import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { createM14CapabilityProjection, createReleaseAdapter } from '../../features/projection-query'
import { ProjectionRepositoryProvider, fixtureProjectionAdapter, type ProjectionRepository } from '../../features/projection-query'
import { loadPyM14Release } from '../release'
import { createSyntheticGoldenReleaseBundle } from '../release/syntheticGoldenRelease'
import { useI18n } from '../../shared/i18n'
import { StatusNotice } from '../../shared/ui'

export type SourceMode = 'fixture' | 'release'
export type ProjectionDiagnostics = { mode: SourceMode; source: 'fixture' | 'release'; releaseId: string; validation: 'COMPATIBLE' | 'COMPATIBLE_WITH_WARNINGS' | 'INVALID_MANIFEST' | 'INTEGRITY_ERROR'; capabilities?: Record<string, string> }
let diagnostics: ProjectionDiagnostics | null = null
export function getProjectionDiagnostics() { return diagnostics }

function configuredMode(): SourceMode {
  return import.meta.env.VITE_MBN_GUIDE_DATA_SOURCE === 'release' ? 'release' : 'fixture'
}

export async function createProjectionSource(input: { mode: SourceMode; syntheticRelease?: boolean; m14ReleaseBaseUrl?: string; m14GateUrl?: string; m14ReleaseId?: string }): Promise<{ repository: ProjectionRepository; diagnostic: ProjectionDiagnostics }> {
  const mode = input.mode
  if (mode === 'fixture') return { repository: fixtureProjectionAdapter, diagnostic: { mode, source: 'fixture', releaseId: fixtureProjectionAdapter.releaseId, validation: 'COMPATIBLE' } }
  if (input.m14ReleaseBaseUrl && input.m14GateUrl && input.m14ReleaseId) {
    const result = await loadPyM14Release({ releaseBaseUrl: input.m14ReleaseBaseUrl, m14GateUrl: input.m14GateUrl, expectedReleaseId: input.m14ReleaseId })
    const composed = createM14CapabilityProjection(result)
    return { repository: composed.repository, diagnostic: { mode, source: 'release', releaseId: result.releaseId, validation: 'COMPATIBLE_WITH_WARNINGS', capabilities: composed.capabilities } }
  }
  if (!input.syntheticRelease) throw new Error('RELEASE_DESCRIPTOR_REQUIRED')
  const bundle = await createSyntheticGoldenReleaseBundle()
  const descriptor = { source: 'release' as const, releaseId: bundle.manifest.releaseId, docsCommit: 'FRONT_SYNTHETIC_TEST', contractVersion: bundle.manifest.contractVersion, schemaVersion: bundle.manifest.schemaVersion, taxonomyVersion: bundle.manifest.taxonomyVersion }
  const repository = await createReleaseAdapter(descriptor, bundle)
  return { repository, diagnostic: { mode, source: 'release', releaseId: bundle.manifest.releaseId, validation: 'COMPATIBLE' } }
}

async function bootstrapRepository() {
  return createProjectionSource({
    mode: configuredMode(),
    syntheticRelease: import.meta.env.DEV && import.meta.env.VITE_MBN_GUIDE_SYNTHETIC_RELEASE === 'true',
    m14ReleaseBaseUrl: import.meta.env.VITE_MBN_GUIDE_M14_RELEASE_BASE_URL,
    m14GateUrl: import.meta.env.VITE_MBN_GUIDE_M14_GATE_URL,
    m14ReleaseId: import.meta.env.VITE_MBN_GUIDE_M14_RELEASE_ID,
  })
}

export function DataSourceProvider({ children }: PropsWithChildren) {
  const { t } = useI18n()
  const [state, setState] = useState<{ repository: ProjectionRepository; diagnostic: ProjectionDiagnostics } | { error: Error } | null>(null)
  useEffect(() => { let current = true; bootstrapRepository().then((result) => { if (current) { diagnostics = result.diagnostic; setState(result) } }).catch((error: Error) => { if (current) { diagnostics = { mode: configuredMode(), source: configuredMode() === 'release' ? 'release' : 'fixture', releaseId: 'UNAVAILABLE', validation: 'INVALID_MANIFEST' }; setState({ error }) } }); return () => { current = false } }, [])
  if (!state) return <main id="main-content" className="product-page"><StatusNotice state="LOADING" title={t('dataSource.loadingTitle')}>{t('dataSource.loadingDescription')}</StatusNotice></main>
  if ('error' in state) throw state.error
  return <ProjectionRepositoryProvider repository={state.repository}>{children}</ProjectionRepositoryProvider>
}
