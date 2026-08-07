import { expect, test as base, type Page } from '@playwright/test'

type RuntimeFinding = {
  kind: 'console.error' | 'pageerror' | 'requestfailed'
  message: string
}

const findingsByPage = new WeakMap<Page, RuntimeFinding[]>()

function addFinding(page: Page, finding: RuntimeFinding) {
  findingsByPage.get(page)?.push(finding)
}

base.beforeEach(async ({ page }) => {
  const findings: RuntimeFinding[] = []
  findingsByPage.set(page, findings)

  page.on('console', (message) => {
    if (message.type() === 'error') addFinding(page, { kind: 'console.error', message: message.text() })
  })
  page.on('pageerror', (error) => addFinding(page, { kind: 'pageerror', message: error.message }))
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'unknown network failure'
    addFinding(page, { kind: 'requestfailed', message: `${request.method()} ${request.url()} — ${failure}` })
  })
})

base.afterEach(async ({ page }, testInfo) => {
  const findings = findingsByPage.get(page) ?? []
  await testInfo.attach('runtime-findings.json', {
    body: JSON.stringify(findings, null, 2),
    contentType: 'application/json',
  })
  expect(findings, 'browser runtime must not emit console errors, page errors, or failed requests').toEqual([])
})

export { expect }
export const test = base
export type { Page }
