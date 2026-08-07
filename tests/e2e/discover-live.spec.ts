import { expect, test } from './test'

const storyId = 'fixture-riverside-story'
const replayId = 'fixture-replay-session'

test.describe('DISCOVER editorial surface', () => {
  test('supports the magazine, truthful community state, Story entry, and return context', async ({ page }) => {
    await page.goto('/discover?view=magazine')
    await expect(page.getByRole('heading', { name: /HOT 매거진|hot magazine/i })).toBeVisible()
    await expect(page.getByRole('group', { name: /발견 보기|discover view/i })).toBeVisible()
    await page.getByRole('button', { name: /스토리 보기|open story/i }).click()
    await expect(page).toHaveURL(new RegExp(`/story/${storyId}`))
    await page.getByRole('button', { name: /발견으로 돌아가기|back to discover/i }).click()
    await expect(page).toHaveURL(/\/discover\?view=magazine/)
    await page.getByRole('button', { name: /커뮤니티|community/i }).click()
    await expect(page.getByText(/커뮤니티 projection을 사용할 수 없습니다|community projection unavailable/i)).toBeVisible()
  })

  test('keeps DISCOVER within the mobile viewport at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/discover?view=magazine')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  })
})

test.describe('LIVE lifecycle surface', () => {
  test('filters lifecycle with pressed state and preserves the filter on detail return', async ({ page }) => {
    await page.goto('/live')
    const replay = page.getByRole('button', { name: /다시보기|replay/i })
    await replay.click()
    await expect(replay).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/status=replay/)
    await page.getByRole('button', { name: /세션 보기|open session/i }).first().click()
    await expect(page).toHaveURL(new RegExp(`/live/${replayId}`))
    await expect(page.getByRole('img', { name: /플레이어 사용 불가|player unavailable/i })).toBeVisible()
    await page.getByRole('button', { name: /라이브로 돌아가기|back to live/i }).click()
    await expect(page).toHaveURL(/\/live\?status=replay&category=all/)
  })

  test('shows all lifecycle cards without claiming a connected provider', async ({ page }) => {
    await page.goto('/live')
    await expect(page.getByRole('heading', { name: /라이브 공급자가 연결되지 않았습니다|no live provider is connected/i })).toBeVisible()
    for (const lifecycle of [/LIVE/i, /예정|upcoming/i, /다시보기|replay/i, /종료|ended/i]) {
      await expect(page.getByRole('button', { name: lifecycle }).first()).toBeVisible()
    }
  })
})
