const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.get('/', sessionController.getAllSessions);
router.post('/', sessionController.createSession);
router.put('/:id/set-active', sessionController.setActiveSession);

module.exports = router;
