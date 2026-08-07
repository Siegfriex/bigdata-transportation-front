import type { HTMLAttributes } from 'react'
import { cn } from '../lib'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('ui-skeleton', className)} aria-hidden="true" />
}
