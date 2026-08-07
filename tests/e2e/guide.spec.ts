import { expect, test } from './test'

const guidePath = '/guide?area=seoul-central&category=all'
const knownPlace = 'fixture-studio-exhibit'

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
}

test.describe('GUIDE map discovery surface', () => {
  test('default renders mobile map, category row, tray and three primary tabs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const errors: string[] = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto(guidePath)
    await expect(page.getByTestId('guide-search')).toBeVisible()
    await expect(page.getByText(/선택한 지역|selected area/i)).toBeVisible()
    await expect(page.getByTestId('guide-category-row')).toBeVisible()
    await expect(page.getByTestId('guide-map')).toBeVisible()
    await expect(page.getByRole('region', { name: /장소 발견 prototype 지도|place discovery prototype map/i })).toBeVisible()
    await expect(page.getByTestId('guide-discovery-tray')).toBeVisible()
    await expect(page.getByRole('navigation', { name: /primary|주요/i })).toHaveCount(1)
    await expect(page.getByRole('button', { name: /settings|설정/i })).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    expect(errors).toEqual([])
  })

  test('marker and card selection remain synchronized', async ({ page }) => {
    await page.goto(guidePath)
    await page.getByTestId(`guide-marker-${knownPlace}`).click()
    await expect(page.getByTestId(`guide-marker-${knownPlace}`)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId(`guide-place-card-${knownPlace}`)).toHaveAttribute('aria-pressed', 'true')
    await page.getByTestId('guide-place-card-fixture-night-market').click()
    await expect(page.getByTestId('guide-marker-fixture-night-market')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId(`guide-marker-${knownPlace}`)).toHaveAttribute('aria-pressed', 'false')
  })

  test('tray expands to a keyboard reachable list sheet', async ({ page }) => {
    await page.goto(guidePath)
    await page.getByTestId('guide-list-toggle').click()
    await expect(page.getByTestId('guide-list-toggle')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('guide-sheet')).toBeVisible()
    await page.getByTestId(`guide-place-card-${knownPlace}`).last().focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/place\/fixture-studio-exhibit/)
    await expect(page.getByTestId('place-detail-modal')).toBeVisible()
  })

  test('deterministic search updates context without network search', async ({ page }) => {
    await page.goto(guidePath)
    const search = page.getByTestId('guide-search')
    await search.fill('데모')
    await expect(page.getByRole('listbox', { name: /search suggestions|검색 제안/i })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/q=%EB%8D%B0%EB%AA%A8/)
    await expect(page.getByTestId('guide-discovery-tray')).toBeVisible()
  })

  test('category filter applies to same marker/list collection and empty remains empty', async ({ page }) => {
    await page.goto(guidePath)
    await page.getByRole('button', { name: /전시|exhibition/i }).first().click()
    await expect(page.getByTestId(`guide-marker-${knownPlace}`)).toBeVisible()
    await expect(page.getByTestId(`guide-place-card-${knownPlace}`)).toBeVisible()
    await page.getByTestId('guide-filter-trigger').click()
    await expect(page.getByRole('dialog')).not.toContainText(/price|가격/i)
    await page.getByRole('dialog').getByRole('button', { name: /힐링|wellbeing/i }).click()
    await page.getByRole('dialog').getByRole('button', { name: /적용|apply/i }).click()
    await expect(page.getByRole('heading', { name: /결과가 없어요|no results/i }).first()).toBeVisible()
    await page.getByRole('button', { name: /초기화|reset/i }).click()
    await expect(page.getByTestId('guide-discovery-tray')).toBeVisible()
  })

  test('GUIDE detail is route-driven modal and restores query state on Escape, close, and back', async ({ page }) => {
    const contextualGuide = '/guide?area=seoul-central&category=exhibition&sheet=full&selected=fixture-studio-exhibit'
    await page.goto(contextualGuide)
    await page.getByTestId(`guide-place-card-${knownPlace}`).last().click()
    await expect(page).toHaveURL(/\/place\/fixture-studio-exhibit/)
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('place-detail-modal')).toContainText(/왜 중요한가|why it matters/i)
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(contextualGuide)
    await page.getByTestId(`guide-place-card-${knownPlace}`).last().click()
    await page.getByRole('button', { name: /장소 상세 닫기|close place detail/i }).click()
    await expect(page).toHaveURL(contextualGuide)
    await page.getByTestId(`guide-place-card-${knownPlace}`).last().click()
    await page.goBack()
    await expect(page).toHaveURL(contextualGuide)
  })

  test('direct detail link is standalone and unknown place is truthful', async ({ page }) => {
    await page.goto(`/place/${knownPlace}`)
    await expect(page.getByRole('heading', { name: /데모 스튜디오 전시|demo studio exhibit/i })).toBeVisible()
    await page.goto('/place/not-found')
    await expect(page.getByRole('heading', { name: /이용 불가|unavailable/i })).toBeVisible()
  })

  test('map unavailable retains list and detail entry', async ({ page }) => {
    await page.goto(`${guidePath}&map=unavailable`)
    await expect(page.getByTestId('guide-map')).toContainText(/지도 공급자가 연결되지|map provider is not connected/i)
    await expect(page.getByTestId('guide-discovery-tray')).toBeVisible()
    await page.getByTestId(`guide-place-card-${knownPlace}`).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 402, height: 874 }, { width: 430, height: 932 }]) {
    test(`has no horizontal overflow at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto(guidePath)
      await expectNoHorizontalOverflow(page)
      await page.getByTestId(`guide-marker-${knownPlace}`).click()
      await expectNoHorizontalOverflow(page)
    })
  }

  test('keeps the primary GUIDE controls within the viewport at 200% text scale', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto(guidePath)
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    await expectNoHorizontalOverflow(page)
    await expect(page.getByTestId('guide-search')).toBeVisible()
    await expect(page.getByTestId('guide-list-toggle')).toBeVisible()
  })

  test('honors reduced motion without changing GUIDE selection semantics', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(guidePath)
    await page.getByTestId(`guide-marker-${knownPlace}`).click()
    await expect(page.getByTestId(`guide-marker-${knownPlace}`)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId(`guide-place-card-${knownPlace}`)).toHaveAttribute('aria-pressed', 'true')
  })

  test('keyboard search and filter return focus to their triggers', async ({ page }) => {
    await page.goto(guidePath)
    await page.getByTestId('guide-search').focus()
    await page.keyboard.type('데모')
    await page.keyboard.press('Escape')
    await page.getByTestId('guide-filter-trigger').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByTestId('guide-filter-trigger')).toBeFocused()
  })

  test('locale chrome switches to English without an overflow', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel(/language|언어/i).selectOption('en')
    await page.goto(guidePath)
    await expect(page.getByTestId('guide-search')).toHaveAttribute('placeholder', /Search an area/i)
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
