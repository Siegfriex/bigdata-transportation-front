import type { Locale } from '../../../shared/i18n'
import type { ProvenanceSource } from '../../place'

export type LiveLifecycle = 'live' | 'upcoming' | 'replay' | 'ended'
export type CapabilityStatus = 'available' | 'unavailable'

export type SessionCapability = {
  status: CapabilityStatus
  reason?: 'PROVIDER_NOT_CONNECTED' | 'NO_REPLAY_SOURCE' | 'NO_ELIGIBLE_OFFER' | 'POLICY_NOT_READY'
}

export type LiveSession = {
  id: string
  lifecycle: LiveLifecycle
  category: string
  localized: Record<Locale, { title: string; deck: string; summary: string }>
  hostName: string
  scheduledAt?: string
  replayUrl?: string
  thumbnailUrl?: string
  player: SessionCapability
  chat: SessionCapability
  offer: SessionCapability
  placeIds: string[]
  articleIds: string[]
  offerIds: string[]
  provenance: {
    source: ProvenanceSource
    referenceId: string
    label: Record<Locale, string>
    method: 'fixture' | 'editorial' | 'release'
  }
}

export function getLiveContent(session: LiveSession, locale: Locale) {
  return session.localized[locale] ?? session.localized.en
}

export function getLiveContentResolution(session: LiveSession, locale: Locale) {
  const servedLocale = session.localized[locale] ? locale : 'en'
  return { content: getLiveContent(session, locale), requestedLocale: locale, servedLocale, fallbackUsed: servedLocale !== locale }
}
