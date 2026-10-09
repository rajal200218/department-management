const db = require('../db/database');

// GET /api/schools
exports.getAllSchools = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    let sql = `
      SELECT 
        s.*,
        COUNT(d.id)::INTEGER AS department_count
      FROM schools s
      LEFT JOIN departments d ON s.id = d.school_id
    `;
    const params = [];

    // RBAC: If HOD or Faculty, filter to only the school containing their department
    if (!user.isAdmin && !user.isDean) {
      if (user.department_id) {
        sql += ` WHERE s.id = (SELECT school_id FROM departments WHERE id = $1) `;
        params.push(user.department_id);
      } else {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    sql += ` GROUP BY s.id ORDER BY s.id ASC`;

    const result = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/schools/:id
exports.getSchoolById = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const { id } = req.params;
    const result = await db.query(`SELECT * FROM schools WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/schools (Admin only)
exports.createSchool = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only System Administrators can create new schools.'
      });
    }

    const { school_name, school_code, dean_name, contact_email, contact_phone, building, status } = req.body;

    if (!school_name || !school_code) {
      return res.status(400).json({ success: false, message: 'School Name and Code are required' });
    }

    const result = await db.query(
      `INSERT INTO schools (school_name, school_code, dean_name, contact_email, contact_phone, building, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [school_name.trim(), school_code.trim().toUpperCase(), dean_name, contact_email, contact_phone, building, status || 'Active']
    );

    return res.status(201).json({ success: true, message: 'School created successfully', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A school with this school code already exists. School codes must be unique.'
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/schools/:id (Admin only)
exports.updateSchool = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only System Administrators can update schools.'
      });
    }

    const { id } = req.params;
    const { school_name, school_code, dean_name, contact_email, contact_phone, building, status } = req.body;

    const result = await db.query(
      `UPDATE schools SET
        school_name = COALESCE($1, school_name),
        school_code = COALESCE($2, school_code),
        dean_name = $3,
        contact_email = $4,
        contact_phone = $5,
        building = $6,
        status = COALESCE($7, status)
      WHERE id = $8
      RETURNING *`,
      [school_name, school_code ? school_code.toUpperCase() : undefined, dean_name, contact_email, contact_phone, building, status || 'Active', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    return res.status(200).json({ success: true, message: 'School updated successfully', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A school with this school code already exists. School codes must be unique.'
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/schools/:id (Admin only)
exports.deleteSchool = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only System Administrators can delete schools.'
      });
    }

    const { id } = req.params;
    const result = await db.query(`DELETE FROM schools WHERE id = $1 RETURNING id, school_name`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    return res.status(200).json({ success: true, message: `School '${result.rows[0].school_name}' deleted successfully` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
