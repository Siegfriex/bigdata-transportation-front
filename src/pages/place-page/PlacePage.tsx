import { getPlaceContent } from '../../entities/place'
import { usePlacePageModel } from '../../features/projection-query'
import { useI18n } from '../../shared/i18n'
import { Button, Dialog, EmptyState, Skeleton } from '../../shared/ui'
import { navigate, safeReturnPath } from '../../app/router/navigation'
import { PlaceDetailContent } from '../../widgets/place-detail-sheet'

type PlacePageProps = {
  placeId: string
  presentation?: 'standalone' | 'modal'
}

export function PlacePage({ placeId, presentation = 'standalone' }: PlacePageProps) {
  const { locale, t } = useI18n()
  const placeModel = usePlacePageModel(placeId)
  const place = placeModel.place
  const returnTo = safeReturnPath(new URLSearchParams(window.location.search).get('returnTo'), '/guide')

  const detail = <>{place === undefined ? <Skeleton className="guide-skeleton" /> : null}{place === null ? <EmptyState title={t('guide.unavailable')} description={t('state.unknownPlace')} /> : null}{place ? <PlaceDetailContent place={place} locale={locale} /> : null}</>

  if (presentation === 'modal') {
    return <Dialog isOpen onClose={() => navigate(returnTo)} title={place ? getPlaceContent(place, locale).name : t('guide.unavailable')} closeLabel={t('guide.closeDetail')} presentation="sheet"><div data-testid="place-detail-modal">{detail}</div></Dialog>
  }

  return <main className="product-page"><Button variant="ghost" onClick={() => navigate(returnTo)}>{t('place.back')}</Button>{detail}</main>
}
