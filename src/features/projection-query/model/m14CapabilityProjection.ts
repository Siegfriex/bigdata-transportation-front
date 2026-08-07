import type { ProjectionRepository } from './projectionRepository'
import type { PyM14CompatibilityResult } from '../../../app/release'

export type ReleaseCapabilityMatrix = {
  place: 'REAL_M14'
  taxonomy: 'VALIDATED_M14_IDS'
  placeRecommendation: 'REAL_M14'
  article: 'REAL_M14'
  story: 'UNAVAILABLE'
  liveSession: 'UNAVAILABLE'
  offer: 'UNAVAILABLE'
  community: 'UNAVAILABLE'
}

/**
 * Composes only capabilities present in the M14 release. Missing projections
 * resolve to explicit empty/unavailable states; release mode never falls back
 * to a fixture entity.
 */
export function createM14CapabilityProjection(m14: PyM14CompatibilityResult): { repository: ProjectionRepository; capabilities: ReleaseCapabilityMatrix } {
  const repository: ProjectionRepository = {
    source: 'release',
    releaseId: m14.releaseId,
    guideAreaFilteringAvailable: false,
    listPlaces: (params) => m14.repository.listPlaces(params),
    getPlace: (id) => m14.repository.getPlace(id),
    async listStories() { return [] },
    async getStory() { return null },
    async listArticles() { return m14.repository.listArticles() },
    getArticle: (id) => m14.repository.getArticle(id),
    async listLiveSessions() { return [] },
    async getLiveSession() { return null },
    async listOffers() { return [] },
    async getOffer() { return null },
    async getPartner() { return null },
    getRelatedArticlesForPlace: (id) => m14.repository.getRelatedArticlesForPlace(id),
    async getRelatedArticlesForArticle() { return [] },
    async getRelatedLiveForPlace() { return [] },
    async getRelatedLiveForArticle() { return [] },
    getNearbyPlaceIds: (id) => m14.repository.getNearbyPlaceIds(id),
  }
  return { repository, capabilities: { place: 'REAL_M14', taxonomy: 'VALIDATED_M14_IDS', placeRecommendation: 'REAL_M14', article: 'REAL_M14', story: 'UNAVAILABLE', liveSession: 'UNAVAILABLE', offer: 'UNAVAILABLE', community: 'UNAVAILABLE' } }
}
