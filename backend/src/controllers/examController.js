const db = require('../db/database');

// Helper to calculate grade from percentage
function calculateGrade(marks, maxMarks) {
  if (!maxMarks || maxMarks <= 0) return 'N/A';
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
}

// GET /api/exams
exports.getExams = async (req, res) => {
  try {
    const { department_id, semester, subject_id, status } = req.query;
    const user = req.user;

    let queryText = `
      SELECT e.*, 
             sub.subject_name, sub.subject_code, sub.semester, sub.department_id,
             d.department_name, d.department_code,
             COUNT(er.id) as students_graded_count
      FROM exams e
      JOIN subjects sub ON e.subject_id = sub.id
      JOIN departments d ON sub.department_id = d.id
      LEFT JOIN exam_results er ON e.id = er.exam_id
      WHERE 1=1
    `;
    const params = [];

    // RBAC: If Student, scope to their department & target semester
    if (user && user.isStudent) {
      if (user.department_id) {
        params.push(user.department_id);
        queryText += ` AND sub.department_id = $${params.length}`;
      }
      const targetSem = semester ? parseInt(semester, 10) : user.current_semester;
      if (targetSem) {
        params.push(targetSem);
        queryText += ` AND sub.semester = $${params.length}`;
      }
    } else {
      if (user && !user.isAdmin && !user.isDean && user.department_id) {
        params.push(user.department_id);
        queryText += ` AND sub.department_id = $${params.length}`;
      } else if (department_id) {
        params.push(parseInt(department_id, 10));
        queryText += ` AND sub.department_id = $${params.length}`;
      }

      if (semester) {
        params.push(parseInt(semester, 10));
        queryText += ` AND sub.semester = $${params.length}`;
      }
    }

    if (subject_id) {
      params.push(parseInt(subject_id, 10));
      queryText += ` AND e.subject_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryText += ` AND e.status = $${params.length}`;
    }

    queryText += `
      GROUP BY e.id, sub.subject_name, sub.subject_code, sub.semester, sub.department_id, d.department_name, d.department_code
      ORDER BY e.exam_date DESC, e.created_at DESC
    `;

    const result = await db.query(queryText, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching exams:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exams/:id
// Returns exam details + roster of students in the course with entered marks
exports.getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const examRes = await db.query(
      `SELECT e.*, 
              sub.subject_name, sub.subject_code, sub.semester, sub.department_id,
              d.department_name, d.department_code
       FROM exams e
       JOIN subjects sub ON e.subject_id = sub.id
       JOIN departments d ON sub.department_id = d.id
       WHERE e.id = $1`,
      [id]
    );

    if (examRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    }

    const exam = examRes.rows[0];

    // Get all students enrolled in this department & semester along with their results if available
    const studentsRes = await db.query(
      `SELECT s.id as student_id, s.enrollment_no, s.name as student_name, s.email,
              er.id as result_id, er.marks_obtained, er.grade, er.remarks
       FROM students s
       LEFT JOIN exam_results er ON s.id = er.student_id AND er.exam_id = $1
       WHERE s.department_id = $2 AND s.current_semester = $3 AND s.status = 'Active'
       ORDER BY s.enrollment_no ASC`,
      [id, exam.department_id, exam.semester]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...exam,
        students: studentsRes.rows
      }
    });
  } catch (err) {
    console.error('Error fetching exam by id:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/exams
exports.createExam = async (req, res) => {
  try {
    const {
      exam_name,
      subject_id,
      exam_date,
      time_slot,
      classroom,
      max_marks = 100,
      passing_marks = 40,
      status = 'Scheduled'
    } = req.body;

    if (!exam_name || !subject_id || !exam_date || !time_slot) {
      return res.status(400).json({
        success: false,
        message: 'Exam name, subject, date, and time slot are required.'
      });
    }

    const insertRes = await db.query(
      `INSERT INTO exams (
         exam_name, subject_id, exam_date, time_slot, classroom, max_marks, passing_marks, status
       ) VALUES ($1, $2, $3::DATE, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        exam_name.trim(),
        parseInt(subject_id, 10),
        exam_date,
        time_slot,
        classroom || null,
        parseInt(max_marks, 10),
        parseInt(passing_marks, 10),
        status
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Exam '${exam_name}' scheduled successfully.`,
      data: insertRes.rows[0]
    });
  } catch (err) {
    console.error('Error creating exam:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exam_name,
      subject_id,
      exam_date,
      time_slot,
      classroom,
      max_marks,
      passing_marks,
      status
    } = req.body;

    const existing = await db.query('SELECT * FROM exams WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    }

    const cur = existing.rows[0];
    const updateRes = await db.query(
      `UPDATE exams SET
         exam_name = $1,
         subject_id = $2,
         exam_date = $3::DATE,
         time_slot = $4,
         classroom = $5,
         max_marks = $6,
         passing_marks = $7,
         status = $8
       WHERE id = $9
       RETURNING *`,
      [
        exam_name ? exam_name.trim() : cur.exam_name,
        subject_id ? parseInt(subject_id, 10) : cur.subject_id,
        exam_date || cur.exam_date,
        time_slot || cur.time_slot,
        classroom !== undefined ? classroom : cur.classroom,
        max_marks ? parseInt(max_marks, 10) : cur.max_marks,
        passing_marks ? parseInt(passing_marks, 10) : cur.passing_marks,
        status || cur.status,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Exam schedule updated successfully.',
      data: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Error updating exam:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT exam_name FROM exams WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    await db.query('DELETE FROM exams WHERE id = $1', [id]);
    return res.status(200).json({
      success: true,
      message: `Exam '${check.rows[0].exam_name}' and its results removed successfully.`
    });
  } catch (err) {
    console.error('Error deleting exam:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/exams/:id/results
// Batch save or update marks for an exam
// Body: { results: [{ student_id, marks_obtained, remarks }] }
exports.saveResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { results } = req.body;

    const examCheck = await db.query('SELECT max_marks, passing_marks FROM exams WHERE id = $1', [id]);
    if (examCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    const { max_marks } = examCheck.rows[0];

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ success: false, message: 'An array of student marks is required.' });
    }

    let savedCount = 0;
    for (const item of results) {
      if (!item.student_id || item.marks_obtained === undefined || item.marks_obtained === null) continue;

      const marks = parseFloat(item.marks_obtained);
      const grade = calculateGrade(marks, max_marks);

      await db.query(
        `INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade, remarks)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (exam_id, student_id)
         DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained,
                       grade = EXCLUDED.grade,
                       remarks = EXCLUDED.remarks`,
        [parseInt(id, 10), parseInt(item.student_id, 10), marks, grade, item.remarks || null]
      );
      savedCount++;
    }

    // Mark exam as Completed if it was Scheduled
    await db.query(`UPDATE exams SET status = 'Completed' WHERE id = $1 AND status = 'Scheduled'`, [id]);

    return res.status(200).json({
      success: true,
      message: `Successfully recorded examination marks for ${savedCount} student(s).`
    });
  } catch (err) {
    console.error('Error saving exam marks:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exams/student/my-results
// Returns report card for logged-in student or selected student (Admin/Faculty)
exports.getMyResults = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let targetStudentId = null;

    if (user.isStudent) {
      targetStudentId = user.id;
    } else if (req.query.student_id) {
      targetStudentId = parseInt(req.query.student_id, 10);
    } else {
      // Default to first active student with exam results or first active student
      const studentWithResults = await db.query(
        `SELECT student_id FROM exam_results ORDER BY id DESC LIMIT 1`
      );
      if (studentWithResults.rows.length > 0) {
        targetStudentId = studentWithResults.rows[0].student_id;
      } else {
        const firstStudent = await db.query(
          `SELECT id FROM students WHERE status = 'Active' ORDER BY enrollment_no ASC LIMIT 1`
        );
        if (firstStudent.rows.length > 0) {
          targetStudentId = firstStudent.rows[0].id;
        }
      }
    }

    if (!targetStudentId) {
      return res.status(200).json({
        success: true,
        summary: { totalExamsTaken: 0, totalMarksEarned: 0, totalMarksPossible: 0, overallPercentage: 0 },
        data: {
          student: null,
          totalMarks: 0,
          totalMax: 0,
          percentage: 0,
          results: []
        }
      });
    }

    // Fetch student profile details
    const studentRes = await db.query(
      `SELECT s.id, s.name, s.enrollment_no, s.current_semester, s.email,
              d.department_name, d.department_code,
              p.program_name
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN programs p ON s.program_id = p.id
       WHERE s.id = $1`,
      [targetStudentId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = studentRes.rows[0];

    // Fetch student academic history (previous semesters SGPA, CGPA, Credits, Status)
    const historyRes = await db.query(
      `SELECT * FROM student_academic_history
       WHERE student_id = $1
       ORDER BY semester ASC`,
      [targetStudentId]
    );

    // Fetch exam results with course info, semester, and credits
    let resultsQuery = `
      SELECT er.*, e.exam_name, e.max_marks, e.passing_marks, e.exam_date,
             sub.subject_name, sub.subject_code, sub.credits, sub.semester as subject_semester
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      JOIN subjects sub ON e.subject_id = sub.id
      WHERE er.student_id = $1
    `;
    const resultsParams = [targetStudentId];

    if (req.query.semester) {
      resultsParams.push(parseInt(req.query.semester, 10));
      resultsQuery += ` AND sub.semester = $${resultsParams.length}`;
    }

    resultsQuery += ` ORDER BY sub.semester ASC, e.exam_date DESC, er.created_at DESC`;

    const resultsRes = await db.query(resultsQuery, resultsParams);

    const totalMarksPossible = resultsRes.rows.reduce((sum, r) => sum + parseFloat(r.max_marks || 0), 0);
    const totalMarksEarned = resultsRes.rows.reduce((sum, r) => sum + parseFloat(r.marks_obtained || 0), 0);
    const overallPercentage = totalMarksPossible > 0 ? ((totalMarksEarned / totalMarksPossible) * 100).toFixed(1) : 0;

    // Calculate current CGPA from history if available or aggregate
    let latestCgpa = null;
    if (historyRes.rows.length > 0) {
      latestCgpa = historyRes.rows[historyRes.rows.length - 1].cgpa;
    } else if (overallPercentage > 0) {
      latestCgpa = (parseFloat(overallPercentage) / 9.5).toFixed(2);
    }

    const totalCreditsEarned = historyRes.rows.reduce((acc, h) => acc + (parseInt(h.credits_earned, 10) || 0), 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalExamsTaken: resultsRes.rows.length,
        totalMarksEarned,
        totalMarksPossible,
        overallPercentage: parseFloat(overallPercentage),
        cgpa: latestCgpa ? parseFloat(latestCgpa) : null,
        totalCreditsEarned: totalCreditsEarned > 0 ? totalCreditsEarned : resultsRes.rows.reduce((sum, r) => sum + (parseInt(r.credits, 10) || 3), 0),
        semestersCompleted: historyRes.rows.length
      },
      data: {
        student,
        totalMarks: totalMarksEarned,
        totalMax: totalMarksPossible,
        percentage: parseFloat(overallPercentage),
        cgpa: latestCgpa ? parseFloat(latestCgpa) : null,
        academic_history: historyRes.rows,
        results: resultsRes.rows
      }
    });
  } catch (err) {
    console.error('Error fetching student report card:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exams/student/academic-history
// Returns chronological semester-by-semester academic history for a student
exports.getAcademicHistory = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let targetStudentId = null;

    if (user.isStudent) {
      targetStudentId = user.id;
    } else if (req.query.student_id) {
      targetStudentId = parseInt(req.query.student_id, 10);
    } else {
      const firstStudent = await db.query(
        `SELECT id FROM students WHERE status = 'Active' ORDER BY enrollment_no ASC LIMIT 1`
      );
      if (firstStudent.rows.length > 0) {
        targetStudentId = firstStudent.rows[0].id;
      }
    }

    if (!targetStudentId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const historyRes = await db.query(
      `SELECT * FROM student_academic_history
       WHERE student_id = $1
       ORDER BY semester ASC`,
      [targetStudentId]
    );

    return res.status(200).json({
      success: true,
      student_id: targetStudentId,
      data: historyRes.rows
    });
  } catch (err) {
    console.error('Error fetching academic history:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

