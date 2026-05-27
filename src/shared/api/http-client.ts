export interface HttpRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
}

export class HttpError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

export class HttpTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "HttpTimeoutError";
  }
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function resolveErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

export async function requestJson<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const { body, headers, timeoutMs = 15000, signal, ...requestOptions } = options;
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      throw new HttpError(response.status, resolveErrorMessage(payload, response.statusText), payload);
    }

    return payload as T;
  } catch (err) {
    if (timedOut && err instanceof DOMException && err.name === "AbortError") {
      throw new HttpTimeoutError(timeoutMs);
    }
    throw err;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function postJson<T>(url: string, body: unknown, options: Omit<HttpRequestOptions, "body" | "method"> = {}) {
  return requestJson<T>(url, {
    ...options,
    method: "POST",
    body,
  });
}
