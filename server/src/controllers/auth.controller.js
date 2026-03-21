import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getConnection } from '../config/database.js';

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register new user (only customers can register, not admin/superadmin)
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (always as customer - admin/superadmin must be created manually)
    // Use getConnection for INSERT to get insertId properly
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO users (name, email, password, role) 
         VALUES (?, ?, ?, 'customer')`,
        [name, email, hashedPassword]
      );

      const userId = result.insertId;

      if (!userId) {
        throw new Error('Failed to get user ID after registration');
      }

      // Generate token
      const token = generateToken(userId, email, 'customer');

      // Get user data
      const users = await query(
        'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
        [userId]
      );

      const userData = Array.isArray(users) && users.length > 0 ? users[0] : null;

      if (!userData) {
        throw new Error('Failed to retrieve user data after registration');
      }

      connection.release();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userData,
          token,
        },
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};


// Login user (works for customer, admin, and superadmin)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user (including superadmin)
    const users = await query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = users[0];

    // Check if account is active
    if (user.is_active === false || user.is_active === 0) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support for assistance.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const users = await query(
      'SELECT id, name, email, role, phone, address, profile_image_url, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user: users[0],
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
    });
  }
};

// Logout (client-side token removal, but we can track it)
export const logout = async (req, res) => {
  try {
    // In a more advanced setup, you could blacklist the token here
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
    });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token required',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Generate new token
      const newToken = generateToken(decoded.userId, decoded.email, decoded.role);

      res.json({
        success: true,
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
    });
  }
};

