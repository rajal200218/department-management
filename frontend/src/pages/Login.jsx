import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Info, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  // Mode: 'login' | 'forgot_step1' | 'forgot_step2' | 'forgot_success'
  const [viewMode, setViewMode] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Recovery state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const [smtpConfigNotice, setSmtpConfigNotice] = useState(null);
  const [devOtp, setDevOtp] = useState('');

  // 1. Standard Sign In Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.login(email.trim(), password);
      if (response.success) {
        onLoginSuccess(response.user, response.token);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP / Reset Code (Step 1)
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setRecoveryError('');
    setRecoveryNotice('');
    setSmtpConfigNotice(null);
    setDevOtp('');

    if (!recoveryEmail.trim()) {
      setRecoveryError('Please enter your registered email address.');
      return;
    }

    setRecoveryLoading(true);

    try {
      const response = await api.forgotPassword(recoveryEmail.trim());
      setRecoveryNotice(response.message || 'If registered, a recovery code has been generated.');
      
      if (response.emailDeliveryConfigured === false && response.configNotice) {
        setSmtpConfigNotice(response.configNotice);
      }
      if (response.devOtp) {
        setDevOtp(response.devOtp);
      }

      setViewMode('forgot_step2');
    } catch (err) {
      setRecoveryError(err.message || 'Failed to process password recovery request.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // 3. Submit New Password with OTP (Step 2)
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setRecoveryError('');

    if (!otpCode.trim()) {
      setRecoveryError('Please enter the 6-digit verification code.');
      return;
    }
    if (otpCode.trim().length !== 6) {
      setRecoveryError('Verification code must be exactly 6 digits.');
      return;
    }
    if (!newPassword) {
      setRecoveryError('Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setRecoveryError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError('Passwords do not match. Please re-enter.');
      return;
    }

    setRecoveryLoading(true);

    try {
      const response = await api.resetPasswordWithOtp({
        email: recoveryEmail.trim(),
        otpCode: otpCode.trim(),
        resetToken: resetToken || undefined,
        newPassword,
        confirmPassword
      });

      if (response.success) {
        // Pre-fill login email with the recovered email
        setEmail(recoveryEmail.trim());
        setPassword('');
        setViewMode('forgot_success');
      }
    } catch (err) {
      setRecoveryError(err.message || 'Failed to reset password. Please verify your OTP code.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Helper to switch to Forgot Password mode
  const startForgotPassword = () => {
    setError('');
    setRecoveryError('');
    setRecoveryNotice('');
    setSmtpConfigNotice(null);
    setDevOtp('');
    setRecoveryEmail(email.trim()); // carry over any pre-typed email
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setViewMode('forgot_step1');
  };

  // Helper to return to Login mode
  const returnToLogin = () => {
    setError('');
    setRecoveryError('');
    setRecoveryNotice('');
    setViewMode('login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 60%), #0B1120',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#131E35',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
        padding: '2.5rem',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* University Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
            marginBottom: '1rem'
          }}>
            {viewMode === 'login' ? <Building2 size={32} /> : <KeyRound size={32} />}
          </div>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFF', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            LJ UNIVERSITY
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', fontWeight: 500 }}>
            Department Management System
          </p>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: SIGN IN FORM                                                      */}
        {/* ========================================================================= */}
        {viewMode === 'login' && (
          <div>
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                Sign In to Your Account
              </h2>
            </div>

            {error && (
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171',
                fontSize: '0.825rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                lineHeight: 1.4
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Mail size={14} color="#94A3B8" />
                  <span>Institutional Email or Enrollment Number</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. admin@ljku.edu.in or LJU2024CS001"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={{ fontSize: '0.9rem', padding: '0.75rem 1rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Lock size={14} color="#94A3B8" />
                  <span>Password</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ fontSize: '0.9rem', padding: '0.75rem 2.75rem 0.75rem 1rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Forgot Password Link directly below the password field */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={startForgotPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60A5FA',
                      fontSize: '0.825rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '2px 0',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = '#93C5FD';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = '#60A5FA';
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 20px -4px rgba(59, 130, 246, 0.4)',
                  marginTop: '0.25rem'
                }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {/* Quick Demo Fill Buttons */}
              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#64748B',
                  marginBottom: '0.75rem',
                  textAlign: 'center'
                }}>
                  Quick Fill Test Accounts
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@ljku.edu.in');
                      setPassword('admin123');
                    }}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      color: '#93C5FD',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Admin Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('amit.patel@ljku.edu.in');
                      setPassword('admin123');
                    }}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      color: '#C4B5FD',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    HOD (CSE)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('priya.joshi@ljku.edu.in');
                      setPassword('admin123');
                    }}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#6EE7B7',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Faculty Member
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('LJU2024CS001');
                      setPassword('admin123');
                    }}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      color: '#FCD34D',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Student (LJU2024CS001)
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FORGOT PASSWORD - STEP 1 (ENTER EMAIL)                           */}
        {/* ========================================================================= */}
        {viewMode === 'forgot_step1' && (
          <div>
            <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.35rem' }}>
                Reset Your Password
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                Enter your institutional email address to receive a secure 6-digit verification code.
              </p>
            </div>

            {recoveryError && (
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171',
                fontSize: '0.825rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                lineHeight: 1.4
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{recoveryError}</span>
              </div>
            )}

            <form onSubmit={handleRequestOtp}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Mail size={14} color="#94A3B8" />
                  <span>Registered Email Address</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. name@ljku.edu.in"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  autoFocus
                  style={{ fontSize: '0.9rem', padding: '0.75rem 1rem' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 20px -4px rgba(59, 130, 246, 0.4)',
                  marginBottom: '1rem'
                }}
                disabled={recoveryLoading}
              >
                {recoveryLoading ? 'Sending Verification Code...' : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={returnToLogin}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94A3B8',
                  padding: '0.7rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#FFF';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#94A3B8';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to Sign In</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: FORGOT PASSWORD - STEP 2 (ENTER OTP & NEW PASSWORD)               */}
        {/* ========================================================================= */}
        {viewMode === 'forgot_step2' && (
          <div>
            <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.35rem' }}>
                Enter Verification Code
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                We sent a 6-digit recovery code to <br />
                <strong style={{ color: '#60A5FA' }}>{recoveryEmail}</strong>{' '}
                <button
                  type="button"
                  onClick={() => setViewMode('forgot_step1')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    textDecoration: 'underline',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: '0 4px'
                  }}
                >
                  (Change)
                </button>
              </p>
            </div>

            {/* Dev notice / SMTP info if unconfigured */}
            {smtpConfigNotice && (
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                color: '#FACC15',
                fontSize: '0.8rem',
                marginBottom: '1.25rem',
                lineHeight: 1.4
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', marginBottom: devOtp ? '0.5rem' : '0' }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>SMTP Configuration Note:</strong>
                    <div style={{ color: '#E2E8F0', marginTop: '2px', fontSize: '0.775rem' }}>
                      {smtpConfigNotice}
                    </div>
                  </div>
                </div>

                {devOtp && (
                  <div style={{
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px dashed rgba(234, 179, 8, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#FFF' }}>
                      Dev OTP Code: <strong style={{ color: '#38BDF8', letterSpacing: '1px', fontSize: '0.95rem' }}>{devOtp}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtp)}
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#93C5FD',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                )}
              </div>
            )}

            {recoveryError && (
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171',
                fontSize: '0.825rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                lineHeight: 1.4
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{recoveryError}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit}>
              {/* OTP Code */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <KeyRound size={14} color="#94A3B8" />
                  <span>6-Digit Verification Code</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-control"
                  placeholder="e.g. 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  style={{
                    fontSize: '1.2rem',
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    fontWeight: 700,
                    padding: '0.7rem 1rem'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem', display: 'block' }}>
                  Code expires in 15 minutes and can only be used once.
                </span>
              </div>

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Lock size={14} color="#94A3B8" />
                  <span>New Password</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ fontSize: '0.9rem', padding: '0.75rem 2.75rem 0.75rem 1rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Lock size={14} color="#94A3B8" />
                  <span>Confirm New Password</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ fontSize: '0.9rem', padding: '0.75rem 2.75rem 0.75rem 1rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 20px -4px rgba(59, 130, 246, 0.4)',
                  marginBottom: '0.85rem'
                }}
                disabled={recoveryLoading}
              >
                {recoveryLoading ? 'Updating Password...' : (
                  <>
                    <span>Confirm & Reset Password</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={recoveryLoading}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94A3B8',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Resend Code</span>
                </button>

                <button
                  type="button"
                  onClick={returnToLogin}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94A3B8',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PASSWORD RESET SUCCESS CONFIRMATION                               */}
        {/* ========================================================================= */}
        {viewMode === 'forgot_success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF', marginBottom: '0.5rem' }}>
              Password Reset Complete!
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Your password has been successfully updated. Your previous session tokens and reset codes have been invalidated for security.
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={returnToLogin}
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.925rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px -4px rgba(59, 130, 246, 0.4)'
              }}
            >
              <span>Sign In with New Password</span>
              <ArrowRight size={17} />
            </button>
          </div>
        )}

        {/* Security Note Footer */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          color: '#64748B',
          fontSize: '0.75rem'
        }}>
          <ShieldCheck size={14} color="#10B981" />
          <span>Encrypted Session • LJ University ERP</span>
        </div>
      </div>
    </div>
  );
}
