import type { Partner } from '../model/types'

export interface PartnerRepository {
  list(): Promise<Partner[]>
  getById(id: string): Promise<Partner | null>
}
