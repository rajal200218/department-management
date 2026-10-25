const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', requireAuth, schoolController.getAllSchools);
router.get('/:id', requireAuth, schoolController.getSchoolById);
router.post('/', requireAuth, requireAdmin, schoolController.createSchool);
router.put('/:id', requireAuth, requireAdmin, schoolController.updateSchool);
router.delete('/:id', requireAuth, requireAdmin, schoolController.deleteSchool);

module.exports = router;

