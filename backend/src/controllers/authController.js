const crypto = require('crypto');
const db = require('../db/database');
const { verifyPassword, hashPassword, generateToken } = require('../utils/security');
const emailService = require('../services/emailService');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check in `users` table (Admin / Dean accounts)
    const userResult = await db.query(
      'SELECT id, name, email, password, role, avatar_url FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      if (!verifyPassword(password, user.password)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      // Transparent upgrade to bcrypt if currently plain text or legacy hash
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        try {
          const upgradedHash = hashPassword(password);
          await db.query('UPDATE users SET password = $1 WHERE id = $2', [upgradedHash, user.id]);
        } catch (upgradeErr) {
          console.warn('Could not upgrade password hash:', upgradeErr.message);
        }
      }

      const { password: _, ...safeUser } = user;
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: safeUser
      });
    }

    // 2. Check in `faculty` table (HODs, Professors, Assistant Professors)
    const facultyResult = await db.query(
      `SELECT f.*, d.department_name, d.department_code,
              CASE WHEN d.hod_id = f.id THEN TRUE ELSE FALSE END AS is_hod
       FROM faculty f
       LEFT JOIN departments d ON f.department_id = d.id
       WHERE LOWER(f.email) = $1`,
      [cleanEmail]
    );

    if (facultyResult.rows.length > 0) {
      const faculty = facultyResult.rows[0];

      if (faculty.status && faculty.status.toLowerCase() === 'inactive') {
        return res.status(403).json({ success: false, message: 'This faculty account is inactive. Please contact administration.' });
      }

      // Verify stored password or fallback to legacy password
      const storedPass = faculty.password || 'admin123';
      if (!verifyPassword(password, storedPass)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      // Transparent upgrade to bcrypt hash
      if (!faculty.password || (!faculty.password.startsWith('$2a$') && !faculty.password.startsWith('$2b$'))) {
        try {
          const upgradedHash = hashPassword(password);
          await db.query('UPDATE faculty SET password = $1 WHERE id = $2', [upgradedHash, faculty.id]);
        } catch (upgradeErr) {
          console.warn('Could not upgrade faculty password hash:', upgradeErr.message);
        }
      }

      const role = faculty.is_hod 
        ? 'HOD' 
        : faculty.designation.includes('Professor') 
        ? faculty.designation 
        : 'Faculty';

      const safeFacultyUser = {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        role: role,
        department_id: faculty.department_id,
        department_name: faculty.department_name,
        department_code: faculty.department_code,
        avatar_url: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80`
      };

      const token = generateToken({
        id: faculty.id,
        email: faculty.email,
        role: role,
        department_id: faculty.department_id
      });

      return res.status(200).json({
        success: true,
        message: `Welcome ${faculty.name} (${role})`,
        token,
        user: safeFacultyUser
      });
    }

    // 3. Check in `students` table (Student Portal)
    const studentResult = await db.query(
      `SELECT s.*, d.department_name, d.department_code, p.program_name, p.program_code
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN programs p ON s.program_id = p.id
       WHERE LOWER(s.email) = $1 OR LOWER(s.enrollment_no) = $1`,
      [cleanEmail]
    );

    if (studentResult.rows.length > 0) {
      const student = studentResult.rows[0];

      if (student.status && student.status.toLowerCase() === 'inactive') {
        return res.status(403).json({ success: false, message: 'This student account is inactive. Please contact the registrar office.' });
      }

      const storedPass = student.password || 'admin123';
      if (!verifyPassword(password, storedPass)) {
        return res.status(401).json({ success: false, message: 'Invalid email/enrollment number or password.' });
      }

      if (!student.password || (!student.password.startsWith('$2a$') && !student.password.startsWith('$2b$'))) {
        try {
          const upgradedHash = hashPassword(password);
          await db.query('UPDATE students SET password = $1 WHERE id = $2', [upgradedHash, student.id]);
        } catch (upgradeErr) {
          console.warn('Could not upgrade student password hash:', upgradeErr.message);
        }
      }

      const safeStudentUser = {
        id: student.id,
        enrollment_no: student.enrollment_no,
        name: student.name,
        email: student.email,
        role: 'student',
        current_semester: student.current_semester,
        department_id: student.department_id,
        department_name: student.department_name,
        department_code: student.department_code,
        program_id: student.program_id,
        program_name: student.program_name,
        avatar_url: student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };

      const token = generateToken({
        id: student.id,
        enrollment_no: student.enrollment_no,
        email: student.email,
        role: 'student',
        department_id: student.department_id
      });

      return res.status(200).json({
        success: true,
        message: `Welcome ${student.name} (Student)`,
        token,
        user: safeStudentUser
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email or enrollment number.' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

// GET /api/auth/profile or /api/auth/verify
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No active session or invalid token. Please log in.'
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const { currentPassword, newPassword } = req.body;
    const userEmail = req.user.email;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const cleanEmail = userEmail.trim().toLowerCase();

    // 1. Check in users table
    const userRes = await db.query('SELECT id, password FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rows.length > 0) {
      const storedPass = userRes.rows[0].password;
      if (!verifyPassword(currentPassword, storedPass)) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const hashedNewPassword = hashPassword(newPassword);
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userRes.rows[0].id]);
      return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    }

    // 2. Check in faculty table
    const facultyRes = await db.query('SELECT id, password FROM faculty WHERE LOWER(email) = $1', [cleanEmail]);
    if (facultyRes.rows.length > 0) {
      const storedPass = facultyRes.rows[0].password || 'admin123';
      if (!verifyPassword(currentPassword, storedPass)) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const hashedNewPassword = hashPassword(newPassword);
      await db.query('UPDATE faculty SET password = $1 WHERE id = $2', [hashedNewPassword, facultyRes.rows[0].id]);
      return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    }

    // 3. Check in students table
    const studentRes = await db.query('SELECT id, password FROM students WHERE LOWER(email) = $1', [cleanEmail]);
    if (studentRes.rows.length > 0) {
      const storedPass = studentRes.rows[0].password || 'admin123';
      if (!verifyPassword(currentPassword, storedPass)) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const hashedNewPassword = hashPassword(newPassword);
      await db.query('UPDATE students SET password = $1 WHERE id = $2', [hashedNewPassword, studentRes.rows[0].id]);
      return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    }

    return res.status(404).json({ success: false, message: 'User account not found.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};

// POST /api/auth/reset-password (Admin only)
exports.resetPassword = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access Denied: Only Administrators can reset user passwords.' });
    }

    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Target email and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashedNewPassword = hashPassword(newPassword);

    const userRes = await db.query('UPDATE users SET password = $1 WHERE LOWER(email) = $2 RETURNING id', [hashedNewPassword, cleanEmail]);
    if (userRes.rows.length > 0) {
      return res.status(200).json({ success: true, message: `Password reset successfully for ${cleanEmail}.` });
    }

    const facultyRes = await db.query('UPDATE faculty SET password = $1 WHERE LOWER(email) = $2 RETURNING id', [hashedNewPassword, cleanEmail]);
    if (facultyRes.rows.length > 0) {
      return res.status(200).json({ success: true, message: `Password reset successfully for faculty member ${cleanEmail}.` });
    }

    return res.status(404).json({ success: false, message: 'No account found with this email address.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

// POST /api/auth/forgot-password (Public self-service request)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check users or faculty table
    const userRes = await db.query('SELECT id, name, email FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    const facultyRes = await db.query('SELECT id, name, email, status FROM faculty WHERE LOWER(email) = $1', [cleanEmail]);

    const targetAccount = userRes.rows[0] || facultyRes.rows[0];

    // Generic security response: Do not reveal whether email exists in the system
    const genericMessage = 'If this email address is registered in the university system, a password recovery code has been sent.';

    if (!targetAccount || (targetAccount.status && targetAccount.status.toLowerCase() === 'inactive')) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
        emailDeliveryConfigured: emailService.isSmtpConfigured()
      });
    }

    // Generate 6-digit verification code and 32-byte secure token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresMinutes = 15;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    // Invalidate prior unused reset requests for this email
    await db.query(
      'UPDATE password_resets SET used = TRUE WHERE LOWER(email) = $1 AND used = FALSE',
      [cleanEmail]
    );

    // Record new password reset entry in database
    await db.query(
      `INSERT INTO password_resets (email, otp_code, reset_token, expires_at, used)
       VALUES ($1, $2, $3, $4, FALSE)`,
      [cleanEmail, otpCode, resetToken, expiresAt]
    );

    // Dispatch email (or log development fallback)
    const emailResult = await emailService.sendPasswordResetEmail({
      toEmail: cleanEmail,
      recipientName: targetAccount.name,
      otpCode,
      resetToken,
      expiresMinutes
    });

    return res.status(200).json({
      success: true,
      message: genericMessage,
      emailDeliveryConfigured: emailResult.delivered,
      configNotice: emailResult.configNotice,
      devOtp: emailResult.devOtp
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing password recovery request.' });
  }
};

// POST /api/auth/verify-reset-otp (Verify 6-digit code)
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otpCode).trim();

    const checkRes = await db.query(
      `SELECT * FROM password_resets
       WHERE LOWER(email) = $1 AND otp_code = $2 AND used = FALSE
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (checkRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
    }

    const resetRow = checkRes.rows[0];
    if (new Date() > new Date(resetRow.expires_at)) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code confirmed.',
      resetToken: resetRow.reset_token
    });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    return res.status(500).json({ success: false, message: 'Server error validating verification code.' });
  }
};

// POST /api/auth/reset-password-with-otp (Submit new password)
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otpCode, resetToken, newPassword, confirmPassword } = req.body;

    if (!email || (!otpCode && !resetToken) || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, verification code/token, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation password do not match.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode ? String(otpCode).trim() : null;
    const cleanToken = resetToken ? String(resetToken).trim() : null;

    // Verify token/OTP is valid, unused, and not expired
    const resetCheck = await db.query(
      `SELECT * FROM password_resets
       WHERE LOWER(email) = $1
         AND (otp_code = $2 OR reset_token = $3)
         AND used = FALSE
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp, cleanToken]
    );

    if (resetCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or already used password reset session. Please request a new code.' });
    }

    const resetRow = resetCheck.rows[0];
    if (new Date() > new Date(resetRow.expires_at)) {
      return res.status(400).json({ success: false, message: 'Password reset session has expired. Please request a new code.' });
    }

    const hashedNewPassword = hashPassword(newPassword);
    let updated = false;

    // Update users table
    const userUpdate = await db.query(
      'UPDATE users SET password = $1 WHERE LOWER(email) = $2 RETURNING id',
      [hashedNewPassword, cleanEmail]
    );
    if (userUpdate.rows.length > 0) updated = true;

    // Update faculty table
    const facultyUpdate = await db.query(
      'UPDATE faculty SET password = $1 WHERE LOWER(email) = $2 RETURNING id',
      [hashedNewPassword, cleanEmail]
    );
    if (facultyUpdate.rows.length > 0) updated = true;

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Invalidate all reset requests for this email to prevent reuse
    await db.query('UPDATE password_resets SET used = TRUE WHERE LOWER(email) = $1', [cleanEmail]);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password with OTP error:', err);
    return res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
};
