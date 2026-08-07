import { useEffect, useMemo, useRef, useState } from 'react'
import type { Place, PlaceCategory } from '../../entities/place'
import { toPlaceViewModel } from '../../features/projection-query'
import { FixtureMapCanvas, type FixtureMapMarker } from '../../shared/map'
import { useI18n } from '../../shared/i18n'
import type { Locale } from '../../shared/i18n'
import { BottomSheet, Button, Chip, EmptyState, Icon, IconButton, MapPlaceholder, StatusNotice } from '../../shared/ui'
import markerIcon from '../../shared/assets/figma-guide/marker.svg'
import './guide.css'

type SheetMode = 'peek' | 'full'
type GuideStateChange = Partial<{
  query: string
  sheet: SheetMode
  selectedPlaceId: string | undefined
  mapUnavailable: boolean
}>

type MapDiscoveryWorkspaceProps = {
  places: Place[]
  locale: Locale
  selectedCategory: PlaceCategory | 'all'
  selectedArea: string
  selectedPlaceId?: string
  searchQuery: string
  sheetMode: SheetMode
  mapUnavailable: boolean
  nearbyPlaceIds?: readonly string[]
  areaSelectionEnabled: boolean
  suppressOverlays?: boolean
  onSelectArea: (area: 'seoul-central' | 'riverside') => void
  onSelectCategory: (category: PlaceCategory | 'all') => void
  onSelectPlace: (place: Place) => void
  onSearchSubmit: (query: string) => void
  onGuideStateChange: (state: GuideStateChange) => void
  onOpenPlace: (place: Place) => void
}

const categoryOrder: Array<PlaceCategory | 'all'> = [
  'all', 'performance', 'exhibition', 'music', 'food', 'beauty-fashion', 'broadcast-media', 'healing', 'activity',
]

const mapPositions: Record<string, { x: number; y: number }> = {
  'fixture-riverside-stage': { x: 67, y: 57 },
  'fixture-studio-exhibit': { x: 38, y: 48 },
  'fixture-night-market': { x: 54, y: 68 },
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function mapPositionsFor(places: readonly Place[]) {
  const latitudes = places.map((item) => item.coordinates.lat)
  const longitudes = places.map((item) => item.coordinates.lng)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLng = Math.min(...longitudes)
  const maxLng = Math.max(...longitudes)
  const spanLat = maxLat - minLat || 1
  const spanLng = maxLng - minLng || 1
  const resolved = new Map<string, { x: number; y: number }>()
  const separationOffsets = [
    { x: 0, y: 0 }, { x: 10, y: 0 }, { x: -10, y: 0 }, { x: 0, y: 10 }, { x: 0, y: -10 },
    { x: 8, y: 8 }, { x: -8, y: 8 }, { x: 8, y: -8 }, { x: -8, y: -8 },
    { x: 18, y: 0 }, { x: -18, y: 0 }, { x: 0, y: 18 }, { x: 0, y: -18 },
  ]

  for (const place of places) {
    const fixturePosition = mapPositions[place.id]
    const projected = fixturePosition ?? {
      x: 12 + ((place.coordinates.lng - minLng) / spanLng) * 76,
      y: 85 - ((place.coordinates.lat - minLat) / spanLat) * 70,
    }
    // The FixtureMapCanvas has no real map projection or cluster interaction.
    // Separate visual pins so an overlapping coordinate cluster never makes a
    // valid release Place inaccessible by pointer or keyboard.
    const position = separationOffsets
      .map((offset) => ({ x: clamp(projected.x + offset.x, 8, 92), y: clamp(projected.y + offset.y, 16, 88) }))
      .find((candidate) => [...resolved.values()].every((existing) => Math.abs(existing.x - candidate.x) >= 9 || Math.abs(existing.y - candidate.y) >= 10))
      ?? projected
    resolved.set(place.id, position)
  }
  return resolved
}

function categoryLabel(category: PlaceCategory | 'all', t: (key: string) => string) {
  return category === 'all' ? t('guide.all') : t(`guide.category.${category}`)
}

export function MapDiscoveryWorkspace(props: MapDiscoveryWorkspaceProps) {
  const { places, locale, selectedCategory, selectedArea, selectedPlaceId, searchQuery, sheetMode, mapUnavailable, nearbyPlaceIds = [], areaSelectionEnabled, suppressOverlays = false, onSelectArea, onSelectCategory, onSelectPlace, onSearchSubmit, onGuideStateChange, onOpenPlace } = props
  const { t } = useI18n()
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(searchQuery))
  const [draftQuery, setDraftQuery] = useState(searchQuery)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [sortMode, setSortMode] = useState<'default' | 'name'>('default')
  const [draftCategory, setDraftCategory] = useState(selectedCategory)
  const cardRefs = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    if (selectedPlaceId) {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      cardRefs.current.get(selectedPlaceId)?.scrollIntoView({ behavior, block: 'nearest', inline: 'center' })
    }
  }, [selectedPlaceId, sheetMode])

  const searchablePlaces = useMemo(() => places.filter((place) => {
    const content = toPlaceViewModel(place, locale)
    const normalized = draftQuery.trim().toLocaleLowerCase()
    return !normalized || `${content.title} ${content.summary} ${place.category}`.toLocaleLowerCase().includes(normalized)
  }), [draftQuery, locale, places])
  const visualPositions = useMemo(() => mapPositionsFor(places), [places])
  const markers: FixtureMapMarker[] = searchablePlaces.map((place) => ({
    id: place.id,
    label: toPlaceViewModel(place, locale).title,
    position: visualPositions.get(place.id) ?? { x: 50, y: 50 },
    selected: place.id === selectedPlaceId,
  }))
  const resultCountLabel = t('guide.resultCount').replace('{count}', String(searchablePlaces.length))
  const orderedPlaces = useMemo(() => {
    if (!selectedPlaceId || !nearbyPlaceIds.length) return searchablePlaces
    const byId = new Map(searchablePlaces.map((place) => [place.id, place]))
    const nearby = nearbyPlaceIds.flatMap((id) => {
      const place = byId.get(id)
      return place ? [place] : []
    })
    const nearbyIds = new Set(nearby.map((place) => place.id))
    return [...nearby, ...searchablePlaces.filter((place) => !nearbyIds.has(place.id))]
  }, [nearbyPlaceIds, searchablePlaces, selectedPlaceId])
  const displayedPlaces = useMemo(() => sortMode === 'name'
    ? [...orderedPlaces].sort((left, right) => toPlaceViewModel(left, locale).title.localeCompare(toPlaceViewModel(right, locale).title, locale === 'ko' ? 'ko-KR' : 'en'))
    : orderedPlaces, [locale, orderedPlaces, sortMode])
  const hasLocaleFallback = useMemo(() => searchablePlaces.some((place) => toPlaceViewModel(place, locale).fallbackUsed), [locale, searchablePlaces])

  const selectPlace = (place: Place) => {
    onGuideStateChange({ selectedPlaceId: place.id })
    onSelectPlace(place)
  }
  const submitSearch = () => {
    onSearchSubmit(draftQuery)
    onGuideStateChange({ query: draftQuery, selectedPlaceId: searchablePlaces[0]?.id })
    setIsSearchOpen(false)
  }
  const resetSearch = () => {
    setDraftQuery('')
    onGuideStateChange({ query: '', selectedPlaceId: undefined })
    if (selectedCategory !== 'all') onSelectCategory('all')
  }

  const previewCard = (place: Place, full = false) => {
    const viewModel = toPlaceViewModel(place, locale)
    const selected = place.id === selectedPlaceId
    return <button
      type="button"
      ref={(node) => { if (node) cardRefs.current.set(place.id, node); else cardRefs.current.delete(place.id) }}
      key={place.id}
      data-testid={`guide-place-card-${place.id}`}
      className={selected ? `guide-place-card guide-place-card--selected ${full ? 'guide-place-card--full' : ''}` : `guide-place-card ${full ? 'guide-place-card--full' : ''}`}
      aria-label={viewModel.title}
      aria-pressed={selected}
      data-selected={selected || undefined}
      onClick={() => { if (full || mapUnavailable || selected) onOpenPlace(place); else selectPlace(place) }}
    >
      <MapPlaceholder className="guide-place-card__art" data-category={place.category} decorative label={viewModel.title} />
      <div className="guide-place-card__body">
        <div className="guide-place-card__meta"><span>{categoryLabel(place.category, t)}</span>{areaSelectionEnabled ? <span>{selectedArea === 'riverside' ? t('guide.area.riverside') : t('guide.area.seoul-central')}</span> : null}</div>
        <span className="guide-place-card__title">{viewModel.title}</span>
        <p>{viewModel.whyItMatters}</p>
        <span className="guide-place-card__provenance">{viewModel.provenanceLabel}</span>
      </div>
    </button>
  }

  return <section className="guide-map-workspace" aria-labelledby="discovery-workspace-title">
    <h1 id="discovery-workspace-title" className="visually-hidden">{t('guide.title')}</h1>
    <div className="guide-search-wrap">
      <form className="guide-search" role="search" onSubmit={(event) => { event.preventDefault(); submitSearch() }}>
        <label className="visually-hidden" htmlFor="guide-search-input">{t('guide.searchLabel')}</label>
        <input
          id="guide-search-input"
          data-testid="guide-search"
          value={draftQuery}
          placeholder={t('guide.searchPlaceholder')}
          onFocus={() => setIsSearchOpen(true)}
          onChange={(event) => { setDraftQuery(event.target.value); setIsSearchOpen(true) }}
          aria-expanded={isSearchOpen}
          aria-controls="guide-search-suggestions"
        />
        <IconButton type="submit" variant="ghost" size="sm" label={t('guide.searchSubmit')}><Icon name="search" /></IconButton>
        <span className="guide-search__divider" aria-hidden="true" />
        <IconButton className="guide-filter-trigger" data-testid="guide-filter-trigger" label={t('guide.openFilter')} onClick={() => { setDraftCategory(selectedCategory); setIsFilterOpen(true) }}><Icon name="filter" /></IconButton>
      </form>
      {isSearchOpen ? <div id="guide-search-suggestions" className="guide-search-suggestions" role="listbox" aria-label={t('guide.searchSuggestions')}>
        {areaSelectionEnabled ? <><p>{t('guide.searchAreas')}</p>
        <button type="button" role="option" aria-selected={selectedArea === 'seoul-central'} onClick={() => { onSelectArea('seoul-central'); onGuideStateChange({ query: '', selectedPlaceId: undefined }); setIsSearchOpen(false) }}>{t('guide.area.seoul-central')}</button>
        <button type="button" role="option" aria-selected={selectedArea === 'riverside'} onClick={() => { onSelectArea('riverside'); onGuideStateChange({ query: '', selectedPlaceId: undefined }); setIsSearchOpen(false) }}>{t('guide.area.riverside')}</button></> : null}
        <p>{t('guide.searchPlaces')}</p>
        {searchablePlaces.length ? searchablePlaces.map((place) => <button type="button" role="option" key={place.id} onClick={() => { setDraftQuery(toPlaceViewModel(place, locale).title); onGuideStateChange({ query: toPlaceViewModel(place, locale).title, selectedPlaceId: place.id }); setIsSearchOpen(false) }}>{toPlaceViewModel(place, locale).title}</button>) : <span>{t('guide.searchNoSuggestion')}</span>}
      </div> : null}
    </div>

    {areaSelectionEnabled ? <p className="guide-area-context" aria-live="polite"><span>{t('guide.area')}</span><strong>{selectedArea === 'riverside' ? t('guide.area.riverside') : t('guide.area.seoul-central')}</strong></p> : null}
    {hasLocaleFallback ? <StatusNotice state="UNAVAILABLE" title={t('locale.fallbackTitle')}>{t('locale.fallbackDescription')}</StatusNotice> : null}
    <div className="guide-category-row" data-testid="guide-category-row" aria-label={t('guide.filters')}>
      {categoryOrder.map((category) => <Chip key={category} selected={selectedCategory === category} onClick={() => onSelectCategory(category)}>{categoryLabel(category, t)}</Chip>)}
    </div>

    <div className="guide-map-stage">
      <FixtureMapCanvas
        markers={markers}
        clusters={searchablePlaces.length > 1 ? [{ id: 'eligible-results', count: searchablePlaces.length, position: { x: 30, y: 31 } }] : []}
        markerIconSrc={markerIcon}
        isUnavailable={mapUnavailable}
        unavailable={<StatusNotice state="UNAVAILABLE" title={t('guide.mapUnavailableTitle')}>{t('guide.mapUnavailableDescription')}</StatusNotice>}
        label={t('guide.mapRegionLabel')}
        disclosure={places.some((place) => place.source === 'mbn') ? t('guide.releaseMapDisclosure') : t('guide.mapDisclosure')}
        markerLabel={(marker) => `${marker.label}${marker.selected ? `, ${t('guide.selected')}` : ''}`}
        onSelectMarker={(id) => { const place = searchablePlaces.find((candidate) => candidate.id === id); if (place) selectPlace(place) }}
      />
      {selectedPlaceId ? <Button variant="secondary" size="sm" className="guide-map-stage__refresh" onClick={() => onGuideStateChange({ selectedPlaceId: undefined })}><Icon name="refresh" />{t('guide.clearSelection')}</Button> : null}
      <IconButton className="guide-map-stage__location" disabled label={t('guide.locationUnavailable')}><Icon name="location" /></IconButton>
    </div>

    {searchablePlaces.length === 0 ? <section className="guide-empty-recovery"><EmptyState title={t('guide.noMatches')} description={t('guide.noMatchesDescription')} /><Button variant="secondary" onClick={resetSearch}>{t('guide.reset')}</Button></section> : <section className="guide-discovery-tray" data-testid="guide-discovery-tray" aria-label={t('guide.trayLabel')}>
      <header><span className="guide-discovery-tray__handle" aria-hidden="true" /><p aria-live="polite">{resultCountLabel}</p><Button data-testid="guide-list-toggle" variant="ghost" size="sm" aria-expanded={sheetMode === 'full'} onClick={() => onGuideStateChange({ sheet: 'full' })}><Icon name="list" />{t('guide.openList')}</Button></header>
        <div className="guide-discovery-tray__rail">{displayedPlaces.map((place) => previewCard(place))}</div>
    </section>}

    <BottomSheet isOpen={!suppressOverlays && sheetMode === 'full'} onClose={() => onGuideStateChange({ sheet: 'peek' })} title={t('guide.listTitle')} closeLabel={t('common.close')}>
      <div className="guide-full-list" data-testid="guide-sheet">
        <header><p>{resultCountLabel}</p><div className="guide-full-list__actions"><Button variant="secondary" size="sm" aria-haspopup="dialog" onClick={() => setIsSortOpen(true)}>정렬 · {sortMode === 'name' ? '이름순' : '기본순'}</Button><Button variant="secondary" size="sm" onClick={() => onGuideStateChange({ sheet: 'peek' })}>{t('guide.showMap')}</Button></div></header>
        {displayedPlaces.map((place) => previewCard(place, true))}
      </div>
    </BottomSheet>

    <BottomSheet isOpen={!suppressOverlays && isFilterOpen} onClose={() => { setDraftCategory(selectedCategory); setIsFilterOpen(false) }} title={t('guide.filterTitle')} closeLabel={t('common.close')}>
      <div className="guide-filter-sheet">
        {categoryOrder.map((category) => <Chip key={category} selected={draftCategory === category} onClick={() => setDraftCategory(category)}>{categoryLabel(category, t)}</Chip>)}
        <div className="guide-filter-sheet__actions"><Button variant="secondary" onClick={() => setDraftCategory('all')}>{t('guide.reset')}</Button><Button onClick={() => { onSelectCategory(draftCategory); setIsFilterOpen(false) }}>{t('guide.apply')}</Button></div>
      </div>
    </BottomSheet>

    <BottomSheet isOpen={!suppressOverlays && isSortOpen} onClose={() => setIsSortOpen(false)} title="정렬" closeLabel={t('common.close')}>
      <div className="guide-sort-sheet" role="listbox" aria-label="정렬 옵션">
        {[{ mode: 'default' as const, label: '기본순', description: '현재 공개된 순서' }, { mode: 'name' as const, label: '이름순', description: '가나다순' }].map(({ mode, label, description }) => <button key={mode} type="button" role="option" aria-selected={sortMode === mode} onClick={() => { setSortMode(mode); setIsSortOpen(false) }}><span><strong>{label}</strong><small>{description}</small></span>{sortMode === mode ? <b aria-hidden="true">✓</b> : null}</button>)}
        <p>실제 거리·인기 정렬은 연결된 데이터가 제공될 때만 표시됩니다.</p>
      </div>
    </BottomSheet>
  </section>
}
