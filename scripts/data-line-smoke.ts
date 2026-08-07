import { createProjectionSource } from '../src/app/providers/DataSourceProvider'
import { parseReleaseProjection } from '../src/app/release'
import { createSyntheticGoldenReleaseBundle } from '../src/app/release/syntheticGoldenRelease'
import { toLiveSessionViewModel, toPlaceViewModel, toStoryViewModel } from '../src/features/projection-query'

const fixture = await createProjectionSource({ mode: 'fixture' })
const release = await createProjectionSource({ mode: 'release', syntheticRelease: true })
const bundle = await createSyntheticGoldenReleaseBundle()
const parsed = parseReleaseProjection(bundle.manifest, bundle.files)
if (parsed.manifest.sourceBranch !== 'FRONT_SYNTHETIC_TEST' || !parsed.manifest.nonEmpirical) throw new Error('Synthetic provenance is not explicit')
const fixturePlaces = await fixture.repository.listPlaces()
const releasePlaces = await release.repository.listPlaces()
const fixtureStories = await fixture.repository.listStories()
const releaseStories = await release.repository.listStories()
const fixtureSessions = await fixture.repository.listLiveSessions()
const releaseSessions = await release.repository.listLiveSessions()
const comparable = JSON.stringify({ places: fixturePlaces.map((item) => toPlaceViewModel(item, 'en')), stories: fixtureStories.map((item) => toStoryViewModel(item, 'en')), sessions: fixtureSessions.map((item) => toLiveSessionViewModel(item, 'en')), offers: await fixture.repository.listOffers(), relatedArticles: await fixture.repository.getRelatedArticlesForPlace('fixture-riverside-stage'), relatedLive: await fixture.repository.getRelatedLiveForPlace('fixture-riverside-stage') })
const releasedComparable = JSON.stringify({ places: releasePlaces.map((item) => toPlaceViewModel(item, 'en')), stories: releaseStories.map((item) => toStoryViewModel(item, 'en')), sessions: releaseSessions.map((item) => toLiveSessionViewModel(item, 'en')), offers: await release.repository.listOffers(), relatedArticles: await release.repository.getRelatedArticlesForPlace('fixture-riverside-stage'), relatedLive: await release.repository.getRelatedLiveForPlace('fixture-riverside-stage') })
if (comparable !== releasedComparable) throw new Error('Fixture/release ViewModel parity failed')
if (!['live', 'upcoming', 'replay', 'ended'].every((lifecycle) => releaseSessions.some((session) => session.lifecycle === lifecycle))) throw new Error('Synthetic release lifecycle coverage failed')
if ((await release.repository.getRelatedArticlesForArticle('fixture-riverside-article')).length === 0) throw new Error('Article→Article relation was not consumed')
try { await createProjectionSource({ mode: 'release' }); throw new Error('Release mode silently accepted without descriptor') } catch (error) { if (!(error instanceof Error) || error.message !== 'RELEASE_DESCRIPTOR_REQUIRED') throw error }
console.log('Data-line smoke passed: composition root, fail-closed release mode, synthetic parser, and ViewModel parity.')
