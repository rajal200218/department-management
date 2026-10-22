const db = require('../db/database');

// GET /api/timetables
// Supports department_id, semester, program_id, day_of_week, faculty_id
exports.getTimetables = async (req, res) => {
  try {
    const { department_id, semester, program_id, day_of_week, faculty_id } = req.query;
    const user = req.user;

    let queryText = `
      SELECT t.*, 
             d.department_name, d.department_code,
             sub.subject_name, sub.subject_code, sub.type as subject_type,
             f.name as faculty_name, f.designation as faculty_designation,
             p.program_name, p.program_code
      FROM timetables t
      JOIN departments d ON t.department_id = d.id
      JOIN subjects sub ON t.subject_id = sub.id
      LEFT JOIN faculty f ON t.faculty_id = f.id
      LEFT JOIN programs p ON t.program_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // RBAC: If Student, scope to their department & target semester
    if (user && user.isStudent) {
      if (user.department_id) {
        params.push(user.department_id);
        queryText += ` AND t.department_id = $${params.length}`;
      }
      const targetSem = semester ? parseInt(semester, 10) : user.current_semester;
      if (targetSem) {
        params.push(targetSem);
        queryText += ` AND t.semester = $${params.length}`;
      }
    } else {
      if (user && !user.isAdmin && !user.isDean && user.department_id) {
        // HOD or Faculty: default to their department
        params.push(user.department_id);
        queryText += ` AND t.department_id = $${params.length}`;
      } else if (department_id) {
        params.push(parseInt(department_id, 10));
        queryText += ` AND t.department_id = $${params.length}`;
      }

      if (semester) {
        params.push(parseInt(semester, 10));
        queryText += ` AND t.semester = $${params.length}`;
      }
    }

    if (program_id) {
      params.push(parseInt(program_id, 10));
      queryText += ` AND t.program_id = $${params.length}`;
    }

    if (day_of_week) {
      params.push(day_of_week);
      queryText += ` AND t.day_of_week = $${params.length}`;
    }

    if (faculty_id) {
      params.push(parseInt(faculty_id, 10));
      queryText += ` AND t.faculty_id = $${params.length}`;
    }

    queryText += `
      ORDER BY 
        CASE t.day_of_week 
          WHEN 'Monday' THEN 1 
          WHEN 'Tuesday' THEN 2 
          WHEN 'Wednesday' THEN 3 
          WHEN 'Thursday' THEN 4 
          WHEN 'Friday' THEN 5 
          WHEN 'Saturday' THEN 6 
          ELSE 7 
        END,
        t.time_slot ASC
    `;

    const result = await db.query(queryText, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching timetable:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/timetables
// Add class slot with conflict check
exports.createTimetable = async (req, res) => {
  try {
    const {
      department_id,
      program_id,
      semester,
      day_of_week,
      time_slot,
      subject_id,
      faculty_id,
      classroom
    } = req.body;

    if (!department_id || !semester || !day_of_week || !time_slot || !subject_id || !classroom) {
      return res.status(400).json({
        success: false,
        message: 'Department, Semester, Day, Time slot, Subject, and Classroom are required.'
      });
    }

    // 1. Conflict Check: Classroom already booked for this day and time slot?
    const roomConflict = await db.query(
      `SELECT t.*, sub.subject_name 
       FROM timetables t
       JOIN subjects sub ON t.subject_id = sub.id
       WHERE LOWER(t.classroom) = $1 AND t.day_of_week = $2 AND t.time_slot = $3`,
      [classroom.trim().toLowerCase(), day_of_week, time_slot]
    );
    if (roomConflict.rows.length > 0) {
      const conf = roomConflict.rows[0];
      return res.status(409).json({
        success: false,
        message: `Classroom Conflict: ${classroom} is already occupied on ${day_of_week} at ${time_slot} by '${conf.subject_name}'.`
      });
    }

    // 2. Conflict Check: Faculty member already teaching another subject at this day and time slot?
    if (faculty_id) {
      const facultyConflict = await db.query(
        `SELECT t.*, sub.subject_name, f.name as faculty_name
         FROM timetables t
         JOIN subjects sub ON t.subject_id = sub.id
         JOIN faculty f ON t.faculty_id = f.id
         WHERE t.faculty_id = $1 AND t.day_of_week = $2 AND t.time_slot = $3`,
        [parseInt(faculty_id, 10), day_of_week, time_slot]
      );
      if (facultyConflict.rows.length > 0) {
        const conf = facultyConflict.rows[0];
        return res.status(409).json({
          success: false,
          message: `Faculty Conflict: Professor ${conf.faculty_name} is already assigned to '${conf.subject_name}' in ${conf.classroom} on ${day_of_week} at ${time_slot}.`
        });
      }
    }

    // 3. Conflict Check: Same batch/semester already has a lecture at this time slot?
    const batchConflict = await db.query(
      `SELECT t.*, sub.subject_name
       FROM timetables t
       JOIN subjects sub ON t.subject_id = sub.id
       WHERE t.department_id = $1 AND t.semester = $2 AND t.day_of_week = $3 AND t.time_slot = $4`,
      [parseInt(department_id, 10), parseInt(semester, 10), day_of_week, time_slot]
    );
    if (batchConflict.rows.length > 0) {
      const conf = batchConflict.rows[0];
      return res.status(409).json({
        success: false,
        message: `Schedule Conflict: Semester ${semester} already has lecture '${conf.subject_name}' scheduled on ${day_of_week} at ${time_slot}.`
      });
    }

    const insertRes = await db.query(
      `INSERT INTO timetables (
         department_id, program_id, semester, day_of_week, time_slot, subject_id, faculty_id, classroom
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        parseInt(department_id, 10),
        program_id ? parseInt(program_id, 10) : null,
        parseInt(semester, 10),
        day_of_week,
        time_slot,
        parseInt(subject_id, 10),
        faculty_id ? parseInt(faculty_id, 10) : null,
        classroom.trim()
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Timetable slot scheduled successfully: ${day_of_week} ${time_slot} in ${classroom}.`,
      data: insertRes.rows[0]
    });
  } catch (err) {
    console.error('Error creating timetable slot:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/timetables/:id
exports.updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      department_id,
      program_id,
      semester,
      day_of_week,
      time_slot,
      subject_id,
      faculty_id,
      classroom
    } = req.body;

    const existing = await db.query('SELECT * FROM timetables WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
    }

    const cur = existing.rows[0];
    const targetRoom = classroom ? classroom.trim() : cur.classroom;
    const targetDay = day_of_week || cur.day_of_week;
    const targetSlot = time_slot || cur.time_slot;
    const targetFac = faculty_id !== undefined ? (faculty_id ? parseInt(faculty_id, 10) : null) : cur.faculty_id;
    const targetDept = department_id ? parseInt(department_id, 10) : cur.department_id;
    const targetSem = semester ? parseInt(semester, 10) : cur.semester;

    // Room conflict check
    const roomConf = await db.query(
      `SELECT t.*, sub.subject_name 
       FROM timetables t
       JOIN subjects sub ON t.subject_id = sub.id
       WHERE LOWER(t.classroom) = $1 AND t.day_of_week = $2 AND t.time_slot = $3 AND t.id != $4`,
      [targetRoom.toLowerCase(), targetDay, targetSlot, id]
    );
    if (roomConf.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Classroom Conflict: ${targetRoom} is already booked on ${targetDay} at ${targetSlot}.`
      });
    }

    // Faculty conflict check
    if (targetFac) {
      const facConf = await db.query(
        `SELECT t.*, sub.subject_name, f.name as faculty_name
         FROM timetables t
         JOIN subjects sub ON t.subject_id = sub.id
         JOIN faculty f ON t.faculty_id = f.id
         WHERE t.faculty_id = $1 AND t.day_of_week = $2 AND t.time_slot = $3 AND t.id != $4`,
        [targetFac, targetDay, targetSlot, id]
      );
      if (facConf.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Faculty Conflict: Professor ${facConf.rows[0].faculty_name} is already busy on ${targetDay} at ${targetSlot}.`
        });
      }
    }

    const updateRes = await db.query(
      `UPDATE timetables SET
         department_id = $1,
         program_id = $2,
         semester = $3,
         day_of_week = $4,
         time_slot = $5,
         subject_id = $6,
         faculty_id = $7,
         classroom = $8
       WHERE id = $9
       RETURNING *`,
      [
        targetDept,
        program_id !== undefined ? (program_id ? parseInt(program_id, 10) : null) : cur.program_id,
        targetSem,
        targetDay,
        targetSlot,
        subject_id ? parseInt(subject_id, 10) : cur.subject_id,
        targetFac,
        targetRoom,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Timetable entry updated successfully.',
      data: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Error updating timetable:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/timetables/:id
exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM timetables WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
    }

    await db.query('DELETE FROM timetables WHERE id = $1', [id]);
    return res.status(200).json({
      success: true,
      message: 'Timetable slot removed successfully.'
    });
  } catch (err) {
    console.error('Error deleting timetable:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
