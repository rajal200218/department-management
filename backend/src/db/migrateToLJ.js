const { runSeed } = require('./seed');

async function createAndMigrateDatabase() {
  await runSeed();
}

if (require.main === module) {
  createAndMigrateDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration error:', err.message);
      process.exit(1);
    });
}

module.exports = { createAndMigrateDatabase };

