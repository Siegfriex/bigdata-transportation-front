import type { Article } from '../../entities/article'
import type { RelatedArticle } from '../../entities/context-relation'
import { PLACE_CATEGORIES, type Place, type PlaceCategory } from '../../entities/place'
import type { ProjectionRepository } from '../../features/projection-query/model/projectionRepository'

type JsonRecord = Record<string, unknown>

export type PyM14ReleaseInput = {
  manifest: unknown
  m14Gate: unknown
  expectedReleaseId: string
  /** Exact immutable bytes, keyed by the paths declared in the manifest. */
  files: Record<string, Uint8Array>
}

export type PyM14CompatibilityResult = {
  releaseId: string
  repository: ProjectionRepository
  /** Place-to-Place C4 recommendations. They are intentionally not Article or Live relations. */
  nearbyPlaceIdsByPlace: Readonly<Record<string, readonly string[]>>
  warnings: readonly string[]
}

const M14_REQUIRED_FILES = ['places.json', 'articles.json', 'stories.json', 'recommendations.json', 'taxonomy.json', 'quality_report.json'] as const

/**
 * Parses exactly the PY M14 minimal-safe release shape. This is deliberately a
 * separate boundary from the old 0.3.0 all-entity release parser: it does not
 * coerce M14 Articles into Stories or invent unavailable Live/Offer payloads.
 */
export async function createPyM14CompatibilityAdapter(input: PyM14ReleaseInput): Promise<PyM14CompatibilityResult> {
  const manifest = asRecord(input.manifest, 'M14_MANIFEST_SCHEMA_INVALID')
  const releaseId = requiredString(manifest.releaseId, 'M14_RELEASE_ID_MISSING')
  if (releaseId !== input.expectedReleaseId) throw new Error('M14_RELEASE_ID_UNEXPECTED')
  assertM14Manifest(manifest)
  assertM14Gate(input.m14Gate, releaseId)
  const declaredFiles = asArray(manifest.files, 'M14_MANIFEST_FILES_INVALID').map((item) => asRecord(item, 'M14_MANIFEST_FILE_INVALID'))

  for (const path of M14_REQUIRED_FILES) {
    const declared = declaredFiles.find((file) => file.path === path)
    const bytes = input.files[path]
    if (!declared || !bytes) throw new Error(`M14_FILE_MISSING:${path}`)
    if (declared.bytes !== bytes.byteLength) throw new Error(`M14_FILE_BYTE_MISMATCH:${path}`)
    if (declared.sha256 !== await sha256(bytes)) throw new Error(`M14_FILE_SHA_MISMATCH:${path}`)
  }

  const placesPayload = readPayload(input.files['places.json']!, 'places.json', 'places')
  const articlesPayload = readPayload(input.files['articles.json']!, 'articles.json', 'articles')
  const recommendationsPayload = readPayload(input.files['recommendations.json']!, 'recommendations.json', 'recommendations')
  // Taxonomy is integrity-checked even though existing UI uses its accepted local enum labels.
  assertM14Taxonomy(readPayload(input.files['taxonomy.json']!, 'taxonomy.json', 'categories'))
  readPayload(input.files['stories.json']!, 'stories.json', 'stories')
  readRecord(input.files['quality_report.json']!, 'quality_report.json')

  const places = placesPayload.map(toPlace)
  const placeIds = new Set(places.map((place) => place.id))
  const articles = articlesPayload.map((value) => toArticle(value, placeIds))
  const relatedArticlesByPlace = toPlaceArticleMap(articles, releaseId)
  const nearbyPlaceIdsByPlace = toNearbyPlaceMap(recommendationsPayload, placeIds)

  const repository: ProjectionRepository = {
    source: 'release',
    releaseId,
    guideAreaFilteringAvailable: false,
    async listPlaces(params = {}) { return places.filter((place) => !params.category || params.category === 'all' || place.category === params.category) },
    async getPlace(id) { return places.find((place) => place.id === id) ?? null },
    async listStories() { return [] },
    async getStory() { return null },
    async listArticles() { return articles },
    async getArticle(id) { return articles.find((article) => article.id === id) ?? null },
    async listLiveSessions() { return [] },
    async getLiveSession() { return null },
    async listOffers() { return [] },
    async getOffer() { return null },
    async getPartner() { return null },
    async getRelatedArticlesForPlace(id) { return relatedArticlesByPlace[id] ?? [] },
    async getRelatedArticlesForArticle() { return [] },
    async getRelatedLiveForPlace() { return [] },
    async getRelatedLiveForArticle() { return [] },
    async getNearbyPlaceIds(id) { return [...(nearbyPlaceIdsByPlace[id] ?? [])] },
  }

  return { releaseId, repository, nearbyPlaceIdsByPlace, warnings: ['KO_ONLY_LOCALE', 'NO_CANONICAL_STORY_BUNDLE', 'LIVE_OFFER_PARTNER_COMMUNITY_ABSENT'] }
}

function toPlace(value: unknown): Place {
  const raw = asRecord(value, 'M14_PLACE_SCHEMA_INVALID')
  const placeId = requiredString(raw.placeId, 'M14_PLACE_ID_MISSING')
  const coordinates = asRecord(raw.coordinates, `M14_PLACE_COORDINATES_INVALID:${placeId}`)
  const lat = requiredNumber(coordinates.lat, `M14_PLACE_LAT_INVALID:${placeId}`)
  const lng = requiredNumber(coordinates.lng, `M14_PLACE_LNG_INVALID:${placeId}`)
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error(`M14_PLACE_COORDINATES_OUT_OF_RANGE:${placeId}`)
  const category = requiredString(raw.category, `M14_PLACE_CATEGORY_MISSING:${placeId}`)
  if (!(PLACE_CATEGORIES as readonly string[]).includes(category)) throw new Error(`M14_PLACE_CATEGORY_UNSUPPORTED:${placeId}:${category}`)
  const localeContent = asRecord(raw.localeContent, `M14_PLACE_LOCALE_CONTENT_INVALID:${placeId}`)
  const ko = asRecord(localeContent.ko, `M14_PLACE_KO_CONTENT_MISSING:${placeId}`)
  const title = requiredString(ko.title, `M14_PLACE_KO_TITLE_MISSING:${placeId}`)
  const whyItMatters = requiredString(ko.whyItMatters, `M14_PLACE_WHY_MISSING:${placeId}`)
  const provenance = asRecord(raw.provenance, `M14_PLACE_PROVENANCE_INVALID:${placeId}`)
  const sourceArticleIds = asStringArray(provenance.sourceArticleIds, `M14_PLACE_PROVENANCE_REFERENCES_INVALID:${placeId}`)
  if (!sourceArticleIds.length) throw new Error(`M14_PLACE_PROVENANCE_REFERENCES_MISSING:${placeId}`)

  return {
    id: placeId,
    slug: requiredString(raw.slug, `M14_PLACE_SLUG_MISSING:${placeId}`),
    coordinates: { lat, lng },
    address: {},
    category: category as PlaceCategory,
    tags: asStringArray(raw.tags, `M14_PLACE_TAGS_INVALID:${placeId}`),
    localized: { ko: { name: title, summary: '', whyItMatters, availableExperience: '' } },
    localeSupport: ['ko'],
    source: 'mbn',
    provenance: { source: 'mbn', referenceId: sourceArticleIds[0]!, label: { ko: 'MBN 문화 기사 기반' }, method: 'release', isSponsored: false },
    relatedStoryIds: [],
    relatedLiveIds: asStringArray(raw.linkedLiveSessionIds, `M14_PLACE_LIVE_IDS_INVALID:${placeId}`),
    offerIds: asStringArray(raw.offerIds, `M14_PLACE_OFFER_IDS_INVALID:${placeId}`),
    status: toPlaceStatus(raw.status, placeId),
  }
}

function toArticle(value: unknown, placeIds: ReadonlySet<string>): Article {
  const raw = asRecord(value, 'M14_ARTICLE_SCHEMA_INVALID')
  const id = requiredString(raw.articleId, 'M14_ARTICLE_ID_MISSING')
  const linkedPlaceIds = asStringArray(raw.linkedPlaceIds, `M14_ARTICLE_PLACE_IDS_INVALID:${id}`)
  for (const placeId of linkedPlaceIds) if (!placeIds.has(placeId)) throw new Error(`M14_ARTICLE_PLACE_FK_BROKEN:${id}:${placeId}`)
  const title = requiredString(raw.cleanTitle, `M14_ARTICLE_TITLE_MISSING:${id}`)
  const sourceArticleId = requiredString(raw.sourceArticleId, `M14_ARTICLE_SOURCE_ID_MISSING:${id}`)
  return {
    id,
    sourceArticleId,
    source: 'mbn',
    url: requiredString(raw.sourceUrl, `M14_ARTICLE_URL_MISSING:${id}`),
    rawTitle: title,
    cleanTitle: title,
    localized: { ko: { headline: title, excerpt: '' } },
    publishedAt: optionalString(raw.publishedAt),
    category: requiredString(raw.section, `M14_ARTICLE_SECTION_MISSING:${id}`),
    tags: asStringArray(raw.editorialLabels, `M14_ARTICLE_LABELS_INVALID:${id}`),
    placeIds: linkedPlaceIds,
    storyIds: [],
    status: 'active',
    provenance: { source: 'mbn', referenceId: sourceArticleId, label: { ko: 'MBN 문화 기사 기반' }, method: 'release' },
  }
}

function toPlaceArticleMap(articles: readonly Article[], releaseId: string) {
  return articles.reduce<Record<string, RelatedArticle[]>>((result, article) => {
    for (const placeId of article.placeIds) {
      const relations = result[placeId] ?? []
      relations.push({ articleId: article.id, relationType: 'article-place', evidence: 'Validated linkedPlaceIds relation from PY M14 release.', provenance: { source: 'PY_RELEASE', releaseId, mapping: 'linkedPlaceIds' } })
      result[placeId] = relations
    }
    return result
  }, {})
}

function toNearbyPlaceMap(values: unknown[], placeIds: ReadonlySet<string>) {
  const ranked = values.reduce<Record<string, Array<{ targetId: string; finalRank: number }>>>((result, value) => {
    const raw = asRecord(value, 'M14_RECOMMENDATION_SCHEMA_INVALID')
    const contextId = requiredString(raw.contextId, 'M14_RECOMMENDATION_CONTEXT_MISSING')
    const targetId = requiredString(raw.targetId, 'M14_RECOMMENDATION_TARGET_MISSING')
    const finalRank = requiredPositiveInteger(raw.finalRank, `M14_RECOMMENDATION_RANK_INVALID:${contextId}:${targetId}`)
    if (raw.contextType !== 'place' || raw.targetType !== 'place') throw new Error(`M14_RECOMMENDATION_TYPE_UNSUPPORTED:${contextId}:${targetId}`)
    if (!placeIds.has(contextId) || !placeIds.has(targetId)) throw new Error(`M14_RECOMMENDATION_PLACE_FK_BROKEN:${contextId}:${targetId}`)
    const reasons = asArray(raw.reasons, `M14_RECOMMENDATION_REASONS_INVALID:${contextId}:${targetId}`).map((reason) => asRecord(reason, 'M14_RECOMMENDATION_REASON_INVALID'))
    const nearby = reasons.find((reason) => reason.code === 'NEARBY')
    if (!nearby || typeof nearby.distanceMeters !== 'number' || nearby.distanceMeters < 0) throw new Error(`M14_RECOMMENDATION_NEARBY_REASON_INVALID:${contextId}:${targetId}`)
    const list = result[contextId] ?? []
    if (list.some((item) => item.targetId === targetId)) throw new Error(`M14_RECOMMENDATION_DUPLICATE_TARGET:${contextId}:${targetId}`)
    list.push({ targetId, finalRank })
    result[contextId] = list
    return result
  }, {})
  return Object.fromEntries(Object.entries(ranked).map(([contextId, targets]) => [contextId, targets.sort((left, right) => left.finalRank - right.finalRank).map((item) => item.targetId)]))
}

function assertM14Manifest(manifest: JsonRecord) {
  if (manifest.contractVersion !== 'docs_product_ssot_v2.1_user_supplied' || manifest.schemaVersion !== 'frontend_release_v2.1_minimal_safe' || manifest.taxonomyVersion !== 'docs_product_taxonomy_v2.1' || manifest.releaseProfile !== 'MINIMAL_SAFE_RELEASE_V1' || manifest.sourceBranch !== 'nbM_GUIDE_PY') throw new Error('M14_MANIFEST_CONTRACT_UNEXPECTED')
}

function assertM14Taxonomy(values: unknown[]) {
  const ids = values.map((value) => requiredString(asRecord(value, 'M14_TAXONOMY_ITEM_INVALID').id, 'M14_TAXONOMY_ID_MISSING'))
  if (ids.length !== PLACE_CATEGORIES.length || ids.some((id) => !(PLACE_CATEGORIES as readonly string[]).includes(id))) throw new Error('M14_TAXONOMY_UNSUPPORTED')
}

function toPlaceStatus(value: unknown, placeId: string): Place['status'] {
  if (value === 'ACTIVE') return 'active'
  if (value === 'UNAVAILABLE') return 'unavailable'
  throw new Error(`M14_PLACE_STATUS_UNSUPPORTED:${placeId}`)
}

function assertM14Gate(value: unknown, releaseId: string) {
  const gate = asRecord(value, 'M14_GATE_SCHEMA_INVALID')
  if (gate.releaseId !== releaseId || gate.validationStatus !== 'PASS_WITH_WARNINGS' || gate.promotionVerdict !== 'FRONTEND_READY') throw new Error('M14_GATE_NOT_FRONTEND_READY')
  for (const key of ['schemaErrors', 'duplicateIds', 'brokenFK', 'invalidCoordinates', 'manifestMismatch', 'hashMismatch', 'secretLeak']) if (gate[key] !== 0) throw new Error(`M14_GATE_FAILED:${key}`)
}

function readPayload(bytes: Uint8Array, path: string, key: string) {
  const record = readRecord(bytes, path)
  return asArray(record[key], `M14_PAYLOAD_SCHEMA_INVALID:${path}:${key}`)
}

function readRecord(bytes: Uint8Array, path: string) {
  try { return asRecord(JSON.parse(new TextDecoder().decode(bytes)), `M14_JSON_SCHEMA_INVALID:${path}`) } catch { throw new Error(`M14_JSON_INVALID:${path}`) }
}

function asRecord(value: unknown, error: string): JsonRecord { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(error); return value as JsonRecord }
function asArray(value: unknown, error: string): unknown[] { if (!Array.isArray(value)) throw new Error(error); return value }
function requiredString(value: unknown, error: string) { if (typeof value !== 'string' || !value.trim()) throw new Error(error); return value }
function optionalString(value: unknown) { return typeof value === 'string' && value.trim() ? value : undefined }
function requiredNumber(value: unknown, error: string) { if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(error); return value }
function requiredPositiveInteger(value: unknown, error: string) { if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) throw new Error(error); return value }
function asStringArray(value: unknown, error: string) { const list = asArray(value, error); if (!list.every((item) => typeof item === 'string')) throw new Error(error); return list as string[] }

async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer)
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('')
}
