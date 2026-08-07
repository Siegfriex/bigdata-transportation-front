import type { Locale } from '../../../shared/i18n'
import type { ProvenanceSource } from '../../place'

export type Article = {
  id: string
  sourceArticleId: string
  source: ProvenanceSource
  url?: string
  rawTitle: string
  cleanTitle: string
  localized: Partial<Record<Locale, { headline: string; excerpt: string }>>
  publishedAt?: string
  category: string
  tags: string[]
  placeIds: string[]
  storyIds: string[]
  status: 'active' | 'unavailable'
  provenance: {
    source: ProvenanceSource
    referenceId: string
    label: Partial<Record<Locale, string>>
    method: 'fixture' | 'editorial' | 'release'
  }
}

export function getArticleContent(article: Article, locale: Locale) {
  return resolveArticleContent(article, locale).content
}

export function getArticleContentResolution(article: Article, locale: Locale) {
  const { content, servedLocale } = resolveArticleContent(article, locale)
  return { content, requestedLocale: locale, servedLocale, fallbackUsed: servedLocale !== locale }
}

export function getArticleProvenanceLabel(article: Article, locale: Locale) {
  return article.provenance.label[locale] ?? article.provenance.label.ko ?? article.provenance.label.en ?? ''
}

function resolveArticleContent(article: Article, locale: Locale) {
  const servedLocale = article.localized[locale] ? locale : article.localized.ko ? 'ko' : 'en'
  const content = article.localized[servedLocale]
  if (!content) throw new Error(`ARTICLE_LOCALIZED_CONTENT_MISSING:${article.id}`)
  return { content, servedLocale }
}
