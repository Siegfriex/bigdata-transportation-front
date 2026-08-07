import type { PropsWithChildren } from 'react'
import { I18nProvider } from '../../shared/i18n'
import { ToastProvider } from '../../shared/ui'
import { AppErrorBoundary } from '../errors/AppErrorBoundary'
import { messages } from '../i18n/catalog'
import { useI18n } from '../../shared/i18n'
import { DataSourceProvider } from './DataSourceProvider'

function LocalizedToastProvider({ children }: PropsWithChildren) {
  const { t } = useI18n()
  return <ToastProvider notificationsLabel={t('toast.region')} dismissLabel={t('toast.dismiss')}>{children}</ToastProvider>
}

function LocalizedErrorBoundary({ children }: PropsWithChildren) {
  const { t } = useI18n()
  return <AppErrorBoundary title={t('errorBoundary.title')} description={t('errorBoundary.description')} actionLabel={t('errorBoundary.returnGuide')}>{children}</AppErrorBoundary>
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <I18nProvider catalog={messages}>
      <LocalizedErrorBoundary>
        <DataSourceProvider><LocalizedToastProvider>{children}</LocalizedToastProvider></DataSourceProvider>
      </LocalizedErrorBoundary>
    </I18nProvider>
  )
}
