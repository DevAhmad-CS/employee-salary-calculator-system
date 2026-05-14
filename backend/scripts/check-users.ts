/**
 * Check Users Script
 * 
 * This script lists all users in the database to verify data.
 * 
 * Usage:
 *   npx ts-node scripts/check-users.ts
 */

import { pool } from '../src/infrastructure/database/postgres/connection';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Lists all users in the database
 */
async function checkUsers() {
  try {
    const query = 'SELECT id, username, role, employee_id, created_at FROM users ORDER BY id';
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('⚠️  No users found in the database.');
      console.log('   Run: npm run create-test-user');
    } else {
      console.log(`✅ Found ${result.rows.length} user(s) in the database:\n`);
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. User ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Employee ID: ${user.employee_id || 'N/A'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
checkUsers();

