const db = require('../db/database');
const { hashPassword } = require('../utils/security');

// GET /api/students
// Supports search, department_id, semester, status, and pagination
exports.getStudents = async (req, res) => {
  try {
    const { department_id, semester, status, search, limit = 50, offset = 0 } = req.query;
    const user = req.user;

    let queryText = `
      SELECT s.*, 
             d.department_name, d.department_code,
             p.program_name, p.program_code
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN programs p ON s.program_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // RBAC: If HOD or Faculty, scope to their department (unless user is Admin/Dean)
    if (user && !user.isAdmin && !user.isDean) {
      if (user.department_id) {
        params.push(user.department_id);
        queryText += ` AND s.department_id = $${params.length}`;
      } else if (user.isStudent) {
        params.push(user.id);
        queryText += ` AND s.id = $${params.length}`;
      }
    } else if (department_id) {
      params.push(parseInt(department_id, 10));
      queryText += ` AND s.department_id = $${params.length}`;
    }

    if (semester) {
      params.push(parseInt(semester, 10));
      queryText += ` AND s.current_semester = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryText += ` AND s.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      queryText += ` AND (LOWER(s.name) LIKE $${params.length} OR LOWER(s.enrollment_no) LIKE $${params.length} OR LOWER(s.email) LIKE $${params.length})`;
    }

    queryText += ` ORDER BY s.enrollment_no ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await db.query(queryText, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM students s WHERE 1=1`;
    const countParams = [];
    if (user && !user.isAdmin && !user.isDean && user.department_id) {
      countParams.push(user.department_id);
      countQuery += ` AND s.department_id = $${countParams.length}`;
    } else if (department_id) {
      countParams.push(parseInt(department_id, 10));
      countQuery += ` AND s.department_id = $${countParams.length}`;
    }
    if (semester) {
      countParams.push(parseInt(semester, 10));
      countQuery += ` AND s.current_semester = $${countParams.length}`;
    }
    if (status) {
      countParams.push(status);
      countQuery += ` AND s.status = $${countParams.length}`;
    }
    if (search) {
      countParams.push(`%${search.trim().toLowerCase()}%`);
      countQuery += ` AND (LOWER(s.name) LIKE $${countParams.length} OR LOWER(s.enrollment_no) LIKE $${countParams.length} OR LOWER(s.email) LIKE $${countParams.length})`;
    }
    const countRes = await db.query(countQuery, countParams);

    return res.status(200).json({
      success: true,
      total: parseInt(countRes.rows[0].count, 10),
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/students/:id
// Returns student profile + attendance summary + results + enrolled subjects
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentRes = await db.query(
      `SELECT s.*, 
              d.department_name, d.department_code,
              p.program_name, p.program_code
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN programs p ON s.program_id = p.id
       WHERE s.id = $1`,
      [id]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = studentRes.rows[0];

    // Attendance summary
    const attRes = await db.query(
      `SELECT 
         COUNT(*) as total_classes,
         COUNT(CASE WHEN status = 'Present' THEN 1 END) as present_count,
         COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent_count,
         COUNT(CASE WHEN status = 'Late' THEN 1 END) as late_count,
         ROUND(
           (COUNT(CASE WHEN status = 'Present' OR status = 'Late' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100), 1
         ) as attendance_percentage
       FROM attendance
       WHERE student_id = $1`,
      [id]
    );

    // Subject-wise attendance
    const subjectAttRes = await db.query(
      `SELECT 
         sub.id as subject_id, sub.subject_name, sub.subject_code,
         COUNT(a.id) as total_sessions,
         COUNT(CASE WHEN a.status = 'Present' OR a.status = 'Late' THEN 1 END) as attended_sessions,
         ROUND(
           (COUNT(CASE WHEN a.status = 'Present' OR a.status = 'Late' THEN 1 END)::numeric / NULLIF(COUNT(a.id), 0) * 100), 1
         ) as percentage
       FROM subjects sub
       LEFT JOIN attendance a ON sub.id = a.subject_id AND a.student_id = $1
       WHERE sub.department_id = $2 AND sub.semester = $3
       GROUP BY sub.id, sub.subject_name, sub.subject_code
       ORDER BY sub.subject_name ASC`,
      [id, student.department_id, student.current_semester]
    );

    // Exam Results with semester and credits
    const resultsRes = await db.query(
      `SELECT er.*, e.exam_name, e.max_marks, e.passing_marks, e.exam_date,
              sub.subject_name, sub.subject_code, sub.semester as subject_semester, sub.credits
       FROM exam_results er
       JOIN exams e ON er.exam_id = e.id
       JOIN subjects sub ON e.subject_id = sub.id
       WHERE er.student_id = $1
       ORDER BY sub.semester ASC, e.exam_date DESC`,
      [id]
    );

    // Past Academic History (Semester-by-semester SGPA, CGPA, Credits, Status)
    const historyRes = await db.query(
      `SELECT * FROM student_academic_history
       WHERE student_id = $1
       ORDER BY semester ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...student,
        attendance_summary: attRes.rows[0] || { total_classes: 0, attendance_percentage: 100 },
        subject_attendance: subjectAttRes.rows,
        exam_results: resultsRes.rows,
        academic_history: historyRes.rows
      }
    });
  } catch (err) {
    console.error('Error fetching student details:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/students
// Add student record
exports.createStudent = async (req, res) => {
  try {
    const {
      enrollment_no,
      name,
      email,
      phone,
      gender,
      dob,
      address,
      admission_year = 2024,
      current_semester = 1,
      department_id,
      program_id,
      status = 'Active'
    } = req.body;

    if (!enrollment_no || !name || !email || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment number, Name, Email, and Department are required.'
      });
    }

    // Check unique enrollment_no & email
    const existsCheck = await db.query(
      'SELECT id FROM students WHERE LOWER(enrollment_no) = $1 OR LOWER(email) = $2',
      [enrollment_no.trim().toLowerCase(), email.trim().toLowerCase()]
    );
    if (existsCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A student with this Enrollment Number or Institutional Email already exists.'
      });
    }

    const defaultPassword = hashPassword('admin123');
    const avatarUrl = gender === 'Female'
      ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    const insertRes = await db.query(
      `INSERT INTO students (
         enrollment_no, name, email, password, phone, gender, dob, address,
         admission_year, current_semester, department_id, program_id, avatar_url, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        enrollment_no.trim().toUpperCase(),
        name.trim(),
        email.trim().toLowerCase(),
        defaultPassword,
        phone || null,
        gender || 'Other',
        dob || null,
        address || null,
        parseInt(admission_year, 10),
        parseInt(current_semester, 10),
        parseInt(department_id, 10),
        program_id ? parseInt(program_id, 10) : null,
        avatarUrl,
        status
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Student '${name}' registered successfully with Enrollment No. ${enrollment_no.toUpperCase()}`,
      data: insertRes.rows[0]
    });
  } catch (err) {
    console.error('Error creating student:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/students/:id
// Update student record
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      enrollment_no,
      name,
      email,
      phone,
      gender,
      dob,
      address,
      admission_year,
      current_semester,
      department_id,
      program_id,
      status
    } = req.body;

    const existing = await db.query('SELECT * FROM students WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    // Unique checks
    if (enrollment_no || email) {
      const dupCheck = await db.query(
        'SELECT id FROM students WHERE (LOWER(enrollment_no) = $1 OR LOWER(email) = $2) AND id != $3',
        [(enrollment_no || '').trim().toLowerCase(), (email || '').trim().toLowerCase(), id]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Another student already uses this Enrollment Number or Email.'
        });
      }
    }

    const cur = existing.rows[0];
    const updateRes = await db.query(
      `UPDATE students SET
         enrollment_no = $1,
         name = $2,
         email = $3,
         phone = $4,
         gender = $5,
         dob = $6,
         address = $7,
         admission_year = $8,
         current_semester = $9,
         department_id = $10,
         program_id = $11,
         status = $12
       WHERE id = $13
       RETURNING *`,
      [
        enrollment_no ? enrollment_no.trim().toUpperCase() : cur.enrollment_no,
        name ? name.trim() : cur.name,
        email ? email.trim().toLowerCase() : cur.email,
        phone !== undefined ? phone : cur.phone,
        gender !== undefined ? gender : cur.gender,
        dob !== undefined ? dob : cur.dob,
        address !== undefined ? address : cur.address,
        admission_year ? parseInt(admission_year, 10) : cur.admission_year,
        current_semester ? parseInt(current_semester, 10) : cur.current_semester,
        department_id ? parseInt(department_id, 10) : cur.department_id,
        program_id ? parseInt(program_id, 10) : cur.program_id,
        status || cur.status,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully.',
      data: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Error updating student:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/students/:id
// Delete student record
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT name, enrollment_no FROM students WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    await db.query('DELETE FROM students WHERE id = $1', [id]);
    return res.status(200).json({
      success: true,
      message: `Student record '${check.rows[0].name}' (${check.rows[0].enrollment_no}) deleted successfully.`
    });
  } catch (err) {
    console.error('Error deleting student:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
