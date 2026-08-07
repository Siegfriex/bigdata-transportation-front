import { StatusNotice } from '../../shared/ui'
import { useI18n } from '../../shared/i18n'

type RouteStatePageProps = {
  routeName: string
}

export function RouteStatePage({ routeName }: RouteStatePageProps) {
  const { t } = useI18n()
  return (
    <main id="main-content" className="product-page route-state-page">
        <p className="eyebrow">{t('routeState.eyebrow')}</p>
        <h1>{routeName}</h1>
        <StatusNotice state="UNAVAILABLE" title={t('routeState.title')}>
          {t('routeState.description')}
        </StatusNotice>
    </main>
  )
}
