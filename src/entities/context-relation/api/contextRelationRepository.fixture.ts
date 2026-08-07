import type { ContextRelationRepository } from './contextRelationRepository'

const provenance = { source: 'FRONT_FIXTURE' as const, nonEmpirical: true as const, declaredBy: 'manual-fixture' as const }

export const fixtureContextRelationRepository: ContextRelationRepository = {
  async getRelatedArticlesForPlace(placeId) { return placeId === 'fixture-riverside-stage' ? [{ articleId: 'fixture-riverside-article', relationType: 'article-place' as const, evidence: 'Manually declared fixture relation.', provenance }] : [] },
  async getRelatedArticlesForArticle(articleId) { return articleId === 'fixture-riverside-article' ? [{ articleId: 'fixture-riverside-followup', relationType: 'article-article' as const, evidence: 'Manually declared fixture relation.', provenance }] : [] },
  async getRelatedLiveForPlace(placeId) { return placeId === 'fixture-riverside-stage' ? [{ liveSessionId: 'fixture-culture-session', relationType: 'place-live' as const, disclosureEligible: false, evidence: 'Manually declared fixture relation.', provenance }] : [] },
  async getRelatedLiveForArticle(articleId) { return articleId === 'fixture-riverside-article' ? [{ liveSessionId: 'fixture-culture-session', relationType: 'article-live' as const, disclosureEligible: false, evidence: 'Manually declared fixture relation.', provenance }] : [] },
}
