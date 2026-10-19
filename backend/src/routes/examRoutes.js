const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { requireAuth, requireFacultyOrAbove, requireAdminOrHOD } = require('../middleware/authMiddleware');

router.get('/student/my-results', requireAuth, examController.getMyResults);
router.get('/', requireAuth, examController.getExams);
router.get('/:id', requireAuth, examController.getExamById);
router.post('/', requireAuth, requireFacultyOrAbove, examController.createExam);
router.put('/:id', requireAuth, requireFacultyOrAbove, examController.updateExam);
router.delete('/:id', requireAuth, requireAdminOrHOD, examController.deleteExam);
router.post('/:id/results', requireAuth, requireFacultyOrAbove, examController.saveResults);

module.exports = router;
