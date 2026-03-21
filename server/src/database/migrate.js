import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query, testConnection } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const runMigration = async () => {
  try {
    console.log('🔄 Starting database migration...');

    // Test connection
    await testConnection();

    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          // Ignore "table already exists" errors
          if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
            console.error('❌ Error executing statement:', error.message);
          }
        }
      }
    }

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();

