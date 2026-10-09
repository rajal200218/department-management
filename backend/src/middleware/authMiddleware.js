const db = require('../db/database');
const { verifyToken } = require('../utils/security');

/**
 * Helper to normalize user roles to lowercase canonical names
 */
function normalizeRole(role) {
  if (!role) return 'faculty';
  const lower = role.toLowerCase().trim();
  if (lower === 'admin' || lower === 'administrator') return 'admin';
  if (lower === 'dean') return 'dean';
  if (lower.includes('hod') || lower === 'head of department') return 'hod';
  return 'faculty'; // Professor, Associate Professor, Assistant Professor, Lecturer, etc.
}

/**
 * Authentication Middleware:
 * Inspects Authorization header, verifies signed session token, and loads user context from PostgreSQL.
 * If unauthenticated or token invalid/expired, req.user remains NULL.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    let token = null;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else {
        token = authHeader.trim();
      }
    }

    req.user = null;

    if (!token) {
      // No token provided -> unauthenticated guest
      return next();
    }

    // 1. Verify signed token
    const decoded = verifyToken(token);
    let targetEmail = decoded?.email;

    // Fallback: If legacy token format (jwt_token_... or jwt_faculty_token_...), check x-user-email
    if (!targetEmail && req.headers['x-user-email']) {
      targetEmail = req.headers['x-user-email'].trim().toLowerCase();
    }

    if (!targetEmail) {
      // Invalid or expired token
      return next();
    }

    const cleanEmail = targetEmail.trim().toLowerCase();

    // 2. Query `users` table in PostgreSQL (System Admin / Deans)
    const userRes = await db.query(
      'SELECT id, name, email, role, avatar_url FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (userRes.rows.length > 0) {
      const u = userRes.rows[0];
      const roleKey = normalizeRole(u.role);

      req.user = {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url,
        rawRole: u.role,
        role: roleKey,
        department_id: null,
        department_name: null,
        department_code: null,
        isAdmin: roleKey === 'admin',
        isDean: roleKey === 'dean',
        isHOD: false,
        isFaculty: false
      };
      return next();
    }

    // 3. Query `faculty` table in PostgreSQL (HODs, Professors, Assistant Professors)
    const facultyRes = await db.query(
      `SELECT f.id, f.name, f.email, f.designation, f.department_id, f.status,
              d.department_name, d.department_code,
              CASE WHEN d.hod_id = f.id THEN TRUE ELSE FALSE END AS is_hod
       FROM faculty f
       LEFT JOIN departments d ON f.department_id = d.id
       WHERE LOWER(f.email) = $1`,
      [cleanEmail]
    );

    if (facultyRes.rows.length > 0) {
      const f = facultyRes.rows[0];

      // If faculty account is inactive, deny access
      if (f.status && f.status.toLowerCase() === 'inactive') {
        req.user = null;
        return next();
      }

      const isHodRole = Boolean(f.is_hod);
      const calculatedRole = isHodRole ? 'hod' : 'faculty';

      req.user = {
        id: f.id,
        name: f.name,
        email: f.email,
        rawRole: isHodRole ? 'HOD' : f.designation,
        role: calculatedRole,
        department_id: f.department_id,
        department_name: f.department_name,
        department_code: f.department_code,
        isAdmin: false,
        isDean: false,
        isHOD: isHodRole,
        isFaculty: !isHodRole
      };
      return next();
    }

    // Email was not found in DB
    req.user = null;
    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    req.user = null;
    next();
  }
}

/**
 * RBAC Guard: Requires any authenticated user session
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to access this resource.'
    });
  }
  next();
}

/**
 * RBAC Guard: Requires System Admin role
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.'
    });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access Forbidden: System Administrator privileges are required for this action.'
    });
  }
  next();
}

/**
 * RBAC Guard: Requires Admin or Dean role
 */
function requireAdminOrDean(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.'
    });
  }
  if (!req.user.isAdmin && !req.user.isDean) {
    return res.status(403).json({
      success: false,
      message: 'Access Forbidden: Requires Admin or Dean privileges.'
    });
  }
  next();
}

/**
 * RBAC Guard: Requires Admin or HOD of the target department
 */
function requireAdminOrHOD(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.'
    });
  }

  if (req.user.isAdmin) {
    return next();
  }

  if (req.user.isHOD) {
    const targetDeptId = req.params.id || req.params.departmentId || req.body.department_id || req.query.department_id;
    if (targetDeptId && parseInt(targetDeptId, 10) !== req.user.department_id) {
      return res.status(403).json({
        success: false,
        message: 'Access Forbidden: You can only manage data for your own department.'
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access Forbidden: Only System Administrators or Department HODs can perform this operation.'
  });
}

module.exports = {
  authenticate,
  requireAuth,
  requireAdmin,
  requireAdminOrDean,
  requireAdminOrHOD,
  normalizeRole
};
