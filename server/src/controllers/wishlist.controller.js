import { query } from '../config/database.js';

// Get current user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;

    const items = await query(
      `SELECT 
        w.product_id,
        w.created_at,
        p.name,
        p.description,
        p.price,
        p.image_url
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        items,
      },
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
    });
  }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required',
      });
    }

    // Ensure product exists
    const products = await query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await query(
      `INSERT INTO wishlist (user_id, product_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [userId, product_id]
    );

    res.status(201).json({
      success: true,
      message: 'Added to wishlist',
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist',
    });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    await query(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    res.json({
      success: true,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist',
    });
  }
};


