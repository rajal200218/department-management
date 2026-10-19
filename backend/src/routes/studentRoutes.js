const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth, requireAdminOrHOD } = require('../middleware/authMiddleware');

router.get('/', requireAuth, studentController.getStudents);
router.get('/:id', requireAuth, studentController.getStudentById);
router.post('/', requireAuth, requireAdminOrHOD, studentController.createStudent);
router.put('/:id', requireAuth, requireAdminOrHOD, studentController.updateStudent);
router.delete('/:id', requireAuth, requireAdminOrHOD, studentController.deleteStudent);

module.exports = router;
