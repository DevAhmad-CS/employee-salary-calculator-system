/**
 * Check Cascade Delete Configuration
 * Verifies if foreign keys have CASCADE DELETE set up correctly
 */

import { pool } from '../src/infrastructure/database/postgres/connection';
import dotenv from 'dotenv';

dotenv.config();

async function checkCascadeDelete() {
  try {
    const query = `
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
        AND ccu.table_name = 'employees' 
      ORDER BY tc.table_name;
    `;

    const result = await pool.query(query);

    console.log('\n🔍 Foreign Keys referencing employees table:');
    console.log('===========================================\n');

    if (result.rows.length === 0) {
      console.log('⚠️  NO FOREIGN KEYS FOUND - CASCADE DELETE NOT CONFIGURED!');
      console.log('   This means related records will NOT be deleted automatically.\n');
    } else {
      let hasCascade = false;
      let hasNoCascade = false;

      result.rows.forEach((row: any) => {
        const status = row.delete_rule === 'CASCADE' ? '✅ CASCADE' : `❌ ${row.delete_rule}`;
        console.log(`Table: ${row.table_name}`);
        console.log(`  Column: ${row.column_name}`);
        console.log(`  Delete Rule: ${row.delete_rule}`);
        console.log(`  Status: ${status}\n`);

        if (row.delete_rule === 'CASCADE') {
          hasCascade = true;
        } else {
          hasNoCascade = true;
        }
      });

      if (hasCascade && !hasNoCascade) {
        console.log('✅ ALL foreign keys have CASCADE DELETE - Related records will be deleted automatically!');
      } else if (hasNoCascade) {
        console.log('⚠️  SOME foreign keys do NOT have CASCADE DELETE - Related records may remain in database!');
      }
    }

    // Check users table separately (different relationship)
    console.log('\n\n🔍 Users table (employee_id reference):');
    console.log('===========================================\n');

    const usersQuery = `
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

    const usersResult = await pool.query(usersQuery);
    
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach((row: any) => {
        console.log(`Table: ${row.table_name}`);
        console.log(`  Column: ${row.column_name}`);
        console.log(`  References: ${row.foreign_table_name}`);
        console.log(`  Delete Rule: ${row.delete_rule}\n`);
      });
    } else {
      console.log('ℹ️  Users table does not have foreign key constraint on employee_id');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkCascadeDelete();

