import { isSavedItemList, type SavedItem } from '../../../entities/saved-item'
import { createSafeStorage } from '../../../shared/model'

const storage = createSafeStorage({ key: 'saved-items', version: 1 })

export function getSavedItems() {
  const result = storage.getValidated(isSavedItemList)
  return result.ok && result.value ? result.value : []
}

export function setSavedItems(items: SavedItem[]) {
  return storage.set(items)
}
