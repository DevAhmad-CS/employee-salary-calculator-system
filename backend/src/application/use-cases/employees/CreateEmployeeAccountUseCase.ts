/**
 * Create Employee Account Use Case
 *
 * Creates a login account for an existing employee and sends credentials via email.
 */

import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { UserWithoutPassword } from '../../../domain/entities/User';
import { EmailService } from '../../../infrastructure/email/EmailService';

export interface CreateEmployeeAccountRequest {
  employeeId: number;
  username: string;
  password: string;
  role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
  email?: string | null;
}

export interface CreateEmployeeAccountResponse {
  user: UserWithoutPassword;
  emailSent: boolean;
}

export class CreateEmployeeAccountUseCase {
  constructor(
    private userRepository: IUserRepository,
    private employeeRepository: IEmployeeRepository,
    private emailService: EmailService | null
  ) {}

  async execute(
    adminUserId: number,
    request: CreateEmployeeAccountRequest
  ): Promise<CreateEmployeeAccountResponse> {
    // Validate admin user
    const adminUser = await this.userRepository.findById(adminUserId);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    if (adminUser.role !== 'Admin' && adminUser.role !== 'HR') {
      throw new Error('Only Admins or HR Managers can create user accounts');
    }

    // Validate employee
    const employee = await this.employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const emailToUse = request.email?.trim() || employee.email || null;
    
    console.log(`📧 Create account email check:`);
    console.log(`   Request email: ${request.email || '(not provided)'}`);
    console.log(`   Employee email: ${employee.email || '(not set)'}`);
    console.log(`   Email to use: ${emailToUse || '(NONE - will throw error)'}`);
    
    if (!emailToUse) {
      throw new Error('Employee email is required to send credentials');
    }

    // Ensure employee does not already have an account
    const existingAccount = await this.userRepository.findByEmployeeId(request.employeeId);
    if (existingAccount) {
      throw new Error('Employee already has an account');
    }
    if (request.email !== undefined) {
      const normalizedEmail = request.email?.trim() || null;
      if (normalizedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          throw new Error('Invalid email format');
        }
        await this.employeeRepository.update(request.employeeId, {
          email: normalizedEmail,
        });
      }
    }


    // Validate username uniqueness
    const existingUser = await this.userRepository.findByUsername(request.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Validate password
    if (!request.password || request.password.trim().length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(request.password, saltRounds);

    // Create user
    const user = await this.userRepository.create({
      username: request.username,
      passwordHash,
      role: request.role,
      employeeId: request.employeeId,
    });

    // Send email with credentials
    let emailSent = false;
    console.log(`\n📧 EMAIL SENDING ATTEMPT:`);
    console.log(`   Email service available: ${!!this.emailService}`);
    console.log(`   Email address: ${emailToUse}`);
    console.log(`   Employee: ${employee.fullName} (ID: ${employee.id})`);
    console.log(`   Username: ${request.username}`);
    
    if (this.emailService) {
      try {
        console.log(`📧 Attempting to send account credentials email to: ${emailToUse}`);
        await this.emailService.sendAccountCredentials({
          to: emailToUse,
          fullName: employee.fullName,
          username: request.username,
          password: request.password,
        }, false); // isUpdate = false (new account)
        emailSent = true;
        console.log(`✅ Account credentials email sent successfully to: ${emailToUse}`);
        console.log(`   Email should arrive within a few minutes.`);
        console.log(`   If not received, check spam/junk folder.\n`);
      } catch (error: any) {
        console.error(`❌ Failed to send account email to ${emailToUse}:`, error.message);
        console.error('   Full error:', error);
        console.error('   Error stack:', error.stack);
        // Don't throw - account is created, email is optional
      }
    } else {
      console.warn('⚠️  Email service is not configured. Skipping email delivery.');
      console.warn('   Please check SMTP settings in .env file (SMTP_HOST, SMTP_USER, SMTP_PASS).\n');
    }

    return { user, emailSent };
  }
}

