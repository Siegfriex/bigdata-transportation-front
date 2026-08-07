type EmptyStateProps = {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="ui-empty-state">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  )
}
