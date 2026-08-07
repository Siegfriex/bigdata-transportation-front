import type { Locale } from '../../../shared/i18n'

export const PLACE_CATEGORIES = [
  'performance',
  'exhibition',
  'music',
  'food',
  'beauty-fashion',
  'broadcast-media',
  'healing',
  'activity',
] as const

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]
export type PlaceStatus = 'active' | 'unavailable'
export type ProvenanceSource = 'mbn' | 'editor' | 'partner' | 'community' | 'public'

export type LocalizedPlaceContent = {
  name: string
  summary: string
  whyItMatters: string
  availableExperience: string
}

export type LocalizedPlaceRecord = Partial<Record<Locale, LocalizedPlaceContent>>

export type PlaceProvenance = {
  source: ProvenanceSource
  referenceId: string
  label: Partial<Record<Locale, string>>
  method: 'fixture' | 'editorial' | 'release'
  reviewedAt?: string
  isSponsored: boolean
}

export type Place = {
  id: string
  slug: string
  coordinates: { lat: number; lng: number }
  address: Partial<Record<Locale, string>>
  category: PlaceCategory
  tags: string[]
  availableFrom?: string
  availableTo?: string
  localized: LocalizedPlaceRecord
  localeSupport: Locale[]
  source: ProvenanceSource
  provenance: PlaceProvenance
  relatedStoryIds: string[]
  relatedLiveIds: string[]
  offerIds: string[]
  status: PlaceStatus
}

export function getPlaceContent(place: Place, locale: Locale) {
  return resolvePlaceContent(place, locale).content
}

export function getPlaceContentResolution(place: Place, locale: Locale) {
  const { content, servedLocale } = resolvePlaceContent(place, locale)
  return { content, requestedLocale: locale, servedLocale, fallbackUsed: servedLocale !== locale }
}

export function getPlaceProvenanceLabel(place: Place, locale: Locale) {
  return place.provenance.label[locale] ?? place.provenance.label.ko ?? place.provenance.label.en ?? ''
}

function resolvePlaceContent(place: Place, locale: Locale) {
  const servedLocale = place.localized[locale] ? locale : place.localized.ko ? 'ko' : 'en'
  const content = place.localized[servedLocale]
  if (!content) throw new Error(`PLACE_LOCALIZED_CONTENT_MISSING:${place.id}`)
  return { content, servedLocale }
}
