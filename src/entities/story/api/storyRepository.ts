import type { Story } from '../model/types'

export interface StoryRepository {
  list(): Promise<Story[]>
  getById(id: string): Promise<Story | null>
}
