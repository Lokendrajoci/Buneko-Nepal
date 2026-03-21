import { query } from '../config/database.js';
import { sendDeactivationEmail, sendActivationEmail } from '../utils/email.js';
import bcrypt from 'bcryptjs';
import { deleteImage, extractPublicId } from '../utils/cloudinary.js';

// Get all users (admin only) or customers (for customer role)
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        id,
        name,
        email,
        role,
        phone,
        address,
        profile_image_url,
        is_active,
        created_at,
        last_login
      FROM users
      WHERE 1=1
    `;
    const params = [];

    // If customer, only show other customers (not admins)
    if (userRole === 'customer') {
      sql += ' AND role = ?';
      params.push('customer');
    } else if (role) {
      // Admin can filter by role
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = await query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];

    if (userRole === 'customer') {
      countSql += ' AND role = ?';
      countParams.push('customer');
    } else if (role) {
      countSql += ' AND role = ?';
      countParams.push(role);
    }

    const countResult = await query(countSql, countParams);
    const total = Array.isArray(countResult) && countResult.length > 0 
      ? countResult[0].total 
      : 0;

    res.json({
      success: true,
      data: {
        users: Array.isArray(users) ? users : [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await query(
      `SELECT 
        id,
        name,
        email,
        role,
        phone,
        address,
        created_at,
        last_login
      FROM users
      WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
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
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, phone, address, profile_image_url } = req.body;

    // Get current user to check for existing profile image
    const currentUsers = await query(
      'SELECT profile_image_url FROM users WHERE id = ?',
      [userId]
    );
    const currentUser = Array.isArray(currentUsers) && currentUsers.length > 0 ? currentUsers[0] : null;
    const oldImageUrl = currentUser?.profile_image_url;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email) {
      // Check if email is already taken by another user
      const existingUsers = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken',
        });
      }
      updates.push('email = ?');
      params.push(email);
    }
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (address) {
      updates.push('address = ?');
      params.push(address);
    }
    if (profile_image_url) {
      // If new image is uploaded and old image exists, delete old image from Cloudinary
      if (oldImageUrl && profile_image_url !== oldImageUrl) {
        const oldPublicId = extractPublicId(oldImageUrl);
        if (oldPublicId) {
          await deleteImage(oldPublicId);
        }
      }
      updates.push('profile_image_url = ?');
      params.push(profile_image_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updates.push('updated_at = NOW()');
    params.push(userId);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const users = await query(
      'SELECT id, name, email, role, phone, address, profile_image_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, role } = req.body;

    // Check if user exists
    const [existingUsers] = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email) {
      // Check if email is already taken
      const [emailCheck] = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken',
        });
      }
      updates.push('email = ?');
      params.push(email);
    }
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (address) {
      updates.push('address = ?');
      params.push(address);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [users] = await query(
      'SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: users[0],
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Get current user password
    const users = await query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = users[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Toggle user active status (admin/superadmin only)
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean value',
      });
    }

    // Check if user exists
    const existingUsers = await query(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );

    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = existingUsers[0];

    // Prevent deactivating superadmin
    if (user.role === 'superadmin' && !is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate superadmin account',
      });
    }

    // Get user details before updating (for email notification)
    const userDetails = await query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [id]
    );
    const userInfo = Array.isArray(userDetails) && userDetails.length > 0 ? userDetails[0] : null;

    // Update is_active status
    await query(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, id]
    );

    const updatedUsers = await query(
      'SELECT id, name, email, role, phone, address, profile_image_url, is_active, created_at FROM users WHERE id = ?',
      [id]
    );

    const updatedUser = Array.isArray(updatedUsers) && updatedUsers.length > 0 ? updatedUsers[0] : null;

    // Send email notification if user is a customer
    if (userInfo && userInfo.role === 'customer') {
      try {
        if (is_active) {
          await sendActivationEmail(userInfo);
        } else {
          await sendDeactivationEmail(userInfo);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user status',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUsers] = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't allow deleting yourself
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
    });
  }
};

