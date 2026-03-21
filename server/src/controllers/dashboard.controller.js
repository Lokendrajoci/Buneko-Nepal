import { query } from '../config/database.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get total products
    const productsResult = await query('SELECT COUNT(*) as total FROM products');
    const totalProducts = Array.isArray(productsResult) && productsResult.length > 0
      ? productsResult[0].total
      : 0;

    // Get total orders
    const ordersResult = await query('SELECT COUNT(*) as total FROM orders');
    const totalOrders = Array.isArray(ordersResult) && ordersResult.length > 0
      ? ordersResult[0].total
      : 0;

    // Get total customers (users with role 'customer')
    const customersResult = await query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'customer'"
    );
    const totalCustomers = Array.isArray(customersResult) && customersResult.length > 0
      ? customersResult[0].total
      : 0;

    // Get total revenue (sum of all paid orders)
    const revenueResult = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE payment_status = 'paid'`
    );
    const totalRevenue = Array.isArray(revenueResult) && revenueResult.length > 0
      ? Number(revenueResult[0].total)
      : 0;

    // Get recent orders (last 5)
    const recentOrders = await query(
      `SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.payment_status,
        o.created_at,
        u.name as user_name,
        GROUP_CONCAT(p.name SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 5`
    );

    // Format recent orders
    const formattedRecentOrders = Array.isArray(recentOrders) ? recentOrders.map(order => ({
      id: order.id,
      total_amount: Number(order.total_amount),
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      user_name: order.user_name || 'Unknown',
      items: order.items || 'No items',
    })) : [];

    res.json({
      success: true,
      data: {
        totalProducts: Number(totalProducts),
        totalOrders: Number(totalOrders),
        totalCustomers: Number(totalCustomers),
        totalRevenue: totalRevenue,
        recentOrders: formattedRecentOrders,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
    });
  }
};

