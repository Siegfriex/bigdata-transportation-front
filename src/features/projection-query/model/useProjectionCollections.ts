import { useCallback, useEffect, useState } from 'react'
import type { LiveSession } from '../../../entities/live-session'
import type { Story } from '../../../entities/story'
import { track } from '../../../shared/analytics'
import { useProjectionRepository } from './ProjectionRepositoryContext'

type CollectionState<T> = {
  data: T[] | null
  error: Error | null
  reload: () => void
}

function useCollection<T>(loadCollection: () => Promise<T[]>, onLoaded: (count: number) => void): CollectionState<T> {
  const [data, setData] = useState<T[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const reload = useCallback(() => {
    setData(null)
    setError(null)
    loadCollection().then((next) => { setData(next); onLoaded(next.length) }).catch((next: Error) => setError(next))
  }, [loadCollection, onLoaded])
  useEffect(() => {
    let active = true
    loadCollection().then((next) => { if (active) { setData(next); setError(null); onLoaded(next.length) } }).catch((next: Error) => active && setError(next))
    return () => { active = false }
  }, [loadCollection, onLoaded])
  return { data, error, reload }
}

export function useStoryCollection(view: 'magazine' | 'community') {
  const repository = useProjectionRepository()
  const loadCollection = useCallback(() => repository.listStories(), [repository])
  const onLoaded = useCallback(() => { track('discover_viewed', { view, source: repository.source }) }, [repository.source, view])
  return useCollection<Story>(loadCollection, onLoaded)
}

export function useLiveSessionCollection() {
  const repository = useProjectionRepository()
  const loadCollection = useCallback(() => repository.listLiveSessions(), [repository])
  const onLoaded = useCallback(() => { track('live_home_viewed', { source: repository.source }) }, [repository.source])
  return useCollection<LiveSession>(loadCollection, onLoaded)
}
