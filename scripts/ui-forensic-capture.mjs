import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.UI_AUDIT_BASE_URL
const reality = process.env.UI_AUDIT_REALITY
const timestamp = process.env.UI_AUDIT_TIMESTAMP
const routeFilter = process.env.UI_AUDIT_ROUTES?.split(',').filter(Boolean)

if (!baseUrl || !reality || !timestamp) {
  throw new Error('UI_AUDIT_BASE_URL, UI_AUDIT_REALITY, and UI_AUDIT_TIMESTAMP are required.')
}

const routes = [
  ['root', '/'],
  ['guide', '/guide'],
  ['discover', '/discover'],
  ['live', '/live'],
  ['search', '/search'],
  ['saved', '/saved'],
  ['settings', '/settings'],
  ['place', '/place/fixture-riverside-stage'],
  ['story', '/story/fixture-riverside-story'],
  ['live-detail', '/live/fixture-culture-session'],
]

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 402, height: 874 },
  { width: 430, height: 932 },
]

const root = join(process.cwd(), 'artifacts', 'ui-audit', reality, timestamp)
const manifestPath = join(root, 'capture-manifest.json')
let priorRecords = []
try {
  priorRecords = JSON.parse(await readFile(manifestPath, 'utf8')).records ?? []
} catch {}
const browser = await chromium.launch({ headless: true })
const records = []

try {
  for (const [name, path] of routes.filter(([name]) => !routeFilter || routeFilter.includes(name))) {
    const routeDir = join(root, name)
    await mkdir(routeDir, { recursive: true })

    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport })
      const consoleErrors = []
      const pageErrors = []
      const requestFailures = []
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      page.on('pageerror', (error) => pageErrors.push(error.message))
      page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }))

      const filename = `${viewport.width}x${viewport.height}.png`
      try {
        const response = await page.goto(new URL(path, baseUrl).toString(), { waitUntil: 'networkidle', timeout: 30_000 })
        await page.waitForTimeout(250)
        const metrics = await page.evaluate(() => ({
          title: document.title,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollHeight: document.documentElement.scrollHeight,
          hasViteOverlay: Boolean(document.querySelector('.vite-error-overlay')),
          bodyTextLength: document.body.innerText.trim().length,
        }))
        await page.screenshot({ path: join(routeDir, filename), fullPage: false })
        records.push({
          route: path,
          name,
          screenshot: join(reality, timestamp, name, filename),
          httpStatus: response?.status() ?? null,
          ...metrics,
          horizontalOverflow: metrics.scrollWidth > metrics.clientWidth,
          consoleErrors,
          pageErrors,
          requestFailures,
        })
      } catch (error) {
        records.push({ route: path, name, screenshot: null, viewport, captureError: error instanceof Error ? error.message : String(error), consoleErrors, pageErrors, requestFailures })
      } finally {
        await page.close()
      }
    }
  }
} finally {
  await browser.close()
}

const merged = [...priorRecords, ...records]
await writeFile(manifestPath, `${JSON.stringify({ reality, baseUrl, capturedAt: new Date().toISOString(), records: merged }, null, 2)}\n`)
console.log(JSON.stringify({ root, routes: routeFilter?.length ?? routes.length, viewports: viewports.length, records: records.length }))
