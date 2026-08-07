import { validateReleaseBundle } from './releaseValidator'
import type { ReleaseBundle } from './types'
import type { ProjectionRepository } from '../../features/projection-query/model/projectionRepository'

export async function createReleaseProjectionRepository(bundle: ReleaseBundle): Promise<ProjectionRepository> {
  const result = await validateReleaseBundle(bundle)
  if (!result.ok) throw new Error(result.errors.join(','))
  const { projection, manifest } = bundle

  return {
    source: 'release', releaseId: manifest.releaseId,
    guideAreaFilteringAvailable: false,
    async listPlaces(params = {}) { return projection.places.filter((place) => !params.category || params.category === 'all' || place.category === params.category) },
    async getPlace(id) { return projection.places.find((item) => item.id === id) ?? null },
    async listStories() { return projection.stories },
    async getStory(id) { return projection.stories.find((item) => item.id === id) ?? null },
    async listArticles() { return projection.articles },
    async getArticle(id) { return projection.articles.find((item) => item.id === id) ?? null },
    async listLiveSessions() { return projection.liveSessions },
    async getLiveSession(id) { return projection.liveSessions.find((item) => item.id === id) ?? null },
    async listOffers() { return projection.offers },
    async getOffer(id) { return projection.offers.find((item) => item.id === id) ?? null },
    async getPartner(id) { return projection.partners.find((item) => item.id === id) ?? null },
    async getRelatedArticlesForPlace(id) { return projection.relatedArticlesByPlace[id] ?? [] },
    async getRelatedArticlesForArticle(id) { return projection.relatedArticlesByArticle[id] ?? [] },
    async getRelatedLiveForPlace(id) { return projection.relatedLiveByPlace[id] ?? [] },
    async getRelatedLiveForArticle(id) { return projection.relatedLiveByArticle[id] ?? [] },
    async getNearbyPlaceIds() { return [] },
  }
}

function parseJsonFile(files: Record<string, Uint8Array>, path: string): unknown {
  const bytes = files[path]
  if (!bytes) throw new Error(`RELEASE_FILE_MISSING:${path}`)
  try { return JSON.parse(new TextDecoder().decode(bytes)) } catch { throw new Error(`RELEASE_JSON_INVALID:${path}`) }
}

function assertQualityReport(value: unknown, manifest: ReleaseBundle['manifest']) {
  if (!value || typeof value !== 'object') throw new Error('QUALITY_REPORT_SCHEMA_INVALID')
  const report = value as Record<string, unknown>
  if (report.releaseId !== manifest.releaseId || report.qualityStatus !== 'PASS') throw new Error('QUALITY_REPORT_IDENTITY_MISMATCH')
}

function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`RELEASE_SCHEMA_INVALID:${path}`)
  return value
}

function toRelationMap(value: unknown, key: 'placeId' | 'articleId' | 'sourceArticleId'): Record<string, never[]> {
  const records = requireArray(value, `${key}_relations`)
  return records.reduce<Record<string, never[]>>((result, item) => {
    if (!item || typeof item !== 'object' || typeof (item as Record<string, unknown>)[key] !== 'string') throw new Error(`RELEASE_RELATION_SCHEMA_INVALID:${key}`)
    const id = (item as Record<string, string>)[key]!
    result[id] ??= []
    result[id].push(item as never)
    return result
  }, {})
}

/** Parses only an explicitly supplied immutable release file set. It never discovers a directory or a latest release. */
export function parseReleaseProjection(manifest: ReleaseBundle['manifest'], files: Record<string, Uint8Array>): ReleaseBundle {
  if (!manifest.qualityReportPath) throw new Error('MANIFEST_QUALITY_REPORT_MISSING')
  assertQualityReport(parseJsonFile(files, manifest.qualityReportPath), manifest)
  const projection = {
    places: requireArray(parseJsonFile(files, 'places.json'), 'places.json'),
    articles: requireArray(parseJsonFile(files, 'articles.json'), 'articles.json'),
    stories: requireArray(parseJsonFile(files, 'stories.json'), 'stories.json'),
    liveSessions: requireArray(parseJsonFile(files, 'live_sessions.json'), 'live_sessions.json'),
    offers: requireArray(parseJsonFile(files, 'offers.json'), 'offers.json'),
    partners: files['partners.json'] ? requireArray(parseJsonFile(files, 'partners.json'), 'partners.json') : [],
    relatedArticlesByPlace: toRelationMap(parseJsonFile(files, 'article_place_relations.json'), 'placeId'),
    relatedArticlesByArticle: toRelationMap(parseJsonFile(files, 'article_article_relations.json'), 'sourceArticleId'),
    relatedLiveByPlace: toRelationMap(parseJsonFile(files, 'place_live_relations.json'), 'placeId'),
    relatedLiveByArticle: toRelationMap(parseJsonFile(files, 'article_live_relations.json'), 'articleId'),
    taxonomy: parseJsonFile(files, 'taxonomy.json'),
  }
  if (!projection.taxonomy || typeof projection.taxonomy !== 'object' || Array.isArray(projection.taxonomy)) throw new Error('RELEASE_SCHEMA_INVALID:taxonomy.json')
  return { manifest, files, projection: projection as ReleaseBundle['projection'] }
}
