/**
 * Script to create a Management user account
 * 
 * This script creates a Management user account directly in the database.
 * Usage: npx tsx scripts/create-management-user.ts
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from '../src/infrastructure/database/postgres/connection';

// Load environment variables
dotenv.config();

async function createManagementUser() {

  try {
    console.log('🔧 Creating Management user account...');

    const username = 'management';
    const password = 'management123';
    const email = 'management@example.com';
    const role = 'Management';

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user already exists
    const checkQuery = 'SELECT id, username FROM users WHERE username = $1';
    const checkResult = await pool.query(checkQuery, [username]);

    if (checkResult.rows.length > 0) {
      console.log(`⚠️  User "${username}" already exists with ID: ${checkResult.rows[0].id}`);
      console.log('   Updating password...');
      
      // Update existing user
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, role = $2, updated_at = CURRENT_TIMESTAMP
        WHERE username = $3
        RETURNING id, username, role
      `;
      const updateResult = await pool.query(updateQuery, [passwordHash, role, username]);
      
      console.log('✅ User updated successfully!');
      console.log('   ID:', updateResult.rows[0].id);
      console.log('   Username:', updateResult.rows[0].username);
      console.log('   Role:', updateResult.rows[0].role);
    } else {
      // Create new user
      const insertQuery = `
        INSERT INTO users (username, password_hash, role, employee_id)
        VALUES ($1, $2, $3, NULL)
        RETURNING id, username, role
      `;
      const insertResult = await pool.query(insertQuery, [username, passwordHash, role]);
      
      console.log('✅ Management user created successfully!');
      console.log('   ID:', insertResult.rows[0].id);
      console.log('   Username:', insertResult.rows[0].username);
      console.log('   Role:', insertResult.rows[0].role);
    }

    console.log('\n📋 Login Credentials:');
    console.log('   Username:', username);
    console.log('   Password:', password);
    console.log('   Email:', email);
    console.log('   Role:', role);
    console.log('\n💡 You can now login with these credentials!');
    console.log('   URL: http://localhost:5174/login');

  } catch (error: any) {
    console.error('❌ Error creating Management user:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
createManagementUser();

