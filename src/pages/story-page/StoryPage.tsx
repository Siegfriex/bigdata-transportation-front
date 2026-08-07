import { useState } from 'react'
import { createPlacePath, navigate, safeReturnPath } from '../../app/router/navigation'
import { getArticleContent } from '../../entities/article'
import { getLiveContent } from '../../entities/live-session'
import { useStoryPageModel } from '../../features/projection-query'
import { SaveItemButton } from '../../features/save-item'
import { track } from '../../shared/analytics'
import { useI18n } from '../../shared/i18n'
import { Button, ContextRelationCard, EmptyState, Icon, MediaFrame, Skeleton, StatusNotice, SurfaceSection } from '../../shared/ui'
import '../../widgets/story-detail-surface/editorial-detail.css'

type StoryPageProps = { storyId: string }

export function StoryPage({ storyId }: StoryPageProps) {
  const { locale, t } = useI18n()
  const storyModel = useStoryPageModel(storyId, locale)
  const { story, resolution } = storyModel
  const returnTo = safeReturnPath(new URLSearchParams(window.location.search).get('returnTo'), '/discover?view=magazine')
  const [searchQuery, setSearchQuery] = useState('')

  return <main id="main-content" className="product-page editorial-detail-page figma-detail-page">
    <header className="figma-detail-page__topbar story-topbar" aria-label={t('discover.title')}>
      <form className="story-topbar__search" onSubmit={(event) => { event.preventDefault(); navigate(`/search?q=${encodeURIComponent(searchQuery)}`) }}>
        <label className="visually-hidden" htmlFor="story-search">{t('discover.searchPlaceholder')}</label>
        <Icon className="story-topbar__search-icon" name="search" />
        <input id="story-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t('discover.searchPlaceholder')} />
        <Button type="submit">{t('discover.searchSubmit')}</Button>
      </form>
      <Button variant="secondary" className="story-topbar__utility" aria-label={t('nav.settings')} onClick={() => navigate('/settings')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-5v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.2-6.2-1.4 1.4M7.7 16.8l-1.4 1.4m11.4 0-1.4-1.4M7.7 7.2 6.3 5.8" /></svg>
      </Button>
    </header>
    <header className="story-breadcrumb"><Button variant="ghost" className="figma-detail-page__back" onClick={() => navigate(returnTo)} aria-label={t('story.back')}>‹</Button><p>{t('story.breadcrumb')}</p></header>
    {storyModel.data === undefined && !storyModel.error ? <Skeleton className="guide-skeleton" /> : null}
    {storyModel.error ? <StatusNotice state="ERROR" title={t('state.errorTitle')}>{storyModel.error.message}<Button onClick={storyModel.reload}>{t('common.retry')}</Button></StatusNotice> : null}
    {storyModel.data && !story ? <EmptyState title={t('story.unavailable')} description={t('state.unknownStory')} /> : null}
    {story && resolution ? <article className="editorial-detail" aria-labelledby="story-detail-title">
      <MediaFrame className="editorial-detail__hero" label={t('story.videoUnavailableTitle')}>
        <span className="editorial-detail__media-note">{t('discover.storyMediaUnavailable')}</span>
      </MediaFrame>
      <header className="editorial-detail__header">
        <div className="editorial-detail__tags">{story.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <h1 id="story-detail-title">{resolution.content.headline}</h1>
        <p className="editorial-detail__provenance">{story.provenance.label[locale]}</p>
        <p className="editorial-detail__summary">{resolution.content.summary}</p>
      </header>
      {resolution.fallbackUsed ? <StatusNotice state="UNAVAILABLE" title={t('locale.fallbackTitle')}>{t('locale.fallbackDescription')}</StatusNotice> : null}
      {story.placeIds.length ? <section className="editorial-detail__place-action" aria-label={t('story.relatedPlaces')}>
        {story.placeIds.map((placeId) => <Button key={placeId} className="editorial-detail__place-cta" variant="secondary" onClick={() => { track('related_place_opened', { originType: 'story', originId: story.id, placeId }); navigate(createPlacePath(placeId, returnTo)) }}><span aria-hidden="true">⌖</span>{t('story.openPlace')}</Button>)}
      </section> : null}
      <section className="editorial-detail__actions" aria-label={t('place.actions')}><SaveItemButton targetType="story" targetId={story.id} /></section>
      <SurfaceSection title={t('story.articleContext')} className="editorial-detail__section editorial-detail__section--context">
        {storyModel.articles.length ? storyModel.articles.map((article) => <ContextRelationCard key={article.id} label={t('story.articleContext')} title={getArticleContent(article, locale).headline} description={getArticleContent(article, locale).excerpt} provenance={article.provenance.label[locale]} />) : <EmptyState title={t('story.noArticle')} />}
      </SurfaceSection>
      <SurfaceSection title={t('story.relatedLive')} className="editorial-detail__section">
        {storyModel.lives.length ? storyModel.lives.map((session) => <Button key={session.id} variant="secondary" onClick={() => navigate(`/live/${encodeURIComponent(session.id)}?returnTo=${encodeURIComponent(returnTo)}`)}>{getLiveContent(session, locale).title}</Button>) : <EmptyState title={t('live.noSessionsTitle')} />}
      </SurfaceSection>
    </article> : null}
  </main>
}
