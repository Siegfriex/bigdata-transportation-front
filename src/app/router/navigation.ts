export function navigate(to: string, options: { replace?: boolean } = {}) {
  const method = options.replace ? 'replaceState' : 'pushState'
  window.history[method](null, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function createPlacePath(placeId: string, returnTo?: string) {
  const context = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
  return `/place/${encodeURIComponent(placeId)}${context}`
}

export function safeReturnPath(value: string | null, fallback: string) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : fallback
}
