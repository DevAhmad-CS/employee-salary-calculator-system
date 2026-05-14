/**
 * Script to update users table role constraint to include 'HR'
 * 
 * This script:
 * 1. Drops the existing users_role_check constraint
 * 2. Adds a new constraint that includes 'HR' in the allowed roles
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'employee_salary_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function fixRoleConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing users table role constraint...\n');

    // Step 1: Drop the existing constraint
    console.log('Step 1: Dropping existing users_role_check constraint...');
    try {
      await client.query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS users_role_check;
      `);
      console.log('✅ Dropped existing constraint\n');
    } catch (error: any) {
      console.log(`⚠️  Warning: ${error.message}\n`);
    }

    // Step 2: Add new constraint with 'HR'
    console.log('Step 2: Adding new constraint with HR support...');
    await client.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('Admin', 'HR', 'Accountant', 'Employee', 'Management'));
    `);
    console.log('✅ Added new constraint with HR support\n');

    // Step 3: Verify the constraint
    console.log('Step 3: Verifying constraint...');
    const result = await client.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'users_role_check'
      AND conrelid = 'users'::regclass;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Constraint verified:');
      console.log(`   ${result.rows[0].constraint_definition}\n`);
    } else {
      console.log('❌ Constraint not found!\n');
    }

    // Step 4: Update any existing 'HR Manager' records to 'HR'
    console.log("Step 4: Updating existing 'HR Manager' records to 'HR'...");
    const updateResult = await client.query(`
      UPDATE users 
      SET role = 'HR' 
      WHERE role = 'HR Manager';
    `);
    console.log(`✅ Updated ${updateResult.rowCount} record(s)\n`);

    console.log('✅ Done! Role constraint now supports: Admin, HR, Accountant, Employee, Management');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixRoleConstraint()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

