export type AnalyticsPayload = Record<string, string | number | boolean | undefined>

export type AnalyticsEventName =
  | 'guide_viewed'
  | 'guide_filter_changed'
  | 'guide_map_rendered'
  | 'discovery_tray_viewed'
  | 'map_pin_opened'
  | 'place_detail_viewed'
  | 'item_saved'
  | 'place_share_attempted'
  | 'discover_viewed'
  | 'story_opened'
  | 'related_place_opened'
  | 'discover_view_changed'
  | 'community_opened'
  | 'live_home_viewed'
  | 'live_filter_changed'
  | 'live_session_opened'
  | 'live_status_viewed'
  | 'chat_shell_viewed'
  | 'offer_opened'
  | 'partner_cta_clicked'
  | 'locale_changed'
  | 'visitor_mode_updated'
  | 'interests_updated'
  | 'search_submitted'
  | 'saved_hub_viewed'
  | 'locale_fallback_shown'
  | 'profile_preferences_persisted'
  | 'loading'
  | 'empty'
  | 'error'
  | 'unavailable'

export type AnalyticsEvent = {
  name: AnalyticsEventName
  payload: AnalyticsPayload
  occurredAt: string
}

export interface AnalyticsClient {
  track(event: AnalyticsEvent): void
}

export const analyticsClient: AnalyticsClient = {
  track(event) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mbn-guide:analytics', { detail: event }))
    }
  },
}

export const noopAnalyticsAdapter: AnalyticsClient = {
  track() {
    // Deliberately no-op until an approved analytics provider is introduced.
  },
}

export function track(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  analyticsClient.track({ name, payload, occurredAt: new Date().toISOString() })
}
