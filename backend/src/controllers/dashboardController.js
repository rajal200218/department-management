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

    const departmentsResult = await db.query(`SELECT * FROM departments`);
    const facultyResult = await db.query(
      sessionRange
        ? `SELECT * FROM faculty WHERE joining_date IS NULL OR joining_date <= $1::DATE`
        : `SELECT * FROM faculty`,
      sessionRange ? [sessionRange.endDate] : []
    );
    const schoolsResult = await db.query(`SELECT * FROM schools`);
    const programsResult = await db.query(`SELECT * FROM programs`);

    let departments = departmentsResult.rows;
    let faculty = facultyResult.rows;
    let schools = schoolsResult.rows;
    let programs = programsResult.rows;

    // Adjust department status according to session establishment
    if (sessionRange) {
      departments = departments.map(d => ({
        ...d,
        status: d.established_year > sessionRange.endYear ? 'Upcoming' : d.status
      }));
    }

    // RBAC: If HOD or Faculty member, scope metrics to their department
    if (!user.isAdmin && !user.isDean && user.department_id) {
      departments = departments.filter(d => d.id === user.department_id);
      faculty = faculty.filter(f => f.department_id === user.department_id);
      programs = programs.filter(p => p.department_id === user.department_id);
      const userDept = departments[0];
      if (userDept) {
        schools = schools.filter(s => s.id === userDept.school_id);
      }
    }

    const totalDepartments = departments.length;
    const totalFaculty = faculty.length;
    const totalSchools = schools.length;
    const totalPrograms = programs.length;

    const departmentsWithHOD = departments.filter(d => d.hod_id !== null && d.hod_id !== undefined).length;
    const departmentsWithoutHOD = departments.filter(d => d.hod_id === null || d.hod_id === undefined).length;
    const activeDepartments = departments.filter(d => d.status === 'Active').length;
    const inactiveDepartments = departments.filter(d => d.status === 'Inactive' || d.status === 'Upcoming').length;

    // School-wise department distribution
    const schoolDistribution = schools.map(school => {
      const depts = departments.filter(d => d.school_id === school.id);
      const facultyInSchool = faculty.filter(f => depts.some(d => d.id === f.department_id));
      return {
        school_id: school.id,
        school_name: school.school_name,
        school_code: school.school_code,
        department_count: depts.length,
        faculty_count: facultyInSchool.length
      };
    });

    // Recent activity / latest departments
    const recentDepartments = [...departments]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        session: session || '2026–2027',
        summary: {
          totalDepartments,
          totalFaculty,
          totalSchools,
          totalPrograms,
          departmentsWithHOD,
          departmentsWithoutHOD,
          activeDepartments,
          inactiveDepartments,
          isScoped: !user.isAdmin && !user.isDean,
          department_name: user.department_name || (departments[0]?.department_name),
          department_code: user.department_code || (departments[0]?.department_code)
        },
        schoolDistribution,
        recentDepartments,
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
