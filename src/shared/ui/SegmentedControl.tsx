import type { ReactNode } from 'react'
import { cn } from '../lib'

export type SegmentedControlOption<T extends string> = {
  value: T
  label: ReactNode
  disabled?: boolean
}

type SegmentedControlProps<T extends string> = {
  label: string
  value: T
  options: readonly SegmentedControlOption<T>[]
  onChange: (value: T) => void
}

/** A disclosed button group. It intentionally is not an ARIA tab widget. */
export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="segmented-control" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn('segmented-control__option', option.value === value && 'segmented-control__option--selected')}
          aria-pressed={option.value === value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
