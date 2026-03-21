import { query, getConnection } from '../config/database.js';

// Get user's customizations
export const getUserCustomizations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const customizations = await query(
      `SELECT 
        id,
        title,
        description,
        type,
        occasion,
        preferred_colors,
        budget,
        delivery_date,
        special_requirements,
        status,
        admin_notes,
        quoted_price,
        created_at,
        updated_at
      FROM customizations
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM customizations WHERE user_id = ?',
      [userId]
    );
    const total = Array.isArray(countResult) && countResult.length > 0
      ? countResult[0].total
      : 0;

    res.json({
      success: true,
      data: {
        customizations: Array.isArray(customizations) ? customizations : [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get user customizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customizations',
    });
  }
};

// Get all customizations (admin only)
export const getAllCustomizations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        c.id,
        c.user_id,
        u.name as user_name,
        u.email as user_email,
        c.title,
        c.description,
        c.type,
        c.occasion,
        c.preferred_colors,
        c.budget,
        c.delivery_date,
        c.special_requirements,
        c.status,
        c.admin_notes,
        c.quoted_price,
        c.created_at,
        c.updated_at
      FROM customizations c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const customizations = await query(sql, params);

    const countSql = status
      ? 'SELECT COUNT(*) as total FROM customizations WHERE status = ?'
      : 'SELECT COUNT(*) as total FROM customizations';
    const countParams = status ? [status] : [];
    const countResult = await query(countSql, countParams);
    const total = Array.isArray(countResult) && countResult.length > 0
      ? countResult[0].total
      : 0;

    res.json({
      success: true,
      data: {
        customizations: Array.isArray(customizations) ? customizations : [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all customizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customizations',
    });
  }
};

// Get customization by ID
export const getCustomizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM customizations c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    const params = [id];

    // Non-admin users can only see their own customizations
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      sql += ' AND c.user_id = ?';
      params.push(userId);
    }

    const customizations = await query(sql, params);

    if (!Array.isArray(customizations) || customizations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customization request not found',
      });
    }

    res.json({
      success: true,
      data: {
        customization: customizations[0],
      },
    });
  } catch (error) {
    console.error('Get customization by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customization',
    });
  }
};

// Create customization request
export const createCustomization = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      description,
      type = 'bouquet',
      occasion,
      preferred_colors,
      budget,
      delivery_date,
      special_requirements,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO customizations (
          user_id, title, description, type, occasion, 
          preferred_colors, budget, delivery_date, special_requirements
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          title,
          description,
          type,
          occasion || null,
          preferred_colors || null,
          budget ? parseFloat(budget) : null,
          delivery_date || null,
          special_requirements || null,
        ]
      );

      const insertedId = result.insertId;

      const rows = await query(
        'SELECT * FROM customizations WHERE id = ?',
        [insertedId]
      );

      res.status(201).json({
        success: true,
        message: 'Customization request submitted successfully',
        data: {
          customization: Array.isArray(rows) && rows.length > 0 ? rows[0] : null,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create customization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating customization request',
    });
  }
};

// Update customization status (admin only)
export const updateCustomizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, quoted_price } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const updateFields = ['status = ?'];
    const params = [status];

    if (admin_notes !== undefined) {
      updateFields.push('admin_notes = ?');
      params.push(admin_notes);
    }

    if (quoted_price !== undefined) {
      updateFields.push('quoted_price = ?');
      params.push(quoted_price ? parseFloat(quoted_price) : null);
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await query(
      `UPDATE customizations SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const rows = await query('SELECT * FROM customizations WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Customization status updated successfully',
      data: {
        customization: Array.isArray(rows) && rows.length > 0 ? rows[0] : null,
      },
    });
  } catch (error) {
    console.error('Update customization status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customization status',
    });
  }
};

// Create order from accepted customization (admin only)
export const createOrderFromCustomization = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { shipping_address, phone, latitude, longitude, notes } = req.body;

    // Get customization
    const customizations = await query(
      'SELECT * FROM customizations WHERE id = ?',
      [id]
    );

    if (!Array.isArray(customizations) || customizations.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Customization not found',
      });
    }

    const customization = customizations[0];

    if (customization.status !== 'accepted') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only accepted customizations can be converted to orders',
      });
    }

    if (!customization.quoted_price) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Customization must have a quoted price before creating order',
      });
    }

    // Create order from customization
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, total_amount, payment_status, status, shipping_address, phone, latitude, longitude, notes)
       VALUES (?, ?, 'pending', 'pending', ?, ?, ?, ?, ?)`,
      [
        customization.user_id,
        customization.quoted_price,
        shipping_address,
        phone,
        latitude || null,
        longitude || null,
        notes || `Customization Order: ${customization.title}\n${customization.description}`,
      ]
    );

    const orderId = orderResult.insertId;

    // Update customization status to completed
    await connection.execute(
      'UPDATE customizations SET status = ?, updated_at = NOW() WHERE id = ?',
      ['completed', id]
    );

    await connection.commit();

    // Get created order
    const orders = await query(
      `SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?`,
      [orderId]
    );

    res.status(201).json({
      success: true,
      message: 'Order created from customization successfully',
      data: {
        order: Array.isArray(orders) && orders.length > 0 ? orders[0] : null,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order from customization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order from customization',
    });
  } finally {
    connection.release();
  }
};

// Complete customization order (user) - add payment and delivery details
export const completeCustomizationOrder = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.userId;
    const { id } = req.params;
    const { shipping_address, phone, latitude, longitude, notes, payment_status } = req.body;

    // Get customization
    const customizations = await query(
      'SELECT * FROM customizations WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!Array.isArray(customizations) || customizations.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Customization not found',
      });
    }

    const customization = customizations[0];

    if (customization.status !== 'accepted') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only accepted customizations can be converted to orders',
      });
    }

    if (!customization.quoted_price) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Customization must have a quoted price',
      });
    }

    // Create order from customization
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, total_amount, payment_status, status, shipping_address, phone, latitude, longitude, notes)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [
        userId,
        customization.quoted_price,
        payment_status || 'pending',
        shipping_address,
        phone,
        latitude || null,
        longitude || null,
        notes || `Customization Order: ${customization.title}\n${customization.description}`,
      ]
    );

    const orderId = orderResult.insertId;

    // Update customization status to completed
    await connection.execute(
      'UPDATE customizations SET status = ?, updated_at = NOW() WHERE id = ?',
      ['completed', id]
    );

    await connection.commit();

    // Get created order
    const orders = await query(
      `SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?`,
      [orderId]
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: Array.isArray(orders) && orders.length > 0 ? orders[0] : null,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Complete customization order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order from customization',
    });
  } finally {
    connection.release();
  }
};

