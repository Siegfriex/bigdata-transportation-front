import type { Article } from '../../entities/article'
import type { LiveSession } from '../../entities/live-session'
import type { Place } from '../../entities/place'
import type { Story } from '../../entities/story'
import type { Offer } from '../../entities/offer'
import type { Partner } from '../../entities/partner'
import type { RelatedArticle, RelatedLive } from '../../entities/context-relation'

export type ReleaseQualityStatus = 'PASS' | 'FAIL'

export type FrontendReleaseManifest = {
  releaseId: string
  sourceRepository: string
  sourceBranch: string
  sourceCommit: string
  contractVersion: string
  schemaVersion: string
  taxonomyVersion: string
  pipelineVersion: string
  generatedAt: string
  qualityStatus: ReleaseQualityStatus
  nonEmpirical?: boolean
  qualityReportPath?: string
  recordCounts: Record<string, number>
  files: Array<{ path: string; sha256: string; bytes: number; required: boolean }>
}

export type ReleaseProjection = {
  places: Place[]
  articles: Article[]
  stories: Story[]
  liveSessions: LiveSession[]
  offers: Offer[]
  partners: Partner[]
  relatedArticlesByPlace: Record<string, RelatedArticle[]>
  relatedArticlesByArticle: Record<string, RelatedArticle[]>
  relatedLiveByPlace: Record<string, RelatedLive[]>
  relatedLiveByArticle: Record<string, RelatedLive[]>
  taxonomy: Record<string, string[]>
}

export type ReleaseBundle = {
  manifest: FrontendReleaseManifest
  files: Record<string, Uint8Array>
  projection: ReleaseProjection
}

export type ReleaseValidationResult =
  | { ok: true; releaseId: string }
  | { ok: false; errors: string[] }
