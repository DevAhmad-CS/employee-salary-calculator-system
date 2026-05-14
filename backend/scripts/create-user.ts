/**
 * Script to create any user account (Admin, HR, Accountant, Employee, Management)
 * 
 * This script creates a user account directly in the database.
 * 
 * Usage: 
 *   npx ts-node scripts/create-user.ts <username> <password> <role> [email]
 * 
 * Examples:
 *   npx ts-node scripts/create-user.ts manager1 manager123 Management manager1@example.com
 *   npx ts-node scripts/create-user.ts hr1 hr123 HR hr1@example.com
 *   npx ts-node scripts/create-user.ts accountant1 acc123 Accountant accountant1@example.com
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from '../src/infrastructure/database/postgres/connection';

// Load environment variables
dotenv.config();

// Valid roles
const VALID_ROLES = ['Admin', 'HR', 'Accountant', 'Employee', 'Management'];

async function createUser() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.log('❌ Missing required arguments!');
      console.log('\n📋 Usage:');
      console.log('   npx ts-node scripts/create-user.ts <username> <password> <role> [email]');
      console.log('\n📝 Examples:');
      console.log('   npx ts-node scripts/create-user.ts manager1 manager123 Management manager1@example.com');
      console.log('   npx ts-node scripts/create-user.ts hr1 hr123 HR hr1@example.com');
      console.log('   npx ts-node scripts/create-user.ts accountant1 acc123 Accountant accountant1@example.com');
      console.log('\n✅ Valid roles:', VALID_ROLES.join(', '));
      process.exit(1);
    }

    const username = args[0];
    const password = args[1];
    const role = args[2];
    const email = args[3] || `${username}@example.com`;

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      console.error(`❌ Invalid role: ${role}`);
      console.error(`✅ Valid roles: ${VALID_ROLES.join(', ')}`);
      process.exit(1);
    }

    // Validate password length
    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    // Validate username length
    if (username.length < 3) {
      console.error('❌ Username must be at least 3 characters long');
      process.exit(1);
    }

    console.log(`🔧 Creating ${role} user account...`);
    console.log(`   Username: ${username}`);
    console.log(`   Role: ${role}`);
    console.log(`   Email: ${email}`);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user already exists
    const checkQuery = 'SELECT id, username, role FROM users WHERE username = $1';
    const checkResult = await pool.query(checkQuery, [username]);

    if (checkResult.rows.length > 0) {
      console.log(`\n⚠️  User "${username}" already exists!`);
      console.log(`   ID: ${checkResult.rows[0].id}`);
      console.log(`   Current Role: ${checkResult.rows[0].role}`);
      console.log('\n   Updating user...');
      
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
      
      console.log('\n✅ User created successfully!');
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
    console.error('❌ Error creating user:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
createUser();

