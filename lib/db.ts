import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Maintain a single pool across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://telecom_admin:telecom_secure_password_2026@localhost:5435/clothshop_db';

const isLocal =
  connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

export const pool =
  global.__dbPool ||
  new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
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

let discountColumnsEnsured = false;
export async function ensureDiscountColumns() {
  if (discountColumnsEnsured) return;
  try {
    await pool.query(`
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS "defaultDiscountPercent" INT DEFAULT 30;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS "clearanceDiscountPercent" INT DEFAULT 50;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS "showDiscountBadges" BOOLEAN DEFAULT true;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(255) DEFAULT 'OPAY';
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS "accountNumber" VARCHAR(50) DEFAULT '6542969118';
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS "accountName" VARCHAR(255) DEFAULT 'Amarachi Jane Awa';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "discountPercent" INT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "design" TEXT;

      UPDATE shops
      SET 
        "bankName" = COALESCE("bankName", 'OPAY'),
        "accountNumber" = COALESCE("accountNumber", '6542969118'),
        "accountName" = COALESCE("accountName", 'Amarachi Jane Awa')
      WHERE "bankName" IS NULL OR "accountNumber" IS NULL OR "accountName" IS NULL;

      CREATE TABLE IF NOT EXISTS shop_bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bank_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      INSERT INTO shop_bank_accounts (bank_name, account_number, account_name, is_primary, is_active, display_order)
      SELECT 'OPAY', '6542969118', 'Amarachi Jane Awa', true, true, 0
      WHERE NOT EXISTS (SELECT 1 FROM shop_bank_accounts);
    `);
    discountColumnsEnsured = true;
  } catch (err) {
    console.error('Failed to ensure discount columns:', err);
  }
}

export default pool;
