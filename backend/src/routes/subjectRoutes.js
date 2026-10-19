const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { requireAuth, requireAdminOrHOD } = require('../middleware/authMiddleware');

router.get('/', requireAuth, subjectController.getSubjects);
router.get('/:id', requireAuth, subjectController.getSubjectById);
router.post('/', requireAuth, requireAdminOrHOD, subjectController.createSubject);
router.put('/:id', requireAuth, requireAdminOrHOD, subjectController.updateSubject);
router.delete('/:id', requireAuth, requireAdminOrHOD, subjectController.deleteSubject);

module.exports = router;
