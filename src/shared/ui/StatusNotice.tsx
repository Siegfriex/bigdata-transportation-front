import type { PropsWithChildren } from 'react'
import type { AsyncState } from '../model'
import { cn } from '../lib'

type StatusNoticeProps = PropsWithChildren<{
  state: AsyncState
  title: string
}>

export function StatusNotice({ state, title, children }: StatusNoticeProps) {
  const isAlert = state === 'ERROR'
  return (
    <section className={cn('ui-status-notice', `ui-status-notice--${state.toLowerCase()}`)} role={isAlert ? 'alert' : 'status'}>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </section>
  )
}
