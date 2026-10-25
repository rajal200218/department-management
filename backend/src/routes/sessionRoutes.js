const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', requireAuth, sessionController.getAllSessions);
router.post('/', requireAuth, requireAdmin, sessionController.createSession);
router.put('/:id/set-active', requireAuth, requireAdmin, sessionController.setActiveSession);

module.exports = router;

