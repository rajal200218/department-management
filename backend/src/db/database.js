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
    database: process.env.PGDATABASE || 'lj_department_db',
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

        // Ensure DMS tables exist
        await client.query(`
          CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            enrollment_no VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) DEFAULT 'admin123',
            phone VARCHAR(50),
            gender VARCHAR(20),
            dob DATE,
            address TEXT,
            admission_year INTEGER DEFAULT 2024,
            current_semester INTEGER DEFAULT 1,
            department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
            program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
            avatar_url VARCHAR(255),
            status VARCHAR(20) DEFAULT 'Active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS subjects (
            id SERIAL PRIMARY KEY,
            subject_name VARCHAR(150) NOT NULL,
            subject_code VARCHAR(50) UNIQUE NOT NULL,
            department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
            program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
            semester INTEGER NOT NULL DEFAULT 1,
            credits INTEGER NOT NULL DEFAULT 3,
            type VARCHAR(50) DEFAULT 'Theory',
            faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'Active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS attendance (
            id SERIAL PRIMARY KEY,
            student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'Present',
            marked_by INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
            remarks VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_student_subject_date UNIQUE(student_id, subject_id, date)
          );
          CREATE TABLE IF NOT EXISTS timetables (
            id SERIAL PRIMARY KEY,
            department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
            program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
            semester INTEGER NOT NULL,
            day_of_week VARCHAR(20) NOT NULL,
            time_slot VARCHAR(50) NOT NULL,
            subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
            faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
            classroom VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS notices (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            category VARCHAR(50) DEFAULT 'General',
            target_role VARCHAR(50) DEFAULT 'All',
            department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            publish_date DATE DEFAULT CURRENT_DATE,
            priority VARCHAR(20) DEFAULT 'Normal',
            posted_by VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS exams (
            id SERIAL PRIMARY KEY,
            exam_name VARCHAR(150) NOT NULL,
            subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
            exam_date DATE NOT NULL,
            time_slot VARCHAR(50) NOT NULL,
            classroom VARCHAR(50),
            max_marks INTEGER DEFAULT 100,
            passing_marks INTEGER DEFAULT 40,
            status VARCHAR(20) DEFAULT 'Scheduled',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS exam_results (
            id SERIAL PRIMARY KEY,
            exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
            student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            marks_obtained NUMERIC(5, 2) NOT NULL,
            grade VARCHAR(10),
            remarks VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_exam_student UNIQUE(exam_id, student_id)
          );
          CREATE TABLE IF NOT EXISTS assignments (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
            department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
            semester INTEGER NOT NULL DEFAULT 1,
            description TEXT,
            due_date DATE NOT NULL,
            max_marks INTEGER DEFAULT 50,
            created_by INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS assignment_submissions (
            id SERIAL PRIMARY KEY,
            assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
            student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
            submission_content TEXT,
            submission_text TEXT,
            submission_file_url TEXT,
            submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) DEFAULT 'Submitted',
            marks_obtained NUMERIC(5, 2),
            feedback TEXT,
            CONSTRAINT uq_assignment_student UNIQUE(assignment_id, student_id)
          );
          ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submission_text TEXT;
          ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submission_file_url TEXT;
        `);

        // Check if secondary module tables are empty, and auto-seed if needed
        try {
          const countRes = await client.query('SELECT count(*) FROM subjects');
          if (parseInt(countRes.rows[0].count, 10) === 0) {
            console.log('🌱 Cloud database missing subjects/attendance/exam records. Seeding comprehensive dataset...');
            const { seedDatabase } = require('./seed');
            await seedDatabase();
            console.log('✔ Cloud database seeded successfully.');
          }

          // Ensure student semester aligns with active academic session curriculum (Semester 4)
          await client.query(`
            UPDATE students SET current_semester = 4 WHERE current_semester != 4;
          `);
        } catch (seedCheckErr) {
          console.warn('Auto-seed check notice:', seedCheckErr.message);
        }
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
