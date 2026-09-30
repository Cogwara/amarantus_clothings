import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Maintain a single pool across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://telecom_admin:telecom_secure_password_2026@localhost:5435/clothshop_db';

export const pool =
  global.__dbPool ||
  new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__dbPool = pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    return res;
  } catch (err: any) {
    console.error('Database query error:', {
      text,
      params,
      message: err?.message,
    });
    throw err;
  }
}

/**
 * Execute multiple database operations inside a single atomic transaction
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
