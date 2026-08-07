export const CONSUMED_CONTRACT = {
  sourceRepository: 'Siegfriex/mbN_GUIDE',
  sourceBranch: 'nbM_GUIDE_DOCS',
  sourceCommit: '264bfc5920f579948efe00d2d31da46c7e9291f4',
  versions: {
    product: '0.2.0',
    prd: '0.1.0',
    ia: '0.2.0',
    feature: '0.2.0',
    data: '0.3.0',
    business: '0.1.0',
    architecture: '0.3.0',
    decisionLog: '0.4.0',
  },
  consumedAt: '2026-08-07',
} as const

export const FIXTURE_RELEASE = {
  fixtureId: 'FIXTURE_FRONT_0_3_0_PROTOTYPE_A',
  releaseId: 'FIXTURE_FRONT_0_3_0_PROTOTYPE_A',
  source: 'FRONT_FIXTURE',
  nonEmpirical: true,
  docsCommit: CONSUMED_CONTRACT.sourceCommit,
  contractVersions: CONSUMED_CONTRACT.versions,
  schemaVersion: '0.3.0',
  taxonomyVersion: '0.3.0',
  pipelineVersion: 'FIXTURE_ONLY',
  qualityStatus: 'FIXTURE_NON_EMPIRICAL',
  fixtureAuthoredAt: '2026-08-07T00:00:00.000Z',
  sourceBranch: 'nbM_GUIDE_FRONT',
  sourceCommit: 'WORKTREE_UNCOMMITTED',
} as const
