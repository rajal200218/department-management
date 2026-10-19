const db = require('../db/database');

// GET /api/notices
exports.getNotices = async (req, res) => {
  try {
    const { category, target_role, department_id, priority, search } = req.query;
    const user = req.user;

    let queryText = `
      SELECT n.*, 
             d.department_name, d.department_code
      FROM notices n
      LEFT JOIN departments d ON n.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // RBAC: If Student, show 'All' or 'Student' notices for their dept or campus-wide (dept IS NULL)
    if (user && user.isStudent) {
      if (user.department_id) {
        params.push(user.department_id);
        queryText += ` AND (n.department_id IS NULL OR n.department_id = $${params.length})`;
      } else {
        queryText += ` AND n.department_id IS NULL`;
      }
      queryText += ` AND (n.target_role = 'All' OR n.target_role = 'Student')`;
    } else if (user && !user.isAdmin && !user.isDean) {
      // Faculty / HOD: show All or Faculty notices
      if (user.department_id) {
        params.push(user.department_id);
        queryText += ` AND (n.department_id IS NULL OR n.department_id = $${params.length})`;
      }
    } else if (department_id) {
      params.push(parseInt(department_id, 10));
      queryText += ` AND (n.department_id = $${params.length} OR n.department_id IS NULL)`;
    }

    if (category) {
      params.push(category);
      queryText += ` AND n.category = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      queryText += ` AND n.priority = $${params.length}`;
    }

    if (target_role && (!user || user.isAdmin || user.isDean)) {
      params.push(target_role);
      queryText += ` AND n.target_role = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      queryText += ` AND (LOWER(n.title) LIKE $${params.length} OR LOWER(n.content) LIKE $${params.length})`;
    }

    queryText += `
      ORDER BY 
        CASE n.priority 
          WHEN 'Urgent' THEN 1 
          WHEN 'High' THEN 2 
          ELSE 3 
        END,
        n.publish_date DESC,
        n.created_at DESC
    `;

    const result = await db.query(queryText, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching notices:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/notices
exports.createNotice = async (req, res) => {
  try {
    const {
      title,
      category = 'General',
      target_role = 'All',
      department_id,
      content,
      publish_date,
      priority = 'Normal',
      posted_by
    } = req.body;
    const user = req.user;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Notice title and content are required.' });
    }

    const poster = posted_by || (user ? `${user.name} (${user.rawRole || user.role})` : 'Administrative Office');

    const insertRes = await db.query(
      `INSERT INTO notices (
         title, category, target_role, department_id, content, publish_date, priority, posted_by
       ) VALUES ($1, $2, $3, $4, $5, $6::DATE, $7, $8)
       RETURNING *`,
      [
        title.trim(),
        category,
        target_role,
        department_id ? parseInt(department_id, 10) : null,
        content.trim(),
        publish_date || new Date().toISOString().split('T')[0],
        priority,
        poster
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Notice announcement published successfully.',
      data: insertRes.rows[0]
    });
  } catch (err) {
    console.error('Error creating notice:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notices/:id
exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      target_role,
      department_id,
      content,
      publish_date,
      priority,
      posted_by
    } = req.body;

    const existing = await db.query('SELECT * FROM notices WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    const cur = existing.rows[0];
    const updateRes = await db.query(
      `UPDATE notices SET
         title = $1,
         category = $2,
         target_role = $3,
         department_id = $4,
         content = $5,
         publish_date = $6::DATE,
         priority = $7,
         posted_by = $8
       WHERE id = $9
       RETURNING *`,
      [
        title ? title.trim() : cur.title,
        category || cur.category,
        target_role || cur.target_role,
        department_id !== undefined ? (department_id ? parseInt(department_id, 10) : null) : cur.department_id,
        content ? content.trim() : cur.content,
        publish_date || cur.publish_date,
        priority || cur.priority,
        posted_by || cur.posted_by,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Notice updated successfully.',
      data: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Error updating notice:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/notices/:id
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT title FROM notices WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    await db.query('DELETE FROM notices WHERE id = $1', [id]);
    return res.status(200).json({
      success: true,
      message: `Notice '${check.rows[0].title}' removed.`
    });
  } catch (err) {
    console.error('Error deleting notice:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
