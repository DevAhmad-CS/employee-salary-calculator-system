/**
 * Create Test User Script
 * 
 * This script creates a test user in the database with a properly hashed password.
 * Run this script to create a test user for development/testing purposes.
 * 
 * Usage:
 *   npx ts-node scripts/create-test-user.ts
 * 
 * Or with npm script:
 *   npm run create-test-user
 */

import bcrypt from 'bcryptjs';
import { pool } from '../src/infrastructure/database/postgres/connection';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Creates a test user in the database
 */
async function createTestUser() {
  try {
    // Test user credentials
    const username = 'admin';
    const password = 'admin123';
    const role = 'Admin';

    // Hash the password using bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE username = $1';
    const checkResult = await pool.query(checkQuery, [username]);

    if (checkResult.rows.length > 0) {
      console.log(`⚠️  User "${username}" already exists.`);
      console.log('   Updating password...');
      
      // Update existing user's password
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE username = $2
        RETURNING id, username, role
      `;
      const updateResult = await pool.query(updateQuery, [passwordHash, username]);
      
      console.log('✅ User password updated successfully!');
      console.log('   User:', updateResult.rows[0]);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${role}`);
    } else {
      // Insert new user
      const insertQuery = `
        INSERT INTO users (username, password_hash, role, employee_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, role
      `;
      const insertResult = await pool.query(insertQuery, [username, passwordHash, role, null]);
      
      console.log('✅ Test user created successfully!');
      console.log('   User:', insertResult.rows[0]);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${role}`);
    }

    // Test the password hash
    console.log('\n🔐 Testing password hash...');
    const testUser = await pool.query('SELECT password_hash FROM users WHERE username = $1', [username]);
    const isValid = await bcrypt.compare(password, testUser.rows[0].password_hash);
    
    if (isValid) {
      console.log('✅ Password hash is valid and working correctly!');
    } else {
      console.log('❌ Password hash validation failed!');
    }

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
createTestUser();

