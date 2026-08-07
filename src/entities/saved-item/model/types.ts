export type SavedItem = {
  id: string
  targetType: 'place' | 'story'
  targetId: string
  savedAt: string
  collection: 'default'
}

export function isSavedItem(value: unknown): value is SavedItem {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string'
    && (candidate.targetType === 'place' || candidate.targetType === 'story')
    && typeof candidate.targetId === 'string'
    && typeof candidate.savedAt === 'string'
    && candidate.collection === 'default'
}

export function isSavedItemList(value: unknown): value is SavedItem[] {
  return Array.isArray(value) && value.every(isSavedItem)
}
