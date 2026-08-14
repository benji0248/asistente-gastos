function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/** Nested JSON blobs stored as-is (camelCase domain objects). */
const OPAQUE_NESTED_KEYS = new Set([
  'statementData',
  'statement_data',
])

export function keysToSnakeCase<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => keysToSnakeCase(item)) as T
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        camelToSnake(key),
        OPAQUE_NESTED_KEYS.has(key) ? nested : keysToSnakeCase(nested),
      ])
    ) as T
  }

  return value as T
}
