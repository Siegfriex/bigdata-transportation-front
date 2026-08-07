import type { ReleaseBundle } from '../../../app/release'
import { createReleaseProjectionRepository } from '../../../app/release'
import type { ProjectionRepository } from './projectionRepository'

/** A release is enabled only by an explicit descriptor, never by directory discovery. */
export type ReleaseDescriptor = {
  source: 'release'
  releaseId: string
  docsCommit: string
  contractVersion: string
  schemaVersion: string
  taxonomyVersion: string
}

export async function createReleaseAdapter(descriptor: ReleaseDescriptor, bundle: ReleaseBundle): Promise<ProjectionRepository> {
  if (descriptor.releaseId !== bundle.manifest.releaseId) throw new Error('RELEASE_ID_MISMATCH')
  if (descriptor.contractVersion !== bundle.manifest.contractVersion) throw new Error('RELEASE_CONTRACT_VERSION_MISMATCH')
  if (descriptor.schemaVersion !== bundle.manifest.schemaVersion) throw new Error('RELEASE_SCHEMA_VERSION_MISMATCH')
  if (descriptor.taxonomyVersion !== bundle.manifest.taxonomyVersion) throw new Error('RELEASE_TAXONOMY_VERSION_MISMATCH')
  return createReleaseProjectionRepository(bundle)
}
