import { expect, test } from './test'

async function noOverflow(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
}

test.describe('detail surface acceptance', () => {
  test('Story establishes editorial hierarchy and returns to DISCOVER context', async ({ page }) => {
    await page.setViewportSize({ width: 402, height: 874 })
    await page.goto('/story/fixture-riverside-story?returnTo=%2Fdiscover%3Fview%3Dmagazine')
    await expect(page.getByRole('img', { name: /media projection|미디어 projection/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /back to discover|발견으로 돌아가기/i })).toBeVisible()
    await noOverflow(page)
    await page.getByRole('button', { name: /back to discover|발견으로 돌아가기/i }).click()
    await expect(page).toHaveURL(/\/discover\?view=magazine/)
  })

  for (const [id, lifecycle] of [
    ['fixture-live-player-unavailable', /LIVE/i],
    ['fixture-culture-session', /UPCOMING|예정/i],
    ['fixture-replay-session', /REPLAY|다시보기/i],
    ['fixture-ended-session', /ENDED|종료/i],
  ] as const) {
    test(`renders ${id} as a temporal lifecycle surface`, async ({ page }) => {
      await page.setViewportSize({ width: 402, height: 874 })
      await page.goto(`/live/${id}`)
      await expect(page.getByRole('img', { name: /player unavailable|플레이어 사용 불가/i })).toBeVisible()
      await expect(page.getByText(lifecycle).first()).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('heading', { name: /chat|채팅/i }).first()).toBeVisible()
      await noOverflow(page)
    })
  }

  test('story and live detail remain readable at the narrow mobile baseline', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/story/fixture-riverside-story')
    await noOverflow(page)
    await page.goto('/live/fixture-ended-session')
    await noOverflow(page)
  })
})
