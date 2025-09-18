import { Pool, type PoolClient } from "pg"

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_DATABASE || "ecommerce_homeopathy",
  user: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
}

// Create a singleton pool instance
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig)

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err)
      process.exit(-1)
    })
  }

  return pool
}

// Helper function to execute queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const result = await client.query(text, params)
    return result.rows
  } finally {
    client.release()
  }
}

// Helper function to execute queries with a transaction
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// Helper function to get a single row
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows.length > 0 ? rows[0] : null
}

// Close the pool (useful for testing or graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
