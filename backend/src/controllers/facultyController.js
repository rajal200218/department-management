const db = require('../db/database');
const { hashPassword } = require('../utils/security');

// Helper to parse session end year and cutoff date
function parseSessionRange(sessionStr) {
  if (!sessionStr) return null;
  const parts = sessionStr.replace('–', '-').split('-');
  const startYear = parseInt(parts[0], 10);
  if (isNaN(startYear)) return null;
  const endYear = parts[1] && !isNaN(parseInt(parts[1], 10)) ? parseInt(parts[1], 10) : startYear + 1;
  return {
    startYear,
    endYear,
    endDate: `${endYear}-06-30`
  };
}

// Columns to select safely without exposing password
const SAFE_FACULTY_COLUMNS = `
  f.id, f.department_id, f.name, f.email, f.phone,
  f.designation, f.qualification, f.specialization,
  f.joining_date, f.experience_years, f.status, f.created_at,
  d.department_name, d.department_code,
  CASE WHEN d.hod_id = f.id THEN TRUE ELSE FALSE END AS is_current_hod
`;

// GET /api/faculty
// Query parameters: department_id, session
exports.getAllFaculty = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const { department_id, session } = req.query;
    const sessionRange = parseSessionRange(session);

    let sql = `
      SELECT ${SAFE_FACULTY_COLUMNS}
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter faculty who joined on or before the session cutoff
    if (sessionRange) {
      sql += ` AND (f.joining_date IS NULL OR f.joining_date <= $${paramIndex}::DATE)`;
      params.push(sessionRange.endDate);
      paramIndex++;
    }

    // RBAC: Non-admin/dean users only see faculty in their own department
    if (!user.isAdmin && !user.isDean) {
      if (user.department_id) {
        sql += ` AND f.department_id = $${paramIndex}`;
        params.push(user.department_id);
        paramIndex++;
      } else {
        return res.status(200).json({ success: true, count: 0, session: session || '2026–2027', data: [] });
      }
    } else if (department_id) {
      sql += ` AND f.department_id = $${paramIndex}`;
      params.push(parseInt(department_id, 10));
      paramIndex++;
    }

    sql += ` ORDER BY f.id ASC`;

    const result = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      session: session || '2026–2027',
      data: result.rows
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/faculty/:id
exports.getFacultyById = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const { id } = req.params;
    const facultyId = parseInt(id, 10);

    const result = await db.query(`
      SELECT ${SAFE_FACULTY_COLUMNS}
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE f.id = $1
    `, [facultyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    const facultyMember = result.rows[0];

    // RBAC Check: Ensure user belongs to same department or is admin/dean
    if (!user.isAdmin && !user.isDean && user.department_id && facultyMember.department_id !== user.department_id && user.id !== facultyId) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You cannot view faculty records outside your department.'
      });
    }

    return res.status(200).json({ success: true, data: facultyMember });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/faculty (Admin or HOD)
exports.createFaculty = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    
    // RBAC: Only Admin or HOD can create faculty
    if (!user.isAdmin && !user.isHOD) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only Administrators and HODs can add faculty members.'
      });
    }

    let {
      department_id,
      name,
      email,
      password,
      phone,
      designation,
      qualification,
      specialization,
      joining_date,
      experience_years,
      status
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Faculty Name and Email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists in faculty or users table
    const existingFaculty = await db.query('SELECT id FROM faculty WHERE LOWER(email) = $1', [cleanEmail]);
    if (existingFaculty.rows.length > 0) {
      return res.status(400).json({ success: false, message: `A faculty account with email ${cleanEmail} already exists.` });
    }

    // Password validation and hashing
    let plainPass = password ? String(password).trim() : '';
    if (plainPass && plainPass.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }
    if (!plainPass) {
      // Default initial password if none provided
      plainPass = 'nuv@' + new Date().getFullYear();
    }
    const hashedPassword = hashPassword(plainPass);

    // If HOD, force department_id to their own department
    if (user.isHOD && !user.isAdmin) {
      department_id = user.department_id;
    }

    const parsedExp = experience_years !== undefined && experience_years !== null && experience_years !== ''
      ? parseInt(experience_years, 10)
      : 0;
    if (isNaN(parsedExp) || parsedExp < 0) {
      return res.status(400).json({ success: false, message: 'Experience Years must be a non-negative integer.' });
    }

    const result = await db.query(
      `INSERT INTO faculty (
        department_id, name, email, password, phone, designation, qualification, specialization, joining_date, experience_years, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, department_id, name, email, phone, designation, qualification, specialization, joining_date, experience_years, status, created_at`,
      [
        department_id ? parseInt(department_id, 10) : null,
        name.trim(),
        cleanEmail,
        hashedPassword,
        phone || null,
        designation || 'Assistant Professor',
        qualification || null,
        specialization || null,
        joining_date || new Date().toISOString().split('T')[0],
        parsedExp,
        status || 'Active'
      ]
    );

    // Update faculty count in departments table
    if (department_id) {
      await db.query(
        `UPDATE departments SET faculty_count = (SELECT COUNT(*) FROM faculty WHERE department_id = $1) WHERE id = $1`,
        [department_id]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A faculty member with this email address already exists. Institutional emails must be unique.'
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/faculty/:id (Admin, HOD for dept, or Faculty for self)
exports.updateFaculty = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const { id } = req.params;
    const facultyId = parseInt(id, 10);

    // Fetch existing faculty record to check department ownership
    const existing = await db.query(`SELECT department_id, email, password FROM faculty WHERE id = $1`, [facultyId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    const existingDeptId = existing.rows[0].department_id;

    // RBAC Check:
    if (!user.isAdmin) {
      if (user.isHOD) {
        if (existingDeptId !== user.department_id) {
          return res.status(403).json({
            success: false,
            message: 'Access Denied: HODs can only update faculty within their own department.'
          });
        }
      } else if (user.id !== facultyId) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Faculty members can only update their own personal profile.'
        });
      }
    }

    let {
      department_id,
      name,
      email,
      password,
      phone,
      designation,
      qualification,
      specialization,
      joining_date,
      experience_years,
      status
    } = req.body;

    // If non-admin, prevent changing department_id
    if (!user.isAdmin) {
      department_id = existingDeptId;
    }

    let finalHashedPassword = existing.rows[0].password;
    if (password && String(password).trim().length > 0) {
      const cleanPass = String(password).trim();
      if (cleanPass.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }
      finalHashedPassword = hashPassword(cleanPass);
    }

    let parsedExp = undefined;
    if (experience_years !== undefined && experience_years !== null && experience_years !== '') {
      parsedExp = parseInt(experience_years, 10);
      if (isNaN(parsedExp) || parsedExp < 0) {
        return res.status(400).json({ success: false, message: 'Experience Years must be a non-negative integer.' });
      }
    }

    const result = await db.query(
      `UPDATE faculty SET
        department_id = COALESCE($1, department_id),
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        password = $4,
        phone = $5,
        designation = COALESCE($6, designation),
        qualification = $7,
        specialization = $8,
        joining_date = $9,
        experience_years = COALESCE($10, experience_years),
        status = COALESCE($11, status)
      WHERE id = $12
      RETURNING id, department_id, name, email, phone, designation, qualification, specialization, joining_date, experience_years, status, created_at`,
      [
        department_id ? parseInt(department_id, 10) : null,
        name,
        email ? email.trim().toLowerCase() : null,
        finalHashedPassword,
        phone,
        designation,
        qualification,
        specialization,
        joining_date,
        parsedExp,
        status,
        facultyId
      ]
    );

    // Sync faculty counts if department changed
    if (department_id && department_id !== existingDeptId) {
      if (existingDeptId) {
        await db.query(`UPDATE departments SET faculty_count = (SELECT COUNT(*) FROM faculty WHERE department_id = $1) WHERE id = $1`, [existingDeptId]);
      }
      await db.query(`UPDATE departments SET faculty_count = (SELECT COUNT(*) FROM faculty WHERE department_id = $1) WHERE id = $1`, [department_id]);
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A faculty member with this email address already exists. Institutional emails must be unique.'
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/faculty/:id (Admin or HOD)
exports.deleteFaculty = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const { id } = req.params;
    const facultyId = parseInt(id, 10);

    const findFaculty = await db.query(`SELECT department_id FROM faculty WHERE id = $1`, [facultyId]);
    if (findFaculty.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    const deptId = findFaculty.rows[0]?.department_id;

    // RBAC Check:
    if (!user.isAdmin) {
      if (!user.isHOD || user.department_id !== deptId) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Only Administrators or department HODs can delete faculty members.'
        });
      }
      if (user.id === facultyId) {
        return res.status(400).json({
          success: false,
          message: 'Action Denied: You cannot delete your own HOD profile.'
        });
      }
    }

    await db.query(`DELETE FROM faculty WHERE id = $1`, [facultyId]);

    if (deptId) {
      await db.query(
        `UPDATE departments SET faculty_count = (SELECT COUNT(*) FROM faculty WHERE department_id = $1) WHERE id = $1`,
        [deptId]
      );
    }

    return res.status(200).json({ success: true, message: 'Faculty deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
