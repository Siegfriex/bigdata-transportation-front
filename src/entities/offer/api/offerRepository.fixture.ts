import type { Offer } from '../model/types'
import type { OfferRepository } from './offerRepository'

const fixtureOffers: Offer[] = [{
  id: 'fixture-riverside-offer',
  type: 'experience',
  title: 'Demo cultural experience offer',
  partnerId: 'fixture-partner-unavailable',
  availability: 'coming-soon',
  disclosure: 'Demo fixture only. No commercial partner or outbound destination is connected.',
  placeIds: ['fixture-riverside-stage'],
  liveSessionIds: ['fixture-culture-session'],
}]

export const fixtureOfferRepository: OfferRepository = {
  async list() { return fixtureOffers },
  async getById(id) { return fixtureOffers.find((offer) => offer.id === id) ?? null },
}
