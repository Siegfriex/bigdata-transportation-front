import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const sourceRoot = join(process.cwd(), 'src')
const sourceFilePattern = /\.(?:ts|tsx)$/

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return listSourceFiles(path)
    return sourceFilePattern.test(entry.name) ? [path] : []
  }))
  return nested.flat()
}

type Rule = {
  layer: 'pages' | 'widgets' | 'shared' | 'entities'
  description: string
  pattern: RegExp
}

const hardBoundaryRules: Rule[] = [
  { layer: 'pages', description: 'pages must not call fetch directly', pattern: /\bfetch\s*\(/ },
  { layer: 'pages', description: 'pages must not access localStorage directly', pattern: /\blocalStorage\b/ },
  { layer: 'pages', description: 'pages must not import fixture or release adapters', pattern: /(?:fixture[A-Za-z]*Repository|fixtureProjection|releaseAdapter|createReleaseAdapter)/ },
  { layer: 'pages', description: 'pages must not import entity api modules', pattern: /from\s+['"][^'"]*entities\/[^'"]+\/api/ },
  { layer: 'widgets', description: 'widgets must not import fixture or release adapters', pattern: /from\s+['"][^'"]*(?:fixture[A-Za-z]*Repository|fixtureProjection|releaseAdapter|syntheticGoldenRelease)/ },
  { layer: 'shared', description: 'shared must not import product entities', pattern: /from\s+['"][^'"]*(?:entities|features)\// },
  { layer: 'entities', description: 'entities must not import app, pages, or widgets', pattern: /from\s+['"][^'"]*(?:app|pages|widgets)\// },
]

async function main() {
  const files = await listSourceFiles(sourceRoot)
  const violations: string[] = []
  const pageQueryFindings: string[] = []

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    const projectPath = relative(process.cwd(), file)
    const layer = projectPath.split('/')[1] as Rule['layer'] | undefined

    for (const rule of hardBoundaryRules) {
      if (layer === rule.layer && rule.pattern.test(content)) {
        violations.push(`${projectPath}: ${rule.description}`)
      }
    }

    if (layer === 'pages' && /\buseProjectionRepository\b|\bprojectionRepository\./.test(content)) {
      pageQueryFindings.push(projectPath)
    }
  }

  if (violations.length > 0 || pageQueryFindings.length > 0) {
    console.error('FSD hard-boundary violations:')
    for (const violation of violations) console.error(`- ${violation}`)
    for (const finding of pageQueryFindings) console.error(`- ${finding}: pages must not orchestrate ProjectionRepository queries directly`)
    process.exitCode = 1
    return
  }

  console.log('FSD hard-boundary audit: PASS')
  console.log(`- scanned source files: ${files.length}`)
  console.log('- direct API/storage/fixture/release ownership leaks: 0')
  console.log('- direct page query-orchestration findings: 0')
  console.log('FSD governance note: strict page-composition purity is enforced by this gate.')
}

await main()
