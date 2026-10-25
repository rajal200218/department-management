const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { requireAuth, requireAdmin, requireAdminOrHOD } = require('../middleware/authMiddleware');

router.get('/', requireAuth, departmentController.getAllDepartments);
router.get('/:id', requireAuth, departmentController.getDepartmentById);
router.post('/', requireAuth, requireAdmin, departmentController.createDepartment);
router.put('/:id', requireAuth, requireAdminOrHOD, departmentController.updateDepartment);
router.delete('/:id', requireAuth, requireAdmin, departmentController.deleteDepartment);
router.post('/:id/assign-hod', requireAuth, requireAdmin, departmentController.assignHod);

module.exports = router;

