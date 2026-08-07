import type { ProvenanceSource } from '../../place'

export type CommunityPost = {
  id: string
  authorClass: 'community' | 'editorial'
  contentReference?: string
  createdAt?: string
  moderationStatus: 'readable' | 'unavailable'
  visibility: 'read-only' | 'unavailable'
  provenance: { source: ProvenanceSource; referenceId: string }
  relatedTargetIds: string[]
}
