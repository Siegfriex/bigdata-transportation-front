import type { Article } from '../../../entities/article'
import type { RelatedArticle, RelatedLive } from '../../../entities/context-relation'
import type { LiveSession } from '../../../entities/live-session'
import type { Offer } from '../../../entities/offer'
import type { Partner } from '../../../entities/partner'
import type { Place, PlaceCategory } from '../../../entities/place'
import type { Story } from '../../../entities/story'

/**
 * Consumer contract only. Pages and widgets know this interface, never whether
 * the projection originated from deterministic fixtures or an immutable PY release.
 */
export interface ProjectionRepository {
  readonly source: 'fixture' | 'release'
  readonly releaseId: string
  listPlaces(params?: { category?: PlaceCategory | 'all'; area?: string }): Promise<Place[]>
  getPlace(placeId: string): Promise<Place | null>
  listStories(): Promise<Story[]>
  getStory(storyId: string): Promise<Story | null>
  listArticles(): Promise<Article[]>
  getArticle(articleId: string): Promise<Article | null>
  listLiveSessions(): Promise<LiveSession[]>
  getLiveSession(sessionId: string): Promise<LiveSession | null>
  listOffers(): Promise<Offer[]>
  getOffer(offerId: string): Promise<Offer | null>
  getPartner(partnerId: string): Promise<Partner | null>
  getRelatedArticlesForPlace(placeId: string): Promise<RelatedArticle[]>
  getRelatedArticlesForArticle(articleId: string): Promise<RelatedArticle[]>
  getRelatedLiveForPlace(placeId: string): Promise<RelatedLive[]>
  getRelatedLiveForArticle(articleId: string): Promise<RelatedLive[]>
  /** Ordered, typed Place→Place recommendation targets. No distance is implied by this identifier list. */
  getNearbyPlaceIds(placeId: string): Promise<string[]>
  /** Presentation capability, not a source-specific conditional in a view. */
  readonly guideAreaFilteringAvailable: boolean
}
