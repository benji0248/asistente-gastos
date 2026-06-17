import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

let pool: Pool | undefined

function getPool(): Pool {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada')
  }

  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase')
      ? { rejectUnauthorized: false }
      : undefined,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  return pool
}

function toPgParams(sql: string, params?: unknown | unknown[]): { text: string; values: unknown[] } {
  const values = params === undefined ? [] : Array.isArray(params) ? params : [params]
  let index = 0
  const text = sql.replace(/\?/g, () => `$${++index}`)
  return { text, values }
}

export const db = {
  query: async <T = unknown>(sql: string, params?: unknown | unknown[]): Promise<[T]> => {
    const { text, values } = toPgParams(sql, params)
    const result = await getPool().query(text, values)
    return [result.rows as T]
  },
}
