/**
 * Email Service
 *
 * Sends transactional emails using SMTP via nodemailer.
 */

import nodemailer from 'nodemailer';

interface AccountEmailPayload {
  to: string;
  fullName: string;
  username: string;
  password: string;
}

interface SalarySlipEmailPayload {
  to: string;
  fullName: string;
  month: number;
  year: number;
  netSalary: number;
  slipId?: number;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;
  private frontendUrl: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    if (!host || !user || !pass) {
      throw new Error(
        `SMTP configuration is missing. Required: SMTP_HOST, SMTP_USER, SMTP_PASS. ` +
        `Found: HOST=${!!host}, USER=${!!user}, PASS=${!!pass}`
      );
    }

    const secure = port === 465;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      // Add timeout and connection retry settings
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
    });

    this.fromAddress = process.env.SMTP_FROM || user;
    this.frontendUrl = frontendUrl;
    
    console.log('✅ Email service initialized with SMTP');
    console.log(`   Host: ${host}:${port}`);
    console.log(`   User: ${user}`);
    console.log(`   From address: ${this.fromAddress}`);
    console.log(`   Frontend URL: ${this.frontendUrl}`);
    console.log(`   Secure (SSL): ${secure}`);
  }

  async sendAccountCredentials(payload: AccountEmailPayload, isUpdate: boolean = false): Promise<void> {
    const loginUrl = `${this.frontendUrl}/login`;
    const showPassword = payload.password !== '********' && payload.password.trim().length > 0;

    const subject = isUpdate 
      ? 'Your Employee Salary System Account Has Been Updated' 
      : 'Your Employee Salary System Account';

    const textLines = [
      `Hello ${payload.fullName},`,
      '',
      isUpdate 
        ? 'Your account has been updated in the Employee Salary System.'
        : 'Your account has been created for the Employee Salary System.',
      `Username: ${payload.username}`,
    ];

    if (showPassword) {
      textLines.push(`Password: ${payload.password}`);
    }

    textLines.push(
      '',
      `Login here: ${loginUrl}`,
      ''
    );

    if (showPassword) {
      textLines.push('Please change your password after your first login.');
    } else if (isUpdate) {
      textLines.push('If you did not request this change, please contact your administrator.');
    }

    const text = textLines.join('\n');

    let htmlPasswordSection = '';
    if (showPassword) {
      htmlPasswordSection = `<p><strong>Password:</strong> ${payload.password}</p>`;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">${isUpdate ? 'Account Updated' : 'Welcome'}, ${payload.fullName}</h2>
        <p>${isUpdate ? 'Your account has been updated in the Employee Salary System.' : 'Your account has been created for the Employee Salary System.'}</p>
        <p><strong>Username:</strong> ${payload.username}</p>
        ${htmlPasswordSection}
        <p>
          <a href="${loginUrl}" style="color: #2563eb;">Login to your account</a>
        </p>
        ${showPassword ? '<p>Please change your password after your first login.</p>' : ''}
        ${isUpdate && !showPassword ? '<p>If you did not request this change, please contact your administrator.</p>' : ''}
      </div>
    `;

    console.log(`📧 Sending email via SMTP to: ${payload.to}`);
    console.log(`   From: ${this.fromAddress}`);
    console.log(`   Subject: ${subject}`);

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.to,
        subject,
        text,
        html,
      });
      console.log(`✅ Email sent successfully via SMTP`);
      console.log(`   Message ID: ${info.messageId || 'N/A'}`);
      console.log(`   To: ${payload.to}`);
      console.log(`   Subject: ${subject}`);
    } catch (error: any) {
      console.error('❌ SMTP (Nodemailer) error:', error.message);
      console.error('   Error code:', error.code || 'N/A');
      console.error('   Error details:', JSON.stringify(error, null, 2));
      
      // Provide more helpful error messages
      if (error.code === 'EAUTH') {
        throw new Error('SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS (App Password for Gmail).');
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        throw new Error(`SMTP connection failed. Please check SMTP_HOST (${process.env.SMTP_HOST}) and SMTP_PORT (${process.env.SMTP_PORT}).`);
      } else if (error.responseCode === 535) {
        throw new Error('SMTP authentication failed. For Gmail, make sure you are using an App Password, not your regular password.');
      }
      throw error;
    }
  }

  /**
   * Sends email notification when a salary slip is generated
   */
  async sendSalarySlipNotification(payload: SalarySlipEmailPayload): Promise<void> {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[payload.month - 1] || payload.month.toString();
    const slipsUrl = `${this.frontendUrl}/salary-slips`;
    const slipUrl = payload.slipId ? `${this.frontendUrl}/salary-slips/${payload.slipId}` : slipsUrl;

    const subject = `Your Salary Slip for ${monthName} ${payload.year}`;

    const text = [
      `Hello ${payload.fullName},`,
      '',
      `Your salary slip for ${monthName} ${payload.year} has been generated.`,
      `Net Salary: $${payload.netSalary.toFixed(2)}`,
      '',
      `View your salary slip: ${slipUrl}`,
      '',
      'Thank you!',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Salary Slip Generated</h2>
        <p>Hello ${payload.fullName},</p>
        <p>Your salary slip for <strong>${monthName} ${payload.year}</strong> has been generated.</p>
        <p><strong>Net Salary:</strong> $${payload.netSalary.toFixed(2)}</p>
        <p>
          <a href="${slipUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            View Your Salary Slip
          </a>
        </p>
        <p>Thank you!</p>
      </div>
    `;

    console.log(`📧 Sending salary slip notification email via SMTP to: ${payload.to}`);
    console.log(`   Subject: ${subject}`);

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.to,
        subject,
        text,
        html,
      });
      console.log(`✅ Salary slip notification email sent successfully via SMTP`);
      console.log(`   Message ID: ${info.messageId || 'N/A'}`);
      console.log(`   To: ${payload.to}`);
    } catch (error: any) {
      console.error('❌ SMTP (Nodemailer) error (Salary Slip):', error.message);
      console.error('   Error code:', error.code || 'N/A');
      console.error('   Error details:', JSON.stringify(error, null, 2));
      
      // Provide more helpful error messages
      if (error.code === 'EAUTH') {
        throw new Error('SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS (App Password for Gmail).');
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        throw new Error(`SMTP connection failed. Please check SMTP_HOST (${process.env.SMTP_HOST}) and SMTP_PORT (${process.env.SMTP_PORT}).`);
      } else if (error.responseCode === 535) {
        throw new Error('SMTP authentication failed. For Gmail, make sure you are using an App Password, not your regular password.');
      }
      throw error;
    }
  }
}

