import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createPyM14CompatibilityAdapter } from '../src/app/release/pyM14CompatibilityAdapter'
import { getPlaceContentResolution } from '../src/entities/place'

const releaseRoot = process.env.MBN_GUIDE_PY_RELEASE_DIR ?? resolve(process.cwd(), '../mbN_GUIDE_PY/mbN_GUIDE/data/90_exports/frontend/mbn-guide-dc9f6a80d54985d6')
const m14GatePath = process.env.MBN_GUIDE_M14_GATE_PATH ?? resolve(process.cwd(), '../mbN_GUIDE_PY/mbN_GUIDE/data/80_quality/mbn/m14/run_20260808_m14_validation_v1_1/m14_final_gate.json')

const manifest = JSON.parse(await readFile(resolve(releaseRoot, 'manifest.json'), 'utf8')) as { files: Array<{ path: string }> }
const files = Object.fromEntries(await Promise.all(manifest.files.map(async ({ path }) => [path, new Uint8Array(await readFile(resolve(releaseRoot, path)))])))
const result = await createPyM14CompatibilityAdapter({ manifest, m14Gate: JSON.parse(await readFile(m14GatePath, 'utf8')), files, expectedReleaseId: 'mbn-guide-dc9f6a80d54985d6' })

const places = await result.repository.listPlaces()
const articles = await result.repository.listArticles()
const firstPlace = places[0]
if (result.releaseId !== 'mbn-guide-dc9f6a80d54985d6' || places.length !== 19 || articles.length !== 461 || Object.values(result.nearbyPlaceIdsByPlace).flat().length !== 109 || !firstPlace) throw new Error('M14_COMPATIBILITY_COUNT_MISMATCH')
const englishResolution = getPlaceContentResolution(firstPlace, 'en')
if (englishResolution.servedLocale !== 'ko' || !englishResolution.fallbackUsed) throw new Error('M14_KO_FALLBACK_DISCLOSURE_MISSING')
console.log(`M14 compatibility PASS: ${result.releaseId}; places=${places.length}; articles=${articles.length}; nearby=${Object.values(result.nearbyPlaceIdsByPlace).flat().length}; enFallback=${englishResolution.servedLocale}`)
