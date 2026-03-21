import { query, getConnection } from '../config/database.js';
import { sendEmail } from '../utils/email.js';

// Get all orders (admin only)
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        o.id,
        o.user_id,
        u.name as user_name,
        u.email as user_email,
        o.total_amount,
        o.payment_status,
        o.status,
        o.shipping_address,
        o.phone,
        o.latitude,
        o.longitude,
        o.created_at,
        o.updated_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = await query(sql, params);

    // Get order items for each order
    for (const order of orders) {
      const items = await query(
        `SELECT 
          oi.id,
          oi.product_id,
          p.name as product_name,
          p.price,
          oi.quantity,
          oi.subtotal
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
    });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const orders = await query(
      `SELECT 
        id,
        total_amount,
        status,
        shipping_address,
        phone,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    // Get order items for each order
    for (const order of orders) {
      const items = await query(
        `SELECT 
          oi.id,
          oi.product_id,
          p.name as product_name,
          p.image_url,
          p.price,
          oi.quantity,
          oi.subtotal
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
    });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    const params = [id];

    // Non-admin users can only see their own orders
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      sql += ' AND o.user_id = ?';
      params.push(userId);
    }

    const orders = await query(sql, params);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = orders[0];

    // Get order items
    const items = await query(
      `SELECT 
        oi.id,
        oi.product_id,
        p.name as product_name,
        p.image_url,
        p.price,
        oi.quantity,
        oi.subtotal
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [id]
    );

    order.items = items;

    res.json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
    });
  }
};

// Create order
export const createOrder = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.userId;
    const { items, shipping_address, phone, notes, latitude, longitude, payment_status } = req.body;

    // Calculate total and validate products (using the same connection for transaction)
    let totalAmount = 0;
    for (const item of items) {
      const [products] = await connection.execute(
        'SELECT id, price, stock, name FROM products WHERE id = ?',
        [item.product_id]
      );

      const productsArray = Array.isArray(products) ? products : [];

      if (productsArray.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`,
        });
      }

      const product = productsArray[0];

      if (product.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}`,
        });
      }

      const subtotal = Number(product.price) * item.quantity;
      totalAmount += subtotal;
    }

    // Create order (on the transaction connection)
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, total_amount, payment_status, status, shipping_address, phone, latitude, longitude, notes)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [
        userId,
        totalAmount,
        payment_status || 'pending',
        shipping_address,
        phone,
        latitude || null,
        longitude || null,
        notes || null,
      ]
    );

    const orderId = orderResult.insertId;

    // Create order items and update stock (same connection / transaction)
    for (const item of items) {
      const [products] = await connection.execute(
        'SELECT price FROM products WHERE id = ?',
        [item.product_id]
      );
      const productsArray = Array.isArray(products) ? products : [];
      const product = productsArray[0];
      const subtotal = Number(product.price) * item.quantity;

      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, product.price, subtotal]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    // Get created order with items (can use pool query here)
    const orders = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const orderItems = await query(
      `SELECT 
        oi.*,
        p.name as product_name,
        p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [orderId]
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          ...orders[0],
          items: orderItems,
        },
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
    });
  } finally {
    connection.release();
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get order with user info
    const orders = await query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = orders[0];
    const oldStatus = order.status;

    // Update order status
    await query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    // Get updated order
    const updatedOrders = await query('SELECT * FROM orders WHERE id = ?', [id]);
    const updatedOrder = updatedOrders[0];

    // Send email notification to customer if status changed
    if (oldStatus !== status && order.user_email) {
      try {
        const statusMessages = {
          pending: {
            subject: 'Order Confirmed - Buneko Blooms',
            title: 'Order Confirmed',
            message: 'Your order has been confirmed and is being prepared.',
            color: '#ffc107',
          },
          processing: {
            subject: 'Order Processing - Buneko Blooms',
            title: 'Order Processing',
            message: 'Your order is now being processed and will be ready soon.',
            color: '#2196f3',
          },
          shipped: {
            subject: 'Order Shipped - Buneko Blooms',
            title: 'Order Shipped',
            message: 'Great news! Your order has been shipped and is on its way to you.',
            color: '#673ab7',
          },
          delivered: {
            subject: 'Order Delivered - Buneko Blooms',
            title: 'Order Delivered',
            message: 'Your order has been successfully delivered! Thank you for shopping with us.',
            color: '#4caf50',
          },
          cancelled: {
            subject: 'Order Cancelled - Buneko Blooms',
            title: 'Order Cancelled',
            message: 'Your order has been cancelled. If you have any questions, please contact our support team.',
            color: '#f44336',
          },
        };

        const statusInfo = statusMessages[status] || statusMessages.pending;

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${statusInfo.title}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: ${statusInfo.color}; margin-top: 0;">${statusInfo.title}</h1>
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0;">
              <p>Dear ${order.user_name || 'Customer'},</p>
              
              <p>${statusInfo.message}</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Order ID:</strong> #${order.id}</p>
                <p style="margin: 5px 0 0 0;"><strong>Order Status:</strong> <span style="text-transform: capitalize;">${status}</span></p>
                <p style="margin: 5px 0 0 0;"><strong>Total Amount:</strong> NPR ${Number(order.total_amount).toFixed(2)}</p>
              </div>
              
              <p>You can track your order status anytime by logging into your account.</p>
              
              <p>If you have any questions or concerns, please don't hesitate to contact our customer support team.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Buneko Blooms Team</strong>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </body>
          </html>
        `;

        const text = `
          ${statusInfo.title} - Buneko Blooms
          
          Dear ${order.user_name || 'Customer'},
          
          ${statusInfo.message}
          
          Order ID: #${order.id}
          Order Status: ${status}
          Total Amount: NPR ${Number(order.total_amount).toFixed(2)}
          
          You can track your order status anytime by logging into your account.
          
          If you have any questions or concerns, please don't hesitate to contact our customer support team.
          
          Best regards,
          Buneko Blooms Team
          
          ---
          This is an automated message. Please do not reply to this email.
        `;

        await sendEmail({
          to: order.user_email,
          subject: statusInfo.subject,
          html,
          text,
        });

        console.log(`✅ Order status email sent to ${order.user_email} for order #${id}`);
      } catch (emailError) {
        // Log email error but don't fail the status update
        console.error('Error sending order status email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order: updatedOrder,
      },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const userId = req.user.userId;

    // Check if order exists and belongs to user
    const orders = await query(
      'SELECT id, status FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = orders[0];

    if (order.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    if (order.status === 'delivered') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a delivered order',
      });
    }

    // Restore stock
    const items = await query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [id]
    );

    for (const item of items) {
      await query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    await query(
      'UPDATE orders SET status = "cancelled", updated_at = NOW() WHERE id = ?',
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
    });
  } finally {
    connection.release();
  }
};

