export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type StorageNamespace = {
  key: string
  version: number
}

export type StorageReadResult<T> =
  | { ok: true; value: T | null }
  | { ok: false; value: null; reason: 'UNAVAILABLE' | 'PARSE_ERROR' | 'MIGRATION_ERROR' | 'INVALID_VALUE' }

export type StorageMigration = {
  fromVersion: number
  migrate: (value: unknown) => unknown
}

type StorageEnvelope = {
  version: number
  value: unknown
}

function resolveStorage(): StorageAdapter | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function createKey(namespace: StorageNamespace) {
  return `mbn-guide.front.v${namespace.version}.${namespace.key}`
}

export function createSafeStorage(
  namespace: StorageNamespace,
  storage = resolveStorage(),
  migrations: StorageMigration[] = [],
) {
  const storageKey = createKey(namespace)

  return {
    get<T>(): StorageReadResult<T> {
      if (!storage) {
        return { ok: false, value: null, reason: 'UNAVAILABLE' }
      }

      try {
        const rawValue = storage.getItem(storageKey)
        if (rawValue === null) {
          return { ok: true, value: null }
        }

        const parsed = JSON.parse(rawValue) as StorageEnvelope | T
        if (!isEnvelope(parsed)) {
          return { ok: true, value: parsed as T }
        }

        if (parsed.version === namespace.version) {
          return { ok: true, value: parsed.value as T }
        }

        let migratedValue = parsed.value
        let currentVersion = parsed.version
        while (currentVersion < namespace.version) {
          const migration = migrations.find((candidate) => candidate.fromVersion === currentVersion)
          if (!migration) {
            storage.removeItem(storageKey)
            return { ok: false, value: null, reason: 'MIGRATION_ERROR' }
          }
          migratedValue = migration.migrate(migratedValue)
          currentVersion += 1
        }

        if (currentVersion !== namespace.version) {
          storage.removeItem(storageKey)
          return { ok: false, value: null, reason: 'MIGRATION_ERROR' }
        }

        storage.setItem(storageKey, JSON.stringify({ version: namespace.version, value: migratedValue }))
        return { ok: true, value: migratedValue as T }
      } catch {
        try {
          storage.removeItem(storageKey)
        } catch {
          // A failing recovery path must not turn storage recovery into an uncaught error.
        }
        return { ok: false, value: null, reason: 'PARSE_ERROR' }
      }
    },
    getValidated<T>(isValid: (value: unknown) => value is T): StorageReadResult<T> {
      const result = this.get<unknown>()
      if (!result.ok || result.value === null) return result as StorageReadResult<T>
      if (isValid(result.value)) return { ok: true, value: result.value }

      try {
        storage?.removeItem(storageKey)
      } catch {
        // Invalid persisted data must never escape into application state.
      }
      return { ok: false, value: null, reason: 'INVALID_VALUE' }
    },
    set<T>(value: T): boolean {
      if (!storage) {
        return false
      }

      try {
        storage.setItem(storageKey, JSON.stringify({ version: namespace.version, value }))
        return true
      } catch {
        return false
      }
    },
    remove(): boolean {
      if (!storage) {
        return false
      }

      try {
        storage.removeItem(storageKey)
        return true
      } catch {
        return false
      }
    },
  }
}

function isEnvelope(value: unknown): value is StorageEnvelope {
  return Boolean(
    value
      && typeof value === 'object'
      && 'version' in value
      && typeof (value as StorageEnvelope).version === 'number'
      && 'value' in value,
  )
}
