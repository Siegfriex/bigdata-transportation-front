import type { ReactNode } from 'react'
import { cn } from '../lib'

type ContextRelationCardProps = {
  label: string
  title: string
  description?: string
  provenance?: string
  evidence?: string
  action?: ReactNode
  unavailable?: boolean
  className?: string
}

/** Renders a supplied relationship; it never creates relation evidence or ranking. */
export function ContextRelationCard({ label, title, description, provenance, evidence, action, unavailable = false, className }: ContextRelationCardProps) {
  return (
    <article className={cn('context-relation-card', unavailable && 'context-relation-card--unavailable', className)}>
      <p className="context-relation-card__label">{label}</p>
      <h3>{title}</h3>
      {description ? <p className="context-relation-card__description">{description}</p> : null}
      {evidence ? <p className="context-relation-card__evidence">{evidence}</p> : null}
      {provenance ? <p className="context-relation-card__provenance">{provenance}</p> : null}
      {action ? <div className="context-relation-card__action">{action}</div> : null}
    </article>
  )
}
