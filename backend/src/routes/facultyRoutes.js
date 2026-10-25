const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { requireAuth, requireAdminOrHOD, requireFacultyOrAbove } = require('../middleware/authMiddleware');

router.get('/', requireAuth, facultyController.getAllFaculty);
router.get('/:id', requireAuth, facultyController.getFacultyById);
router.post('/', requireAuth, requireAdminOrHOD, facultyController.createFaculty);
router.put('/:id', requireAuth, requireFacultyOrAbove, facultyController.updateFaculty);
router.delete('/:id', requireAuth, requireAdminOrHOD, facultyController.deleteFaculty);

module.exports = router;

