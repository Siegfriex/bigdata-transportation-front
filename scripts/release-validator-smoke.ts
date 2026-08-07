import { createHash } from 'node:crypto'
import { createReleaseProjectionRepository, parseReleaseProjection, REQUIRED_RELEASE_FILE_PATHS, validateReleaseBundle } from '../src/app/release'
import type { ReleaseBundle } from '../src/app/release/types'

const encoder = new TextEncoder()
const bytes = encoder.encode('{"fixture":true}')
const sha = createHash('sha256').update(bytes).digest('hex')
const localized = { ko: { name: '데모', summary: '데모', whyItMatters: '데모', availableExperience: '데모' }, en: { name: 'Demo', summary: 'Demo', whyItMatters: 'Demo', availableExperience: 'Demo' } }
const provenance = { source: 'editor' as const, referenceId: 'fixture:test', label: { ko: '데모', en: 'Demo' }, method: 'fixture' as const, isSponsored: false }

function makeBundle(): ReleaseBundle {
  const files = Object.fromEntries(REQUIRED_RELEASE_FILE_PATHS.map((path) => [path, bytes]))
  return {
    manifest: { releaseId: 'VALID_TEST_RELEASE', sourceRepository: 'test', sourceBranch: 'FRONT_SYNTHETIC_TEST', sourceCommit: 'TEST_ONLY', contractVersion: '0.3.0', schemaVersion: '0.3.0', taxonomyVersion: '0.3.0', pipelineVersion: 'test', generatedAt: '2026-08-07T00:00:00.000Z', qualityStatus: 'PASS', nonEmpirical: true, qualityReportPath: 'quality_report.json', recordCounts: { places: 1, articles: 1, stories: 1, liveSessions: 1, offers: 1, partners: 1 }, files: REQUIRED_RELEASE_FILE_PATHS.map((path) => ({ path, sha256: sha, bytes: bytes.byteLength, required: true })) },
    files,
    projection: {
      places: [{ id: 'p1', slug: 'p1', coordinates: { lat: 0, lng: 0 }, address: { ko: '데모', en: 'Demo' }, category: 'music', tags: [], localized, localeSupport: ['ko', 'en'], source: 'editor', provenance, relatedStoryIds: ['s1'], relatedLiveIds: ['l1'], offerIds: ['o1'], status: 'active' }],
      articles: [{ id: 'a1', sourceArticleId: 'source:a1', source: 'editor', rawTitle: 'Demo', cleanTitle: 'Demo', localized: { ko: { headline: '데모', excerpt: '데모' }, en: { headline: 'Demo', excerpt: 'Demo' } }, category: 'music', tags: [], placeIds: ['p1'], storyIds: ['s1'], status: 'active', provenance: { ...provenance, referenceId: 'fixture:article' } }],
      stories: [{ id: 's1', localized: { ko: { headline: '데모', deck: '데모', summary: '데모' }, en: { headline: 'Demo', deck: 'Demo', summary: 'Demo' } }, articleIds: ['a1'], placeIds: ['p1'], liveIds: ['l1'], tags: [], provenance: { ...provenance, referenceId: 'fixture:story' }, status: 'active' }],
      liveSessions: [{ id: 'l1', lifecycle: 'replay', category: 'music', localized: { ko: { title: '데모', deck: '데모', summary: '데모' }, en: { title: 'Demo', deck: 'Demo', summary: 'Demo' } }, hostName: 'Demo', player: { status: 'unavailable' }, chat: { status: 'unavailable' }, offer: { status: 'unavailable' }, placeIds: ['p1'], articleIds: ['a1'], offerIds: ['o1'], provenance: { ...provenance, referenceId: 'fixture:live' } }],
      offers: [{ id: 'o1', type: 'experience', title: 'Demo', partnerId: 'partner-1', availability: 'unavailable', placeIds: ['p1'], liveSessionIds: ['l1'] }],
      partners: [{ id: 'partner-1', name: 'Demo', disclosureIdentity: 'Demo', allowedActionTypes: ['ticket'], status: 'unavailable', provenance: { source: 'partner', referenceId: 'fixture:partner' } }],
      relatedArticlesByPlace: { p1: [{ articleId: 'a1', relationType: 'article-place', evidence: 'fixture', provenance: { source: 'FRONT_FIXTURE', nonEmpirical: true, declaredBy: 'manual-fixture' } }] },
      relatedArticlesByArticle: { a1: [{ articleId: 'a1', relationType: 'article-article', evidence: 'fixture', provenance: { source: 'FRONT_FIXTURE', nonEmpirical: true, declaredBy: 'manual-fixture' } }] },
      relatedLiveByPlace: { p1: [{ liveSessionId: 'l1', relationType: 'place-live', disclosureEligible: false, evidence: 'fixture', provenance: { source: 'FRONT_FIXTURE', nonEmpirical: true, declaredBy: 'manual-fixture' } }] },
      relatedLiveByArticle: { a1: [{ liveSessionId: 'l1', relationType: 'article-live', disclosureEligible: false, evidence: 'fixture', provenance: { source: 'FRONT_FIXTURE', nonEmpirical: true, declaredBy: 'manual-fixture' } }] },
      taxonomy: { categories: ['music'] },
    },
  }
}

async function expectInvalid(mutator: (bundle: ReleaseBundle) => void, expectedError: string) {
  const bundle = makeBundle()
  mutator(bundle)
  const result = await validateReleaseBundle(bundle)
  if (result.ok || !result.errors.includes(expectedError)) throw new Error(`Expected ${expectedError}, got ${JSON.stringify(result)}`)
}

const valid = await validateReleaseBundle(makeBundle())
if (!valid.ok) throw new Error(`Valid release rejected: ${JSON.stringify(valid)}`)
const repository = await createReleaseProjectionRepository(makeBundle())
if ((await repository.getPlace('p1'))?.id !== 'p1') throw new Error('Release adapter failed to return parsed projection')
function makeParsableBundle() {
  const base = makeBundle()
  const projectionFiles: Record<string, unknown> = {
    'places.json': base.projection.places,
    'articles.json': base.projection.articles,
    'stories.json': base.projection.stories,
    'live_sessions.json': base.projection.liveSessions,
    'offers.json': base.projection.offers,
    'partners.json': base.projection.partners,
    'article_place_relations.json': Object.entries(base.projection.relatedArticlesByPlace).flatMap(([placeId, relations]) => relations.map((relation) => ({ placeId, ...relation }))),
    'article_article_relations.json': Object.entries(base.projection.relatedArticlesByArticle).flatMap(([sourceArticleId, relations]) => relations.map((relation) => ({ sourceArticleId, ...relation }))),
    'article_live_relations.json': Object.entries(base.projection.relatedLiveByArticle).flatMap(([articleId, relations]) => relations.map((relation) => ({ articleId, ...relation }))),
    'place_live_relations.json': Object.entries(base.projection.relatedLiveByPlace).flatMap(([placeId, relations]) => relations.map((relation) => ({ placeId, ...relation }))),
    'recommendations.json': [],
    'taxonomy.json': base.projection.taxonomy,
    'quality_report.json': { releaseId: base.manifest.releaseId, qualityStatus: 'PASS', promotionStatus: 'SYNTHETIC_TEST_ONLY' },
  }
  const files = Object.fromEntries(Object.entries(projectionFiles).map(([path, payload]) => [path, encoder.encode(JSON.stringify(payload))]))
  const manifest = { ...base.manifest, files: Object.entries(files).map(([path, fileBytes]) => ({ path, sha256: createHash('sha256').update(fileBytes).digest('hex'), bytes: fileBytes.byteLength, required: true })) }
  return { manifest, files }
}
const parseInput = makeParsableBundle()
const parsed = parseReleaseProjection(parseInput.manifest, parseInput.files)
const parsedRepository = await createReleaseProjectionRepository(parsed)
if ((await parsedRepository.getLiveSession('l1'))?.id !== 'l1') throw new Error('Manifest → parse → validate → repository integration failed')
await expectInvalid((bundle) => { bundle.manifest.qualityStatus = 'FAIL' }, 'MANIFEST_QUALITY_NOT_PASS')
await expectInvalid((bundle) => { bundle.manifest.contractVersion = 'bad' }, 'CONTRACT_VERSION_MISMATCH')
await expectInvalid((bundle) => { bundle.manifest.schemaVersion = 'bad' }, 'SCHEMA_VERSION_MISMATCH')
await expectInvalid((bundle) => { bundle.manifest.taxonomyVersion = 'bad' }, 'TAXONOMY_VERSION_MISMATCH')
await expectInvalid((bundle) => { bundle.files['places.json'] = encoder.encode('tampered') }, 'FILE_SHA_MISMATCH:places.json')
await expectInvalid((bundle) => { bundle.manifest.files[0]!.bytes = 0 }, 'FILE_BYTE_MISMATCH:places.json')
await expectInvalid((bundle) => { delete bundle.files['places.json'] }, 'DECLARED_FILE_MISSING:places.json')
await expectInvalid((bundle) => { bundle.manifest.files = bundle.manifest.files.filter((file) => file.path !== 'offers.json') }, 'REQUIRED_FILE_UNDECLARED:offers.json')
await expectInvalid((bundle) => { bundle.projection.places[0]!.relatedStoryIds = ['missing'] }, 'PLACE_STORY_FK_BROKEN:p1:missing')
await expectInvalid((bundle) => { delete bundle.projection.places[0]!.localized.en }, 'PLACE_LOCALE_MISSING:p1')
await expectInvalid((bundle) => { bundle.projection.places[0]!.provenance.referenceId = '' }, 'PLACE_PROVENANCE_MISSING:p1')
await expectInvalid((bundle) => { bundle.projection.offers[0]!.partnerId = 'missing' }, 'OFFER_PARTNER_FK_BROKEN:o1:missing')
await expectInvalid((bundle) => { bundle.projection.relatedLiveByPlace.p1![0]!.liveSessionId = 'missing' }, 'LIVE_RELATION_SESSION_FK_BROKEN:p1:missing')
await expectInvalid((bundle) => { delete (bundle.projection.places[0] as unknown as Record<string, unknown>).localized }, 'ENTITY_SCHEMA_INVALID')
await expectInvalid((bundle) => { (bundle.projection.liveSessions[0] as unknown as Record<string, unknown>).lifecycle = 'unavailable' }, 'ENTITY_SCHEMA_INVALID')
await expectInvalid((bundle) => { bundle.projection.offers[0]!.availability = 'active' }, 'OFFER_CTA_INELIGIBLE:o1')
try { parseReleaseProjection(parseInput.manifest, { ...parseInput.files, 'places.json': encoder.encode('{bad') }); throw new Error('Invalid JSON accepted') } catch (error) { if (!(error instanceof Error) || error.message !== 'RELEASE_JSON_INVALID:places.json') throw error }
console.log('Release validator smoke passed: immutable adapter + fail-closed validation cases.')
