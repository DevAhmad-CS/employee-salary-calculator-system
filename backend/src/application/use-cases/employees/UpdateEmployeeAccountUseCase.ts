/**
 * Update Employee Account Use Case
 *
 * Updates login account details for an existing employee.
 */

import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { UserWithoutPassword } from '../../../domain/entities/User';
import { EmailService } from '../../../infrastructure/email/EmailService';

export interface UpdateEmployeeAccountRequest {
  employeeId: number;
  username?: string;
  password?: string;
  role?: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
  email?: string | null;
}

export interface UpdateEmployeeAccountResponse {
  user: UserWithoutPassword;
  emailSent: boolean;
}

export class UpdateEmployeeAccountUseCase {
  constructor(
    private userRepository: IUserRepository,
    private employeeRepository: IEmployeeRepository,
    private emailService: EmailService | null
  ) {}

  async execute(
    adminUserId: number,
    request: UpdateEmployeeAccountRequest
  ): Promise<UpdateEmployeeAccountResponse> {
    const adminUser = await this.userRepository.findById(adminUserId);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    if (adminUser.role !== 'Admin' && adminUser.role !== 'HR') {
      throw new Error('Only admins or HR managers can update user accounts');
    }

    const employee = await this.employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const existingAccount = await this.userRepository.findByEmployeeId(request.employeeId);
    if (!existingAccount) {
      throw new Error('Employee account not found');
    }

    if (request.username) {
      const trimmedUsername = request.username.trim();
      if (!trimmedUsername) {
        throw new Error('Username cannot be empty');
      }
      const userWithSameUsername = await this.userRepository.findByUsername(trimmedUsername);
      if (userWithSameUsername && userWithSameUsername.id !== existingAccount.id) {
        throw new Error('Username already exists');
      }
    }

    if (request.password && request.password.trim().length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (request.email !== undefined) {
      const normalizedEmail = request.email?.trim() || null;
      if (normalizedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          throw new Error('Invalid email format');
        }
      }
      await this.employeeRepository.update(request.employeeId, {
        email: normalizedEmail,
      });
    }

    const updatedUser = await this.userRepository.update(existingAccount.id, {
      username: request.username?.trim(),
      role: request.role,
      employeeId: request.employeeId,
    });

    if (request.password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(request.password, saltRounds);
      await this.userRepository.updatePassword(existingAccount.id, passwordHash);
    }

    let emailSent = false;
    const emailToUse = request.email?.trim() || employee.email || null;
    
    console.log(`📧 Update account email check:`);
    console.log(`   Request email: ${request.email || '(not provided)'}`);
    console.log(`   Employee email: ${employee.email || '(not set)'}`);
    console.log(`   Email to use: ${emailToUse || '(NONE - email will not be sent)'}`);
    console.log(`   Has updates: ${!!(request.username || request.password || request.role)}`);
    console.log(`   Email service available: ${!!this.emailService}`);
    
    // Send email if any account details were updated and email service is available
    const hasUpdates = !!(request.username || request.password || request.role);
    if (hasUpdates && emailToUse && this.emailService) {
      try {
        console.log(`📧 Attempting to send account update email to: ${emailToUse}`);
        
        // Use updated password if provided, otherwise use placeholder that won't be shown
        const passwordToSend = request.password || '********';
        
        await this.emailService.sendAccountCredentials(
          {
            to: emailToUse,
            fullName: employee.fullName,
            username: request.username?.trim() || updatedUser.username,
            password: passwordToSend,
          },
          true // isUpdate = true
        );
        emailSent = true;
        console.log(`✅ Account update email sent successfully to: ${emailToUse}`);
      } catch (error: any) {
        console.error(`❌ Failed to send account update email to ${emailToUse}:`, error.message);
        console.error('   Full error:', error);
        // Don't throw - account is updated, email is optional
      }
    }

    return { user: updatedUser, emailSent };
  }
}

