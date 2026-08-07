import { useEffect } from 'react'
import { getArticleContent, getArticleProvenanceLabel } from '../../entities/article'
import { getLiveContent } from '../../entities/live-session'
import { isOfferCtaEligible } from '../../entities/offer'
import type { Place } from '../../entities/place'
import { getPlaceContentResolution, getPlaceProvenanceLabel } from '../../entities/place'
import { navigate } from '../../app/router/navigation'
import { usePlaceRelationsModel } from '../../features/projection-query'
import { SavePlaceButton } from '../../features/save-item'
import { SharePlaceButton } from '../../features/share-item'
import { track } from '../../shared/analytics'
import type { Locale } from '../../shared/i18n'
import { useI18n } from '../../shared/i18n'
import { Button, Card, ContextRelationCard, EmptyState, Skeleton, StatusNotice } from '../../shared/ui'

type PlaceDetailContentProps = { place: Place; locale: Locale }

export function PlaceDetailContent({ place, locale }: PlaceDetailContentProps) {
  const { t } = useI18n()
  const relationModel = usePlaceRelationsModel(place)
  const resolution = getPlaceContentResolution(place, locale)
  const content = resolution.content

  useEffect(() => { if (resolution.fallbackUsed) track('locale_fallback_shown', { entityType: 'place', entityId: place.id, requestedLocale: locale, servedLocale: resolution.servedLocale }) }, [locale, place.id, resolution.fallbackUsed, resolution.servedLocale])

  return <article className="place-detail" aria-labelledby="place-detail-title">
    <header className="place-detail__header"><p className="eyebrow">{t(`label.category.${place.category}`)}</p><h1 id="place-detail-title">{content.name}</h1>{content.summary ? <p>{content.summary}</p> : null}<p className="place-preview__provenance">{getPlaceProvenanceLabel(place, locale)}</p></header>
    {resolution.fallbackUsed ? <StatusNotice state="UNAVAILABLE" title={t('locale.fallbackTitle')}>{t('locale.fallbackDescription')}</StatusNotice> : null}
    {place.status === 'unavailable' ? <StatusNotice state="UNAVAILABLE" title={t('place.availabilityUnknownTitle')}>{t('place.availabilityUnknownDescription')}</StatusNotice> : null}
    <Card><h2>{t('place.why')}</h2><p>{content.whyItMatters}</p></Card>
    <Card><h2>{t('place.experience')}</h2>{content.availableExperience ? <p>{content.availableExperience}</p> : <p className="place-detail__unavailable-copy">{t('place.experienceUnavailable')}</p>}</Card>
    <Card><h2>{t('place.editorial')}</h2>{relationModel.relations === undefined && !relationModel.error ? <Skeleton /> : null}{relationModel.error ? <StatusNotice state="ERROR" title={t('state.errorTitle')}>{relationModel.error.message}<Button variant="secondary" onClick={relationModel.reload}>{t('common.retry')}</Button></StatusNotice> : null}{relationModel.relations?.articles.length ? relationModel.relations.articles.map((article) => <ContextRelationCard key={article.id} label={t('place.editorial')} title={getArticleContent(article, locale).headline} description={getArticleContent(article, locale).excerpt} provenance={getArticleProvenanceLabel(article, locale)} />) : relationModel.relations ? <EmptyState title={t('place.noStoryTitle')} description={t('place.noStoryDescription')} /> : null}</Card>
    <Card><h2>{t('place.relatedLive')}</h2>{relationModel.relations?.lives.length ? relationModel.relations.lives.map((session) => <Button key={session.id} variant="secondary" onClick={() => navigate(`/live/${encodeURIComponent(session.id)}`)}>{getLiveContent(session, locale).title}</Button>) : relationModel.relations ? <EmptyState title={t('live.noSessionsTitle')} description={t('live.noSessionsDescription')} /> : <Skeleton />}</Card>
    <Card><h2>{t('place.community')}</h2><EmptyState title={t('place.communityTitle')} description={t('place.communityDescription')} /></Card>
    <section className="place-detail__actions" aria-label={t('place.actions')}><SavePlaceButton placeId={place.id} /><SharePlaceButton placeId={place.id} title={content.name} description={content.summary} /></section>
    <Card><h2>{t('place.offer')}</h2>{relationModel.relations?.offers.length ? relationModel.relations.offers.map(({ offer, partner }) => <ContextRelationCard key={offer.id} unavailable label={t('place.offer')} title={offer.title} description={offer.disclosure} provenance={partner?.disclosureIdentity ?? t('offer.partnerUnavailable')} action={isOfferCtaEligible(offer) && partner?.status === 'active' ? <StatusNotice state="UNAVAILABLE" title={t('offer.ctaUnavailable')}>{t('offer.ctaUnavailableDescription')}</StatusNotice> : <StatusNotice state="UNAVAILABLE" title={t('offer.unavailableTitle')}>{t('offer.unavailableDescription')}</StatusNotice>} />) : relationModel.relations ? <StatusNotice state="UNAVAILABLE" title={t('place.offerTitle')}>{t('place.offerDescription')}</StatusNotice> : <Skeleton />}</Card>
  </article>
}
