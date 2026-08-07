import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const requiredPaths = [
  'src/main.tsx',
  'src/App.tsx',
  'src/app/router/AppRouter.tsx',
  'src/shared/api/httpClient.ts',
  'src/shared/model/safeStorage.ts',
  'src/shared/i18n/I18nProvider.tsx',
  'src/shared/styles/tokens.css',
  'src/shared/ui/Dialog.tsx',
]
const forbidden = [
  /\bstation\b/i,
  /\bsubway\b/i,
  /\bcrowding\b/i,
  /\broute-plan\b/i,
  /@google\/genai/i,
  /\bgemini\b/i,
  /\bexpress\b/i,
  /api\/chat/i,
]

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name)
      return entry.isDirectory() ? filesUnder(entryPath) : [entryPath]
    }),
  )
  return nested.flat()
}

for (const relativePath of requiredPaths) {
  try {
    await stat(resolve(root, relativePath))
  } catch {
    throw new Error(`Required M-1 file is missing: ${relativePath}`)
  }
}

const sourceFiles = await filesUnder(resolve(root, 'src'))
const textFiles = [...sourceFiles.filter((file) => /\.(ts|tsx|css)$/.test(file)), resolve(root, 'package.json')]
const violations = []

for (const file of textFiles) {
  const contents = await readFile(file, 'utf8')
  for (const pattern of forbidden) {
    if (pattern.test(contents)) {
      violations.push(`${file.replace(`${root}/`, '')}: ${pattern}`)
    }
  }
}

if (violations.length > 0) {
  throw new Error(`M-1 contamination check failed:\n${violations.join('\n')}`)
}

console.log(`Static contamination smoke passed: ${textFiles.length} files checked.`)
