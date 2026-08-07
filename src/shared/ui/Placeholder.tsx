import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib'

type PlaceholderKind = 'media' | 'map' | 'player' | 'avatar' | 'editorial' | 'offer' | 'community'

type PlaceholderProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** A concise, truthful description for assistive technology. */
  label: string
  /** Small presentational context; this must not assert empirical availability. */
  eyebrow?: ReactNode
  detail?: ReactNode
  decorative?: boolean
}

/**
 * A source-agnostic visual slot. It is intentionally presentation-only: a
 * fixture adapter and a future release adapter pass the same ViewModel into it.
 */
function Placeholder({ kind, label, eyebrow, detail, decorative = false, className, ...props }: PlaceholderProps & { kind: PlaceholderKind }) {
  return (
    <div {...props} className={cn('placeholder-frame', `placeholder-frame--${kind}`, className)} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined}>
      <div className="placeholder-frame__art" aria-hidden="true">
        <span className="placeholder-frame__halo" />
        <span className="placeholder-frame__plane placeholder-frame__plane--one" />
        <span className="placeholder-frame__plane placeholder-frame__plane--two" />
        <span className="placeholder-frame__mark" />
      </div>
      {(eyebrow || detail) ? <div className="placeholder-frame__meta">
        {eyebrow ? <span className="placeholder-frame__eyebrow">{eyebrow}</span> : null}
        {detail ? <span className="placeholder-frame__detail">{detail}</span> : null}
      </div> : null}
    </div>
  )
}

export function MediaPlaceholder(props: PlaceholderProps) { return <Placeholder {...props} kind="media" /> }
export function MapPlaceholder(props: PlaceholderProps) { return <Placeholder {...props} kind="map" /> }
export function PlayerPlaceholder(props: PlaceholderProps) { return <Placeholder {...props} kind="player" /> }
export function AvatarPlaceholder(props: PlaceholderProps) { return <Placeholder {...props} kind="avatar" /> }
export function EditorialImagePlaceholder(props: PlaceholderProps) { return <Placeholder {...props} kind="editorial" /> }
export function OfferPlaceholder(props: PlaceholderProps) { return <Placeholder {...props} kind="offer" /> }
export function CommunityPlaceholder(props: PlaceholderProps) { return <Placeholder {...props} kind="community" /> }
