/**
 * Test Email Sending
 * Tests sending an email via Resend to verify configuration
 */

import { EmailService } from '../src/infrastructure/email/EmailService';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  try {
    console.log('🧪 Testing email service...\n');

    // Check environment variables
    console.log('Environment Variables:');
    console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  RESEND_FROM: ${process.env.RESEND_FROM || '(not set, using default)'}`);
    console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL || '(not set, using default)'}\n`);

    // Initialize email service
    const emailService = new EmailService();

    // Test email - use command line argument if provided
    const testEmail = process.argv[2] || 'ahmadmahmouddev@gmail.com';
    console.log(`📧 Sending test email to: ${testEmail}\n`);

    await emailService.sendAccountCredentials({
      to: testEmail,
      fullName: 'Test User',
      username: 'Ahmad20000dev',
      password: 'ahmad2000dev',
    }, false);

    console.log('\n✅ Test email sent successfully!');
    console.log(`   Please check inbox/spam folder for: ${testEmail}`);

  } catch (error: any) {
    console.error('\n❌ Error sending test email:');
    console.error(`   Message: ${error.message}`);
    
    if (error.response) {
      console.error(`   Response: ${JSON.stringify(error.response, null, 2)}`);
    }
    
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
  }
}

testEmail();

