import type { Place, PlaceCategory } from '../model/types'

export type PlaceListParams = {
  category?: PlaceCategory | 'all'
}

export interface PlaceRepository {
  list(params?: PlaceListParams): Promise<Place[]>
  getById(id: string): Promise<Place | null>
}
