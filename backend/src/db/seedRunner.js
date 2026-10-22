// Forwarding wrapper for seed.js to preserve backward compatibility
const { seedDatabase } = require('./seed');

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
