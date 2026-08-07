import { createContext, useContext } from 'react'
import type { PropsWithChildren } from 'react'
import type { ProjectionRepository } from './projectionRepository'

const ProjectionRepositoryContext = createContext<ProjectionRepository | null>(null)

export function ProjectionRepositoryProvider({ repository, children }: PropsWithChildren<{ repository: ProjectionRepository }>) {
  return <ProjectionRepositoryContext.Provider value={repository}>{children}</ProjectionRepositoryContext.Provider>
}

/** Product consumers receive only a source-neutral repository. */
export function useProjectionRepository() {
  const repository = useContext(ProjectionRepositoryContext)
  if (!repository) throw new Error('ProjectionRepository is not available from the application composition root.')
  return repository
}
