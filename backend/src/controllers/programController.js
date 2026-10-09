const db = require('../db/database');

// GET /api/programs
exports.getAllPrograms = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const { department_id } = req.query;

    let sql = `
      SELECT p.*, d.department_name, d.department_code, s.school_name
      FROM programs p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN schools s ON d.school_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // RBAC: Non-admin/dean users only see programs in their own department
    if (!user.isAdmin && !user.isDean) {
      if (user.department_id) {
        sql += ` AND p.department_id = $${paramIndex}`;
        params.push(user.department_id);
        paramIndex++;
      } else {
        return res.status(200).json({ success: true, data: [] });
      }
    } else if (department_id) {
      sql += ` AND p.department_id = $${paramIndex}`;
      params.push(parseInt(department_id, 10));
      paramIndex++;
    }

    sql += ` ORDER BY p.id ASC`;

    const result = await db.query(sql, params);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/programs/:id
exports.getProgramById = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const { id } = req.params;
    const progId = parseInt(id, 10);

    const result = await db.query(`SELECT * FROM programs WHERE id = $1`, [progId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    const prog = result.rows[0];

    // RBAC Check
    if (!user.isAdmin && !user.isDean && user.department_id && prog.department_id !== user.department_id) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You cannot view academic programs of other departments.'
      });
    }

    return res.status(200).json({ success: true, data: prog });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/programs (Admin or HOD)
exports.createProgram = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    if (!user.isAdmin && !user.isHOD) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only Administrators and HODs can create academic programs.'
      });
    }

    let { department_id, program_name, program_code, degree_level, intake_capacity, duration_years, status } = req.body;

    if (!program_name || !program_code) {
      return res.status(400).json({ success: false, message: 'Program Name and Code are required' });
    }

    // Force department_id for HODs
    if (user.isHOD && !user.isAdmin) {
      department_id = user.department_id;
    }

    const parsedIntake = intake_capacity !== undefined && intake_capacity !== null && intake_capacity !== ''
      ? parseInt(intake_capacity, 10)
      : 60;
    if (isNaN(parsedIntake) || parsedIntake < 0) {
      return res.status(400).json({ success: false, message: 'Intake Capacity must be a non-negative integer.' });
    }

    const parsedDuration = duration_years !== undefined && duration_years !== null && duration_years !== ''
      ? parseInt(duration_years, 10)
      : 4;
    if (isNaN(parsedDuration) || parsedDuration < 0) {
      return res.status(400).json({ success: false, message: 'Duration Years must be a non-negative integer.' });
    }

    const result = await db.query(
      `INSERT INTO programs (department_id, program_name, program_code, degree_level, intake_capacity, duration_years, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        department_id ? parseInt(department_id, 10) : null,
        program_name.trim(),
        program_code.trim().toUpperCase(),
        degree_level || 'Undergraduate (B.Tech)',
        parsedIntake,
        parsedDuration,
        status || 'Active'
      ]
    );
    return res.status(201).json({ success: true, message: 'Program created successfully', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A program with this program code already exists. Program codes must be unique.'
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/programs/:id (Admin or HOD)
exports.updateProgram = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const { id } = req.params;
    const progId = parseInt(id, 10);

    const existing = await db.query(`SELECT department_id FROM programs WHERE id = $1`, [progId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    const existingDeptId = existing.rows[0].department_id;

    if (!user.isAdmin) {
      if (!user.isHOD || user.department_id !== existingDeptId) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You do not have permission to modify this program.'
        });
      }
    }

    let { department_id, program_name, program_code, degree_level, intake_capacity, duration_years, status } = req.body;

    if (!user.isAdmin) {
      department_id = existingDeptId;
    }

    let parsedIntake = undefined;
    if (intake_capacity !== undefined && intake_capacity !== null && intake_capacity !== '') {
      parsedIntake = parseInt(intake_capacity, 10);
      if (isNaN(parsedIntake) || parsedIntake < 0) {
        return res.status(400).json({ success: false, message: 'Intake Capacity must be a non-negative integer.' });
      }
    }

    let parsedDuration = undefined;
    if (duration_years !== undefined && duration_years !== null && duration_years !== '') {
      parsedDuration = parseInt(duration_years, 10);
      if (isNaN(parsedDuration) || parsedDuration < 0) {
        return res.status(400).json({ success: false, message: 'Duration Years must be a non-negative integer.' });
      }
    }

    const result = await db.query(
      `UPDATE programs SET
        department_id = COALESCE($1, department_id),
        program_name = COALESCE($2, program_name),
        program_code = COALESCE($3, program_code),
        degree_level = COALESCE($4, degree_level),
        intake_capacity = COALESCE($5, intake_capacity),
        duration_years = COALESCE($6, duration_years),
        status = COALESCE($7, status)
      WHERE id = $8
      RETURNING *`,
      [
        department_id ? parseInt(department_id, 10) : null,
        program_name,
        program_code ? program_code.toUpperCase() : undefined,
        degree_level,
        parsedIntake,
        parsedDuration,
        status || 'Active',
        progId
      ]
    );

    return res.status(200).json({ success: true, message: 'Program updated successfully', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A program with this program code already exists. Program codes must be unique.'
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/programs/:id (Admin or HOD)
exports.deleteProgram = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const { id } = req.params;
    const progId = parseInt(id, 10);

    const existing = await db.query(`SELECT department_id FROM programs WHERE id = $1`, [progId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    if (!user.isAdmin) {
      if (!user.isHOD || user.department_id !== existing.rows[0].department_id) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You do not have permission to delete this program.'
        });
      }
    }

    await db.query(`DELETE FROM programs WHERE id = $1`, [progId]);
    return res.status(200).json({ success: true, message: 'Program deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
