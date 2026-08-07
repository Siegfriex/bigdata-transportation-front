import { useMemo, useState } from 'react'
import type { LiveLifecycle } from '../../entities/live-session'
import { useLiveSessionCollection } from '../../features/projection-query'
import { track } from '../../shared/analytics'
import { useI18n } from '../../shared/i18n'
import { Button, EmptyState, Skeleton, StatusNotice } from '../../shared/ui'
import { navigate } from '../../app/router/navigation'
import { LiveCommerceHub } from '../../widgets/live-commerce-hub'

const statuses: Array<LiveLifecycle | 'all'> = ['all', 'live', 'upcoming', 'replay', 'ended']

function readLiveFilters() {
  const query = new URLSearchParams(window.location.search)
  const status = query.get('status')
  return {
    status: statuses.includes(status as LiveLifecycle | 'all') ? status as LiveLifecycle | 'all' : 'all',
    category: query.get('category') ?? 'all',
  }
}

export function LivePage() {
  const [initial] = useState(readLiveFilters)
  const [status, setStatus] = useState(initial.status)
  const [category, setCategory] = useState(initial.category)
  const { locale, t } = useI18n()
  const { data: sessions, error, reload } = useLiveSessionCollection()

  const categories = useMemo(() => ['all', ...new Set(sessions?.map((item) => item.category) ?? [])], [sessions])
  const safeCategory = categories.includes(category) ? category : 'all'
  const filtered = sessions?.filter((item) => (status === 'all' || item.lifecycle === status) && (safeCategory === 'all' || item.category === safeCategory)) ?? null
  const change = (nextStatus: LiveLifecycle | 'all', nextCategory: string) => {
    setStatus(nextStatus)
    setCategory(nextCategory)
    navigate(`/live?status=${encodeURIComponent(nextStatus)}&category=${encodeURIComponent(nextCategory)}`, { replace: true })
    track('live_filter_changed', { status: nextStatus, category: nextCategory })
  }

  return (
    <main id="main-content" className="figma-mobile-page live-page">
      <header className="figma-topbar figma-topbar--live" aria-label="라이브 도구">
        <button className="figma-search figma-search--link" type="button" onClick={() => navigate('/search')}><span>브랜드, 상품, 방송 검색</span></button>
        <Button variant="secondary" className="figma-topbar__utility" aria-label={t('nav.settings')} onClick={() => navigate('/settings')}>설정</Button>
      </header>
      <section className="live-filter-section live-filter-section--categories" aria-labelledby="live-category-filter">
        <h2 id="live-category-filter" className="visually-hidden">{t('live.categoryFilter')}</h2>
        <div className="filter-row">
          {categories.map((value) => <Button key={value} size="sm" variant={safeCategory === value ? 'primary' : 'secondary'} aria-pressed={safeCategory === value} onClick={() => change(status, value)}>{value === 'all' ? t('label.all') : t(`label.live.category.${value}`)}</Button>)}
        </div>
      </section>
      <section className="live-filter-section live-filter-section--status" aria-labelledby="live-status-filter">
        <h2 id="live-status-filter" className="visually-hidden">{t('live.statusFilter')}</h2>
        <div className="filter-row">
          {statuses.map((value) => <Button key={value} size="sm" variant={status === value ? 'primary' : 'secondary'} aria-pressed={status === value} onClick={() => change(value, safeCategory)}>{value === 'all' ? t('label.all') : t(`label.live.lifecycle.${value}`)}</Button>)}
        </div>
      </section>
      {sessions === null && !error ? <Skeleton className="guide-skeleton" /> : null}
      {error ? <StatusNotice state="ERROR" title={t('state.errorTitle')}>{error.message}<Button onClick={reload}>{t('common.retry')}</Button></StatusNotice> : null}
      {filtered?.length ? <LiveCommerceHub sessions={filtered} locale={locale} onOpenSession={(session) => navigate(`/live/${encodeURIComponent(session.id)}?returnTo=${encodeURIComponent(`/live?status=${status}&category=${safeCategory}`)}`)} /> : filtered ? <EmptyState title={t('live.noSessionsTitle')} description={t('live.noSessionsDescription')} /> : null}
      <section className="live-page__provider-note" role="status"><h2>{t('live.noProviderTitle')}</h2><p>{t('live.noProviderDescription')}</p></section>
    </main>
  )
}
