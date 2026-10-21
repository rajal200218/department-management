const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function resetAndSeedDatabase() {
  const dbName = process.env.PGDATABASE || 'lj_department_db';
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || 'postgres';
  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT, 10) || 5432;

  console.log('🔄 Connecting to PostgreSQL server...');
  
  const rootClient = new Client({
    user,
    password,
    host,
    port,
    database: 'postgres'
  });

  try {
    await rootClient.connect();
    console.log('✔ Connected to PostgreSQL root server.');

    // Create database if not exists
    const dbRes = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (dbRes.rowCount === 0) {
      console.log(`📦 Creating database '${dbName}'...`);
      await rootClient.query(`CREATE DATABASE ${dbName};`);
      console.log(`✔ Database '${dbName}' created.`);
    } else {
      console.log(`✔ Database '${dbName}' already exists.`);
    }
    await rootClient.end();

    // Connect to target database and run schema + seed
    console.log(`📦 Connecting to '${dbName}' to apply schema & seed...`);
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
      console.log('✔ All 5 tables created.');
    }

    if (fs.existsSync(seedPath)) {
      console.log('🌱 Executing seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await targetClient.query(seedSql);
      console.log('✔ All seed data inserted.');
    }

    await targetClient.end();
    console.log('\n======================================================');
    console.log(`🎉 SUCCESS! PostgreSQL is ready and seeded.`);
    console.log(`🔑 Host:     ${host}:${port}`);
    console.log(`🔑 Username: ${user}`);
    console.log(`🗄️  Database: ${dbName}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Database reset/seed error:', err.message);
  }
}

resetAndSeedDatabase();
