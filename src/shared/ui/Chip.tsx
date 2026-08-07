import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib'

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
}

export function Chip({ className, selected = false, type = 'button', ...props }: ChipProps) {
  return <button {...props} type={type} className={cn('ui-chip', selected && 'ui-chip--selected', className)} aria-pressed={selected} />
}
