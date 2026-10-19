const db = require('../db/database');

// GET /api/attendance
// Filter by subject_id, date, student_id, department_id, semester
exports.getAttendance = async (req, res) => {
  try {
    const { subject_id, date, student_id, department_id, semester } = req.query;
    const user = req.user;

    let queryText = `
      SELECT a.*, 
             s.name as student_name, s.enrollment_no, s.current_semester,
             sub.subject_name, sub.subject_code,
             f.name as marked_by_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      LEFT JOIN faculty f ON a.marked_by = f.id
      WHERE 1=1
    `;
    const params = [];

    // RBAC: If Student, scope to their own records
    if (user && user.isStudent) {
      params.push(user.id);
      queryText += ` AND a.student_id = $${params.length}`;
    } else if (student_id) {
      params.push(parseInt(student_id, 10));
      queryText += ` AND a.student_id = $${params.length}`;
    }

    // If HOD or Faculty member, scope to their department (unless Admin/Dean)
    if (user && !user.isAdmin && !user.isDean && !user.isStudent && user.department_id) {
      params.push(user.department_id);
      queryText += ` AND s.department_id = $${params.length}`;
    } else if (department_id) {
      params.push(parseInt(department_id, 10));
      queryText += ` AND s.department_id = $${params.length}`;
    }

    if (subject_id) {
      params.push(parseInt(subject_id, 10));
      queryText += ` AND a.subject_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      queryText += ` AND a.date = $${params.length}::DATE`;
    }

    if (semester) {
      params.push(parseInt(semester, 10));
      queryText += ` AND s.current_semester = $${params.length}`;
    }

    queryText += ` ORDER BY a.date DESC, s.enrollment_no ASC`;

    const result = await db.query(queryText, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching attendance records:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/mark
// Batch mark attendance for an entire class/subject session
// Body: { subject_id, date, records: [{ student_id, status, remarks }] }
exports.markAttendance = async (req, res) => {
  try {
    const { subject_id, date, records } = req.body;
    const user = req.user;

    if (!subject_id || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'subject_id, date, and an array of student attendance records are required.'
      });
    }

    const markedByFacultyId = (user && !user.isAdmin && !user.isDean && user.id) ? user.id : null;

    let savedCount = 0;
    for (const rec of records) {
      if (!rec.student_id || !rec.status) continue;

      await db.query(
        `INSERT INTO attendance (student_id, subject_id, date, status, marked_by, remarks)
         VALUES ($1, $2, $3::DATE, $4, $5, $6)
         ON CONFLICT (student_id, subject_id, date) 
         DO UPDATE SET status = EXCLUDED.status, 
                       marked_by = EXCLUDED.marked_by, 
                       remarks = EXCLUDED.remarks`,
        [
          rec.student_id,
          parseInt(subject_id, 10),
          date,
          rec.status,
          markedByFacultyId,
          rec.remarks || null
        ]
      );
      savedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Successfully saved attendance for ${savedCount} student(s) on ${date}.`
    });
  } catch (err) {
    console.error('Error marking attendance:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/report
// Calculates aggregate attendance percentages per student, highlights students below threshold (e.g. 75%)
exports.getAttendanceReport = async (req, res) => {
  try {
    const { department_id, semester, subject_id, threshold = 75 } = req.query;
    const user = req.user;

    let queryText = `
      SELECT 
        s.id as student_id,
        s.enrollment_no,
        s.name as student_name,
        s.email as student_email,
        s.current_semester,
        d.department_name,
        d.department_code,
        COUNT(a.id) as total_lectures,
        COUNT(CASE WHEN a.status = 'Present' OR a.status = 'Late' THEN 1 END) as attended_lectures,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_lectures,
        COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as late_lectures,
        CASE 
          WHEN COUNT(a.id) = 0 THEN 100.0
          ELSE ROUND((COUNT(CASE WHEN a.status = 'Present' OR a.status = 'Late' THEN 1 END)::numeric / COUNT(a.id) * 100), 1)
        END as attendance_percentage
      FROM students s
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN attendance a ON s.id = a.student_id
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      WHERE s.status = 'Active'
    `;
    const params = [];

    // RBAC: If HOD or Faculty member, scope to department
    if (user && !user.isAdmin && !user.isDean && !user.isStudent && user.department_id) {
      params.push(user.department_id);
      queryText += ` AND s.department_id = $${params.length}`;
    } else if (department_id) {
      params.push(parseInt(department_id, 10));
      queryText += ` AND s.department_id = $${params.length}`;
    }

    if (semester) {
      params.push(parseInt(semester, 10));
      queryText += ` AND s.current_semester = $${params.length}`;
    }

    if (subject_id) {
      params.push(parseInt(subject_id, 10));
      queryText += ` AND a.subject_id = $${params.length}`;
    }

    queryText += `
      GROUP BY s.id, s.enrollment_no, s.name, s.email, s.current_semester, d.department_name, d.department_code
      ORDER BY attendance_percentage ASC, s.enrollment_no ASC
    `;

    const result = await db.query(queryText, params);
    const parsedThreshold = parseFloat(threshold);

    const dataWithAlerts = result.rows.map(row => {
      const pct = parseFloat(row.attendance_percentage);
      return {
        ...row,
        total_lectures: parseInt(row.total_lectures, 10),
        attended_lectures: parseInt(row.attended_lectures, 10),
        absent_lectures: parseInt(row.absent_lectures, 10),
        late_lectures: parseInt(row.late_lectures, 10),
        attendance_percentage: pct,
        is_low_attendance: pct < parsedThreshold,
        status_alert: pct < parsedThreshold ? 'Defaulter (<75%)' : pct < 85 ? 'Warning (75-85%)' : 'Good (>=85%)'
      };
    });

    const totalStudents = dataWithAlerts.length;
    const defaultersCount = dataWithAlerts.filter(r => r.is_low_attendance).length;
    const averageAttendance = totalStudents > 0
      ? (dataWithAlerts.reduce((sum, r) => sum + r.attendance_percentage, 0) / totalStudents).toFixed(1)
      : 100;

    return res.status(200).json({
      success: true,
      summary: {
        totalStudents,
        defaultersCount,
        averageAttendance: parseFloat(averageAttendance),
        threshold: parsedThreshold
      },
      data: dataWithAlerts
    });
  } catch (err) {
    console.error('Error generating attendance report:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
