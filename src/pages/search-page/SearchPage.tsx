import { createPlacePath, navigate } from '../../app/router/navigation'
import { getPlaceContent } from '../../entities/place'
import { useSearchPageModel } from '../../features/projection-query'
import { useI18n } from '../../shared/i18n'
import { Button, EmptyState, Skeleton, StatusNotice } from '../../shared/ui'
import { UtilityNavigation } from '../../widgets/app-chrome'

export function SearchPage() {
  const { locale, t } = useI18n()
  const searchModel = useSearchPageModel(locale)
  return <main id="main-content" className="product-page">
    <UtilityNavigation />
    <header className="surface-header"><p className="eyebrow">SEARCH</p><h1>{t('search.title')}</h1><p>{t('search.description')}</p></header>
    <form className="search-form" onSubmit={(event) => { event.preventDefault(); searchModel.submit() }}><label><span className="visually-hidden">{t('search.label')}</span><input value={searchModel.query} onChange={(event) => searchModel.setQuery(event.target.value)} placeholder={t('search.placeholder')} /></label><Button type="submit">{t('search.submit')}</Button></form>
    {searchModel.places === undefined && !searchModel.error ? <Skeleton /> : null}
    {searchModel.error ? <StatusNotice state="ERROR" title={t('state.errorTitle')}>{searchModel.error.message}<Button onClick={searchModel.reload}>{t('common.retry')}</Button></StatusNotice> : null}
    {searchModel.submittedQuery ? <StatusNotice state="UNAVAILABLE" title={t('search.fixtureOnly')}>{t('search.fixtureOnlyDescription')}</StatusNotice> : null}
    {searchModel.submittedQuery && searchModel.results.length === 0 ? <EmptyState title={t('search.emptyTitle')} description={t('search.emptyDescription')} /> : null}
    {searchModel.results.map((item) => <article className="place-preview" key={item.id}><h2>{getPlaceContent(item, locale).name}</h2><p>{getPlaceContent(item, locale).summary}</p><Button variant="secondary" onClick={() => navigate(createPlacePath(item.id, '/search'))}>{t('common.openPlace')}</Button></article>)}
  </main>
}
