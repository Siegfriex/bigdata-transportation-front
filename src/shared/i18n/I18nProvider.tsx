import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { createSafeStorage } from '../model'

export const SUPPORTED_LOCALES = ['ko', 'en'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export type MessageCatalog = Record<string, string>
export type LocaleCatalog = Record<Locale, MessageCatalog>

const FALLBACK_LOCALE: Locale = 'en'
const localeStorage = createSafeStorage({ key: 'locale', version: 1 })

type I18nContextValue = {
  locale: Locale
  fallbackLocale: Locale
  setLocale: (candidate: string) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function isSupportedLocale(candidate: string): candidate is Locale {
  return SUPPORTED_LOCALES.includes(candidate as Locale)
}

type I18nProviderProps = PropsWithChildren<{ catalog: LocaleCatalog }>

export function I18nProvider({ children, catalog }: I18nProviderProps) {
  const [locale, setActiveLocale] = useState<Locale>(() => {
    const stored = localeStorage.get<Locale>()
    return stored.ok && stored.value && isSupportedLocale(stored.value) ? stored.value : 'ko'
  })
  const setLocale = useCallback((candidate: string) => {
    const nextLocale = isSupportedLocale(candidate) ? candidate : FALLBACK_LOCALE
    localeStorage.set(nextLocale)
    setActiveLocale(nextLocale)
  }, [])
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      fallbackLocale: FALLBACK_LOCALE,
      setLocale,
      t: (key) => catalog[locale][key] ?? catalog[FALLBACK_LOCALE][key] ?? `[${key}]`,
    }),
    [catalog, locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider.')
  }
  return context
}
