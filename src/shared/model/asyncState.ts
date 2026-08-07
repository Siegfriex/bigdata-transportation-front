export const ASYNC_STATES = ['IDLE', 'LOADING', 'SUCCESS', 'EMPTY', 'ERROR', 'UNAVAILABLE'] as const

export type AsyncState = (typeof ASYNC_STATES)[number]

export type AsyncResult<T> =
  | { state: 'IDLE'; data?: undefined; error?: undefined }
  | { state: 'LOADING'; data?: T; error?: undefined }
  | { state: 'SUCCESS'; data: T; error?: undefined }
  | { state: 'EMPTY'; data?: undefined; error?: undefined }
  | { state: 'ERROR'; data?: T; error: Error }
  | { state: 'UNAVAILABLE'; data?: undefined; error?: undefined }
