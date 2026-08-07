import type { ProvenanceSource } from '../../place'

export type Partner = {
  id: string
  name: string
  disclosureIdentity: string
  allowedActionTypes: Array<'reservation' | 'ticket' | 'product' | 'external-link'>
  outboundDomain?: string
  status: 'active' | 'unavailable'
  provenance: { source: ProvenanceSource; referenceId: string }
}
