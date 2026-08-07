import type { LiveSession } from '../../entities/live-session'
import { toLiveSessionViewModel } from '../../features/projection-query'
import { useI18n } from '../../shared/i18n'
import type { Locale } from '../../shared/i18n'
import { Button, EmptyState } from '../../shared/ui'
import './live.css'

type LiveCommerceHubProps = {
  sessions: LiveSession[]
  locale: Locale
  onOpenSession: (session: LiveSession) => void
}

export function LiveCommerceHub({ sessions, locale, onOpenSession }: LiveCommerceHubProps) {
  const { t } = useI18n()
  if (sessions.length === 0) return <EmptyState title={t('live.noSessionsTitle')} description={t('live.noSessionsDescription')} />
  const label = (session: LiveSession) => t(`label.live.lifecycle.${session.lifecycle}`)

  const featured = sessions.filter((session) => session.lifecycle === 'live' || session.lifecycle === 'upcoming')
  const railItems = sessions

  return (
    <div className="live-surface">
      <section className="live-surface__section" aria-labelledby="featured-live-title">
        <header className="live-surface__heading"><div><p>MBN GUIDE LIVE</p><h2 id="featured-live-title">{featured.length ? '지금 이어지는 문화 라이브' : '새로운 문화 라이브'}</h2></div><span aria-hidden="true">›</span></header>
        <div className="live-session-rail" aria-label={t('live.featured')}>
          {railItems.map((session) => {
            const viewModel = toLiveSessionViewModel(session, locale)
            return <article className={`live-visual-card live-visual-card--${session.lifecycle}`} key={session.id}>
              <button type="button" className="live-visual-card__media" onClick={() => onOpenSession(session)} aria-label={`${viewModel.title}, ${t('common.openSession')}`}>
                <span className="live-visual-card__badge">{label(session)}</span><span className="live-visual-card__glyph" aria-hidden="true">◌</span><span className="live-visual-card__media-note">미디어 준비 중</span>
              </button>
              <div className="live-visual-card__body"><h3>{viewModel.title}</h3><p>{session.hostName}</p><p>{viewModel.provenanceLabel}</p><Button size="sm" variant="ghost" onClick={() => onOpenSession(session)}>{t('common.openSession')}</Button></div>
            </article>
          })}
        </div>
      </section>
    </div>
  )
}
