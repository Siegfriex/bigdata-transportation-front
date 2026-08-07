import { useState } from 'react'
import type { SavedItem } from '../../../entities/saved-item'
import { track } from '../../../shared/analytics'
import { useI18n } from '../../../shared/i18n'
import { Button, useToast } from '../../../shared/ui'
import { getSavedItems, setSavedItems } from '../model/savedItemStorage'

type SaveItemButtonProps = { targetType: SavedItem['targetType']; targetId: string }

export function SaveItemButton({ targetType, targetId }: SaveItemButtonProps) {
  const [isSaved, setIsSaved] = useState(() => getSavedItems().some((item) => item.targetType === targetType && item.targetId === targetId))
  const { pushToast } = useToast()
  const { t } = useI18n()
  const toggleSaved = () => {
    const current = getSavedItems()
    const existing = current.find((item) => item.targetType === targetType && item.targetId === targetId)
    const next: SavedItem[] = existing ? current.filter((item) => item.id !== existing.id) : [...current, { id: `saved:${targetType}:${targetId}`, targetType, targetId, savedAt: new Date().toISOString(), collection: 'default' }]
    if (!setSavedItems(next)) { pushToast({ message: t('saved.updateFailed') }); return }
    const saved = !existing
    setIsSaved(saved)
    if (saved) track('item_saved', { targetType, targetId, collection: 'default' })
    pushToast({ message: saved ? t('saved.saved') : t('saved.removed') })
  }
  return <Button variant={isSaved ? 'secondary' : 'primary'} onClick={toggleSaved}>{isSaved ? t('common.saved') : t('common.save')}</Button>
}
