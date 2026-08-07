import { navigate, safeReturnPath } from '../../app/router/navigation'
import { isOfferCtaEligible } from '../../entities/offer'
import { useLiveDetailPageModel } from '../../features/projection-query'
import { useI18n } from '../../shared/i18n'
import { Button, ContextRelationCard, EmptyState, MediaFrame, Skeleton, StatusNotice, SurfaceSection } from '../../shared/ui'
import '../../widgets/live-detail-surface/live-detail.css'

type LiveDetailPageProps = { sessionId: string }

export function LiveDetailPage({ sessionId }: LiveDetailPageProps) {
  const { locale, t } = useI18n()
  const liveModel = useLiveDetailPageModel(sessionId, locale)
  const { session, resolution } = liveModel
  const returnTo = safeReturnPath(new URLSearchParams(window.location.search).get('returnTo'), '/live')
  const lifecycleLabel = session ? t(`label.live.lifecycle.${session.lifecycle}`) : ''

  return <main id="main-content" className="product-page live-detail-page figma-live-detail-page">
    {liveModel.data === undefined && !liveModel.error ? <Skeleton className="guide-skeleton" /> : null}
    {liveModel.error ? <StatusNotice state="ERROR" title={t('state.errorTitle')}>{liveModel.error.message}<Button onClick={liveModel.reload}>{t('common.retry')}</Button></StatusNotice> : null}
    {liveModel.data && !session ? <EmptyState title={t('live.unavailable')} description={t('state.unknownSession')} /> : null}
    {session && resolution ? <article className={`live-detail live-detail--${session.lifecycle}`} aria-labelledby="live-detail-title">
      <section className="live-detail__stage" aria-label={session.player.status === 'available' ? t('live.playerAvailable') : t('live.playerUnavailable')}>
      <MediaFrame label={session.player.status === 'available' ? t('live.playerAvailable') : t('live.playerUnavailable')} status={session.player.status} eyebrow={lifecycleLabel}>
        <span className="live-detail__media-note">{session.player.status === 'available' ? t('live.playerAvailable') : t('live.playerUnavailableDescription')}</span>
      </MediaFrame>
      <div className="live-detail__stage-top"><Button variant="ghost" className="live-detail__close" onClick={() => navigate(returnTo)} aria-label={t('live.back')}>×</Button><p>{session.hostName}</p><span>{lifecycleLabel}</span></div>
      <div className="live-detail__stage-bottom"><p>{session.provenance.label[locale]}</p><Button size="sm" variant="secondary" onClick={() => navigate(`/place/${encodeURIComponent(session.placeIds[0] ?? '')}?returnTo=${encodeURIComponent(returnTo)}`)} disabled={!session.placeIds[0]}>{t('live.relatedPlace')}</Button></div>
      </section>
      <header className="live-detail__header">
        <p className="eyebrow">{lifecycleLabel}</p>
        <h1 id="live-detail-title">{resolution.content.title}</h1>
        <p className="live-detail__host">{session.hostName}</p>
        {session.scheduledAt ? <p className="live-detail__schedule">{session.scheduledAt}</p> : null}
        <p className="live-detail__summary">{resolution.content.summary}</p>
        <p className="live-detail__provenance">{session.provenance.label[locale]}</p>
      </header>
      {resolution.fallbackUsed ? <StatusNotice state="UNAVAILABLE" title={t('locale.fallbackTitle')}>{t('locale.fallbackDescription')}</StatusNotice> : null}
      <SurfaceSection title={t('live.chat')} className="live-detail__section">
        <StatusNotice state={session.chat.status === 'available' ? 'SUCCESS' : 'UNAVAILABLE'} title={session.chat.status === 'available' ? t('live.chatAvailable') : t('live.chatUnavailable')}>
          {session.chat.status === 'available' ? t('live.chatAvailable') : t('live.chatUnavailableDescription')}
        </StatusNotice>
      </SurfaceSection>
      <SurfaceSection title={t('live.relatedPlace')} className="live-detail__section">
        {session.placeIds.length ? session.placeIds.map((placeId) => <Button key={placeId} variant="secondary" onClick={() => navigate(`/place/${encodeURIComponent(placeId)}?returnTo=${encodeURIComponent(returnTo)}`)}>{t('common.openPlace')}</Button>) : <EmptyState title={t('live.noRelatedPlace')} />}
      </SurfaceSection>
      <SurfaceSection title={t('live.offer')} className="live-detail__section">
        {liveModel.offers.length ? liveModel.offers.map(({ offer, partner }) => <ContextRelationCard key={offer.id} unavailable label={t('live.offer')} title={offer.title} description={offer.disclosure} provenance={partner?.disclosureIdentity ?? t('offer.partnerUnavailable')} action={isOfferCtaEligible(offer) && partner?.status === 'active' ? <StatusNotice state="UNAVAILABLE" title={t('offer.ctaUnavailable')}>{t('offer.ctaUnavailableDescription')}</StatusNotice> : <StatusNotice state="UNAVAILABLE" title={t('offer.unavailableTitle')}>{t('offer.unavailableDescription')}</StatusNotice>} />) : <StatusNotice state="UNAVAILABLE" title={t('live.noOffer')}>{t('live.noOfferDescription')}</StatusNotice>}
      </SurfaceSection>
    </article> : null}
  </main>
}
