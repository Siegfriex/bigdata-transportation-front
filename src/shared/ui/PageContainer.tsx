import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '../lib'

type PageContainerProps<T extends ElementType> = {
  as?: T
  className?: string
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className'>

export function PageContainer<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: PageContainerProps<T>) {
  const Component = as ?? 'div'
  return <Component {...props} className={cn('page-container', className)} />
}

export type { HTMLAttributes }
