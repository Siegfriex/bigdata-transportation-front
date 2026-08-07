import type { Article } from '../model/types'

export interface ArticleRepository {
  list(): Promise<Article[]>
  getById(id: string): Promise<Article | null>
}
