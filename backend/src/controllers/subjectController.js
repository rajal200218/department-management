const db = require('../db/database');

// GET /api/subjects
exports.getSubjects = async (req, res) => {
  try {
    const { department_id, program_id, semester, faculty_id, type, search } = req.query;
    const user = req.user;

    let queryText = `
      SELECT s.*, 
             d.department_name, d.department_code,
             p.program_name, p.program_code,
             f.name as faculty_name, f.designation as faculty_designation, f.email as faculty_email
      FROM subjects s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN programs p ON s.program_id = p.id
      LEFT JOIN faculty f ON s.faculty_id = f.id
      WHERE 1=1
    `;
    const params = [];

    // RBAC: If HOD or Faculty member, filter by their department unless Admin/Dean
    if (user && !user.isAdmin && !user.isDean) {
      if (user.department_id) {
        params.push(user.department_id);
        queryText += ` AND s.department_id = $${params.length}`;
      }
    } else if (department_id) {
      params.push(parseInt(department_id, 10));
      queryText += ` AND s.department_id = $${params.length}`;
    }

    if (program_id) {
      params.push(parseInt(program_id, 10));
      queryText += ` AND s.program_id = $${params.length}`;
    }

    if (semester) {
      params.push(parseInt(semester, 10));
      queryText += ` AND s.semester = $${params.length}`;
    }

    if (faculty_id) {
      params.push(parseInt(faculty_id, 10));
      queryText += ` AND s.faculty_id = $${params.length}`;
    }

    if (type) {
      params.push(type);
      queryText += ` AND s.type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      queryText += ` AND (LOWER(s.subject_name) LIKE $${params.length} OR LOWER(s.subject_code) LIKE $${params.length})`;
    }

    queryText += ` ORDER BY s.semester ASC, s.subject_code ASC`;

    const result = await db.query(queryText, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching subjects:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/subjects/:id
exports.getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT s.*, 
              d.department_name, d.department_code,
              p.program_name, p.program_code,
              f.name as faculty_name, f.designation as faculty_designation, f.email as faculty_email
       FROM subjects s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN programs p ON s.program_id = p.id
       LEFT JOIN faculty f ON s.faculty_id = f.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching subject by id:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/subjects
exports.createSubject = async (req, res) => {
  try {
    const {
      subject_name,
      subject_code,
      department_id,
      program_id,
      semester = 1,
      credits = 3,
      type = 'Theory',
      faculty_id,
      description,
      status = 'Active'
    } = req.body;

    if (!subject_name || !subject_code || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Subject Name, Subject Code, and Department are required.'
      });
    }

    // Check unique subject code
    const check = await db.query(
      'SELECT id FROM subjects WHERE LOWER(subject_code) = $1',
      [subject_code.trim().toLowerCase()]
    );
    if (check.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A subject with code '${subject_code.toUpperCase()}' already exists.`
      });
    }

    const insertRes = await db.query(
      `INSERT INTO subjects (
         subject_name, subject_code, department_id, program_id,
         semester, credits, type, faculty_id, description, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        subject_name.trim(),
        subject_code.trim().toUpperCase(),
        parseInt(department_id, 10),
        program_id ? parseInt(program_id, 10) : null,
        parseInt(semester, 10),
        parseInt(credits, 10),
        type,
        faculty_id ? parseInt(faculty_id, 10) : null,
        description || null,
        status
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Subject '${subject_name}' (${subject_code.toUpperCase()}) created successfully.`,
      data: insertRes.rows[0]
    });
  } catch (err) {
    console.error('Error creating subject:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/subjects/:id
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject_name,
      subject_code,
      department_id,
      program_id,
      semester,
      credits,
      type,
      faculty_id,
      description,
      status
    } = req.body;

    const existing = await db.query('SELECT * FROM subjects WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    if (subject_code) {
      const dup = await db.query(
        'SELECT id FROM subjects WHERE LOWER(subject_code) = $1 AND id != $2',
        [subject_code.trim().toLowerCase(), id]
      );
      if (dup.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Subject code '${subject_code.toUpperCase()}' is already used by another course.`
        });
      }
    }

    const cur = existing.rows[0];
    const updateRes = await db.query(
      `UPDATE subjects SET
         subject_name = $1,
         subject_code = $2,
         department_id = $3,
         program_id = $4,
         semester = $5,
         credits = $6,
         type = $7,
         faculty_id = $8,
         description = $9,
         status = $10
       WHERE id = $11
       RETURNING *`,
      [
        subject_name ? subject_name.trim() : cur.subject_name,
        subject_code ? subject_code.trim().toUpperCase() : cur.subject_code,
        department_id ? parseInt(department_id, 10) : cur.department_id,
        program_id !== undefined ? (program_id ? parseInt(program_id, 10) : null) : cur.program_id,
        semester ? parseInt(semester, 10) : cur.semester,
        credits ? parseInt(credits, 10) : cur.credits,
        type || cur.type,
        faculty_id !== undefined ? (faculty_id ? parseInt(faculty_id, 10) : null) : cur.faculty_id,
        description !== undefined ? description : cur.description,
        status || cur.status,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully.',
      data: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Error updating subject:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/subjects/:id
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT subject_name, subject_code FROM subjects WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    await db.query('DELETE FROM subjects WHERE id = $1', [id]);
    return res.status(200).json({
      success: true,
      message: `Subject '${check.rows[0].subject_name}' (${check.rows[0].subject_code}) removed successfully.`
    });
  } catch (err) {
    console.error('Error deleting subject:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
