import { navigate } from '../../app/router/navigation'
import { useSavedPageModel } from '../../features/projection-query'
import { useI18n } from '../../shared/i18n'
import { Button, EmptyState, Skeleton, StatusNotice } from '../../shared/ui'
import { UtilityNavigation } from '../../widgets/app-chrome'

export function SavedPage() {
  const { locale, t } = useI18n()
  const savedModel = useSavedPageModel(locale, t('saved.targetUnavailableDescription'))
  return <main id="main-content" className="product-page">
    <UtilityNavigation />
    <header className="surface-header"><p className="eyebrow">SAVED</p><h1>{t('saved.title')}</h1><p>{t('saved.description')}</p></header>
    {savedModel.data === undefined && !savedModel.error ? <Skeleton className="guide-skeleton" /> : null}
    {savedModel.error ? <StatusNotice state="ERROR" title={t('state.errorTitle')}>{savedModel.error.message}<Button onClick={savedModel.reload}>{t('common.retry')}</Button></StatusNotice> : null}
    {savedModel.data && savedModel.items.length === 0 ? <EmptyState title={t('saved.emptyTitle')} description={t('saved.emptyDescription')} /> : null}
    {savedModel.items.map(({ item, title, summary, path, unavailable }) => <article className="place-preview" key={item.id}><h2>{title}</h2><p>{summary}</p>{unavailable ? <StatusNotice state="UNAVAILABLE" title={t('saved.targetUnavailable')}>{t('saved.targetUnavailableDescription')}</StatusNotice> : null}<Button variant="secondary" disabled={unavailable} onClick={() => navigate(path)}>{t('saved.openItem')}</Button></article>)}
  </main>
}
