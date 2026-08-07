import type { RelatedArticle, RelatedLive } from '../model/types'

export interface ContextRelationRepository {
  getRelatedArticlesForPlace(placeId: string): Promise<RelatedArticle[]>
  getRelatedArticlesForArticle(articleId: string): Promise<RelatedArticle[]>
  getRelatedLiveForPlace(placeId: string): Promise<RelatedLive[]>
  getRelatedLiveForArticle(articleId: string): Promise<RelatedLive[]>
}
