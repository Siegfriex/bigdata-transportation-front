import { createPyM14CompatibilityAdapter, type PyM14CompatibilityResult } from './pyM14CompatibilityAdapter'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

/** Loads one explicit immutable release directory; it never discovers "latest". */
export async function loadPyM14Release(input: { releaseBaseUrl: string; m14GateUrl: string; fetcher?: FetchLike }): Promise<PyM14CompatibilityResult> {
  const fetcher = input.fetcher ?? fetch
  const manifest = await fetchJson(fetcher, input.releaseBaseUrl, 'manifest.json')
  const m14Gate = await fetchAbsoluteJson(fetcher, input.m14GateUrl)
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || !Array.isArray((manifest as Record<string, unknown>).files)) throw new Error('M14_MANIFEST_SCHEMA_INVALID')
  const declaredPaths = (manifest as { files: unknown[] }).files.map((entry) => {
    if (!entry || typeof entry !== 'object' || typeof (entry as Record<string, unknown>).path !== 'string') throw new Error('M14_MANIFEST_FILE_INVALID')
    return (entry as { path: string }).path
  })
  const files = Object.fromEntries(await Promise.all(declaredPaths.map(async (path) => [path, await fetchBytes(fetcher, input.releaseBaseUrl, path)])))
  return createPyM14CompatibilityAdapter({ manifest, m14Gate, files })
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
