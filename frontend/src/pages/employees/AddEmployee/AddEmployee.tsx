/**
 * Add Employee Page
 * 
 * Form page for adding a new employee to the system.
 * Uses React Hook Form + Zod for validation.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { employeeService } from '../../../services/api/employee.service';
import { getApiErrorMessage } from '../../../utils/errorHandler';
import styles from './AddEmployee.module.css';

// Form validation schema
const addEmployeeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  hireDate: z.string().min(1, 'Hire date is required'),
  basicSalary: z.number().min(0, 'Basic salary must be positive'),
  status: z.enum(['Active', 'Inactive', 'Terminated']).optional(),
});

type AddEmployeeFormData = z.infer<typeof addEmployeeSchema>;

export default function AddEmployee() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Account Access state
  const [createAccount, setCreateAccount] = useState(false);
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountRole, setAccountRole] = useState<'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management'>('Employee');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddEmployeeFormData>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      status: 'Active',
    },
  });

  const onSubmit = async (data: AddEmployeeFormData) => {
    try {
      setLoading(true);
      setError('');

      // Validate account fields if createAccount is enabled
      if (createAccount) {
        if (!accountUsername.trim()) {
          setError('Username is required when creating an account');
          setLoading(false);
          return;
        }
        if (!accountPassword.trim() || accountPassword.trim().length < 6) {
          setError('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
        if (!data.email?.trim()) {
          setError('Email is required to send account credentials');
          setLoading(false);
          return;
        }
      }

      // Create employee first
      const employeeResponse = await employeeService.create({
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        department: data.department,
        position: data.position,
        hireDate: new Date(data.hireDate),
        basicSalary: data.basicSalary,
        status: data.status || 'Active',
      });

      // Create account if checkbox is enabled
      if (createAccount && employeeResponse.success && employeeResponse.data) {
        try {
          await employeeService.createAccount(employeeResponse.data.id, {
            username: accountUsername.trim(),
            password: accountPassword,
            role: accountRole,
            email: data.email?.trim() || null,
          });
        } catch (accountError) {
          // Account creation failed, but employee was created
          console.error('Failed to create account:', accountError);
          setError('Employee created, but account creation failed. You can create the account later from Employee Details.');
          setLoading(false);
          return;
        }
      }

      // Show success card
      setShowSuccess(true);
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = getApiErrorMessage(err) || 'Failed to create employee';
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Hide success card and redirect after animation
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        navigate('/employees');
      }, 2500); // Hide after 2.5 seconds (animation duration ~2s + buffer)
      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate]);

  return (
    <div className={styles.addEmployeeContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Add New Employee</h2>
              <p className={styles.pageSubtitle}>Fill in the employee information below</p>
            </div>
            <button
              className={styles.backButton}
              onClick={() => navigate('/employees')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Employee List
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}

          {/* Success Card */}
          {showSuccess && (
            <div className={styles.successCard}>
              <div className={styles.successCircle}>
                <svg className={styles.checkmark} viewBox="0 0 52 52">
                  <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                  <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              <h3 className={styles.successTitle}>Employee Added Successfully!</h3>
              <p className={styles.successMessage}>The employee has been added to the system.</p>
            </div>
          )}

          {/* Form Card */}
          <div className={styles.formCard}>
            <form className={styles.employeeForm} onSubmit={handleSubmit(onSubmit)}>
              {/* Employee Information Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className={styles.sectionTitle}>Employee Information</h3>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="fullName" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    {...register('fullName')}
                    className={styles.formInput}
                    placeholder="Enter employee full name"
                  />
                  {errors.fullName && (
                    <span className={styles.errorText}>{errors.fullName.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register('email')}
                    className={styles.formInput}
                    placeholder="Enter email address (optional)"
                  />
                  {errors.email && (
                    <span className={styles.errorText}>{errors.email.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9842 21.5573 21.2126 21.3522 21.3979C21.1472 21.5832 20.9053 21.7212 20.6441 21.8021C20.3828 21.883 20.1081 21.9049 19.8382 21.8662C16.7425 21.4952 13.787 20.3686 11.19 18.5582C8.77382 16.8918 6.72533 14.7115 5.19 12.1682C3.3598 9.49541 2.21447 6.55408 1.83822 3.55822C1.79949 3.28834 1.82144 3.01359 1.90234 2.75235C1.98324 2.49111 2.12119 2.2492 2.30649 2.04419C2.49179 1.83918 2.72018 1.67564 2.97519 1.56404C3.2302 1.45244 3.50595 1.39547 3.78447 1.39659H6.78447C7.21228 1.39397 7.62771 1.55272 7.94356 1.83922C8.2594 2.12572 8.45142 2.51932 8.48447 2.94659C8.61641 4.43915 8.95021 5.90568 9.47447 7.29659C9.61214 7.64051 9.65658 8.01977 9.60247 8.39022C9.54836 8.76067 9.39782 9.10757 9.16822 9.39659L7.63822 10.9266C9.37369 13.442 11.5776 15.6459 14.0932 17.3813L15.6232 15.8513C15.9122 15.6217 16.2591 15.4711 16.6296 15.417C16.9999 15.3629 17.3792 15.4074 17.7232 15.545C19.1141 16.0692 20.5806 16.403 22.0732 16.535C22.5005 16.5682 22.8941 16.7604 23.1806 17.0764C23.4671 17.3924 23.6258 17.808 23.6232 18.2359L23.6232 18.2359Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    {...register('phone')}
                    className={styles.formInput}
                    placeholder="Enter phone number (optional)"
                  />
                  {errors.phone && (
                    <span className={styles.errorText}>{errors.phone.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="department" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Department *
                  </label>
                  <select
                    id="department"
                    {...register('department')}
                    className={styles.formInput}
                  >
                    <option value="">Select or enter department</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Management">Management</option>
                  </select>
                  {errors.department && (
                    <span className={styles.errorText}>{errors.department.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="position" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 21V17C16 15.8954 15.1046 15 14 15H10C8.89543 15 8 15.8954 8 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Position *
                  </label>
                  <select
                    id="position"
                    {...register('position')}
                    className={styles.formInput}
                  >
                    <option value="">Select or enter position</option>
                    <option value="Manager">Manager</option>
                    <option value="Developer">Developer</option>
                    <option value="Accountant">Accountant</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Sales Representative">Sales Representative</option>
                  </select>
                  {errors.position && (
                    <span className={styles.errorText}>{errors.position.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="basicSalary" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Basic Salary *
                  </label>
                  <input
                    type="number"
                    id="basicSalary"
                    {...register('basicSalary', { valueAsNumber: true })}
                    className={styles.formInput}
                    placeholder="Enter basic salary"
                    min="0"
                    step="0.01"
                  />
                  {errors.basicSalary && (
                    <span className={styles.errorText}>{errors.basicSalary.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="hireDate" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 14H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M11 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Hire Date *
                  </label>
                  <input
                    type="date"
                    id="hireDate"
                    {...register('hireDate')}
                    className={styles.formInput}
                  />
                  {errors.hireDate && (
                    <span className={styles.errorText}>{errors.hireDate.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="status" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Status
                  </label>
                  <select
                    id="status"
                    {...register('status')}
                    className={styles.formInput}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                  {errors.status && (
                    <span className={styles.errorText}>{errors.status.message}</span>
                  )}
                </div>
              </div>

              {/* Account Access Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className={styles.sectionTitle}>Account Access (Optional)</h3>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span>Create login account for this employee</span>
                  </label>
                  <p className={styles.helpText}>
                    If enabled, the employee will receive login credentials via email.
                  </p>
                </div>

                {createAccount && (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor="accountUsername" className={styles.formLabel}>
                        <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Username *
                      </label>
                      <input
                        type="text"
                        id="accountUsername"
                        value={accountUsername}
                        onChange={(e) => setAccountUsername(e.target.value)}
                        className={styles.formInput}
                        placeholder="Enter username (min. 3 characters)"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="accountPassword" className={styles.formLabel}>
                        <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 10C21 11.1 20.1 12 19 12H5C3.9 12 3 11.1 3 10V8C3 6.9 3.9 6 5 6H19C20.1 6 21 6.9 21 8V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7 10V14C7 15.1 7.9 16 9 16H15C16.1 16 17 15.1 17 14V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Password *
                      </label>
                      <input
                        type="password"
                        id="accountPassword"
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        className={styles.formInput}
                        placeholder="Enter password (min. 6 characters)"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="accountRole" className={styles.formLabel}>
                        <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Role *
                      </label>
                      <select
                        id="accountRole"
                        value={accountRole}
                        onChange={(e) => setAccountRole(e.target.value as typeof accountRole)}
                        className={styles.formInput}
                      >
                        <option value="Employee">Employee</option>
                        <option value="Admin">Administrator</option>
                        <option value="HR">HR Manager</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Save Employee
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => navigate('/employees')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

