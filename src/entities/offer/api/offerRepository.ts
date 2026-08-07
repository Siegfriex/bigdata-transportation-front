import type { Offer } from '../model/types'

export interface OfferRepository {
  list(): Promise<Offer[]>
  getById(id: string): Promise<Offer | null>
}
