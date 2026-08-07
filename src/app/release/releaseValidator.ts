import { CONSUMED_CONTRACT } from '../config'
import type { ReleaseBundle, ReleaseValidationResult } from './types'

export const REQUIRED_RELEASE_FILE_PATHS = [
  'places.json',
  'articles.json',
  'stories.json',
  'live_sessions.json',
  'offers.json',
  'article_place_relations.json',
  'article_article_relations.json',
  'article_live_relations.json',
  'place_live_relations.json',
  'recommendations.json',
  'taxonomy.json',
  'quality_report.json',
] as const

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
function hasIdAndProvenance(value: unknown) { return isRecord(value) && typeof value.id === 'string' && isRecord(value.provenance) && typeof value.provenance.referenceId === 'string' }
function hasLocalizedRecord(value: unknown) { return isRecord(value) && isRecord(value.localized) }
function isProjectionSchema(projection: ReleaseBundle['projection']) {
  return Array.isArray(projection.places) && projection.places.every((item) => hasIdAndProvenance(item) && hasLocalizedRecord(item) && Array.isArray(item.relatedStoryIds) && Array.isArray(item.relatedLiveIds) && Array.isArray(item.offerIds))
    && Array.isArray(projection.stories) && projection.stories.every((item) => hasIdAndProvenance(item) && hasLocalizedRecord(item) && Array.isArray(item.articleIds) && Array.isArray(item.placeIds) && Array.isArray(item.liveIds))
    && Array.isArray(projection.articles) && projection.articles.every((item) => hasIdAndProvenance(item) && hasLocalizedRecord(item) && Array.isArray(item.placeIds) && Array.isArray(item.storyIds))
    && Array.isArray(projection.liveSessions) && projection.liveSessions.every((item) => hasIdAndProvenance(item) && hasLocalizedRecord(item) && ['live', 'upcoming', 'replay', 'ended'].includes(item.lifecycle) && Array.isArray(item.placeIds) && Array.isArray(item.articleIds) && Array.isArray(item.offerIds))
    && Array.isArray(projection.offers) && projection.offers.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.partnerId === 'string' && Array.isArray(item.placeIds) && Array.isArray(item.liveSessionIds))
    && Array.isArray(projection.partners) && projection.partners.every((item) => hasIdAndProvenance(item))
    && isRecord(projection.relatedArticlesByPlace) && isRecord(projection.relatedArticlesByArticle) && isRecord(projection.relatedLiveByPlace) && isRecord(projection.relatedLiveByArticle) && isRecord(projection.taxonomy)
}

async function sha256(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes)
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer)
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('')
}

export async function validateReleaseBundle(bundle: ReleaseBundle): Promise<ReleaseValidationResult> {
  const errors: string[] = []
  const { manifest, files, projection } = bundle
  const versions = CONSUMED_CONTRACT.versions

  if (!isProjectionSchema(projection)) return { ok: false, errors: ['ENTITY_SCHEMA_INVALID'] }

  if (!manifest.releaseId) errors.push('MANIFEST_RELEASE_ID_MISSING')
  if (!manifest.sourceBranch || !manifest.sourceCommit || !manifest.generatedAt || !manifest.pipelineVersion) errors.push('MANIFEST_PROVENANCE_MISSING')
  if (!manifest.qualityReportPath) errors.push('MANIFEST_QUALITY_REPORT_MISSING')
  if (manifest.qualityStatus !== 'PASS') errors.push('MANIFEST_QUALITY_NOT_PASS')
  if (manifest.contractVersion !== versions.data) errors.push('CONTRACT_VERSION_MISMATCH')
  if (manifest.schemaVersion !== versions.data) errors.push('SCHEMA_VERSION_MISMATCH')
  if (manifest.taxonomyVersion !== versions.data) errors.push('TAXONOMY_VERSION_MISMATCH')

  for (const requiredPath of REQUIRED_RELEASE_FILE_PATHS) {
    const declared = manifest.files.find((file) => file.path === requiredPath)
    if (!declared?.required) errors.push(`REQUIRED_FILE_UNDECLARED:${requiredPath}`)
  }

  for (const file of manifest.files) {
    const bytes = files[file.path]
    if (!bytes) {
      if (file.required) errors.push(`DECLARED_FILE_MISSING:${file.path}`)
      continue
    }
    if ((await sha256(bytes)) !== file.sha256) errors.push(`FILE_SHA_MISMATCH:${file.path}`)
    if (bytes.byteLength !== file.bytes) errors.push(`FILE_BYTE_MISMATCH:${file.path}`)
  }
  if (manifest.qualityReportPath && !files[manifest.qualityReportPath]) errors.push(`QUALITY_REPORT_FILE_MISSING:${manifest.qualityReportPath}`)

  for (const [name, expectedCount] of Object.entries(manifest.recordCounts)) {
    const actual = ({ places: projection.places.length, articles: projection.articles.length, stories: projection.stories.length, liveSessions: projection.liveSessions.length, offers: projection.offers.length, partners: projection.partners.length } as Record<string, number>)[name]
    if (actual !== undefined && actual !== expectedCount) errors.push(`RECORD_COUNT_MISMATCH:${name}`)
  }

  const ids = {
    place: new Set(projection.places.map((item) => item.id)),
    article: new Set(projection.articles.map((item) => item.id)),
    story: new Set(projection.stories.map((item) => item.id)),
    live: new Set(projection.liveSessions.map((item) => item.id)),
  }

  for (const place of projection.places) {
    if (!place.localized.ko || !place.localized.en) errors.push(`PLACE_LOCALE_MISSING:${place.id}`)
    if (!place.provenance?.referenceId) errors.push(`PLACE_PROVENANCE_MISSING:${place.id}`)
    place.relatedStoryIds.forEach((id) => !ids.story.has(id) && errors.push(`PLACE_STORY_FK_BROKEN:${place.id}:${id}`))
    place.relatedLiveIds.forEach((id) => !ids.live.has(id) && errors.push(`PLACE_LIVE_FK_BROKEN:${place.id}:${id}`))
  }
  for (const story of projection.stories) {
    if (!story.localized.ko || !story.localized.en) errors.push(`STORY_LOCALE_MISSING:${story.id}`)
    if (!story.provenance?.referenceId) errors.push(`STORY_PROVENANCE_MISSING:${story.id}`)
    story.articleIds.forEach((id) => !ids.article.has(id) && errors.push(`STORY_ARTICLE_FK_BROKEN:${story.id}:${id}`))
    story.placeIds.forEach((id) => !ids.place.has(id) && errors.push(`STORY_PLACE_FK_BROKEN:${story.id}:${id}`))
    story.liveIds.forEach((id) => !ids.live.has(id) && errors.push(`STORY_LIVE_FK_BROKEN:${story.id}:${id}`))
  }
  for (const article of projection.articles) {
    if (!article.localized.ko || !article.localized.en) errors.push(`ARTICLE_LOCALE_MISSING:${article.id}`)
    if (!article.provenance?.referenceId) errors.push(`ARTICLE_PROVENANCE_MISSING:${article.id}`)
    article.placeIds.forEach((id) => !ids.place.has(id) && errors.push(`ARTICLE_PLACE_FK_BROKEN:${article.id}:${id}`))
    article.storyIds.forEach((id) => !ids.story.has(id) && errors.push(`ARTICLE_STORY_FK_BROKEN:${article.id}:${id}`))
  }
  for (const session of projection.liveSessions) {
    if (!session.localized.ko || !session.localized.en) errors.push(`LIVE_LOCALE_MISSING:${session.id}`)
    if (!session.provenance?.referenceId) errors.push(`LIVE_PROVENANCE_MISSING:${session.id}`)
    session.placeIds.forEach((id) => !ids.place.has(id) && errors.push(`LIVE_PLACE_FK_BROKEN:${session.id}:${id}`))
    session.articleIds.forEach((id) => !ids.article.has(id) && errors.push(`LIVE_ARTICLE_FK_BROKEN:${session.id}:${id}`))
    session.offerIds.forEach((id) => !projection.offers.some((offer) => offer.id === id) && errors.push(`LIVE_OFFER_FK_BROKEN:${session.id}:${id}`))
  }
  for (const offer of projection.offers) {
    if (!offer.id || !offer.partnerId) errors.push(`OFFER_SCHEMA_INVALID:${offer.id || 'unknown'}`)
    if (!projection.partners.some((partner) => partner.id === offer.partnerId)) errors.push(`OFFER_PARTNER_FK_BROKEN:${offer.id}:${offer.partnerId}`)
    offer.placeIds.forEach((id) => !ids.place.has(id) && errors.push(`OFFER_PLACE_FK_BROKEN:${offer.id}:${id}`))
    offer.liveSessionIds.forEach((id) => !ids.live.has(id) && errors.push(`OFFER_LIVE_FK_BROKEN:${offer.id}:${id}`))
    if (offer.availability === 'active' && (!offer.disclosure || !offer.outboundUrl)) errors.push(`OFFER_CTA_INELIGIBLE:${offer.id}`)
  }
  for (const [placeId, relations] of Object.entries(projection.relatedArticlesByPlace)) {
    if (!ids.place.has(placeId)) errors.push(`ARTICLE_RELATION_PLACE_FK_BROKEN:${placeId}`)
    relations.forEach((relation) => !ids.article.has(relation.articleId) && errors.push(`ARTICLE_RELATION_ARTICLE_FK_BROKEN:${placeId}:${relation.articleId}`))
  }
  for (const [articleId, relations] of Object.entries(projection.relatedArticlesByArticle)) {
    if (!ids.article.has(articleId)) errors.push(`ARTICLE_RELATION_SOURCE_FK_BROKEN:${articleId}`)
    relations.forEach((relation) => !ids.article.has(relation.articleId) && errors.push(`ARTICLE_RELATION_TARGET_FK_BROKEN:${articleId}:${relation.articleId}`))
  }
  for (const [placeId, relations] of Object.entries(projection.relatedLiveByPlace)) {
    if (!ids.place.has(placeId)) errors.push(`LIVE_RELATION_PLACE_FK_BROKEN:${placeId}`)
    relations.forEach((relation) => { const target = projection.liveSessions.find((session) => session.id === relation.liveSessionId); if (!target) errors.push(`LIVE_RELATION_SESSION_FK_BROKEN:${placeId}:${relation.liveSessionId}`); if (target?.lifecycle === 'ended') errors.push(`LIVE_RELATION_ENDED_INELIGIBLE:${placeId}:${relation.liveSessionId}`) })
  }
  for (const [articleId, relations] of Object.entries(projection.relatedLiveByArticle)) {
    if (!ids.article.has(articleId)) errors.push(`LIVE_RELATION_ARTICLE_FK_BROKEN:${articleId}`)
    relations.forEach((relation) => { const target = projection.liveSessions.find((session) => session.id === relation.liveSessionId); if (!target) errors.push(`LIVE_RELATION_SESSION_FK_BROKEN:${articleId}:${relation.liveSessionId}`); if (target?.lifecycle === 'ended') errors.push(`LIVE_RELATION_ENDED_INELIGIBLE:${articleId}:${relation.liveSessionId}`) })
  }

  return errors.length === 0 ? { ok: true, releaseId: manifest.releaseId } : { ok: false, errors }
}
