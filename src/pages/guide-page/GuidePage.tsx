import { useState } from 'react'
import type { PlaceCategory } from '../../entities/place'
import { createPlacePath, navigate } from '../../app/router/navigation'
import { useGuidePageModel } from '../../features/projection-query'
import { track } from '../../shared/analytics'
import { useI18n } from '../../shared/i18n'
import { Button, Skeleton, StatusNotice } from '../../shared/ui'
import { MapDiscoveryWorkspace } from '../../widgets/map-discovery-workspace'

const AREAS = ['seoul-central', 'riverside'] as const
type Area = (typeof AREAS)[number]

function readGuideState() {
  return readGuideStateFromPath(`${window.location.pathname}${window.location.search}`)
}

function readGuideStateFromPath(path: string) {
  const query = new URLSearchParams(path.split('?')[1] ?? '')
  const category = query.get('category') as PlaceCategory | 'all' | null
  const area = query.get('area') as Area | null
  return {
    area: AREAS.includes(area as Area) ? area as Area : 'seoul-central',
    category: category ?? 'all',
    query: query.get('q') ?? '',
    sheet: query.get('sheet') === 'full' ? 'full' as const : 'peek' as const,
    selectedPlaceId: query.get('selected') ?? undefined,
    mapUnavailable: query.get('map') === 'unavailable',
  }
}

function createGuidePath(state: ReturnType<typeof readGuideState>) {
  const query = new URLSearchParams({ area: state.area, category: state.category })
  if (state.query) query.set('q', state.query)
  if (state.sheet === 'full') query.set('sheet', 'full')
  if (state.selectedPlaceId) query.set('selected', state.selectedPlaceId)
  if (state.mapUnavailable) query.set('map', 'unavailable')
  return `/guide?${query.toString()}`
}

export function GuidePage({ locationOverride }: { locationOverride?: string }) {
  const [initial] = useState(() => locationOverride ? readGuideStateFromPath(locationOverride) : readGuideState())
  const [selectedArea, setSelectedArea] = useState<Area>(initial.area)
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'all'>(initial.category)
  const [guideState, setGuideState] = useState(initial)
  const { locale, t } = useI18n()
  const guideModel = useGuidePageModel({ area: selectedArea, category: selectedCategory, locale, selectedPlaceId: guideState.selectedPlaceId })

  const changeState = (next: Partial<typeof guideState>) => {
    const merged = { ...guideState, ...next }
    setGuideState(merged)
    setSelectedArea(merged.area)
    setSelectedCategory(merged.category)
    if (!locationOverride) navigate(createGuidePath(merged), { replace: true })
  }

  const changeArea = (area: Area) => {
    setSelectedArea(area)
    changeState({ area, selectedPlaceId: undefined })
  }

  return <>
    <main id="main-content" className="product-page guide-page">
      {guideModel.error ? <StatusNotice state="ERROR" title={t('state.errorTitle')}>{guideModel.error.message}<Button variant="secondary" onClick={guideModel.reload}>{t('common.retry')}</Button></StatusNotice> : null}
      {guideModel.places === undefined && !guideModel.error ? <Skeleton className="guide-skeleton" /> : null}
      {guideModel.places ? <MapDiscoveryWorkspace
        places={guideModel.places}
        locale={locale}
        selectedCategory={selectedCategory}
        selectedArea={selectedArea}
        selectedPlaceId={guideState.selectedPlaceId}
        searchQuery={guideState.query}
        sheetMode={guideState.sheet}
        mapUnavailable={guideState.mapUnavailable}
        nearbyPlaceIds={guideModel.nearbyPlaceIds}
        areaSelectionEnabled={guideModel.areaFilteringAvailable}
        suppressOverlays={Boolean(locationOverride)}
        onGuideStateChange={changeState}
        onSelectArea={changeArea}
        onSelectCategory={(category) => { changeState({ category, selectedPlaceId: undefined }); track('guide_filter_changed', { category, area: selectedArea }) }}
        onSelectPlace={(place) => track('map_pin_opened', { placeId: place.id, category: place.category, provenance: place.provenance.source })}
        onSearchSubmit={(query) => track('search_submitted', { queryLength: query.trim().length, scope: 'guide' })}
        onOpenPlace={(place) => { track('map_pin_opened', { placeId: place.id, category: place.category, provenance: place.provenance.source }); navigate(createPlacePath(place.id, createGuidePath({ ...guideState, selectedPlaceId: place.id }))) }}
      /> : null}
    </main>
  </>
}
