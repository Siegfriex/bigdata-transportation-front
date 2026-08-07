import { fixtureArticleRepository } from '../../entities/article'
import { fixtureContextRelationRepository } from '../../entities/context-relation'
import { fixtureLiveSessionRepository } from '../../entities/live-session'
import { fixtureOfferRepository } from '../../entities/offer'
import { fixturePartnerRepository } from '../../entities/partner'
import { fixturePlaceRepository } from '../../entities/place'
import { fixtureStoryRepository } from '../../entities/story'
import type { RelatedArticle, RelatedLive } from '../../entities/context-relation'
import { CONSUMED_CONTRACT } from '../config'
import { REQUIRED_RELEASE_FILE_PATHS } from './releaseValidator'
import type { ReleaseBundle } from './types'

async function sha256(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes)
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer)
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('')
}

/** FRONT_TEST_ONLY. It proves consumer parity and never represents PY/MBN data. */
export async function createSyntheticGoldenReleaseBundle(): Promise<ReleaseBundle> {
  const [places, stories, articles, liveSessions, offers, partners] = await Promise.all([
    fixturePlaceRepository.list(), fixtureStoryRepository.list(), fixtureArticleRepository.list(), fixtureLiveSessionRepository.list(), fixtureOfferRepository.list(), fixturePartnerRepository.list(),
  ])
  const relatedArticlesByPlace: Record<string, RelatedArticle[]> = Object.fromEntries(await Promise.all(places.map(async (place) => [place.id, await fixtureContextRelationRepository.getRelatedArticlesForPlace(place.id)])))
  const relatedArticlesByArticle: Record<string, RelatedArticle[]> = Object.fromEntries(await Promise.all(articles.map(async (article) => [article.id, await fixtureContextRelationRepository.getRelatedArticlesForArticle(article.id)])))
  const relatedLiveByPlace: Record<string, RelatedLive[]> = Object.fromEntries(await Promise.all(places.map(async (place) => [place.id, await fixtureContextRelationRepository.getRelatedLiveForPlace(place.id)])))
  const relatedLiveByArticle: Record<string, RelatedLive[]> = Object.fromEntries(await Promise.all(articles.map(async (article) => [article.id, await fixtureContextRelationRepository.getRelatedLiveForArticle(article.id)])))
  const projection = { places, stories, articles, liveSessions, offers, partners, relatedArticlesByPlace, relatedArticlesByArticle, relatedLiveByPlace, relatedLiveByArticle, taxonomy: { categories: ['performance', 'exhibition', 'music', 'food', 'culture-travel'] } }
  const records: Record<string, unknown> = {
    'places.json': places, 'articles.json': articles, 'stories.json': stories, 'live_sessions.json': liveSessions, 'offers.json': offers, 'partners.json': partners,
    'article_place_relations.json': Object.entries(relatedArticlesByPlace).flatMap(([placeId, relations]) => relations.map((relation) => ({ placeId, ...relation }))),
    'article_article_relations.json': Object.entries(relatedArticlesByArticle).flatMap(([sourceArticleId, relations]) => relations.map((relation) => ({ sourceArticleId, ...relation }))),
    'article_live_relations.json': Object.entries(relatedLiveByArticle).flatMap(([articleId, relations]) => relations.map((relation) => ({ articleId, ...relation }))),
    'place_live_relations.json': Object.entries(relatedLiveByPlace).flatMap(([placeId, relations]) => relations.map((relation) => ({ placeId, ...relation }))),
    'recommendations.json': [], 'taxonomy.json': projection.taxonomy,
    'quality_report.json': { releaseId: 'SYNTHETIC_FRONT_M6_0_3_0', qualityStatus: 'PASS', promotionStatus: 'SYNTHETIC_TEST_ONLY' },
  }
  const files = Object.fromEntries(Object.entries(records).map(([path, value]) => [path, new TextEncoder().encode(JSON.stringify(value))]))
  const manifestFiles = await Promise.all(Object.entries(files).map(async ([path, bytes]) => ({ path, sha256: await sha256(bytes), bytes: bytes.byteLength, required: (REQUIRED_RELEASE_FILE_PATHS as readonly string[]).includes(path) })))
  return {
    manifest: { releaseId: 'SYNTHETIC_FRONT_M6_0_3_0', sourceRepository: 'Siegfriex/mbN_GUIDE', sourceBranch: 'FRONT_SYNTHETIC_TEST', sourceCommit: 'TEST_ONLY', contractVersion: CONSUMED_CONTRACT.versions.data, schemaVersion: CONSUMED_CONTRACT.versions.data, taxonomyVersion: CONSUMED_CONTRACT.versions.data, pipelineVersion: 'FRONT_SYNTHETIC_TEST_ONLY', generatedAt: '2026-08-07T00:00:00.000Z', qualityStatus: 'PASS', nonEmpirical: true, qualityReportPath: 'quality_report.json', recordCounts: { places: places.length, stories: stories.length, articles: articles.length, liveSessions: liveSessions.length, offers: offers.length, partners: partners.length }, files: manifestFiles },
    files, projection,
  }
}
