export type FixtureRelationProvenance = {
  source: 'FRONT_FIXTURE'
  nonEmpirical: true
  declaredBy: 'manual-fixture'
}

export type ReleaseRelationProvenance = {
  source: 'PY_RELEASE'
  releaseId: string
  mapping: 'linkedPlaceIds'
}

export type RelatedArticle = {
  articleId: string
  relationType: 'article-place' | 'article-article'
  evidence: string
  provenance: FixtureRelationProvenance | ReleaseRelationProvenance
}

export type RelatedLive = {
  liveSessionId: string
  relationType: 'article-live' | 'place-live'
  disclosureEligible: boolean
  evidence: string
  provenance: FixtureRelationProvenance | ReleaseRelationProvenance
}
