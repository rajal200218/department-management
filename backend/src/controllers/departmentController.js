const db = require('../db/database');

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

// GET /api/departments
// Query parameters: search, school_id, status, session
exports.getAllDepartments = async (req, res) => {
  try {
    const { search, school_id, status, session } = req.query;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const sessionRange = parseSessionRange(session);
    
    let sql = `
      SELECT 
        d.id,
        d.department_name,
        d.department_code,
        d.school_id,
        d.hod_id,
        d.email,
        d.phone,
        d.established_year,
        CASE 
          WHEN $1::DATE IS NOT NULL THEN (
            SELECT COUNT(*)::INTEGER FROM faculty f 
            WHERE f.department_id = d.id AND (f.joining_date IS NULL OR f.joining_date <= $1::DATE)
          )
          ELSE (
            SELECT COUNT(*)::INTEGER FROM faculty f 
            WHERE f.department_id = d.id
          )
        END AS faculty_count,
        d.building,
        d.room_no,
        d.description,
        CASE
          WHEN $2::INTEGER IS NOT NULL AND d.established_year > $2::INTEGER THEN 'Upcoming'
          ELSE d.status
        END AS status,
        d.created_at,
        d.updated_at,
        s.school_name,
        s.school_code,
        f.name AS hod_name,
        f.email AS hod_email
      FROM departments d
      LEFT JOIN schools s ON d.school_id = s.id
      LEFT JOIN faculty f ON d.hod_id = f.id
      WHERE 1=1
    `;

    const params = [
      sessionRange ? sessionRange.endDate : null,
      sessionRange ? sessionRange.endYear : null
    ];
    let paramIndex = 3;

    // RBAC: Non-admin/dean users only see their own department
    if (!user.isAdmin && !user.isDean) {
      if (user.department_id) {
        sql += ` AND d.id = $${paramIndex}`;
        params.push(user.department_id);
        paramIndex++;
      } else {
        return res.status(200).json({ success: true, count: 0, session: session || '2026–2027', data: [] });
      }
    }

    // Filter by search query (name or code)
    if (search) {
      sql += ` AND (d.department_name ILIKE $${paramIndex} OR d.department_code ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Filter by school
    if (school_id && (user.isAdmin || user.isDean)) {
      sql += ` AND d.school_id = $${paramIndex}`;
      params.push(parseInt(school_id, 10));
      paramIndex++;
    }

    // Filter by status
    if (status) {
      sql += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY d.id ASC`;

    const result = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      session: session || '2026–2027',
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching departments:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/departments/:id
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { session } = req.query;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const deptId = parseInt(id, 10);
    const sessionRange = parseSessionRange(session);

    // RBAC Check: Faculty and HOD can only view their own department profile
    if (!user.isAdmin && !user.isDean && user.department_id && user.department_id !== deptId) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to view other department profiles.'
      });
    }

    const deptSql = `
      SELECT 
        d.*,
        s.school_name,
        s.school_code,
        s.dean_name,
        s.contact_email AS school_email,
        f.name AS hod_name,
        f.email AS hod_email,
        f.phone AS hod_phone,
        f.designation AS hod_designation,
        f.qualification AS hod_qualification,
        f.specialization AS hod_specialization
      FROM departments d
      LEFT JOIN schools s ON d.school_id = s.id
      LEFT JOIN faculty f ON d.hod_id = f.id
      WHERE d.id = $1
    `;
    const deptResult = await db.query(deptSql, [deptId]);

    if (deptResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const department = deptResult.rows[0];

    // Fetch department faculty (exclude password column)
    let facultySql = `
      SELECT id, department_id, name, email, phone, designation, qualification, specialization, joining_date, experience_years, status, created_at
      FROM faculty
      WHERE department_id = $1
    `;
    const facultyParams = [deptId];

    if (sessionRange) {
      facultySql += ` AND (joining_date IS NULL OR joining_date <= $2::DATE)`;
      facultyParams.push(sessionRange.endDate);
    }

    facultySql += ` ORDER BY id ASC`;
    const facultyResult = await db.query(facultySql, facultyParams);

    // Fetch department academic programs
    const progSql = `SELECT * FROM programs WHERE department_id = $1 ORDER BY id ASC`;
    const progResult = await db.query(progSql, [deptId]);

    // Attach sub-resources
    department.faculty_members = facultyResult.rows;
    department.programs = progResult.rows;
    department.faculty_count = facultyResult.rows.length;

    return res.status(200).json({
      success: true,
      session: session || '2026–2027',
      data: department
    });
  } catch (err) {
    console.error('Error fetching department details:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/departments (Admin only)
exports.createDepartment = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only System Administrators can create new departments.'
      });
    }

    const {
      department_name,
      department_code,
      school_id,
      hod_id,
      email,
      phone,
      established_year,
      faculty_count,
      building,
      room_no,
      description,
      status
    } = req.body;

    if (!department_name || !department_code) {
      return res.status(400).json({ success: false, message: 'Department Name and Department Code are required.' });
    }

    const parsedEstablishedYear = established_year !== undefined && established_year !== null && established_year !== ''
      ? parseInt(established_year, 10)
      : new Date().getFullYear();
    if (isNaN(parsedEstablishedYear) || parsedEstablishedYear < 0) {
      return res.status(400).json({ success: false, message: 'Established Year must be a non-negative integer.' });
    }

    const parsedFacultyCount = faculty_count !== undefined && faculty_count !== null && faculty_count !== ''
      ? parseInt(faculty_count, 10)
      : 0;
    if (isNaN(parsedFacultyCount) || parsedFacultyCount < 0) {
      return res.status(400).json({ success: false, message: 'Faculty Count must be a non-negative integer.' });
    }

    const insertSql = `
      INSERT INTO departments (
        department_name,
        department_code,
        school_id,
        hod_id,
        email,
        phone,
        established_year,
        faculty_count,
        building,
        room_no,
        description,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      department_name.trim(),
      department_code.trim().toUpperCase(),
      school_id ? parseInt(school_id, 10) : null,
      hod_id ? parseInt(hod_id, 10) : null,
      email || null,
      phone || null,
      parsedEstablishedYear,
      parsedFacultyCount,
      building || null,
      room_no || null,
      description || null,
      status || 'Active'
    ];

    const result = await db.query(insertSql, values);

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating department:', err);
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Department code already exists. Please choose a unique code.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/departments/:id (Admin or HOD of that department)
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const deptId = parseInt(id, 10);

    // RBAC: Admin can update any department; HOD can update their own; others denied
    if (!user.isAdmin) {
      if (!user.isHOD || user.department_id !== deptId) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You do not have permission to modify this department.'
        });
      }
    }

    const {
      department_name,
      department_code,
      school_id,
      hod_id,
      email,
      phone,
      established_year,
      faculty_count,
      building,
      room_no,
      description,
      status
    } = req.body;

    let parsedEstablishedYear = undefined;
    if (established_year !== undefined && established_year !== null && established_year !== '') {
      parsedEstablishedYear = parseInt(established_year, 10);
      if (isNaN(parsedEstablishedYear) || parsedEstablishedYear < 0) {
        return res.status(400).json({ success: false, message: 'Established Year must be a non-negative integer.' });
      }
    }

    let parsedFacultyCount = undefined;
    if (faculty_count !== undefined && faculty_count !== null && faculty_count !== '') {
      parsedFacultyCount = parseInt(faculty_count, 10);
      if (isNaN(parsedFacultyCount) || parsedFacultyCount < 0) {
        return res.status(400).json({ success: false, message: 'Faculty Count must be a non-negative integer.' });
      }
    }

    const updateSql = `
      UPDATE departments SET
        department_name = COALESCE($1, department_name),
        department_code = COALESCE($2, department_code),
        school_id = COALESCE($3, school_id),
        hod_id = $4,
        email = COALESCE($5, email),
        phone = COALESCE($6, phone),
        established_year = COALESCE($7, established_year),
        faculty_count = COALESCE($8, faculty_count),
        building = COALESCE($9, building),
        room_no = COALESCE($10, room_no),
        description = COALESCE($11, description),
        status = COALESCE($12, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      department_name,
      department_code ? department_code.toUpperCase() : undefined,
      school_id ? parseInt(school_id, 10) : undefined,
      hod_id !== undefined ? (hod_id ? parseInt(hod_id, 10) : null) : undefined,
      email,
      phone,
      parsedEstablishedYear,
      parsedFacultyCount,
      building,
      room_no,
      description,
      status || 'Active',
      deptId
    ];

    const result = await db.query(updateSql, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating department:', err);
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Department code already exists. Please choose a unique code.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/departments/:id (Admin only)
exports.deleteDepartment = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only System Administrators can delete departments.'
      });
    }

    const { id } = req.params;
    const result = await db.query(`DELETE FROM departments WHERE id = $1 RETURNING id, department_name`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Department '${result.rows[0].department_name}' deleted successfully`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting department:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/departments/:id/assign-hod (Admin only)
exports.assignHod = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only System Administrators can assign HODs.'
      });
    }

    const { id } = req.params;
    const { hod_id } = req.body;

    const result = await db.query(
      `UPDATE departments SET hod_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [hod_id ? parseInt(hod_id, 10) : null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'HOD assigned successfully',
      data: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
