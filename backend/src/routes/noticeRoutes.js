const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { requireAuth, requireFacultyOrAbove, requireAdminOrHOD } = require('../middleware/authMiddleware');

router.get('/', requireAuth, noticeController.getNotices);
router.post('/', requireAuth, requireFacultyOrAbove, noticeController.createNotice);
router.put('/:id', requireAuth, requireFacultyOrAbove, noticeController.updateNotice);
router.delete('/:id', requireAuth, requireAdminOrHOD, noticeController.deleteNotice);

module.exports = router;
