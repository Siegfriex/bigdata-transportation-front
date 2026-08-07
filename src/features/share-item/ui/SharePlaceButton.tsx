import { useState } from 'react'
import { track } from '../../../shared/analytics'
import { useI18n } from '../../../shared/i18n'
import { Button, useToast } from '../../../shared/ui'
import { shareItem } from '../model/shareItem'

type SharePlaceButtonProps = { placeId: string; title: string; description: string }

export function SharePlaceButton({ placeId, title, description }: SharePlaceButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const { locale, t } = useI18n()
  const { pushToast } = useToast()

  const share = async () => {
    setIsPending(true)
    const result = await shareItem({ title, text: description, url: `${window.location.origin}/place/${encodeURIComponent(placeId)}` })
    track('place_share_attempted', { placeId, result, locale })
    if (result === 'copied') pushToast({ message: t('share.copied') })
    if (result === 'unavailable') pushToast({ message: t('share.unavailable') })
    if (result === 'failed') pushToast({ message: t('share.failed') })
    setIsPending(false)
  }

  return <Button variant="secondary" onClick={share} disabled={isPending}>{t('common.share')}</Button>
}
