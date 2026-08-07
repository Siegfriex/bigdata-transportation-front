import type { ReactNode } from 'react'
import { cn } from '../lib'

type MediaFrameProps = {
  label: string
  status?: 'available' | 'unavailable'
  eyebrow?: ReactNode
  className?: string
  children?: ReactNode
}

/** Visual media region only. It does not imply playback or a connected provider. */
export function MediaFrame({ label, status = 'unavailable', eyebrow, className, children }: MediaFrameProps) {
  return (
    <div className={cn('media-frame', `media-frame--${status}`, className)} role="img" aria-label={label}>
      <div className="media-frame__texture" aria-hidden="true" />
      <div className="media-frame__content">
        {eyebrow ? <span className="media-frame__eyebrow">{eyebrow}</span> : null}
        <span>{label}</span>
        {children}
      </div>
    </div>
  )
}
