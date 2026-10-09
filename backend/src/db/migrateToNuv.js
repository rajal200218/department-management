const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function createAndMigrateDatabase() {
  const dbName = process.env.PGDATABASE || 'nuv_department_db';
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || 'postgres';
  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT, 10) || 5432;

  console.log(`🔄 Checking PostgreSQL connection and database: ${dbName}...`);

  const rootClient = new Client({
    user,
    password,
    host,
    port,
    database: 'postgres'
  });

  try {
    await rootClient.connect();

    const check = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (check.rowCount === 0) {
      console.log(`📦 Creating database '${dbName}'...`);
      await rootClient.query(`CREATE DATABASE ${dbName};`);
      console.log(`✔ Database '${dbName}' created.`);
    } else {
      console.log(`✔ Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.warn(`Database creation notice: ${err.message}`);
  } finally {
    await rootClient.end();
  }

  // Connect to target database and apply schema + seed
  console.log(`📦 Connecting to '${dbName}' to populate schema & seed data...`);
  const targetClient = new Client({
    user,
    password,
    host,
    port,
    database: dbName
  });

  await targetClient.connect();

  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

  if (fs.existsSync(schemaPath)) {
    console.log('📜 Executing schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await targetClient.query(schemaSql);
    console.log('✔ All tables created in ' + dbName);
  }

  if (fs.existsSync(seedPath)) {
    console.log('🌱 Executing seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await targetClient.query(seedSql);
    console.log('✔ Seed data populated into ' + dbName);
  }

  const deptCount = await targetClient.query('SELECT count(*) FROM departments');
  console.log(`\n🎉 SUCCESS! '${dbName}' is fully active with ${deptCount.rows[0].count} departments.`);
  await targetClient.end();
}

createAndMigrateDatabase().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
