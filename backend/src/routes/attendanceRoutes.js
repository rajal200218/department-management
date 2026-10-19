const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth, requireFacultyOrAbove } = require('../middleware/authMiddleware');

router.get('/', requireAuth, attendanceController.getAttendance);
router.get('/report', requireAuth, attendanceController.getAttendanceReport);
router.post('/mark', requireAuth, requireFacultyOrAbove, attendanceController.markAttendance);

module.exports = router;
