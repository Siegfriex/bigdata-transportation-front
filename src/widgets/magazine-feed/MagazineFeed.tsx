import type { Story } from '../../entities/story'
import { toStoryViewModel } from '../../features/projection-query'
import { useI18n } from '../../shared/i18n'
import type { Locale } from '../../shared/i18n'
import { EditorialImagePlaceholder, EmptyState } from '../../shared/ui'
import './discover.css'

type MagazineFeedProps = {
  stories: Story[]
  locale: Locale
  onOpenStory: (story: Story) => void
}

export function MagazineFeed({ stories, locale, onOpenStory }: MagazineFeedProps) {
  const { t } = useI18n()
  if (stories.length === 0) return <EmptyState title={t('discover.noStoriesTitle')} description={t('discover.noStoriesDescription')} />

  const featured = stories[0]!
  const featuredViewModel = toStoryViewModel(featured, locale)

  return (
    <div className="magazine-feed">
      <section className="magazine-feed__section" aria-labelledby="hot-magazine-title">
        <header className="magazine-feed__heading"><p aria-hidden="true">♨</p><h2 id="hot-magazine-title">{t('discover.hotMagazine')}</h2></header>
        <div className="magazine-card-rail" aria-label={t('discover.featured')}>
          <button type="button" className="magazine-card magazine-card--featured" aria-label={t('common.openStory')} onClick={() => onOpenStory(featured)}>
            <EditorialImagePlaceholder className="magazine-card__image" label={t('discover.storyMedia')} eyebrow="EDITORIAL" detail={t('discover.storyMediaUnavailable')} />
            <div className="magazine-card__body">
              <p className="magazine-card__tag">{featuredViewModel.deck}</p>
              <h3>{featuredViewModel.headline}</h3>
            </div>
          </button>
        </div>
      </section>
      <section className="magazine-feed__section" aria-labelledby="all-magazine-title">
        <header className="magazine-feed__heading"><h2 id="all-magazine-title">{t('discover.allMagazines')}</h2></header>
        {stories.slice(1).length ? <div className="magazine-card-rail" aria-label={t('discover.stream')}>
          {stories.slice(1).map((story) => {
            const viewModel = toStoryViewModel(story, locale)
            return (
              <button type="button" className="magazine-card" key={story.id} aria-label={t('common.openStory')} onClick={() => onOpenStory(story)}>
                <EditorialImagePlaceholder className="magazine-card__image" label={t('discover.storyMedia')} eyebrow="EDITORIAL" detail={t('discover.storyMediaUnavailable')} />
                <div className="magazine-card__body">
                  <p className="magazine-card__tag">{viewModel.deck}</p>
                  <h3>{viewModel.headline}</h3>
                </div>
              </button>
            )
          })}
        </div> : <div className="magazine-card magazine-card--unavailable" role="status">
          <EditorialImagePlaceholder className="magazine-card__image" label={t('discover.storyMedia')} eyebrow="EDITORIAL" detail={t('discover.storyMediaUnavailable')} />
          <div className="magazine-card__body">
            <p className="magazine-card__tag">{t('discover.singleMagazine')}</p>
            <h3>{t('discover.moreMagazinesUnavailable')}</h3>
          </div>
        </div>}
      </section>
    </div>
  )
}
