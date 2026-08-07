import type { ReactNode } from 'react'
import { cn } from '../lib'
import { Button, type ButtonProps } from './Button'

export type IconButtonProps = Omit<ButtonProps, 'aria-label' | 'children'> & {
  label: string
  children: ReactNode
}

export function IconButton({ className, label, children, ...props }: IconButtonProps) {
  return <Button {...props} className={cn('ui-icon-button', className)} aria-label={label}>{children}</Button>
}
