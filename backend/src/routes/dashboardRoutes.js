const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/', dashboardController.getStats);
router.get('/stats', dashboardController.getStats);
router.get('/logs', dashboardController.getQueryLogs);
router.post('/sync-seed', dashboardController.syncSeed);

module.exports = router;

