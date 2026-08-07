import type { LiveSession } from '../model/types'

export interface LiveSessionRepository {
  list(): Promise<LiveSession[]>
  getById(id: string): Promise<LiveSession | null>
}
