import type { PropsWithChildren } from 'react'
import { Dialog } from './Dialog'

type BottomSheetProps = PropsWithChildren<{
  isOpen: boolean
  onClose: () => void
  title: string
  closeLabel: string
}>

export function BottomSheet({ isOpen, onClose, title, closeLabel, children }: BottomSheetProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} closeLabel={closeLabel} presentation="sheet">
      {children}
    </Dialog>
  )
}
