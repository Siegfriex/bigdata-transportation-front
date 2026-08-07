import type { Locale } from '../../../shared/i18n'
import { PLACE_CATEGORIES, type PlaceCategory } from '../../place'

export type VisitorMode = 'foreigner' | 'domestic-traveler' | 'local-explorer'

export type TravelerProfile = {
  locale: Locale
  visitorMode: VisitorMode
  interests: PlaceCategory[]
  persistenceStatus: 'local' | 'unavailable'
}

const VISITOR_MODES: VisitorMode[] = ['foreigner', 'domestic-traveler', 'local-explorer']

export function isTravelerProfile(value: unknown): value is TravelerProfile {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (candidate.locale === 'ko' || candidate.locale === 'en')
    && typeof candidate.persistenceStatus === 'string'
    && (candidate.persistenceStatus === 'local' || candidate.persistenceStatus === 'unavailable')
    && typeof candidate.visitorMode === 'string'
    && VISITOR_MODES.includes(candidate.visitorMode as VisitorMode)
    && Array.isArray(candidate.interests)
    && candidate.interests.every((interest) => typeof interest === 'string' && PLACE_CATEGORIES.includes(interest as PlaceCategory))
}
