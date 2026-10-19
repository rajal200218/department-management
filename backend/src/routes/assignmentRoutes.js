const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { requireAuth, requireFacultyOrAbove, requireAdminOrHOD } = require('../middleware/authMiddleware');

router.get('/', requireAuth, assignmentController.getAssignments);
router.get('/:id', requireAuth, assignmentController.getAssignmentById);
router.post('/', requireAuth, requireFacultyOrAbove, assignmentController.createAssignment);
router.put('/:id', requireAuth, requireFacultyOrAbove, assignmentController.updateAssignment);
router.delete('/:id', requireAuth, requireAdminOrHOD, assignmentController.deleteAssignment);
router.post('/:id/submit', requireAuth, assignmentController.submitAssignment);
router.post('/submissions/:submissionId/grade', requireAuth, requireFacultyOrAbove, assignmentController.gradeSubmission);

module.exports = router;
