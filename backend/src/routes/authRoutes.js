const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/profile', authController.getProfile);
router.get('/verify', authController.getProfile);
router.post('/change-password', authController.changePassword);
router.post('/reset-password', authController.resetPassword);

// Public Password Recovery Endpoints
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password-with-otp', authController.resetPasswordWithOtp);

module.exports = router;
