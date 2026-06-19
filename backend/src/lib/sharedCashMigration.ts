type PostgresError = { code?: string; message?: string }

export function isMissingColumnError(err: unknown, column: string) {
  if (!err || typeof err !== 'object') return false
  const pgErr = err as PostgresError
  return pgErr.code === '42703' && pgErr.message?.includes(column) === true
}

let sharedCashReady: boolean | null = null

export async function isSharedCashReady(
  probe: () => Promise<{ error: PostgresError | null }>
): Promise<boolean> {
  if (sharedCashReady !== null) return sharedCashReady

  const { error } = await probe()
  if (!error) {
    sharedCashReady = true
    return true
  }

  if (isMissingColumnError(error, 'household_id') || isMissingColumnError(error, 'shared_cash')) {
    sharedCashReady = false
    return false
  }

  throw error
}

export function resetSharedCashReadyCache() {
  sharedCashReady = null
}
