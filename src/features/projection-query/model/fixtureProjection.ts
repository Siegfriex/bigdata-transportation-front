import { fixturePlaceRepository } from '../../../entities/place'
import { fixtureArticleRepository } from '../../../entities/article'
import { fixtureContextRelationRepository } from '../../../entities/context-relation'
import { fixtureLiveSessionRepository } from '../../../entities/live-session'
import { fixtureOfferRepository } from '../../../entities/offer'
import { fixturePartnerRepository } from '../../../entities/partner'
import { fixtureStoryRepository } from '../../../entities/story'
import type { ProjectionRepository } from './projectionRepository'

/**
 * The only M-2 fixture adapter entrypoint for page-level consumers.
 * A future release adapter can implement this same projection boundary without
 * exposing raw repository choices to pages or widgets.
 */
export const fixtureProjectionAdapter: ProjectionRepository = {
  source: 'fixture',
  releaseId: 'FIXTURE_FRONT_0_3_0_PROTOTYPE_A',
  guideAreaFilteringAvailable: true,
  async listPlaces(params = {}) {
    const places = await fixturePlaceRepository.list({ category: params.category ?? 'all' })
    // Fixture-only selected-area projection. It is deterministic UI input, not
    // a geospatial inference, provider query, or recommendation rule.
    if (!params.area) return places
    if (params.area === 'seoul-central') return places.filter((place) => place.id !== 'fixture-riverside-stage')
    if (params.area === 'riverside') return places.filter((place) => place.id === 'fixture-riverside-stage')
    return []
  },
  getPlace(placeId: string) {
    return fixturePlaceRepository.getById(placeId)
  },
  listStories() {
    return fixtureStoryRepository.list()
  },
  getStory(storyId: string) {
    return fixtureStoryRepository.getById(storyId)
  },
  listLiveSessions() {
    return fixtureLiveSessionRepository.list()
  },
  getLiveSession(sessionId: string) {
    return fixtureLiveSessionRepository.getById(sessionId)
  },
  listArticles() { return fixtureArticleRepository.list() },
  getArticle(articleId) { return fixtureArticleRepository.getById(articleId) },
  listOffers() { return fixtureOfferRepository.list() },
  getOffer(offerId) { return fixtureOfferRepository.getById(offerId) },
  getPartner(partnerId) { return fixturePartnerRepository.getById(partnerId) },
  getRelatedArticlesForPlace(placeId) { return fixtureContextRelationRepository.getRelatedArticlesForPlace(placeId) },
  getRelatedArticlesForArticle(articleId) { return fixtureContextRelationRepository.getRelatedArticlesForArticle(articleId) },
  getRelatedLiveForPlace(placeId) { return fixtureContextRelationRepository.getRelatedLiveForPlace(placeId) },
  getRelatedLiveForArticle(articleId) { return fixtureContextRelationRepository.getRelatedLiveForArticle(articleId) },
  async getNearbyPlaceIds() { return [] },
}
