import { createPyM14CompatibilityAdapter, type PyM14CompatibilityResult } from './pyM14CompatibilityAdapter'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
const M14_RELEASE_FILES = ['places.json', 'articles.json', 'stories.json', 'recommendations.json', 'taxonomy.json', 'quality_report.json'] as const

/** Loads one explicit immutable release directory; it never discovers "latest". */
export async function loadPyM14Release(input: { releaseBaseUrl: string; m14GateUrl: string; expectedReleaseId: string; fetcher?: FetchLike }): Promise<PyM14CompatibilityResult> {
  const fetcher = input.fetcher ?? fetch
  const releaseBaseUrl = trustedBaseUrl(input.releaseBaseUrl, input.expectedReleaseId)
  const m14GateUrl = trustedAbsoluteUrl(input.m14GateUrl)
  const manifest = await fetchJson(fetcher, releaseBaseUrl, 'manifest.json')
  const m14Gate = await fetchAbsoluteJson(fetcher, m14GateUrl)
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || !Array.isArray((manifest as Record<string, unknown>).files)) throw new Error('M14_MANIFEST_SCHEMA_INVALID')
  if ((manifest as Record<string, unknown>).releaseId !== input.expectedReleaseId) throw new Error('M14_RELEASE_ID_UNEXPECTED')
  const declaredPaths = (manifest as { files: unknown[] }).files.map((entry) => {
    if (!entry || typeof entry !== 'object' || typeof (entry as Record<string, unknown>).path !== 'string') throw new Error('M14_MANIFEST_FILE_INVALID')
    return (entry as { path: string }).path
  })
  if (declaredPaths.length !== M14_RELEASE_FILES.length || M14_RELEASE_FILES.some((path) => !declaredPaths.includes(path)) || declaredPaths.some((path) => !M14_RELEASE_FILES.includes(path as typeof M14_RELEASE_FILES[number]))) throw new Error('M14_MANIFEST_FILESET_UNEXPECTED')
  const files = Object.fromEntries(await Promise.all(M14_RELEASE_FILES.map(async (path) => [path, await fetchBytes(fetcher, releaseBaseUrl, path)])))
  return createPyM14CompatibilityAdapter({ manifest, m14Gate, files, expectedReleaseId: input.expectedReleaseId })
}

async function fetchJson(fetcher: FetchLike, base: string, path: string) { return fetchAbsoluteJson(fetcher, new URL(path, normalizedBase(base)).toString()) }
async function fetchAbsoluteJson(fetcher: FetchLike, url: string) {
  const response = await fetcher(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`M14_FETCH_FAILED:${response.status}:${url}`)
  return response.json() as Promise<unknown>
}
async function fetchBytes(fetcher: FetchLike, base: string, path: string) {
  const url = new URL(path, normalizedBase(base)).toString()
  const response = await fetcher(url)
  if (!response.ok) throw new Error(`M14_FETCH_FAILED:${response.status}:${url}`)
  return new Uint8Array(await response.arrayBuffer())
}
function normalizedBase(value: string) { return value.endsWith('/') ? value : `${value}/` }

function trustedBaseUrl(value: string, releaseId: string) {
  const url = new URL(normalizedBase(value))
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.pathname.includes(`/${releaseId}/`)) throw new Error('M14_RELEASE_BASE_URL_INVALID')
  return url.toString()
}

function trustedAbsoluteUrl(value: string) {
  const url = new URL(value)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('M14_GATE_URL_INVALID')
  return url.toString()
}
