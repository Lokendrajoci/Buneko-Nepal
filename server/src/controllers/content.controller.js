import { query, getConnection } from '../config/database.js';

// Get all contents (optionally paginated)
export const getContents = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const contents = await query(
      `SELECT id, title, url, platform, created_at, updated_at
       FROM contents
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM contents',
      []
    );
    const total = Array.isArray(countResult) && countResult.length > 0
      ? countResult[0].total
      : 0;

    res.json({
      success: true,
      data: {
        contents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get contents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contents',
    });
  }
};

// Get single content by ID
export const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query(
      'SELECT id, title, url, platform, created_at, updated_at FROM contents WHERE id = ?',
      [id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.json({
      success: true,
      data: {
        content: rows[0],
      },
    });
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
    });
  }
};

// Create new content (TikTok link)
export const createContent = async (req, res) => {
  try {
    const { title, url } = req.body;

    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'Title and URL are required',
      });
    }

    // Use direct connection to get insertId properly
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO contents (title, url, platform)
         VALUES (?, ?, 'tiktok')`,
        [title, url]
      );

      const insertedId = result.insertId;

      const rows = await query(
        'SELECT id, title, url, platform, created_at, updated_at FROM contents WHERE id = ?',
        [insertedId]
      );

      res.status(201).json({
        success: true,
        message: 'Content created successfully',
        data: {
          content: Array.isArray(rows) && rows.length > 0 ? rows[0] : null,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating content',
    });
  }
};

// Update content
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url } = req.body;

    if (!title && !url) {
      return res.status(400).json({
        success: false,
        message: 'Nothing to update',
      });
    }

    const existing = await query(
      'SELECT id FROM contents WHERE id = ?',
      [id]
    );

    if (!Array.isArray(existing) || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    const fields = [];
    const params = [];

    if (title) {
      fields.push('title = ?');
      params.push(title);
    }
    if (url) {
      fields.push('url = ?');
      params.push(url);
    }

    params.push(id);

    await query(
      `UPDATE contents SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    const rows = await query(
      'SELECT id, title, url, platform, created_at, updated_at FROM contents WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: {
        content: Array.isArray(rows) && rows.length > 0 ? rows[0] : null,
      },
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content',
    });
  }
};

// Delete content
export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query(
      'SELECT id FROM contents WHERE id = ?',
      [id]
    );

    if (!Array.isArray(existing) || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    await query(
      'DELETE FROM contents WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
    });
  }
};


