import { expect, test } from './test'

const mobile = { width: 402, height: 874 }

async function expectMobileFrame(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await expect(page.locator('.primary-navigation')).toBeVisible()
}

test.describe('Figma spatial audit', () => {
  test('DISCOVER preserves the compact search, horizontal card rail, and notice rhythm', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/discover')
    await expect(page.locator('.figma-topbar')).toBeVisible()
    await expect(page.locator('.magazine-card-rail')).toBeVisible()
    await expect(page.locator('.magazine-card')).toHaveCount(2)
    await expect(page.locator('.magazine-home__notice button')).toHaveCount(2)
    await expectMobileFrame(page)
  })

  test('LIVE preserves category rail and media-led session cards without fabricated metrics', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/live')
    await expect(page.locator('.figma-topbar--live')).toBeVisible()
    await expect(page.locator('.live-filter-section--categories .filter-row')).toBeVisible()
    await expect(page.locator('.live-visual-card')).toHaveCount(4)
    const cardCopy = await page.locator('.live-visual-card').allTextContents()
    expect(cardCopy.join(' ')).not.toMatch(/19,900|1\.2만|조회/)
    await expectMobileFrame(page)
  })

  test('detail pages retain their Figma-derived spatial anchors', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/story/fixture-riverside-story')
    await expect(page.locator('.figma-detail-page__topbar')).toBeVisible()
    await expect(page.locator('.editorial-detail__hero')).toBeVisible()
    await expectMobileFrame(page)

    await page.goto('/live/fixture-culture-session')
    await expect(page.locator('.live-detail__stage')).toBeVisible()
    await expect(page.locator('.live-detail__stage-top')).toBeVisible()
    await expectMobileFrame(page)
  })
})
