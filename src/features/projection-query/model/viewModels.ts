import { getLiveContentResolution, type LiveSession } from '../../../entities/live-session'
import { getPlaceContentResolution, getPlaceProvenanceLabel, type Place } from '../../../entities/place'
import { getStoryContentResolution, type Story } from '../../../entities/story'
import type { Locale } from '../../../shared/i18n'

export function toPlaceViewModel(place: Place, locale: Locale) {
  const localized = getPlaceContentResolution(place, locale)
  return { id: place.id, title: localized.content.name, summary: localized.content.summary, whyItMatters: localized.content.whyItMatters, category: place.category, status: place.status, provenanceLabel: getPlaceProvenanceLabel(place, locale), fallbackUsed: localized.fallbackUsed }
}
export function toStoryViewModel(story: Story, locale: Locale) {
  const localized = getStoryContentResolution(story, locale)
  return { id: story.id, headline: localized.content.headline, deck: localized.content.deck, summary: localized.content.summary, status: story.status, provenanceLabel: story.provenance.label[locale], fallbackUsed: localized.fallbackUsed }
}
export function toLiveSessionViewModel(session: LiveSession, locale: Locale) {
  const localized = getLiveContentResolution(session, locale)
  return { id: session.id, title: localized.content.title, summary: localized.content.summary, lifecycle: session.lifecycle, playerStatus: session.player.status, chatStatus: session.chat.status, offerStatus: session.offer.status, category: session.category, provenanceLabel: session.provenance.label[locale], fallbackUsed: localized.fallbackUsed }
}
