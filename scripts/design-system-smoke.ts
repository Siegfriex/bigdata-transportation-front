import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const read = (path: string) => readFile(join(root, path), 'utf8')
const failures: string[] = []

const [tokens, globalStyles, sharedIndex, guideWorkspace] = await Promise.all([
  read('src/shared/styles/tokens.css'),
  read('src/shared/styles/index.css'),
  read('src/shared/ui/index.ts'),
  read('src/widgets/map-discovery-workspace/MapDiscoveryWorkspace.tsx'),
])

for (const requiredLayer of ['/* Primitive tokens */', '/* Semantic tokens */', '/* Component tokens */']) {
  if (!tokens.includes(requiredLayer)) failures.push(`tokens.css is missing ${requiredLayer}`)
}

if (!globalStyles.includes('@import "./tokens.css"')) failures.push('global stylesheet does not import tokens.css')
if (/(?:#[\da-fA-F]{3,8}\b|\brgb\()/.test(globalStyles)) failures.push('index.css contains a raw color; move it into tokens.css')

for (const requiredExport of ["export { IconButton } from './IconButton'", "export { Icon } from './Icon'", "export { Chip } from './Chip'"]) {
  if (!sharedIndex.includes(requiredExport)) failures.push(`shared UI export missing: ${requiredExport}`)
}

for (const requiredGuidePrimitive of ['<IconButton', '<Icon', '<Chip']) {
  if (!guideWorkspace.includes(requiredGuidePrimitive)) failures.push(`GUIDE does not consume shared ${requiredGuidePrimitive.slice(1)} primitive`)
}

if (failures.length > 0) {
  console.error('Design-system governance violations:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log('Design-system smoke passed: three-layer tokens, token-only global CSS, and shared GUIDE controls are enforced.')
}
