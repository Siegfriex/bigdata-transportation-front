import type { ReactNode } from 'react'

export type FixtureMapMarker = {
  id: string
  label: string
  position: { x: number; y: number }
  selected?: boolean
}

type FixtureMapCanvasProps = {
  markers: FixtureMapMarker[]
  clusters?: Array<{ id: string; count: number; position: { x: number; y: number } }>
  markerIconSrc?: string
  isUnavailable?: boolean
  unavailable: ReactNode
  label: string
  disclosure: string
  onSelectMarker: (id: string) => void
  markerLabel: (marker: FixtureMapMarker) => string
}

/**
 * Contract-neutral interactive canvas for deterministic prototypes. It does not
 * render a provider map, geocode data, or make any geographic accuracy claim.
 */
export function FixtureMapCanvas({ markers, clusters = [], markerIconSrc, isUnavailable = false, unavailable, label, disclosure, onSelectMarker, markerLabel }: FixtureMapCanvasProps) {
  if (isUnavailable) {
    return <section className="fixture-map fixture-map--unavailable" data-testid="guide-map" aria-label={label}>{unavailable}</section>
  }

  return (
    <section className="fixture-map" data-testid="guide-map" aria-label={label} aria-describedby="fixture-map-disclosure">
      <div className="fixture-map__park" aria-hidden="true" />
      <div className="fixture-map__water" aria-hidden="true" />
      <div className="fixture-map__road fixture-map__road--one" aria-hidden="true" />
      <div className="fixture-map__road fixture-map__road--two" aria-hidden="true" />
      <div className="fixture-map__road fixture-map__road--three" aria-hidden="true" />
      <div className="fixture-map__road fixture-map__road--four" aria-hidden="true" />
      <div className="fixture-map__road fixture-map__road--five" aria-hidden="true" />
      <div className="fixture-map__block fixture-map__block--one" aria-hidden="true" />
      <div className="fixture-map__block fixture-map__block--two" aria-hidden="true" />
      <div className="fixture-map__block fixture-map__block--three" aria-hidden="true" />
      <p id="fixture-map-disclosure" className="fixture-map__disclosure">{disclosure}</p>
      {clusters.map((cluster) => <span key={cluster.id} className="fixture-map__cluster" style={{ left: `${cluster.position.x}%`, top: `${cluster.position.y}%` }} aria-hidden="true">{cluster.count}</span>)}
      {markers.map((marker) => (
        <button
          type="button"
          key={marker.id}
          data-testid={`guide-marker-${marker.id}`}
          className={marker.selected ? 'fixture-map__marker fixture-map__marker--selected' : 'fixture-map__marker'}
          style={{ left: `${marker.position.x}%`, top: `${marker.position.y}%` }}
          aria-pressed={marker.selected}
          aria-label={markerLabel(marker)}
          onClick={() => onSelectMarker(marker.id)}
        >
          {markerIconSrc ? <img src={markerIconSrc} alt="" /> : <span aria-hidden="true">●</span>}
        </button>
      ))}
    </section>
  )
}
