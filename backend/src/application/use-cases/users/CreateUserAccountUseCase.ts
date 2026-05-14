/**
 * Create User Account Use Case
 *
 * Creates a standalone user account (without requiring an employee).
 * Used for creating Admin, HR, Accountant, or Management accounts.
 */

import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { UserWithoutPassword } from '../../../domain/entities/User';
import { EmailService } from '../../../infrastructure/email/EmailService';

export interface CreateUserAccountRequest {
  username: string;
  password: string;
  role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
  email: string; // Required for sending credentials
  employeeId?: number | null; // Optional - can be null for Management, Admin, etc.
}

export interface CreateUserAccountResponse {
  user: UserWithoutPassword;
  emailSent: boolean;
}

export class CreateUserAccountUseCase {
  constructor(
    private userRepository: IUserRepository,
    private emailService: EmailService | null
  ) {}

  async execute(
    adminUserId: number,
    request: CreateUserAccountRequest
  ): Promise<CreateUserAccountResponse> {
    // Validate admin user
    const adminUser = await this.userRepository.findById(adminUserId);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    if (adminUser.role !== 'Admin') {
      throw new Error('Only Admins can create standalone user accounts');
    }

    // Validate email
    const emailToUse = request.email?.trim() || null;
    if (!emailToUse) {
      throw new Error('Email is required to send credentials');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      throw new Error('Invalid email format');
    }

    // If employeeId is provided, ensure employee doesn't already have an account
    if (request.employeeId) {
      const existingAccount = await this.userRepository.findByEmployeeId(request.employeeId);
      if (existingAccount) {
        throw new Error('Employee already has an account');
      }
    }

    // Validate username uniqueness
    const existingUser = await this.userRepository.findByUsername(request.username.trim());
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(request.password, 10);

    // Create user account
    const newUser = await this.userRepository.create({
      username: request.username.trim(),
      passwordHash,
      role: request.role,
      employeeId: request.employeeId || null,
    });

    // Send email with credentials
    let emailSent = false;
    if (this.emailService) {
      try {
        await this.emailService.sendAccountCredentials(
          {
            to: emailToUse,
            fullName: request.username, // Use username as fullName if no employee
            username: request.username,
            password: request.password,
          },
          false // isUpdate = false
        );
        emailSent = true;
        console.log(`✅ Account credentials email sent to ${emailToUse}`);
      } catch (emailError: any) {
        console.error('❌ Failed to send account credentials email:', emailError.message);
        // Don't fail the request if email fails
        emailSent = false;
      }
    }

    return {
      user: newUser,
      emailSent,
    };
  }
}

