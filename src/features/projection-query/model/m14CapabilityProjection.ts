import type { ProjectionRepository } from './projectionRepository'
import type { PyM14CompatibilityResult } from '../../../app/release'

export type ReleaseCapabilityMatrix = {
  place: 'REAL_M14'
  taxonomy: 'REAL_M14'
  placeRecommendation: 'REAL_M14'
  article: 'REAL_M14'
  story: 'FIXTURE'
  liveSession: 'FIXTURE'
  offer: 'UNAVAILABLE'
  community: 'UNAVAILABLE'
}

/**
 * Composes capabilities at the repository boundary. Views receive one stable
 * ProjectionRepository and never branch on fixture/release source themselves.
 */
export function createM14CapabilityProjection(m14: PyM14CompatibilityResult, fixture: ProjectionRepository): { repository: ProjectionRepository; capabilities: ReleaseCapabilityMatrix } {
  const repository: ProjectionRepository = {
    source: 'release',
    releaseId: m14.releaseId,
    guideAreaFilteringAvailable: false,
    listPlaces: (params) => m14.repository.listPlaces(params),
    async getPlace(id) { return (await m14.repository.getPlace(id)) ?? fixture.getPlace(id) },
    listStories: () => fixture.listStories(),
    getStory: (id) => fixture.getStory(id),
    async listArticles() { return m14.repository.listArticles() },
    async getArticle(id) { return (await m14.repository.getArticle(id)) ?? fixture.getArticle(id) },
    listLiveSessions: () => fixture.listLiveSessions(),
    getLiveSession: (id) => fixture.getLiveSession(id),
    async listOffers() { return [] },
    async getOffer() { return null },
    async getPartner() { return null },
    async getRelatedArticlesForPlace(id) { return (await m14.repository.getRelatedArticlesForPlace(id)).length ? m14.repository.getRelatedArticlesForPlace(id) : fixture.getRelatedArticlesForPlace(id) },
    getRelatedArticlesForArticle: (id) => fixture.getRelatedArticlesForArticle(id),
    getRelatedLiveForPlace: (id) => fixture.getRelatedLiveForPlace(id),
    getRelatedLiveForArticle: (id) => fixture.getRelatedLiveForArticle(id),
    getNearbyPlaceIds: (id) => m14.repository.getNearbyPlaceIds(id),
  }
  return { repository, capabilities: { place: 'REAL_M14', taxonomy: 'REAL_M14', placeRecommendation: 'REAL_M14', article: 'REAL_M14', story: 'FIXTURE', liveSession: 'FIXTURE', offer: 'UNAVAILABLE', community: 'UNAVAILABLE' } }
}
