import { expect, test } from './test'

const placeId = 'fixture-studio-exhibit'
const storyId = 'fixture-riverside-story'
const replayId = 'fixture-replay-session'

async function resetLocalState(page: import('@playwright/test').Page) {
  await page.goto('/guide')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
}

test.describe('core cross-surface flows', () => {
  test('GUIDE selection opens contextual Place detail and persists a saved place reference', async ({ page }) => {
    await resetLocalState(page)
    await page.goto('/guide?area=seoul-central&category=all')
    await page.getByTestId(`guide-marker-${placeId}`).click()
    await page.getByTestId(`guide-place-card-${placeId}`).click()
    await expect(page).toHaveURL(new RegExp(`/place/${placeId}`))
    await expect(page.getByTestId('place-detail-modal')).toBeVisible()

    await page.getByRole('button', { name: /저장|save/i }).click()
    await expect(page.getByRole('button', { name: /저장됨|saved/i })).toBeVisible()

    await page.goto('/saved')
    await expect(page.getByRole('heading', { name: /데모 스튜디오 전시|demo studio exhibit/i })).toBeVisible()
  })

  test('DISCOVER Story persists a reference and resolves it in Saved', async ({ page }) => {
    await resetLocalState(page)
    await page.goto('/discover?view=magazine')
    await page.getByRole('button', { name: /스토리 보기|open story/i }).click()
    await expect(page).toHaveURL(new RegExp(`/story/${storyId}`))
    await expect(page.getByRole('heading', { name: /문화 맥락은 장소 카드 이후에도 이어져야 한다|cultural context should continue beyond the place card/i })).toBeVisible()

    await page.getByRole('button', { name: /저장|save/i }).click()
    await page.goto('/saved')
    await expect(page.getByRole('heading', { name: /문화 맥락은 장소 카드 이후에도 이어져야 한다|cultural context should continue beyond the place card/i })).toBeVisible()
  })

  test('LIVE filter opens the selected lifecycle detail and returns to its preserved context', async ({ page }) => {
    await resetLocalState(page)
    await page.goto('/live')
    await page.getByRole('button', { name: 'REPLAY' }).click()
    await expect(page).toHaveURL(/status=replay/)
    await page.getByRole('button', { name: /세션 보기|open session/i }).click()
    await expect(page).toHaveURL(new RegExp(`/live/${replayId}`))
    await expect(page.getByRole('heading', { name: /데모 리플레이 세션|demo replay session/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /플레이어 사용 불가|player unavailable/i })).toBeVisible()

    await page.getByRole('button', { name: /라이브로 돌아가기|back to live/i }).click()
    await expect(page).toHaveURL(/\/live\?status=replay&category=all/)
  })
})
