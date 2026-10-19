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

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const { session } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const sessionRange = parseSessionRange(session);

    // 1. If Student, return specialized Student Dashboard metrics
    if (user.isStudent) {
      const studentRes = await db.query(
        `SELECT s.*, d.department_name, d.department_code, p.program_name, p.program_code
         FROM students s
         LEFT JOIN departments d ON s.department_id = d.id
         LEFT JOIN programs p ON s.program_id = p.id
         WHERE s.id = $1`,
        [user.id]
      );
      const student = studentRes.rows[0] || {};

      // My subjects
      const subjectsRes = await db.query(
        `SELECT s.*, f.name as faculty_name 
         FROM subjects s 
         LEFT JOIN faculty f ON s.faculty_id = f.id
         WHERE s.department_id = $1 AND s.semester = $2
         ORDER BY s.subject_code ASC`,
        [student.department_id, student.current_semester]
      );

      // Attendance
      const attRes = await db.query(
        `SELECT 
           COUNT(*) as total_classes,
           COUNT(CASE WHEN status = 'Present' OR status = 'Late' THEN 1 END) as attended,
           ROUND((COUNT(CASE WHEN status = 'Present' OR status = 'Late' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100), 1) as percentage
         FROM attendance WHERE student_id = $1`,
        [user.id]
      );

      // Upcoming exams
      const examsRes = await db.query(
        `SELECT e.*, sub.subject_name, sub.subject_code
         FROM exams e
         JOIN subjects sub ON e.subject_id = sub.id
         WHERE sub.department_id = $1 AND sub.semester = $2 AND e.exam_date >= CURRENT_DATE
         ORDER BY e.exam_date ASC LIMIT 5`,
        [student.department_id, student.current_semester]
      );

      // Recent notices
      const noticesRes = await db.query(
        `SELECT * FROM notices 
         WHERE (department_id IS NULL OR department_id = $1)
           AND (target_role = 'All' OR target_role = 'Student')
         ORDER BY publish_date DESC, created_at DESC LIMIT 5`,
        [student.department_id]
      );

      // Pending assignments
      const assignRes = await db.query(
        `SELECT a.*, sub.subject_name, sub.subject_code,
                asub.status as submission_status, asub.marks_obtained
         FROM assignments a
         JOIN subjects sub ON a.subject_id = sub.id
         LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = $1
         WHERE a.department_id = $2 AND a.semester = $3
         ORDER BY a.due_date ASC LIMIT 5`,
        [user.id, student.department_id, student.current_semester]
      );

      const attPct = attRes.rows[0]?.percentage ? parseFloat(attRes.rows[0].percentage) : 100;

      return res.status(200).json({
        success: true,
        data: {
          isStudent: true,
          student,
          summary: {
            totalEnrolledSubjects: subjectsRes.rows.length,
            totalClasses: parseInt(attRes.rows[0]?.total_classes || 0, 10),
            attendedClasses: parseInt(attRes.rows[0]?.attended || 0, 10),
            attendancePercentage: attPct,
            isLowAttendance: attPct < 75,
            upcomingExamsCount: examsRes.rows.length,
            pendingAssignmentsCount: assignRes.rows.filter(a => !a.submission_status).length
          },
          subjects: subjectsRes.rows,
          upcomingExams: examsRes.rows,
          recentNotices: noticesRes.rows,
          assignments: assignRes.rows
        }
      });
    }

    // 2. Admin / Dean / HOD / Faculty metrics
    const departmentsResult = await db.query(`SELECT * FROM departments`);
    const facultyResult = await db.query(
      sessionRange
        ? `SELECT * FROM faculty WHERE joining_date IS NULL OR joining_date <= $1::DATE`
        : `SELECT * FROM faculty`,
      sessionRange ? [sessionRange.endDate] : []
    );
    const schoolsResult = await db.query(`SELECT * FROM schools`);
    const programsResult = await db.query(`SELECT * FROM programs`);
    const studentsResult = await db.query(`SELECT * FROM students`);
    const subjectsResult = await db.query(`SELECT * FROM subjects`);

    let departments = departmentsResult.rows;
    let faculty = facultyResult.rows;
    let schools = schoolsResult.rows;
    let programs = programsResult.rows;
    let students = studentsResult.rows;
    let subjects = subjectsResult.rows;

    // RBAC: If HOD or Faculty member, scope metrics to their department
    if (!user.isAdmin && !user.isDean && user.department_id) {
      departments = departments.filter(d => d.id === user.department_id);
      faculty = faculty.filter(f => f.department_id === user.department_id);
      programs = programs.filter(p => p.department_id === user.department_id);
      students = students.filter(s => s.department_id === user.department_id);
      subjects = subjects.filter(sub => sub.department_id === user.department_id);
      const userDept = departments[0];
      if (userDept) {
        schools = schools.filter(s => s.id === userDept.school_id);
      }
    }

    const totalDepartments = departments.length;
    const totalFaculty = faculty.length;
    const totalSchools = schools.length;
    const totalPrograms = programs.length;
    const totalStudents = students.length;
    const totalSubjects = subjects.length;

    const departmentsWithHOD = departments.filter(d => d.hod_id !== null && d.hod_id !== undefined).length;
    const departmentsWithoutHOD = departments.filter(d => d.hod_id === null || d.hod_id === undefined).length;
    const activeDepartments = departments.filter(d => d.status === 'Active').length;
    const inactiveDepartments = departments.filter(d => d.status === 'Inactive' || d.status === 'Upcoming').length;

    // Department-wise stats (students, faculty, subjects, programs)
    const departmentStats = departments.map(d => {
      const deptsFaculty = faculty.filter(f => f.department_id === d.id);
      const deptsStudents = students.filter(s => s.department_id === d.id);
      const deptsSubjects = subjects.filter(sub => sub.department_id === d.id);
      const deptsPrograms = programs.filter(p => p.department_id === d.id);

      return {
        id: d.id,
        department_name: d.department_name,
        department_code: d.department_code,
        building: d.building,
        room_no: d.room_no,
        status: d.status,
        faculty_count: deptsFaculty.length,
        student_count: deptsStudents.length,
        subject_count: deptsSubjects.length,
        program_count: deptsPrograms.length
      };
    });

    // Attendance Overview & Defaulters
    let attQuery = `
      SELECT 
        COUNT(*) as total_attendance_records,
        COUNT(CASE WHEN status = 'Present' OR status = 'Late' THEN 1 END) as attended_records,
        ROUND(
          (COUNT(CASE WHEN status = 'Present' OR status = 'Late' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100), 1
        ) as overall_attendance_pct
      FROM attendance
    `;
    const attOverviewRes = await db.query(attQuery);
    const overallAttPct = attOverviewRes.rows[0]?.overall_attendance_pct 
      ? parseFloat(attOverviewRes.rows[0].overall_attendance_pct) 
      : 84.5;

    // Defaulters (< 75% attendance) count
    const defaultersRes = await db.query(`
      SELECT COUNT(*) as defaulters_count FROM (
        SELECT student_id,
               (COUNT(CASE WHEN status = 'Present' OR status = 'Late' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100) as pct
        FROM attendance
        GROUP BY student_id
        HAVING (COUNT(CASE WHEN status = 'Present' OR status = 'Late' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100) < 75
      ) defs
    `);
    const defaultersCount = parseInt(defaultersRes.rows[0]?.defaulters_count || 0, 10);

    // Recent Notices
    const noticesRes = await db.query(`
      SELECT * FROM notices 
      ORDER BY 
        CASE priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 ELSE 3 END,
        publish_date DESC 
      LIMIT 4
    `);

    // Upcoming Examinations
    const upcomingExamsRes = await db.query(`
      SELECT e.*, sub.subject_name, sub.subject_code, d.department_name
      FROM exams e
      JOIN subjects sub ON e.subject_id = sub.id
      JOIN departments d ON sub.department_id = d.id
      ORDER BY e.exam_date ASC
      LIMIT 4
    `);

    return res.status(200).json({
      success: true,
      data: {
        session: session || '2026–2027',
        isStudent: false,
        summary: {
          totalStudents,
          totalFaculty,
          totalSubjects,
          totalPrograms,
          totalDepartments,
          totalSchools,
          overallAttendancePct: overallAttPct,
          defaultersCount,
          departmentsWithHOD,
          departmentsWithoutHOD,
          activeDepartments,
          inactiveDepartments,
          isScoped: !user.isAdmin && !user.isDean,
          department_name: user.department_name || (departments[0]?.department_name),
          department_code: user.department_code || (departments[0]?.department_code)
        },
        departmentStats,
        recentNotices: noticesRes.rows,
        upcomingExams: upcomingExamsRes.rows,
        dbMode: db.getDbMode()
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/logs (Recent SQL queries - Admin only)
exports.getQueryLogs = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
  }
  if (!user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Live SQL log inspection is restricted to System Administrators.'
    });
  }

  return res.status(200).json({
    success: true,
    dbMode: db.getDbMode(),
    logs: db.getQueryLogs()
  });
};
