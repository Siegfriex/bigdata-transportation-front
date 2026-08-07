import type { Partner } from '../model/types'
import type { PartnerRepository } from './partnerRepository'

const fixturePartners: Partner[] = [{
  id: 'fixture-partner-unavailable',
  name: 'Demo partner identity',
  disclosureIdentity: 'Demo partner identity only; no agreement or outbound connection exists.',
  allowedActionTypes: ['reservation', 'ticket', 'product', 'external-link'],
  status: 'unavailable',
  provenance: { source: 'partner', referenceId: 'fixture:partner:unavailable' },
}]

export const fixturePartnerRepository: PartnerRepository = {
  async list() { return fixturePartners },
  async getById(id) { return fixturePartners.find((partner) => partner.id === id) ?? null },
}
