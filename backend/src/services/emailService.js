const nodemailer = require('nodemailer');

/**
 * Check if SMTP settings are configured in environment variables
 */
function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

/**
 * Send password reset email with 6-digit OTP and recovery token
 */
async function sendPasswordResetEmail({ toEmail, recipientName, otpCode, resetToken, expiresMinutes = 15 }) {
  const fromAddress = process.env.SMTP_FROM || 'LJ University ERP <no-reply@ljku.edu.in>';
  const subject = `[LJ University ERP] Password Reset Verification Code: ${otpCode}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Recovery - LJ University</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B1120; color: #E2E8F0; padding: 20px; }
        .container { max-width: 520px; margin: 0 auto; background: #131E35; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 30px; }
        .logo { font-size: 20px; font-weight: 800; color: #3B82F6; margin-bottom: 5px; }
        .sub { font-size: 13px; color: #94A3B8; margin-bottom: 25px; }
        .otp-box { background: rgba(59, 130, 246, 0.12); border: 1px dashed #3B82F6; border-radius: 8px; padding: 18px; text-align: center; margin: 25px 0; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #60A5FA; font-family: monospace; }
        .footer { font-size: 12px; color: #64748B; margin-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">LJ UNIVERSITY</div>
        <div class="sub">Department Management System • Password Recovery</div>
        <p>Dear <strong>${recipientName || 'User'}</strong>,</p>
        <p>We received a request to reset your password for your LJ University institutional account (<strong>${toEmail}</strong>).</p>
        <p>Use the following 6-digit verification code (OTP) to reset your password. This code will expire in <strong>${expiresMinutes} minutes</strong>:</p>
        
        <div class="otp-box">
          <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700; margin-bottom: 6px;">Your One-Time Verification Code</div>
          <div class="otp-code">${otpCode}</div>
        </div>

        <p style="font-size: 13px; color: #94A3B8;">If you did not request a password reset, please ignore this email or notify your system administrator immediately. No changes have been made to your account.</p>

        <div class="footer">
          This is an automated institutional message from LJ University ERP. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
LJ UNIVERSITY - DEPARTMENT MANAGEMENT SYSTEM
Password Reset Verification Code

Dear ${recipientName || 'User'},

We received a request to reset the password for your account (${toEmail}).
Your one-time verification code (OTP) is: ${otpCode}

This code is valid for ${expiresMinutes} minutes and cannot be reused.

If you did not make this request, please ignore this message.
  `.trim();

  if (isSmtpConfigured()) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`\x1b[32m✔ [Email Service]\x1b[0m Password reset OTP sent to ${toEmail} via SMTP (${process.env.SMTP_HOST})`);
      return {
        success: true,
        delivered: true,
        method: 'SMTP'
      };
    } catch (smtpErr) {
      console.error(`\x1b[31m❌ [Email Service Error]\x1b[0m SMTP send error:`, smtpErr.message);
      return {
        success: false,
        delivered: false,
        method: 'SMTP_FAILED',
        error: smtpErr.message
      };
    }
  } else {
    // SMTP is not configured in .env
    console.log(`\n======================================================`);
    console.log(`\x1b[33m⚠️  [Email Service Notice - SMTP Not Configured]\x1b[0m`);
    console.log(`To enable real inbox delivery, configure the following in backend/.env:`);
    console.log(`  SMTP_HOST=smtp.gmail.com (or your SMTP server)`);
    console.log(`  SMTP_PORT=587`);
    console.log(`  SMTP_USER=your-email@nuv.ac.in`);
    console.log(`  SMTP_PASS=your-app-password`);
    console.log(`------------------------------------------------------`);
    console.log(`🔑 Generated Reset OTP for \x1b[36m${toEmail}\x1b[0m: \x1b[32m${otpCode}\x1b[0m`);
    console.log(`🕒 Valid for ${expiresMinutes} minutes.`);
    console.log(`======================================================\n`);

    return {
      success: true,
      delivered: false,
      method: 'DEV_LOG',
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otpCode,
      configNotice: 'SMTP delivery is not configured. To send actual emails to users, please add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in backend/.env.'
    };
  }
}

module.exports = {
  isSmtpConfigured,
  sendPasswordResetEmail
};
