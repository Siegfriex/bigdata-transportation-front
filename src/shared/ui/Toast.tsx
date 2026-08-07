import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { Button } from './Button'

type Toast = { id: number; message: string }
type ToastContextValue = { pushToast: (input: { message: string }) => void }
type ToastProviderProps = PropsWithChildren<{ notificationsLabel?: string; dismissLabel?: string }>

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children, notificationsLabel, dismissLabel }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])
  const pushToast = useCallback(
    ({ message }: { message: string }) => {
      const id = Date.now()
      setToasts((current) => [...current, { id, message }])
      globalThis.setTimeout(() => dismiss(id), 5_000)
    },
    [dismiss],
  )
  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ui-toast-region" aria-live="polite" aria-label={notificationsLabel}>
        {toasts.map((toast) => (
          <div className="ui-toast" key={toast.id} role="status">
            <span>{toast.message}</span>
            <Button size="sm" variant="ghost" onClick={() => dismiss(toast.id)} aria-label={dismissLabel}>
              ×
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.')
  }
  return context
}
