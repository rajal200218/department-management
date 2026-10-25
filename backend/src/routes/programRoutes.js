const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const { requireAuth, requireAdminOrHOD } = require('../middleware/authMiddleware');

router.get('/', requireAuth, programController.getAllPrograms);
router.get('/:id', requireAuth, programController.getProgramById);
router.post('/', requireAuth, requireAdminOrHOD, programController.createProgram);
router.put('/:id', requireAuth, requireAdminOrHOD, programController.updateProgram);
router.delete('/:id', requireAuth, requireAdminOrHOD, programController.deleteProgram);

module.exports = router;

