export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type ResponseMode = 'auto' | 'json' | 'text'

export type HttpRequestOptions = {
  method?: HttpMethod
  headers?: HeadersInit
  body?: BodyInit | null
  signal?: AbortSignal
  timeoutMs?: number
  responseMode?: ResponseMode
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly code: 'HTTP' | 'NETWORK' | 'TIMEOUT' | 'ABORTED' | 'PARSE',
    public readonly status: number | null,
    public readonly payload?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

async function parseResponse(response: Response, mode: ResponseMode): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''
  const shouldParseJson = mode === 'json' || (mode === 'auto' && contentType.includes('application/json'))

  try {
    return shouldParseJson ? await response.json() : await response.text()
  } catch {
    throw new HttpError('Response parsing failed.', 'PARSE', response.status)
  }
}

export async function request<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? 10_000
  let timedOut = false
  const abortFromCaller = () => controller.abort(options.signal?.reason)

  if (options.signal) {
    if (options.signal.aborted) {
      abortFromCaller()
    } else {
      options.signal.addEventListener('abort', abortFromCaller, { once: true })
    }
  }

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    })
    const payload = await parseResponse(response, options.responseMode ?? 'auto')

    if (!response.ok) {
      throw new HttpError(`Request failed with status ${response.status}.`, 'HTTP', response.status, payload)
    }

    return payload as T
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }
    if (timedOut) {
      throw new HttpError('Request timed out.', 'TIMEOUT', null)
    }
    if (options.signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new HttpError('Request was aborted.', 'ABORTED', null)
    }
    throw new HttpError('Network request failed.', 'NETWORK', null, error)
  } finally {
    globalThis.clearTimeout(timeoutId)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}
