/**
 * Test Login Script
 * Tests login with admin/admin123
 */

import bcrypt from 'bcryptjs';
import { pool } from '../src/infrastructure/database/postgres/connection';
import dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  try {
    const username = 'admin';
    const password = 'admin123';

    console.log('🔍 Testing login...');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}\n`);

    // Get user from database
    const userResult = await pool.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found in database');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}\n`);

    // Test password
    console.log('🔐 Testing password...');
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (isValid) {
      console.log('✅ Password is VALID - Login should work!');
    } else {
      console.log('❌ Password is INVALID - This is the problem!');
      console.log('\n💡 Try running: npm run create-test-user');
    }

    // Test JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    console.log(`\n🔑 JWT_SECRET: ${jwtSecret ? '✅ EXISTS' : '❌ MISSING'}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testLogin();

