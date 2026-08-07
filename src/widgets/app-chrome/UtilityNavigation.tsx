import { navigate } from '../../app/router/navigation'
import { useI18n } from '../../shared/i18n'

const utilityItems = [
  { href: '/search', labelKey: 'nav.search' },
  { href: '/saved', labelKey: 'nav.saved' },
  { href: '/settings', labelKey: 'nav.settings' },
] as const

export function UtilityNavigation() {
  const { t } = useI18n()
  return (
    <nav className="utility-navigation" aria-label={t('nav.utility')}>
      {utilityItems.map((item) => <button key={item.href} onClick={() => navigate(item.href)}>{t(item.labelKey)}</button>)}
    </nav>
  )
}
