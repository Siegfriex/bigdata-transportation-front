export type OfferAvailability = 'active' | 'coming-soon' | 'unavailable' | 'expired'
export type Offer = {
  id: string
  type: 'reservation' | 'ticket' | 'product' | 'experience' | 'external-link'
  title: string
  partnerId: string
  availability: OfferAvailability
  disclosure?: string
  outboundUrl?: string
  placeIds: string[]
  liveSessionIds: string[]
}

export function isOfferCtaEligible(offer: Offer) {
  return offer.availability === 'active' && Boolean(offer.disclosure) && Boolean(offer.outboundUrl)
}
