const db = require('../db/database');

// GET /api/assignments
exports.getAssignments = async (req, res) => {
  try {
    const { department_id, subject_id, semester } = req.query;
    const user = req.user;

    let queryText = `
      SELECT a.*, 
             sub.subject_name, sub.subject_code,
             d.department_name, d.department_code,
             f.name as created_by_name,
             COUNT(asub.id) as total_submissions,
             COUNT(CASE WHEN asub.status = 'Graded' THEN 1 END) as graded_submissions
    `;

    // If logged in as student, also fetch their personal submission status
    if (user && user.isStudent) {
      queryText += `,
        my_sub.id as my_submission_id,
        my_sub.status as my_submission_status,
        my_sub.marks_obtained as my_marks,
        my_sub.submitted_at as my_submitted_at,
        my_sub.feedback as my_feedback,
        my_sub.submission_content as my_submission_content,
        COALESCE(my_sub.submission_text, my_sub.submission_content) as my_submission_text,
        my_sub.submission_file_url as my_submission_file_url
      `;
    }

    queryText += `
      FROM assignments a
      JOIN subjects sub ON a.subject_id = sub.id
      JOIN departments d ON a.department_id = d.id
      LEFT JOIN faculty f ON a.created_by = f.id
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
    `;

    if (user && user.isStudent) {
      queryText += ` LEFT JOIN assignment_submissions my_sub ON a.id = my_sub.assignment_id AND my_sub.student_id = ${parseInt(user.id, 10)}`;
    }

    queryText += ` WHERE 1=1`;
    const params = [];

    // RBAC: If Student, scope to their department & current semester
    if (user && user.isStudent) {
      if (user.department_id) {
        params.push(user.department_id);
        queryText += ` AND a.department_id = $${params.length}`;
      }
      if (user.current_semester) {
        params.push(user.current_semester);
        queryText += ` AND a.semester = $${params.length}`;
      }
    } else if (user && !user.isAdmin && !user.isDean && user.department_id) {
      params.push(user.department_id);
      queryText += ` AND a.department_id = $${params.length}`;
    } else if (department_id) {
      params.push(parseInt(department_id, 10));
      queryText += ` AND a.department_id = $${params.length}`;
    }

    if (subject_id) {
      params.push(parseInt(subject_id, 10));
      queryText += ` AND a.subject_id = $${params.length}`;
    }

    if (semester) {
      params.push(parseInt(semester, 10));
      queryText += ` AND a.semester = $${params.length}`;
    }

    queryText += `
      GROUP BY a.id, sub.subject_name, sub.subject_code, d.department_name, d.department_code, f.name
    `;

    if (user && user.isStudent) {
      queryText += `, my_sub.id, my_sub.status, my_sub.marks_obtained, my_sub.submitted_at, my_sub.feedback, my_sub.submission_content, my_sub.submission_text, my_sub.submission_file_url`;
    }

    queryText += ` ORDER BY a.due_date DESC, a.created_at DESC`;

    const result = await db.query(queryText, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching assignments:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/assignments/:id
exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignRes = await db.query(
      `SELECT a.*, 
              sub.subject_name, sub.subject_code,
              d.department_name, d.department_code,
              f.name as created_by_name
       FROM assignments a
       JOIN subjects sub ON a.subject_id = sub.id
       JOIN departments d ON a.department_id = d.id
       LEFT JOIN faculty f ON a.created_by = f.id
       WHERE a.id = $1`,
      [id]
    );

    if (assignRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const assignment = assignRes.rows[0];

    // Get all student submissions for this assignment
    const subsRes = await db.query(
      `SELECT asub.*, 
              COALESCE(asub.submission_text, asub.submission_content) as submission_text,
              s.name as student_name, s.enrollment_no, s.email as student_email
       FROM assignment_submissions asub
       JOIN students s ON asub.student_id = s.id
       WHERE asub.assignment_id = $1
       ORDER BY asub.submitted_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...assignment,
        submissions: subsRes.rows
      }
    });
  } catch (err) {
    console.error('Error fetching assignment by id:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments
exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      subject_id,
      department_id,
      semester = 1,
      description,
      due_date,
      max_marks = 50
    } = req.body;
    const user = req.user;

    if (!title || !subject_id || !department_id || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, Subject, Department, and Due Date are required.'
      });
    }

    const facultyId = (user && !user.isAdmin && !user.isDean && user.id) ? user.id : null;

    const insertRes = await db.query(
      `INSERT INTO assignments (
         title, subject_id, department_id, semester, description, due_date, max_marks, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6::DATE, $7, $8)
       RETURNING *`,
      [
        title.trim(),
        parseInt(subject_id, 10),
        parseInt(department_id, 10),
        parseInt(semester, 10),
        description || null,
        due_date,
        parseInt(max_marks, 10),
        facultyId
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Assignment '${title}' created successfully.`,
      data: insertRes.rows[0]
    });
  } catch (err) {
    console.error('Error creating assignment:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/assignments/:id
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject_id, department_id, semester, description, due_date, max_marks } = req.body;

    const existing = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const cur = existing.rows[0];
    const updateRes = await db.query(
      `UPDATE assignments SET
         title = $1,
         subject_id = $2,
         department_id = $3,
         semester = $4,
         description = $5,
         due_date = $6::DATE,
         max_marks = $7
       WHERE id = $8
       RETURNING *`,
      [
        title ? title.trim() : cur.title,
        subject_id ? parseInt(subject_id, 10) : cur.subject_id,
        department_id ? parseInt(department_id, 10) : cur.department_id,
        semester ? parseInt(semester, 10) : cur.semester,
        description !== undefined ? description : cur.description,
        due_date || cur.due_date,
        max_marks ? parseInt(max_marks, 10) : cur.max_marks,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully.',
      data: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Error updating assignment:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT title FROM assignments WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    await db.query('DELETE FROM assignments WHERE id = $1', [id]);
    return res.status(200).json({
      success: true,
      message: `Assignment '${check.rows[0].title}' removed.`
    });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments/:id/submit
// Student submits work
exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { submission_content, submission_text, submission_file_url } = req.body;
    const user = req.user;

    if (!user || !user.isStudent) {
      return res.status(403).json({ success: false, message: 'Only students can submit assignments.' });
    }

    const textPart = (submission_text !== undefined && submission_text !== null)
      ? String(submission_text)
      : (submission_content ? String(submission_content) : '');
    const fileUrlPart = (submission_file_url !== undefined && submission_file_url !== null)
      ? String(submission_file_url).trim()
      : null;

    let combinedContent = (submission_content && String(submission_content).trim()) || '';
    if (!combinedContent) {
      const parts = [];
      if (textPart.trim()) parts.push(textPart.trim());
      if (fileUrlPart) parts.push(`Project/Attachment Link: ${fileUrlPart}`);
      combinedContent = parts.join('\n\n');
    }

    if (!combinedContent.trim() && !textPart.trim() && !fileUrlPart) {
      return res.status(400).json({ success: false, message: 'Submission content/link is required.' });
    }

    await db.query(
      `INSERT INTO assignment_submissions (
         assignment_id, student_id, submission_content, submission_text, submission_file_url, status, submitted_at
       )
       VALUES ($1, $2, $3, $4, $5, 'Submitted', CURRENT_TIMESTAMP)
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET submission_content = EXCLUDED.submission_content,
                     submission_text = EXCLUDED.submission_text,
                     submission_file_url = EXCLUDED.submission_file_url,
                     submitted_at = CURRENT_TIMESTAMP,
                     status = 'Submitted'`,
      [
        parseInt(id, 10),
        user.id,
        combinedContent.trim(),
        textPart.trim() || null,
        fileUrlPart || null
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully!'
    });
  } catch (err) {
    console.error('Error submitting assignment:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments/submissions/:submissionId/grade
// Faculty grades a student submission
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks_obtained, feedback } = req.body;

    if (marks_obtained === undefined || marks_obtained === null) {
      return res.status(400).json({ success: false, message: 'Marks obtained is required.' });
    }

    const updateRes = await db.query(
      `UPDATE assignment_submissions SET
         marks_obtained = $1,
         feedback = $2,
         status = 'Graded'
       WHERE id = $3
       RETURNING *`,
      [parseFloat(marks_obtained), feedback || null, parseInt(submissionId, 10)]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Submission record not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Submission graded successfully.',
      data: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Error grading submission:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
