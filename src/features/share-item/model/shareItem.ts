export type ShareResult = 'shared' | 'copied' | 'unavailable' | 'dismissed' | 'failed'

export async function shareItem(input: { title: string; text: string; url: string }): Promise<ShareResult> {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share(input)
      return 'shared'
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(input.url)
      return 'copied'
    }
    return 'unavailable'
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError' ? 'dismissed' : 'failed'
  }
}
