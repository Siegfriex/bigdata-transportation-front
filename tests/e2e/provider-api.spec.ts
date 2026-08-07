import { expect, test } from './test'

test.describe('provider API boundary', () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'provider routes are exercised against a Vercel deployment, not the Vite SPA server')

  test('rejects invalid reverse-geocoding coordinates before calling a provider', async ({ request }) => {
    const response = await request.get('/api/geocode?lat=outside&lng=127')
    expect(response.status()).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'invalid_coordinates' })
  })

  test('rejects invalid YouTube IDs before calling a provider', async ({ request }) => {
    const response = await request.get('/api/youtube?videoId=not-a-youtube-id')
    expect(response.status()).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'invalid_video_id' })
  })

  test('runs the production provider canary only when explicitly enabled', async ({ request }) => {
    test.skip(process.env.RUN_PROVIDER_CANARY !== '1', 'requires production secrets and consumes provider quota')

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
