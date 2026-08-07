import { useEffect, useSyncExternalStore } from 'react'
import { GuidePage } from '../../pages/guide-page/GuidePage'
import { DiscoverPage } from '../../pages/discover-page/DiscoverPage'
import { StoryPage } from '../../pages/story-page/StoryPage'
import { LivePage } from '../../pages/live-page/LivePage'
import { LiveDetailPage } from '../../pages/live-detail-page/LiveDetailPage'
import { SavedPage } from '../../pages/saved-page/SavedPage'
import { SearchPage } from '../../pages/search-page/SearchPage'
import { SettingsPage } from '../../pages/settings-page/SettingsPage'
import { PlacePage } from '../../pages/place-page/PlacePage'
import { RouteStatePage } from '../../pages/route-state-page/RouteStatePage'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function getSnapshot() {
  return `${window.location.pathname}${window.location.search}`
}

function decodeRouteId(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

export function AppRouter() {
  const path = useSyncExternalStore(subscribe, getSnapshot, () => '/')

  useEffect(() => {
  if (path === '/') {
      window.history.replaceState(null, '', '/guide')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [path])

  const pathname = path.split('?')[0] ?? '/'

  if (pathname === '/guide') {
    return <GuidePage />
  }
  if (pathname.startsWith('/place/')) {
    const placeId = decodeRouteId(pathname.slice('/place/'.length))
    const returnTo = new URLSearchParams(path.split('?')[1] ?? '').get('returnTo')
    const guideBackground = returnTo?.startsWith('/guide') ? returnTo : null
    return placeId ? guideBackground ? <><GuidePage locationOverride={guideBackground} /><PlacePage key={placeId} placeId={placeId} presentation="modal" /></> : <PlacePage key={placeId} placeId={placeId} /> : <RouteStatePage routeName="Unknown place" />
  }
  if (pathname === '/discover') {
    return <DiscoverPage />
  }
  if (pathname.startsWith('/story/')) {
    const storyId = decodeRouteId(pathname.slice('/story/'.length))
    return storyId ? <StoryPage key={storyId} storyId={storyId} /> : <RouteStatePage routeName="Unknown Story" />
  }
  if (pathname === '/live') {
    return <LivePage />
  }
  if (pathname.startsWith('/live/')) {
    const sessionId = decodeRouteId(pathname.slice('/live/'.length))
    return sessionId ? <LiveDetailPage key={sessionId} sessionId={sessionId} /> : <RouteStatePage routeName="Unknown session" />
  }
  if (pathname === '/search') {
    return <SearchPage />
  }
  if (pathname === '/saved') {
    return <SavedPage />
  }
  if (pathname === '/settings') {
    return <SettingsPage />
  }
  return <RouteStatePage routeName="Unavailable route" />
}
