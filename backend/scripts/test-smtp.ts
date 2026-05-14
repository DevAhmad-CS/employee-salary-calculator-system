/**
 * Test SMTP Email Configuration
 * 
 * This script tests the SMTP email configuration by sending a test email.
 * Run: npm run test-smtp
 */

import dotenv from 'dotenv';
import { EmailService } from '../src/infrastructure/email/EmailService';
import path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testSMTP() {
  console.log('\n🧪 Testing SMTP Email Configuration...\n');
  console.log('==========================================\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('--------------------------------');
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : undefined;
  const smtpFrom = process.env.SMTP_FROM;
  const resendApiKey = process.env.RESEND_API_KEY ? '***' + process.env.RESEND_API_KEY.slice(-4) : undefined;

  console.log(`SMTP_HOST: ${smtpHost || '❌ MISSING'}`);
  console.log(`SMTP_PORT: ${smtpPort || '❌ MISSING'}`);
  console.log(`SMTP_USER: ${smtpUser || '❌ MISSING'}`);
  console.log(`SMTP_PASS: ${smtpPass || '❌ MISSING'}`);
  console.log(`SMTP_FROM: ${smtpFrom || '❌ MISSING (will use SMTP_USER)'}`);
  console.log(`RESEND_API_KEY: ${resendApiKey || '✅ NOT SET (SMTP will be used)'}`);
  console.log('');

  // Check if RESEND_API_KEY is set
  if (resendApiKey) {
    console.log('⚠️  WARNING: RESEND_API_KEY is set. Email service will use Resend, not SMTP.');
    console.log('   To use SMTP, comment out or remove RESEND_API_KEY from .env file.\n');
  }

  // Check required SMTP variables
  if (!smtpHost || !smtpUser || !process.env.SMTP_PASS) {
    console.error('❌ ERROR: SMTP configuration is incomplete.');
    console.error('   Required variables: SMTP_HOST, SMTP_USER, SMTP_PASS\n');
    process.exit(1);
  }

  try {
    // Initialize EmailService
    console.log('🔧 Initializing EmailService...');
    const emailService = new EmailService();
    console.log('✅ EmailService initialized successfully\n');

    // Get test email from command line argument or use SMTP_USER
    const testEmail = process.argv[2] || smtpUser;
    if (!testEmail) {
      console.error('❌ ERROR: No test email address provided.');
      console.error('   Usage: npm run test-smtp <test-email@example.com>');
      console.error('   Or provide SMTP_USER in .env file\n');
      process.exit(1);
    }

    // Send test email
    console.log('📧 Sending test email...');
    console.log(`   To: ${testEmail}`);
    console.log('');

    await emailService.sendAccountCredentials({
      to: testEmail,
      fullName: 'Test User',
      username: 'testuser',
      password: 'testpass123',
    });

    console.log('\n✅ SUCCESS! Test email sent successfully!');
    console.log(`   Please check your inbox (and spam folder) at: ${testEmail}\n`);
  } catch (error: any) {
    console.error('\n❌ ERROR: Failed to send test email');
    console.error('-----------------------------------\n');
    console.error('Error message:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.responseCode) {
      console.error('SMTP response code:', error.responseCode);
    }

    console.error('\n💡 Common Issues:');
    console.error('   1. For Gmail: Make sure you are using an App Password, not your regular password');
    console.error('      → Create one at: https://myaccount.google.com/apppasswords');
    console.error('   2. Check SMTP_HOST and SMTP_PORT are correct');
    console.error('      → Gmail: smtp.gmail.com:587 (TLS) or smtp.gmail.com:465 (SSL)');
    console.error('   3. Make sure 2-Step Verification is enabled in your Google Account');
    console.error('   4. Check firewall/network settings');
    console.error('   5. Verify RESEND_API_KEY is commented out/removed from .env\n');
    
    process.exit(1);
  }
}

testSMTP();

