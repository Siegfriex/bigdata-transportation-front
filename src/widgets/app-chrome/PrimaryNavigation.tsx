import { useSyncExternalStore } from 'react'
import { cn } from '../../shared/lib'
import { useI18n } from '../../shared/i18n'
import { navigate } from '../../app/router/navigation'
import './primary-navigation.css'

type NavigationItem = {
  href: '/guide' | '/discover' | '/live'
  labelKey: 'nav.guide' | 'nav.discover' | 'nav.live'
  icon: 'guide' | 'discover' | 'live'
}

const navigationItems: NavigationItem[] = [
  { href: '/guide', labelKey: 'nav.guide', icon: 'guide' },
  { href: '/discover', labelKey: 'nav.discover', icon: 'discover' },
  { href: '/live', labelKey: 'nav.live', icon: 'live' },
]

function NavigationIcon({ icon }: Pick<NavigationItem, 'icon'>) {
  if (icon === 'guide') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.13 6-11a6 6 0 1 0-12 0c0 5.87 6 11 6 11Z" /><circle cx="12" cy="10" r="2.25" /></svg>
  }
  if (icon === 'discover') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" /><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></svg>
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function getPathname() {
  return window.location.pathname
}

export function PrimaryNavigation() {
  const pathname = useSyncExternalStore(subscribe, getPathname, () => '/guide')
  const { t } = useI18n()

  return (
    <nav className="primary-navigation" aria-label={t('nav.primary')}>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || (item.href === '/guide' && pathname.startsWith('/place/'))
        return (
          <button
            key={item.href}
            className={cn('primary-navigation__item', isActive && 'primary-navigation__item--active')}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => navigate(item.href)}
          >
            <NavigationIcon icon={item.icon} />
            <span>{t(item.labelKey)}</span>
          </button>
        )
      })}
    </nav>
  )
}
