import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib'

type SurfaceSectionProps = HTMLAttributes<HTMLElement> & {
  title: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
}

export function SurfaceSection({ title, eyebrow, action, className, children, ...props }: SurfaceSectionProps) {
  return (
    <section {...props} className={cn('surface-section', className)}>
      <header className="surface-section__header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {action ? <div className="surface-section__action">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}
