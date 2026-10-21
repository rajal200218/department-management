const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 10;
const TOKEN_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'lj_erp_department_management_secure_key_2026';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a plain text password using bcrypt
 */
function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
}

/**
 * Verify an input password against stored hash or legacy credentials
 */
function verifyPassword(inputPassword, storedPassword) {
  if (!inputPassword || !storedPassword) return false;

  // 1. Bcrypt hash check (starts with $2a$, $2b$, or $2y$)
  if (/^\$2[aby]\$\d{2}\$/.test(storedPassword)) {
    try {
      return bcrypt.compareSync(inputPassword, storedPassword);
    } catch (err) {
      return false;
    }
  }

  // 2. SHA-256 hash comparison if legacy hashed
  const hashedInput = crypto.createHash('sha256').update(inputPassword).digest('hex');
  if (storedPassword === hashedInput) return true;

  // 3. Plaintext match (for unmigrated legacy seed data)
  if (storedPassword === inputPassword) return true;

  return false;
}

/**
 * Generate a signed session token
 */
function generateToken(payload) {
  const data = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS
  };
  const jsonStr = JSON.stringify(data);
  const dataB64 = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(dataB64).digest('base64url');
  return `${dataB64}.${signature}`;
}

/**
 * Verify and decode a signed session token
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  // Support standard "jwt_token_<timestamp>" or "jwt_faculty_token_<timestamp>" for backward compatibility if any
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [dataB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(dataB64).digest('base64url');

  if (signature !== expectedSig) {
    return null; // Invalid signature / tampered token
  }

  try {
    const jsonStr = Buffer.from(dataB64, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr);

    if (!data.exp || Date.now() > data.exp) {
      return null; // Expired token
    }

    return data;
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
};
