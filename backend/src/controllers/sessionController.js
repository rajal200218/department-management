const db = require('../db/database');

// GET /api/sessions
exports.getAllSessions = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const result = await db.query(
      `SELECT * FROM academic_sessions ORDER BY start_date DESC, id DESC`
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching academic sessions:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/sessions (Admin/Dean only)
exports.createSession = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    if (!user.isAdmin && !user.isDean) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only Administrators or Deans can create academic sessions.'
      });
    }

    const { session_name, term, start_date, end_date, status, is_current } = req.body;

    if (!session_name) {
      return res.status(400).json({ success: false, message: 'Session name is required' });
    }

    // If marked current, set all other sessions is_current = FALSE
    if (is_current) {
      await db.query(`UPDATE academic_sessions SET is_current = FALSE`);
    }

    const result = await db.query(
      `INSERT INTO academic_sessions (session_name, term, start_date, end_date, status, is_current)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        session_name.trim(),
        term || 'Fall & Spring (Full Year)',
        start_date || null,
        end_date || null,
        status || 'Upcoming',
        Boolean(is_current)
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Academic session created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'An academic session with this name already exists.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/sessions/:id/set-active (Admin/Dean only)
exports.setActiveSession = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    if (!user.isAdmin && !user.isDean) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only Administrators or Deans can switch active university session.'
      });
    }

    const { id } = req.params;

    // Reset all sessions to not current
    await db.query(`UPDATE academic_sessions SET is_current = FALSE`);

    // Set selected session to active and is_current = TRUE
    const result = await db.query(
      `UPDATE academic_sessions SET is_current = TRUE, status = 'Active' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Academic session not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Academic Session '${result.rows[0].session_name}' is now active.`,
      data: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
