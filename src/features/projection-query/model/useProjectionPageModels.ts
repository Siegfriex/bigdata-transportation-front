import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Article } from '../../../entities/article'
import { getLiveContentResolution, type LiveSession } from '../../../entities/live-session'
import { type Offer } from '../../../entities/offer'
import { type Partner } from '../../../entities/partner'
import { getPlaceContent, type Place, type PlaceCategory } from '../../../entities/place'
import type { SavedItem } from '../../../entities/saved-item'
import { getStoryContentResolution, type Story } from '../../../entities/story'
import { getSavedItems } from '../../save-item'
import { track } from '../../../shared/analytics'
import type { Locale } from '../../../shared/i18n'
import { createPlacePath } from '../../../app/router/navigation'
import { useProjectionRepository } from './ProjectionRepositoryContext'

type Loadable<T> = {
  data: T | null | undefined
  error: Error | null
  reload: () => void
}

function useLoadable<T>(load: () => Promise<T>, dependencies: readonly unknown[]): Loadable<T> {
  const [data, setData] = useState<T | null | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const reload = useCallback(() => {
    setData(undefined)
    setError(null)
    load().then((next) => setData(next)).catch((next: Error) => setError(next))
  }, [load])

  useEffect(() => {
    let active = true
    load().then((next) => { if (active) { setData(next); setError(null) } }).catch((next: Error) => { if (active) setError(next) })
    return () => { active = false }
    // The loader carries every externally meaningful dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return { data, error, reload }
}

export function useGuidePageModel(params: { area: string; category: PlaceCategory | 'all'; locale: Locale; selectedPlaceId?: string }) {
  const repository = useProjectionRepository()
  const load = useCallback(async () => {
    const places = await repository.listPlaces({ area: params.area, category: params.category })
    const nearbyPlaceIds = params.selectedPlaceId ? await repository.getNearbyPlaceIds(params.selectedPlaceId) : []
    return { places, nearbyPlaceIds }
  }, [params.area, params.category, params.selectedPlaceId, repository])
  const state = useLoadable(load, [load])
  useEffect(() => {
    if (!state.data) return
    track('guide_viewed', { area: params.area, locale: params.locale, visitorMode: 'prototype-profile', source: repository.source })
    track('guide_map_rendered', { mode: 'list-fallback', placeCount: state.data.places.length, area: params.area })
    track('discovery_tray_viewed', { count: state.data.places.length, category: params.category })
  }, [params.area, params.category, params.locale, repository.source, state.data])
  return { ...state, places: state.data?.places, nearbyPlaceIds: state.data?.nearbyPlaceIds ?? [], areaFilteringAvailable: repository.guideAreaFilteringAvailable, resultCount: state.data?.places.length ?? 0, mapEligible: true }
}

export function usePlacePageModel(placeId: string) {
  const repository = useProjectionRepository()
  const load = useCallback(() => repository.getPlace(placeId), [placeId, repository])
  const state = useLoadable(load, [load])
  useEffect(() => {
    if (state.data) track('place_detail_viewed', { placeId: state.data.id, entryPoint: 'guide' })
  }, [state.data])
  return { ...state, place: state.data }
}

export type PlaceRelations = { articles: Article[]; lives: LiveSession[]; offers: Array<{ offer: Offer; partner: Partner | null }> }

export function usePlaceRelationsModel(place: Place | null | undefined) {
  const repository = useProjectionRepository()
  const load = useCallback(async (): Promise<PlaceRelations | null> => {
    if (!place) return null
    const [articleRelations, liveRelations, offerEntries] = await Promise.all([
      repository.getRelatedArticlesForPlace(place.id),
      repository.getRelatedLiveForPlace(place.id),
      Promise.all(place.offerIds.map(async (id) => {
        const offer = await repository.getOffer(id)
        return offer ? { offer, partner: await repository.getPartner(offer.partnerId) } : null
      })),
    ])
    const [articles, lives] = await Promise.all([
      Promise.all(articleRelations.map((relation) => repository.getArticle(relation.articleId))),
      Promise.all(liveRelations.map((relation) => repository.getLiveSession(relation.liveSessionId))),
    ])
    return { articles: articles.filter((item): item is Article => item !== null), lives: lives.filter((item): item is LiveSession => item !== null), offers: offerEntries.filter((item): item is { offer: Offer; partner: Partner | null } => item !== null) }
  }, [place, repository])
  const state = useLoadable(load, [load])
  return { ...state, relations: state.data }
}

export type StoryDetailProjection = { story: Story | null; articles: Article[]; lives: LiveSession[] }

export function useStoryPageModel(storyId: string, locale: Locale) {
  const repository = useProjectionRepository()
  const load = useCallback(async (): Promise<StoryDetailProjection> => {
    const story = await repository.getStory(storyId)
    if (!story) return { story: null, articles: [], lives: [] }
    const [relatedArticles, relatedLives] = await Promise.all([
      Promise.all(story.articleIds.map((id) => repository.getArticle(id))),
      Promise.all(story.liveIds.map((id) => repository.getLiveSession(id))),
    ])
    const baseArticles = relatedArticles.filter((item): item is Article => item !== null)
    const articleRelations = await Promise.all(baseArticles.map((article) => repository.getRelatedArticlesForArticle(article.id)))
    const followUps = await Promise.all(articleRelations.flat().map((relation) => repository.getArticle(relation.articleId)))
    return { story, articles: [...baseArticles, ...followUps.filter((item): item is Article => item !== null).filter((candidate) => !baseArticles.some((article) => article.id === candidate.id))], lives: relatedLives.filter((item): item is LiveSession => item !== null) }
  }, [repository, storyId])
  const state = useLoadable(load, [load])
  const story = state.data?.story
  const resolution = useMemo(() => story ? getStoryContentResolution(story, locale) : null, [locale, story])
  useEffect(() => {
    if (story) track('story_opened', { storyId: story.id, source: story.provenance.source })
  }, [story])
  useEffect(() => {
    if (story && resolution?.fallbackUsed) track('locale_fallback_shown', { entityType: 'story', entityId: story.id, requestedLocale: locale, servedLocale: resolution.servedLocale })
  }, [locale, resolution?.fallbackUsed, resolution?.servedLocale, story])
  return { ...state, story, articles: state.data?.articles ?? [], lives: state.data?.lives ?? [], resolution }
}

export type LiveDetailProjection = { session: LiveSession | null; offers: Array<{ offer: Offer; partner: Partner | null }> }

export function useLiveDetailPageModel(sessionId: string, locale: Locale) {
  const repository = useProjectionRepository()
  const load = useCallback(async (): Promise<LiveDetailProjection> => {
    const session = await repository.getLiveSession(sessionId)
    if (!session) return { session: null, offers: [] }
    const entries = await Promise.all(session.offerIds.map(async (id) => {
      const offer = await repository.getOffer(id)
      return offer ? { offer, partner: await repository.getPartner(offer.partnerId) } : null
    }))
    return { session, offers: entries.filter((entry): entry is { offer: Offer; partner: Partner | null } => entry !== null) }
  }, [repository, sessionId])
  const state = useLoadable(load, [load])
  const session = state.data?.session
  const resolution = useMemo(() => session ? getLiveContentResolution(session, locale) : null, [locale, session])
  useEffect(() => {
    if (!session) return
    track('live_session_opened', { sessionId: session.id, lifecycle: session.lifecycle })
    track('live_status_viewed', { sessionId: session.id, lifecycle: session.lifecycle, playerStatus: session.player.status })
    track('chat_shell_viewed', { sessionId: session.id, chatStatus: session.chat.status })
  }, [session])
  useEffect(() => {
    if (session && resolution?.fallbackUsed) track('locale_fallback_shown', { entityType: 'liveSession', entityId: session.id, requestedLocale: locale, servedLocale: resolution.servedLocale })
  }, [locale, resolution?.fallbackUsed, resolution?.servedLocale, session])
  return { ...state, session, offers: state.data?.offers ?? [], resolution }
}

export type ResolvedSavedItem = { item: SavedItem; title: string; summary: string; path: string; unavailable: boolean }

export function useSavedPageModel(locale: Locale, unavailableDescription: string) {
  const repository = useProjectionRepository()
  const load = useCallback(async () => {
    const saved = getSavedItems()
    const resolved = await Promise.all(saved.map(async (item): Promise<ResolvedSavedItem> => {
      if (item.targetType === 'story') {
        const story = await repository.getStory(item.targetId)
        return story ? { item, title: getStoryContentResolution(story, locale).content.headline, summary: getStoryContentResolution(story, locale).content.summary, path: `/story/${encodeURIComponent(story.id)}`, unavailable: story.status === 'unavailable' } : { item, title: item.targetId, summary: unavailableDescription, path: '/saved', unavailable: true }
      }
      const place = await repository.getPlace(item.targetId)
      return place ? { item, title: getPlaceContent(place, locale).name, summary: getPlaceContent(place, locale).summary, path: createPlacePath(place.id, '/saved'), unavailable: place.status === 'unavailable' } : { item, title: item.targetId, summary: unavailableDescription, path: '/saved', unavailable: true }
    }))
    return { saved, resolved }
  }, [locale, repository, unavailableDescription])
  const state = useLoadable(load, [load])
  useEffect(() => { if (state.data) track('saved_hub_viewed', { collection: 'default', itemCount: state.data.saved.length }) }, [state.data])
  return { ...state, items: state.data?.resolved ?? [] }
}

export function useSearchPageModel(locale: Locale, initialQuery = '') {
  const repository = useProjectionRepository()
  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const load = useCallback(() => repository.listPlaces(), [repository])
  const state = useLoadable(load, [load])
  const results = useMemo(() => {
    const normalized = submittedQuery.trim().toLocaleLowerCase()
    if (!normalized || !state.data) return []
    return state.data.filter((place) => {
      const content = getPlaceContent(place, locale)
      return [content.name, content.summary, content.whyItMatters, ...place.tags].join(' ').toLocaleLowerCase().includes(normalized)
    })
  }, [locale, state.data, submittedQuery])
  const submit = useCallback(() => {
    setSubmittedQuery(query)
    track('search_submitted', { queryLength: query.trim().length, scope: 'projection-direct-match' })
  }, [query])
  return { ...state, places: state.data, query, setQuery, submittedQuery, results, submit }
}
