import type { PropsWithChildren } from 'react'

export function VisuallyHidden({ children }: PropsWithChildren) {
  return <span className="visually-hidden">{children}</span>
}
