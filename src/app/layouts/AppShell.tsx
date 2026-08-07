import type { PropsWithChildren } from 'react'
import { useI18n } from '../../shared/i18n'
import { PrimaryNavigation } from '../../widgets/app-chrome'

export function AppShell({ children }: PropsWithChildren) {
  const { t } = useI18n()
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('a11y.skipToMain')}
      </a>
      <div className="app-shell__content">{children}</div>
      <PrimaryNavigation />
    </div>
  )
}
