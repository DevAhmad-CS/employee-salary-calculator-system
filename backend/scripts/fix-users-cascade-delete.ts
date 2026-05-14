/**
 * Fix Users Cascade Delete
 * Changes users.employee_id foreign key from SET NULL to CASCADE DELETE
 */

import { pool } from '../src/infrastructure/database/postgres/connection';
import dotenv from 'dotenv';

dotenv.config();

async function fixUsersCascadeDelete() {
  try {
    console.log('🔧 Fixing users.employee_id foreign key to CASCADE DELETE...\n');

    // First, check current constraint name
    const checkQuery = `
      SELECT 
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name 
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND kcu.column_name = 'employee_id'
        AND tc.table_name = 'users';
    `;

    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length === 0) {
      console.log('⚠️  No foreign key constraint found on users.employee_id');
      await pool.end();
      return;
    }

    const constraintName = checkResult.rows[0].constraint_name;
    console.log(`Found constraint: ${constraintName}`);

    // Drop existing foreign key constraint
    console.log('Dropping existing constraint...');
    const dropQuery = `ALTER TABLE users DROP CONSTRAINT IF EXISTS ${constraintName}`;
    await pool.query(dropQuery);
    console.log('✅ Constraint dropped');

    // Create new foreign key constraint with CASCADE DELETE
    console.log('Creating new constraint with CASCADE DELETE...');
    const createQuery = `
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_employee 
      FOREIGN KEY (employee_id) 
      REFERENCES employees(id) 
      ON DELETE CASCADE;
    `;
    await pool.query(createQuery);
    console.log('✅ New constraint created with CASCADE DELETE');

    // Verify the change
    console.log('\n🔍 Verifying change...');
    const verifyQuery = `
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name, 
        rc.delete_rule 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name 
      JOIN information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name 
      JOIN information_schema.referential_constraints AS rc 
        ON rc.constraint_name = tc.constraint_name 
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND kcu.column_name = 'employee_id'
        AND tc.table_name = 'users';
    `;

    const verifyResult = await pool.query(verifyQuery);

    if (verifyResult.rows.length > 0) {
      const row = verifyResult.rows[0];
      console.log(`Table: ${row.table_name}`);
      console.log(`Column: ${row.column_name}`);
      console.log(`References: ${row.foreign_table_name}`);
      console.log(`Delete Rule: ${row.delete_rule}`);
      
      if (row.delete_rule === 'CASCADE') {
        console.log('\n✅ SUCCESS! User accounts will now be deleted when employee is deleted.');
      } else {
        console.log(`\n⚠️  Delete rule is still ${row.delete_rule}, not CASCADE`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

fixUsersCascadeDelete();

