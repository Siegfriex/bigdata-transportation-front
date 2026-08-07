import type { HTMLAttributes } from 'react'
import { cn } from '../lib'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('ui-card', className)} />
}
