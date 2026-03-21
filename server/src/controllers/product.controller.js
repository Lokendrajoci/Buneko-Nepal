import { query, getConnection } from '../config/database.js';
import { deleteImage, extractPublicId } from '../utils/cloudinary.js';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category_id, search } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock,
        p.category_id,
        c.name as category_name,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = await query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams = [];

    if (category_id) {
      countSql += ' AND category_id = ?';
      countParams.push(category_id);
    }

    if (search) {
      countSql += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const countResult = await query(countSql, countParams);
    const total = Array.isArray(countResult) && countResult.length > 0 
      ? countResult[0].total 
      : 0;

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
    });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const products = await query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock,
        p.category_id,
        c.name as category_name,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?`,
      [id]
    );

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: {
        product: products[0],
      },
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
    });
  }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const products = await query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock,
        p.category_id,
        c.name as category_name,
        p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [categoryId, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: {
        products,
      },
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
    });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, stock, image_url } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, and category are required',
      });
    }

    // Use connection for INSERT to get insertId properly
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO products (name, description, price, category_id, stock, image_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, description, parseFloat(price), parseInt(category_id), parseInt(stock) || 0, image_url || null]
      );

      const userId = result.insertId;

      // Get created product
      const products = await query(
        `SELECT 
          p.id,
          p.name,
          p.description,
          p.price,
          p.image_url,
          p.stock,
          p.category_id,
          c.name as category_name,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?`,
        [userId]
      );

      connection.release();

      const product = Array.isArray(products) && products.length > 0 ? products[0] : null;

      if (!product) {
        throw new Error('Failed to retrieve created product');
      }

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: {
          product,
        },
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating product',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, stock, image_url } = req.body;

    // Check if product exists and get current image
    const existingProducts = await query(
      'SELECT id, image_url FROM products WHERE id = ?',
      [id]
    );

    if (!Array.isArray(existingProducts) || existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const existingProduct = existingProducts[0];
    const oldImageUrl = existingProduct.image_url;

    // If new image is uploaded and old image exists, delete old image from Cloudinary
    if (image_url && oldImageUrl && image_url !== oldImageUrl) {
      const oldPublicId = extractPublicId(oldImageUrl);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    await query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, category_id = ?, 
           stock = ?, image_url = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, description, parseFloat(price), parseInt(category_id), parseInt(stock) || 0, image_url || null, id]
    );

    const products = await query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock,
        p.category_id,
        c.name as category_name,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?`,
      [id]
    );

    const product = Array.isArray(products) && products.length > 0 ? products[0] : null;

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product,
      },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating product',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists and get image URL
    const existingProducts = await query(
      'SELECT id, image_url FROM products WHERE id = ?',
      [id]
    );

    if (!Array.isArray(existingProducts) || existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const existingProduct = existingProducts[0];

    // Delete image from Cloudinary if exists
    if (existingProduct.image_url) {
      const publicId = extractPublicId(existingProduct.image_url);
      if (publicId) {
        await deleteImage(publicId);
      }
    }

    // Delete product from database
    await query('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting product',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

