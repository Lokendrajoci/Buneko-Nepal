import bcrypt from 'bcryptjs';
import { query, testConnection } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    await testConnection();

    // Seed categories
    console.log('📦 Seeding categories...');
    const categories = [
      { name: 'Bouquets', description: 'Beautiful handcrafted flower bouquets' },
      { name: 'Home Decor', description: 'Decorative flowers for your home' },
      { name: 'Gifts', description: 'Perfect gift arrangements' },
      { name: 'Wedding', description: 'Elegant wedding florals' },
    ];

    for (const category of categories) {
      try {
        await query(
          'INSERT INTO categories (name, description) VALUES (?, ?)',
          [category.name, category.description]
        );
        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`❌ Error creating category ${category.name}:`, error.message);
        }
      }
    }

    // Seed admin user
    console.log('👤 Seeding admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    try {
      await query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@buneko.com', adminPassword, 'admin']
      );
      console.log('✅ Created admin user: admin@buneko.com / admin123');
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        console.error('❌ Error creating admin user:', error.message);
      } else {
        console.log('ℹ️  Admin user already exists');
      }
    }

    // Seed sample customer
    console.log('👤 Seeding sample customer...');
    const customerPassword = await bcrypt.hash('customer123', 10);
    try {
      await query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['John Doe', 'customer@example.com', customerPassword, 'customer']
      );
      console.log('✅ Created customer: customer@example.com / customer123');
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        console.error('❌ Error creating customer:', error.message);
      } else {
        console.log('ℹ️  Customer already exists');
      }
    }

    // Seed sample products
    console.log('🌺 Seeding sample products...');
    const [categoryRows] = await query('SELECT id, name FROM categories LIMIT 4');
    
    const products = [
      {
        name: 'Rose Elegance Bouquet',
        description: 'A stunning arrangement of handcrafted roses in elegant pink and white tones. Perfect for special occasions.',
        price: 2500.00,
        category_id: categoryRows[0]?.id || 1,
        stock: 20,
      },
      {
        name: 'Bohemian Dreams',
        description: 'A beautiful mix of wildflowers and rustic elements, bringing a bohemian touch to any space.',
        price: 3200.00,
        category_id: categoryRows[1]?.id || 2,
        stock: 15,
      },
      {
        name: 'Peony Paradise',
        description: 'Luxurious peony arrangement in soft pastel colors. Handcrafted with attention to detail.',
        price: 2800.00,
        category_id: categoryRows[0]?.id || 1,
        stock: 12,
      },
      {
        name: 'Sunflower Bliss',
        description: 'Bright and cheerful sunflower arrangement that brings warmth and joy to any room.',
        price: 2200.00,
        category_id: categoryRows[2]?.id || 3,
        stock: 18,
      },
    ];

    for (const product of products) {
      try {
        await query(
          'INSERT INTO products (name, description, price, category_id, stock) VALUES (?, ?, ?, ?, ?)',
          [product.name, product.description, product.price, product.category_id, product.stock]
        );
        console.log(`✅ Created product: ${product.name}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`❌ Error creating product ${product.name}:`, error.message);
        }
      }
    }

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

