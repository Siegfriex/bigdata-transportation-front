import { expect, test } from './test'

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
}

test.describe('mobile design-system guardrails', () => {
  test('keeps long LIVE chrome within the mobile column and leaves filter labels readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/live')

    const heading = page.locator('.live-surface__heading h2').first()
    await expect(heading).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expect.poll(() => heading.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)

    const statusFilterButtons = page.locator('.filter-row').first().getByRole('button')
    const count = await statusFilterButtons.count()
    for (let index = 0; index < count; index += 1) {
      await expect.poll(() => statusFilterButtons.nth(index).evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    }
  })

  test('aligns direct-search controls to a single touch-target height', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/search')

    const dimensions = await page.locator('.search-form').evaluate((form) => {
      const input = form.querySelector('input')?.getBoundingClientRect()
      const button = form.querySelector('button')?.getBoundingClientRect()
      return { inputHeight: input?.height ?? 0, buttonHeight: button?.height ?? 0 }
    })

    expect(dimensions.inputHeight).toBeGreaterThanOrEqual(44)
    expect(Math.abs(dimensions.inputHeight - dimensions.buttonHeight)).toBeLessThanOrEqual(2)
    await expectNoHorizontalOverflow(page)
  })

  test('centers desktop primary navigation as a mobile-scale control group', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 874 })
    await page.goto('/guide?area=seoul-central&category=all')

    const metrics = await page.locator('.primary-navigation').evaluate((navigation) => {
      const buttons = [...navigation.querySelectorAll('button')].map((button) => button.getBoundingClientRect())
      const first = buttons[0]
      const last = buttons.at(-1)
      return { firstLeft: first?.left ?? 0, lastRight: last?.right ?? 0, navigationWidth: navigation.getBoundingClientRect().width }
    })

    expect((metrics.firstLeft + metrics.lastRight) / 2).toBeCloseTo(metrics.navigationWidth / 2, 0)
  })
})
