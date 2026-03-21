import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create connection pool (without database first to create it if needed)
const poolWithoutDB = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Create connection pool with database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'EduConnect',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Create database if it doesn't exist
export const createDatabaseIfNotExists = async () => {
  try {
    const dbName = process.env.DB_NAME || 'EduConnect';
    await poolWithoutDB.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' ready`);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  }
};

// Initialize tables from schema - create in correct order
export const initializeTables = async () => {
  try {
    // Define tables in creation order (respecting foreign key dependencies)
    const tableDefinitions = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('customer', 'admin', 'superadmin') DEFAULT 'customer',
          phone VARCHAR(20),
          address TEXT,
          profile_image_url VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL,
          INDEX idx_email (email),
          INDEX idx_role (role),
          INDEX idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'categories',
        sql: `CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          image_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'products',
        sql: `CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          category_id INT NOT NULL,
          image_url VARCHAR(255),
          stock INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
          INDEX idx_category (category_id),
          INDEX idx_name (name),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'contents',
        sql: `CREATE TABLE IF NOT EXISTS contents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(150) NOT NULL,
          url VARCHAR(500) NOT NULL,
          platform ENUM('tiktok', 'other') DEFAULT 'tiktok',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_platform (platform),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'orders',
        sql: `CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
          status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
          shipping_address TEXT NOT NULL,
          phone VARCHAR(20) NOT NULL,
          latitude DECIMAL(10, 8) NULL,
          longitude DECIMAL(11, 8) NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
          INDEX idx_user (user_id),
          INDEX idx_status (status),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'order_items',
        sql: `CREATE TABLE IF NOT EXISTS order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          subtotal DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
          INDEX idx_order (order_id),
          INDEX idx_product (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'wishlist',
        sql: `CREATE TABLE IF NOT EXISTS wishlist (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE KEY unique_wishlist (user_id, product_id),
          INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'customizations',
        sql: `CREATE TABLE IF NOT EXISTS customizations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT NOT NULL,
          type ENUM('bouquet', 'flower', 'arrangement', 'other') DEFAULT 'bouquet',
          occasion VARCHAR(100),
          preferred_colors VARCHAR(255),
          budget DECIMAL(10, 2),
          delivery_date DATE,
          special_requirements TEXT,
          status ENUM('pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
          admin_notes TEXT,
          quoted_price DECIMAL(10, 2) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
          INDEX idx_user (user_id),
          INDEX idx_status (status),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    // Create tables in order
    for (const table of tableDefinitions) {
      try {
        await query(table.sql);
        // Verify table was created
        const tables = await query(
          "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
          [process.env.DB_NAME || 'EduConnect', table.name]
        );
        if (Array.isArray(tables) && tables.length > 0) {
          createdCount++;
          console.log(`  ✓ Table '${table.name}' ready`);
        }
      } catch (error) {
        // Ignore "table already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.message.includes('already exists') ||
            error.code === 'ER_DUP_KEYNAME') {
          skippedCount++;
          console.log(`  ℹ️  Table '${table.name}' already exists`);
        } else {
          console.error(`❌ Error creating table '${table.name}':`, error.message);
          throw error;
        }
      }
    }

    // Final verification
    try {
      const allTables = await query(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
        [process.env.DB_NAME || 'EduConnect']
      );

      // Debug: log what we got
      if (!Array.isArray(allTables)) {
        console.error('Query result is not an array:', typeof allTables, allTables);
        throw new Error('Unexpected query result format');
      }

      // Handle query results - extract table names
      const tableNames = allTables.map(t => {
        // Handle different case variations of column names
        return t.TABLE_NAME || t.table_name || (typeof t === 'string' ? t : Object.values(t)[0]);
      });
      
      const requiredTables = ['users', 'categories', 'products', 'orders', 'order_items', 'wishlist', 'contents', 'customizations'];
      const missingTables = requiredTables.filter(t => !tableNames.includes(t));

      if (missingTables.length > 0) {
        console.error('Available tables:', tableNames);
        throw new Error(`Missing tables: ${missingTables.join(', ')}`);
      }
    } catch (error) {
      // If verification fails, log but don't fail initialization
      console.warn('⚠️  Could not verify all tables:', error.message);
      // Continue anyway - tables might exist but query format issue
    }

    // Add profile_image_url column if it doesn't exist (for existing databases)
    try {
      const columns = await query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_image_url'
      `, [process.env.DB_NAME || 'EduConnect']);
      
      if (!Array.isArray(columns) || columns.length === 0) {
        await query(`
          ALTER TABLE users 
          ADD COLUMN profile_image_url VARCHAR(255) AFTER address
        `);
        console.log('  ✓ Added profile_image_url column to users table');
      }
    } catch (error) {
      // Ignore if column already exists
      if (error.code === 'ER_DUP_FIELDNAME' || (error.message || '').includes('Duplicate column name')) {
        // Column already exists, that's fine
      } else {
        console.warn('⚠️  Could not add profile_image_url column:', error.message);
      }
    }

    // Add is_active column if it doesn't exist (for existing databases)
    try {
      const columns = await query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'
      `, [process.env.DB_NAME || 'EduConnect']);
      
      if (!Array.isArray(columns) || columns.length === 0) {
        await query(`
          ALTER TABLE users 
          ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER profile_image_url
        `);
        console.log('  ✓ Added is_active column to users table');
      }
    } catch (error) {
      // Ignore if column already exists
      if (error.code === 'ER_DUP_FIELDNAME' || (error.message || '').includes('Duplicate column name')) {
        // Column already exists, that's fine
      } else {
        console.warn('⚠️  Could not add is_active column:', error.message);
      }
    }

    // Add payment_status column to orders if it doesn't exist (for existing databases)
    try {
      const columns = await query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_status'
      `, [process.env.DB_NAME || 'EduConnect']);

      if (!Array.isArray(columns) || columns.length === 0) {
        await query(`
          ALTER TABLE orders 
          ADD COLUMN payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending' 
          AFTER total_amount
        `);
        console.log('  ✓ Added payment_status column to orders table');
      }
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || (error.message || '').includes('Duplicate column name')) {
        // Column already exists
      } else {
        console.warn('⚠️  Could not add payment_status column:', error.message);
      }
    }

    // Add latitude/longitude columns to orders if they don't exist (for existing databases)
    try {
      const latCols = await query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'latitude'
      `, [process.env.DB_NAME || 'EduConnect']);

      if (!Array.isArray(latCols) || latCols.length === 0) {
        await query(`
          ALTER TABLE orders 
          ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER phone,
          ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude
        `);
        console.log('  ✓ Added latitude/longitude columns to orders table');
      }
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || (error.message || '').includes('Duplicate column name')) {
        // Columns already exist
      } else {
        console.warn('⚠️  Could not add latitude/longitude columns:', error.message);
      }
    }

    console.log(`✅ Database tables initialized (${createdCount} created, ${skippedCount} already existed)`);
  } catch (error) {
    console.error('❌ Error initializing tables:', error.message);
    throw error;
  }
};

// Initialize superadmin
export const initializeSuperAdmin = async () => {
  try {
    // First verify users table exists
    const tables = await query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [process.env.DB_NAME || 'EduConnect']
    );

    if (!Array.isArray(tables) || tables.length === 0) {
      throw new Error('Users table does not exist. Cannot create superadmin.');
    }

    // Check if superadmin already exists
    const existingAdmins = await query(
      "SELECT id FROM users WHERE email = ? OR role = 'superadmin'",
      ['superadmin@buneko.com']
    );

    if (Array.isArray(existingAdmins) && existingAdmins.length > 0) {
      console.log('ℹ️  Superadmin already exists');
      return;
    }

    // Create superadmin
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    const result = await query(
      `INSERT INTO users (name, email, password, role) 
       VALUES (?, ?, ?, 'superadmin')`,
      ['Super Admin', 'superadmin@buneko.com', superAdminPassword]
    );

    // Verify superadmin was created
    const verifyAdmin = await query(
      "SELECT id, name, email, role FROM users WHERE email = ?",
      ['superadmin@buneko.com']
    );

    if (Array.isArray(verifyAdmin) && verifyAdmin.length > 0) {
      console.log('✅ Superadmin created successfully!');
      console.log('   Email: superadmin@buneko.com');
      console.log('   Password: superadmin123');
      console.log('   Role: superadmin');
    } else {
      console.warn('⚠️  Superadmin creation may have failed - could not verify');
    }
  } catch (error) {
    console.error('❌ Error creating superadmin:', error.message);
    // Check if it's a duplicate entry error (admin already exists)
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      console.log('ℹ️  Superadmin already exists in database');
      return;
    }
    // Don't throw, just log - superadmin might already exist or table might not be ready
    if (error.message.includes('does not exist')) {
      throw error; // Re-throw if table doesn't exist
    }
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    // First create database if it doesn't exist
    await createDatabaseIfNotExists();
    
    // Then test connection to the database
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();
    
    // Initialize tables
    await initializeTables();
    
    // Initialize superadmin
    await initializeSuperAdmin();
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    throw error;
  }
};

// Execute query helper
export const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    // Ensure we return an array
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get connection from pool
export const getConnection = async () => {
  return await pool.getConnection();
};

export default pool;

