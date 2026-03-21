import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { query, testConnection } from '../config/database.js';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    console.log('🔄 Creating superadmin...');

    // Test connection first
    await testConnection();

    // Check if superadmin already exists
    const existingAdmins = await query(
      "SELECT id, name, email, role FROM users WHERE email = ? OR role = 'superadmin'",
      ['superadmin@buneko.com']
    );

    if (Array.isArray(existingAdmins) && existingAdmins.length > 0) {
      console.log('ℹ️  Superadmin already exists:');
      existingAdmins.forEach(admin => {
        console.log(`   ID: ${admin.id}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
      });
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
      const admin = verifyAdmin[0];
      console.log('✅ Superadmin created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   Email: superadmin@buneko.com');
      console.log('   Password: superadmin123');
      console.log('   Role: superadmin');
      console.log('   ID:', admin.id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('You can now login with these credentials!');
    } else {
      console.error('❌ Failed to verify superadmin creation');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating superadmin:', error.message);
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      console.log('ℹ️  Superadmin already exists in database');
    }
    process.exit(1);
  }
};

createSuperAdmin();

