import type { Locale } from '../../../shared/i18n'
import type { ProvenanceSource } from '../../place'

export type StoryStatus = 'active' | 'unavailable'

export type Story = {
  id: string
  localized: Record<Locale, { headline: string; deck: string; summary: string }>
  articleIds: string[]
  placeIds: string[]
  liveIds: string[]
  tags: string[]
  provenance: {
    source: ProvenanceSource
    referenceId: string
    label: Record<Locale, string>
    method: 'fixture' | 'editorial' | 'release'
  }
  publishedAt?: string
  status: StoryStatus
}

export function getStoryContent(story: Story, locale: Locale) {
  return story.localized[locale] ?? story.localized.en
}

export function getStoryContentResolution(story: Story, locale: Locale) {
  const servedLocale = story.localized[locale] ? locale : 'en'
  return { content: getStoryContent(story, locale), requestedLocale: locale, servedLocale, fallbackUsed: servedLocale !== locale }
}
