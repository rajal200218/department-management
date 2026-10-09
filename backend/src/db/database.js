const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Build connection configuration with full environment variable support
const getDbConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
    };
  }

  const isSsl = process.env.PGSSL === 'true' || process.env.DATABASE_SSL === 'true';

  return {
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT, 10) || 5432,
    database: process.env.PGDATABASE || 'nuv_department_db',
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.PG_MAX_CONNECTIONS, 10) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  };
};

const dbConfig = getDbConfig();
let pool = null;
const queryLogs = [];

// Query logging for Live SQL inspection drawer (Admin feature)
function logQuery(text, params, rowCount, durationMs) {
  const logEntry = {
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    sql: text,
    params: params || [],
    rowCount: rowCount !== undefined ? rowCount : null,
    durationMs: durationMs || 0,
    dbMode: 'POSTGRES'
  };
  queryLogs.unshift(logEntry);
  if (queryLogs.length > 50) queryLogs.pop();
  console.log(`\x1b[36m[SQL Query]\x1b[0m ${text} \x1b[33m(${durationMs}ms)\x1b[0m`);
}

// Get or initialize the connection pool
function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
    pool.on('error', (err) => {
      console.error('\x1b[31m[PostgreSQL Pool Error]\x1b[0m Unexpected error on idle client:', err.message);
    });
  }
  return pool;
}

/**
 * Execute parameterized query directly against PostgreSQL
 * PostgreSQL is the single source of truth for all data
 */
async function query(text, params = []) {
  const start = Date.now();
  const activePool = getPool();

  try {
    const res = await activePool.query(text, params);
    const duration = Date.now() - start;
    logQuery(text, params, res.rowCount, duration);
    return res;
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`\x1b[31m[PostgreSQL Query Error]\x1b[0m (${duration}ms):`, err.message);
    throw err;
  }
}

/**
 * Initialize database connection and synchronize schema if tables do not exist
 */
async function initDatabase() {
  const activePool = getPool();

  try {
    // Test direct connection
    const client = await activePool.connect();
    const dbTarget = dbConfig.connectionString 
      ? 'PostgreSQL Cloud Database' 
      : `${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

    console.log(`\x1b[32m✔ Connected to PostgreSQL (${dbTarget})\x1b[0m`);

    // Synchronize schema if tables are not yet created
    try {
      const tableCheck = await client.query(`
        SELECT to_regclass('public.departments') AS dept_exists;
      `);

      if (!tableCheck.rows[0].dept_exists) {
        console.log('📜 Initializing tables with schema.sql...');
        const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
        const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(schemaSql);
          console.log('✔ Schema tables created in PostgreSQL.');
        }

        if (fs.existsSync(seedPath)) {
          console.log('🌱 Populating initial seed data from seed.sql...');
          const seedSql = fs.readFileSync(seedPath, 'utf8');
          await client.query(seedSql);
          console.log('✔ Initial seed data loaded successfully into PostgreSQL.');
        }
      } else {
        // Ensure faculty table has password column
        await client.query(`
          ALTER TABLE faculty ADD COLUMN IF NOT EXISTS password VARCHAR(255);
        `);
        // Ensure password_resets table exists
        await client.query(`
          CREATE TABLE IF NOT EXISTS password_resets (
            id SERIAL PRIMARY KEY,
            email VARCHAR(150) NOT NULL,
            otp_code VARCHAR(10) NOT NULL,
            reset_token VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
          CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
        `);
      }
    } catch (syncErr) {
      console.warn('Database schema sync notice:', syncErr.message);
    } finally {
      client.release();
    }

    return { success: true, mode: 'POSTGRES' };
  } catch (err) {
    console.error(`\x1b[31m[PostgreSQL Connection Error]\x1b[0m Failed to connect to PostgreSQL: ${err.message}`);
    console.error('Please verify your database environment variables (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE or DATABASE_URL).');
    throw err;
  }
}

module.exports = {
  query,
  initDatabase,
  getPool,
  getDbMode: () => 'POSTGRES',
  getQueryLogs: () => queryLogs
};
