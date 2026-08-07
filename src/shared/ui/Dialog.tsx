import { useEffect, useId, useRef } from 'react'
import type { PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib'
import { Button } from './Button'

type DialogPresentation = 'dialog' | 'sheet'

type DialogProps = PropsWithChildren<{
  isOpen: boolean
  onClose: () => void
  title: string
  presentation?: DialogPresentation
  closeLabel: string
}>

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function Dialog({ isOpen, onClose, title, presentation = 'dialog', closeLabel, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const initialFocus = dialogRef.current?.querySelector<HTMLElement>(focusableSelector)
    initialFocus?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !dialogRef.current) {
      return
    }

    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) {
      event.preventDefault()
      dialogRef.current.focus()
      return
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className="ui-dialog-backdrop" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={cn('ui-dialog', `ui-dialog--${presentation}`)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ui-dialog__header">
          <h2 id={titleId}>{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={closeLabel}>
            ×
          </Button>
        </header>
        <div className="ui-dialog__content">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
