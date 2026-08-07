import { expect, test, type Page } from './test'

const mobile = { width: 402, height: 874 }

async function setLocale(page: Page, locale: 'ko' | 'en') {
  await page.goto('/settings')
  await page.getByLabel(/language|언어/i).selectOption(locale)
}

test.describe('TAB2 Figma spatial frames', () => {
  test('M1 / M4 keep the 250 by 150 editorial rail and English-safe chrome', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/discover')
    const card = page.locator('.magazine-card').first()
    await expect(card).toBeVisible()
    await expect(card).toHaveCSS('flex-basis', '250px')
    await expect(card.locator('.magazine-card__image')).toHaveCSS('min-height', '150px')
    await setLocale(page, 'en')
    await page.goto('/discover')
    await expect(page.locator('.figma-topbar--discover')).toBeVisible()
    await expect(page.locator('.magazine-card-rail')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
  })

  test('M2 / M6 preserve the 170px full-width story hero in both locales', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/story/fixture-riverside-story')
    await expect(page.locator('.editorial-detail__hero')).toBeVisible()
    await expect(page.locator('.editorial-detail__hero')).toHaveCSS('min-height', '170px')
    await setLocale(page, 'en')
    await page.goto('/story/fixture-riverside-story')
    await expect(page.locator('.story-breadcrumb')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
  })

  test('M3 / M5 keep the profile block and display rows resilient in KO and EN', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/settings')
    await expect(page.locator('.settings-profile')).toBeVisible()
    await expect(page.locator('.settings-profile__avatar')).toHaveCSS('width', '76px')
    await expect(page.locator('.settings-row select')).toHaveCSS('min-height', '36px')
    await page.getByLabel(/language|언어/i).selectOption('en')
    await expect(page.getByRole('heading', { name: 'Language & display' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
  })
})
