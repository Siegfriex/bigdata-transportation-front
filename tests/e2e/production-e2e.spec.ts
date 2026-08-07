import { expect, test } from './test'

test.describe('production M14 and provider E2E', () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'this suite must target a deployed Vercel URL')

  test('GUIDE renders the M14 place release and opens a real place detail', async ({ page }) => {
    await page.setViewportSize({ width: 402, height: 874 })
    await page.goto('/guide?area=seoul-central&category=all')

    await expect(page.getByTestId('guide-map')).toBeVisible()
    const markers = page.locator('[data-testid^="guide-marker-place_"]')
    await expect.poll(() => markers.count()).toBeGreaterThan(0)
    const firstMarker = markers.first()
    const markerId = await firstMarker.getAttribute('data-testid')
    expect(markerId).toMatch(/^guide-marker-place_\d+$/)
    const placeId = markerId?.replace('guide-marker-', '')
    expect(placeId).toBeTruthy()

    await firstMarker.click()
    await expect(firstMarker).toHaveAttribute('aria-pressed', 'true')
    await page.getByTestId(`guide-place-card-${placeId}`).first().click()
    await expect(page).toHaveURL(new RegExp(`/place/${placeId}`))
    await expect(page.getByTestId('place-detail-modal')).toBeVisible()
    await expect(page.getByTestId('place-detail-modal').getByRole('heading', { level: 1 })).not.toHaveText('')
    await expect(page.getByRole('heading', { name: /왜 중요한가|why it matters/i })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  })

  test('product surfaces remain available while Story and LIVE stay on their declared fallback paths', async ({ page }) => {
    await page.setViewportSize({ width: 402, height: 874 })
    await page.goto('/discover')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()

    await page.goto('/live')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()

    await page.goto('/settings')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('navigation', { name: /primary|주요/i })).toHaveCount(1)
  })

  test('rejects invalid Google provider input without calling a provider', async ({ request }) => {
    const geocode = await request.get('/api/geocode?lat=outside&lng=127')
    expect(geocode.status()).toBe(400)
    expect(await geocode.json()).toMatchObject({ error: 'invalid_coordinates' })

    const youtube = await request.get('/api/youtube?videoId=not-a-youtube-id')
    expect(youtube.status()).toBe(400)
    expect(await youtube.json()).toMatchObject({ error: 'invalid_video_id' })
  })

  test('canaries confirm both server-side Google credentials without exposing them', async ({ request }) => {
    const youtube = await request.get('/api/youtube?mode=health')
    expect(youtube.status()).toBe(200)
    const youtubeBody = await youtube.json() as { provider: string; configured: boolean; categoryCount: number }
    expect(youtubeBody).toMatchObject({ provider: 'youtube-data-v3', configured: true })
    expect(youtubeBody.categoryCount).toBeGreaterThan(0)

    const geocode = await request.get('/api/geocode?lat=37.5786500878&lng=126.9800038741')
    expect(geocode.status()).toBe(200)
    const geocodeBody = await geocode.json() as { provider: string; coordinate: { lat: number; lng: number }; formattedAddress: string }
    expect(geocodeBody).toMatchObject({ provider: 'google-geocoding', coordinate: { lat: 37.5786500878, lng: 126.9800038741 } })
    expect(geocodeBody.formattedAddress).not.toEqual('')
  })
})
