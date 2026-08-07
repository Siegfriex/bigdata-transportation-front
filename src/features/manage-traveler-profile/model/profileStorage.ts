import { isTravelerProfile, type TravelerProfile } from '../../../entities/traveler-profile'
import { createSafeStorage } from '../../../shared/model'

const storage = createSafeStorage({ key: 'traveler-profile', version: 1 })

export const DEFAULT_PROFILE: TravelerProfile = {
  locale: 'ko',
  visitorMode: 'foreigner',
  interests: [],
  persistenceStatus: 'local',
}

export function getTravelerProfile() {
  const result = storage.getValidated(isTravelerProfile)
  return result.ok && result.value ? result.value : DEFAULT_PROFILE
}

export function setTravelerProfile(profile: TravelerProfile) {
  return storage.set(profile)
}
