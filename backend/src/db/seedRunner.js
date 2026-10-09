const { initDatabase, query } = require('./database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSeed() {
  console.log('🌱 Starting Database Seeding on PostgreSQL...');
  
  try {
    await initDatabase();

    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('📜 Applying database schema (schema.sql)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await query(schemaSql);
      console.log('✔ Schema applied successfully.');
    } else {
      console.error('❌ schema.sql not found at:', schemaPath);
      process.exit(1);
    }

    if (fs.existsSync(seedPath)) {
      console.log('🌿 Populating seed records (seed.sql)...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await query(seedSql);
      console.log('✔ Seed data inserted successfully.');
    } else {
      console.error('❌ seed.sql not found at:', seedPath);
      process.exit(1);
    }

    // Verify record counts in PostgreSQL
    const [deptRes, facultyRes, schoolRes, progRes, userRes] = await Promise.all([
      query('SELECT count(*) FROM departments'),
      query('SELECT count(*) FROM faculty'),
      query('SELECT count(*) FROM schools'),
      query('SELECT count(*) FROM programs'),
      query('SELECT count(*) FROM users')
    ]);

    console.log('\n========================================================');
    console.log('🎉 POSTGRESQL DATABASE SEEDED SUCCESSFULLY');
    console.log(`🏛️  Departments: ${deptRes.rows[0].count}`);
    console.log(`👨‍🏫 Faculty:     ${facultyRes.rows[0].count}`);
    console.log(`🏢 Schools:     ${schoolRes.rows[0].count}`);
    console.log(`📚 Programs:    ${progRes.rows[0].count}`);
    console.log(`👤 Users:       ${userRes.rows[0].count}`);
    console.log('========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\x1b[31mSeed execution error:\x1b[0m', err.message);
    process.exit(1);
  }
}

runSeed();
