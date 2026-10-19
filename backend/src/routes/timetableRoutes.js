const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { requireAuth, requireAdminOrHOD } = require('../middleware/authMiddleware');

router.get('/', requireAuth, timetableController.getTimetables);
router.post('/', requireAuth, requireAdminOrHOD, timetableController.createTimetable);
router.put('/:id', requireAuth, requireAdminOrHOD, timetableController.updateTimetable);
router.delete('/:id', requireAuth, requireAdminOrHOD, timetableController.deleteTimetable);

module.exports = router;
