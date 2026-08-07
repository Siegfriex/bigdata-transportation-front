import type { Article } from '../model/types'
import type { ArticleRepository } from './articleRepository'

const fixtureArticles: Article[] = [{
  id: 'fixture-riverside-article', sourceArticleId: 'fixture-source-riverside-article', source: 'editor', rawTitle: 'Fixture editorial context', cleanTitle: 'Fixture editorial context', category: 'performance', tags: ['demo', 'context'], placeIds: ['fixture-riverside-stage'], storyIds: ['fixture-riverside-story'], status: 'active',
  localized: { ko: { headline: '데모 편집 맥락', excerpt: 'Article context는 standalone route가 아닌 Story detail 안에서만 노출됩니다.' }, en: { headline: 'Demo editorial context', excerpt: 'Article context is exposed only inside Story detail, not as a standalone route.' } },
  provenance: { source: 'editor', referenceId: 'fixture:article:riverside', label: { ko: '데모 fixture · 원문 corpus 아님', en: 'Demo fixture · not a source corpus' }, method: 'fixture' },
}, {
  id: 'fixture-riverside-followup', sourceArticleId: 'fixture-source-riverside-followup', source: 'editor', rawTitle: 'Fixture follow-up context', cleanTitle: 'Fixture follow-up context', category: 'performance', tags: ['demo', 'follow-up'], placeIds: ['fixture-riverside-stage'], storyIds: ['fixture-riverside-story'], status: 'active',
  localized: { ko: { headline: '데모 후속 맥락', excerpt: 'Article→Article 관계 소비를 검증하는 비실증 fixture입니다.' }, en: { headline: 'Demo follow-up context', excerpt: 'A non-empirical fixture for validating Article-to-Article relation consumption.' } },
  provenance: { source: 'editor', referenceId: 'fixture:article:riverside-followup', label: { ko: '데모 fixture · 원문 corpus 아님', en: 'Demo fixture · not a source corpus' }, method: 'fixture' },
}]

export const fixtureArticleRepository: ArticleRepository = { async list() { return fixtureArticles }, async getById(id) { return fixtureArticles.find((article) => article.id === id) ?? null } }
