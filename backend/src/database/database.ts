import { Pool, PoolConfig } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
}

if (process.env.DATABASE_URL?.includes('supabase')) {
  poolConfig.ssl = { rejectUnauthorized: false }
}

const pool = new Pool(poolConfig)

function toPgParams(sql: string, params?: unknown | unknown[]): { text: string; values: unknown[] } {
  const values = params === undefined ? [] : Array.isArray(params) ? params : [params]
  let index = 0
  const text = sql.replace(/\?/g, () => `$${++index}`)
  return { text, values }
}

export const db = {
  query: async <T = unknown>(sql: string, params?: unknown | unknown[]): Promise<[T]> => {
    const { text, values } = toPgParams(sql, params)
    const result = await pool.query(text, values)
    return [result.rows as T]
  },
}
