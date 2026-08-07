import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib'

type SurfaceHeaderProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function SurfaceHeader({ eyebrow, title, description, actions, className, ...props }: SurfaceHeaderProps) {
  return (
    <header {...props} className={cn('surface-header', className)}>
      <div className="surface-header__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="surface-header__actions">{actions}</div> : null}
    </header>
  )
}
