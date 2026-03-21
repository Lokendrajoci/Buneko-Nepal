import { query } from '../config/database.js';

// Get customer dashboard statistics
export const getCustomerDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get total orders for this user
    const totalOrdersResult = await query(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [userId]
    );
    const totalOrders = Array.isArray(totalOrdersResult) && totalOrdersResult.length > 0
      ? totalOrdersResult[0].total
      : 0;

    // Get active orders (pending, processing, shipped)
    const activeOrdersResult = await query(
      `SELECT COUNT(*) as total 
       FROM orders 
       WHERE user_id = ? AND status IN ('pending', 'processing', 'shipped')`,
      [userId]
    );
    const activeOrders = Array.isArray(activeOrdersResult) && activeOrdersResult.length > 0
      ? activeOrdersResult[0].total
      : 0;

    // Get wishlist items count
    const wishlistResult = await query(
      'SELECT COUNT(*) as total FROM wishlist WHERE user_id = ?',
      [userId]
    );
    const wishlistItems = Array.isArray(wishlistResult) && wishlistResult.length > 0
      ? wishlistResult[0].total
      : 0;

    // Get recent orders (last 5)
    const recentOrders = await query(
      `SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.payment_status,
        o.created_at,
        GROUP_CONCAT(p.name SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 5`,
      [userId]
    );

    // Format recent orders
    const formattedRecentOrders = Array.isArray(recentOrders) ? recentOrders.map(order => ({
      id: order.id,
      total_amount: Number(order.total_amount),
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      items: order.items || 'No items',
    })) : [];

    res.json({
      success: true,
      data: {
        totalOrders: Number(totalOrders),
        activeOrders: Number(activeOrders),
        wishlistItems: Number(wishlistItems),
        recentOrders: formattedRecentOrders,
      },
    });
  } catch (error) {
    console.error('Get customer dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
    });
  }
};

