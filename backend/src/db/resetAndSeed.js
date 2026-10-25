const { runSeed } = require('./seed');

async function resetAndSeedDatabase() {
  await runSeed();
}

if (require.main === module) {
  resetAndSeedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Reset and seed error:', err.message);
      process.exit(1);
    });
}

module.exports = { resetAndSeedDatabase };

