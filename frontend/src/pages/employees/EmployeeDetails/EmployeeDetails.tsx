/**
 * Employee Details Page
 * 
 * Displays detailed information about an employee.
 * Includes employee information, salary components summary, and action buttons.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { employeeService } from '../../../services/api/employee.service';
import type { Employee } from '../../../services/api/employee.service';
import { allowancesService } from '../../../services/api/allowances.service';
import { deductionsService } from '../../../services/api/deductions.service';
import { bonusesService } from '../../../services/api/bonuses.service';
import { useAuthStore } from '../../../services/state/authStore';
import { getApiErrorMessage } from '../../../utils/errorHandler';
import styles from './EmployeeDetails.module.css';

export default function EmployeeDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allowancesTotal, setAllowancesTotal] = useState(0);
  const [allowancesCount, setAllowancesCount] = useState(0);
  const [deductionsTotal, setDeductionsTotal] = useState(0);
  const [deductionsCount, setDeductionsCount] = useState(0);
  const [bonusesTotal, setBonusesTotal] = useState(0);
  const [bonusesCount, setBonusesCount] = useState(0);
  const [componentsLoading, setComponentsLoading] = useState(true);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountRole, setAccountRole] = useState<'Admin' | 'Accountant' | 'Employee' | 'Management' | 'HR'>('Employee');
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [accountEditMode, setAccountEditMode] = useState(false);

  // Fetch employee data
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) {
        setError('Invalid employee ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await employeeService.getById(parseInt(id));
        setEmployee(response.data);
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employee data';
        setError(axiosError?.response?.data?.error || errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  useEffect(() => {
    if (employee && !employee.userAccount) {
      setAccountUsername(employee.email || '');
      setAccountEmail(employee.email || '');
      setAccountRole('Employee');
    }
    if (employee && employee.userAccount) {
      setAccountUsername(employee.userAccount.username || '');
      setAccountEmail(employee.email || '');
      setAccountRole(employee.userAccount.role);
    }
  }, [employee]);

  // Fetch salary components data
  useEffect(() => {
    const fetchComponents = async () => {
      if (!id || !employee) return;

      try {
        setComponentsLoading(true);
        
        // Fetch allowances
        try {
          const allowancesResponse = await allowancesService.getByEmployeeId(parseInt(id));
          if (allowancesResponse.success && allowancesResponse.data) {
            const total = allowancesResponse.data.reduce((sum, a) => sum + a.amount, 0);
            setAllowancesTotal(total);
            setAllowancesCount(allowancesResponse.data.length);
          }
        } catch {
          // Skip if error
        }

        // Fetch deductions
        try {
          const deductionsResponse = await deductionsService.getByEmployeeId(parseInt(id));
          if (deductionsResponse.success && deductionsResponse.data) {
            const total = deductionsResponse.data.reduce((sum, d) => sum + d.amount, 0);
            setDeductionsTotal(total);
            setDeductionsCount(deductionsResponse.data.length);
          }
        } catch {
          // Skip if error
        }

        // Fetch bonuses
        try {
          const bonusesResponse = await bonusesService.getByEmployeeId(parseInt(id));
          if (bonusesResponse.success && bonusesResponse.data) {
            const total = bonusesResponse.data.reduce((sum, b) => sum + b.amount, 0);
            setBonusesTotal(total);
            setBonusesCount(bonusesResponse.data.length);
          }
        } catch {
          // Skip if error
        }
      } catch (err: unknown) {
        console.error('Error fetching salary components:', err);
      } finally {
        setComponentsLoading(false);
      }
    };

    fetchComponents();
  }, [id, employee]);

  // Handle delete click - show confirmation card
  const handleDeleteClick = () => {
    if (!id || !employee) return;
    setShowDeleteConfirm(true);
  };

  // Handle delete confirmation - actually delete the employee
  const handleDeleteConfirm = async () => {
    if (!id || !employee) return;

    try {
      await employeeService.delete(parseInt(id));
      // Close confirmation card
      setShowDeleteConfirm(false);
      // Show success card
      setShowDeleteSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete employee';
      alert(axiosError?.response?.data?.error || errorMessage);
      setShowDeleteConfirm(false);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleCreateAccount = async () => {
    if (!employee) return;
    setAccountError('');
    setAccountSuccess('');

    if (!accountEmail.trim() || !accountUsername.trim() || !accountPassword.trim()) {
      setAccountError('Email, username, and password are required');
      return;
    }

    if (accountPassword.trim().length < 6) {
      setAccountError('Password must be at least 6 characters long');
      return;
    }

    try {
      setAccountSubmitting(true);
      const response = await employeeService.createAccount(employee.id, {
        username: accountUsername.trim(),
        password: accountPassword,
        role: accountRole,
        email: accountEmail.trim(),
      });

      const emailStatus = response.data.emailSent
        ? 'Account created and email sent successfully. Please check spam/junk folder if not received.'
        : 'Account created, but email delivery failed. Please check server logs for details.';

      setEmployee({
        ...employee,
        userAccount: response.data.user,
        email: accountEmail.trim(),
      });
      setAccountPassword('');
      setAccountSuccess(emailStatus);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) || 'Failed to create account';
      setAccountError(message);
    } finally {
      setAccountSubmitting(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!employee || !employee.userAccount) return;
    setAccountError('');
    setAccountSuccess('');

    if (!accountEmail.trim() || !accountUsername.trim()) {
      setAccountError('Email and username are required');
      return;
    }

    if (accountPassword.trim() && accountPassword.trim().length < 6) {
      setAccountError('Password must be at least 6 characters long');
      return;
    }

    try {
      setAccountSubmitting(true);
      const response = await employeeService.updateAccount(employee.id, {
        username: accountUsername.trim(),
        role: accountRole,
        password: accountPassword.trim() ? accountPassword : undefined,
        email: accountEmail.trim(),
      });

      const emailStatus = response.data.emailSent
        ? 'Account updated and email sent successfully. Please check spam/junk folder if not received.'
        : 'Account updated successfully.';

      setEmployee({
        ...employee,
        userAccount: response.data.user,
        email: accountEmail.trim(),
      });
      setAccountPassword('');
      setAccountEditMode(false);
      setAccountSuccess(emailStatus);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) || 'Failed to update account';
      setAccountError(message);
    } finally {
      setAccountSubmitting(false);
    }
  };

  // Hide success card and redirect after animation
  useEffect(() => {
    if (showDeleteSuccess) {
      const timer = setTimeout(() => {
        setShowDeleteSuccess(false);
        navigate('/employees');
      }, 2500); // Hide after 2.5 seconds (animation duration ~2s + buffer)
      return () => clearTimeout(timer);
    }
  }, [showDeleteSuccess, navigate]);

  // Format employee ID
  const formatEmployeeId = (id: number) => {
    return `EMP${String(id).padStart(3, '0')}`;
  };

  // Format salary
  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(salary);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  };

  if (loading) {
    return (
      <div className={styles.employeeDetailsContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.loadingMessage}>
              <p>Loading employee data...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className={styles.employeeDetailsContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.errorMessage}>
              <p>{error || 'Employee not found'}</p>
              <button
                className={styles.backButton}
                onClick={() => navigate('/employees')}
              >
                Back to Employee List
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.employeeDetailsContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        
        <main className={styles.mainContent}>
          {/* Delete Confirmation Card */}
          {showDeleteConfirm && employee && (
            <div className={styles.confirmCard}>
              <div className={styles.confirmCardOverlay} onClick={handleDeleteCancel}></div>
              <div className={styles.confirmCardContent}>
                <div className={styles.confirmCardIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.confirmCardTitle}>Confirm Deletion</h3>
                <p className={styles.confirmCardMessage}>
                  Are you sure you want to delete <strong>{employee.fullName}</strong>? This action cannot be undone.
                </p>
                <div className={styles.confirmCardActions}>
                  <button
                    className={styles.confirmCancelButton}
                    onClick={handleDeleteCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.confirmDeleteButton}
                    onClick={handleDeleteConfirm}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Success Card */}
          {showDeleteSuccess && (
            <div className={styles.successCard}>
              <div className={styles.successCircle}>
                <svg className={styles.checkmark} viewBox="0 0 52 52">
                  <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                  <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              <h3 className={styles.successTitle}>Employee Deleted Successfully!</h3>
              <p className={styles.successMessage}>The employee has been removed from the system.</p>
            </div>
          )}

          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Employee Details</h2>
              <p className={styles.employeeNameDisplay}>
                <svg className={styles.employeeIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {employee.fullName} - <span className={styles.employeeIdBadge}>{formatEmployeeId(employee.id)}</span>
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.backButton}
                onClick={() => navigate('/employees')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to List
              </button>
              <button
                className={styles.editButton}
                onClick={() => navigate(`/employees/${employee.id}/edit`)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit
              </button>
              <button
                className={styles.deleteButton}
                onClick={handleDeleteClick}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete
              </button>
            </div>
          </div>

          {/* Employee Information Card */}
          <div className={styles.infoCard}>
            <div className={styles.cardHeaderSection}>
              <svg className={styles.sectionIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className={styles.cardTitle}>Employee Information</h3>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabelWrapper}>
                  <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.infoLabel}>Employee ID</span>
                </div>
                <span className={styles.infoValue}>{formatEmployeeId(employee.id)}</span>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabelWrapper}>
                  <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.infoLabel}>Name</span>
                </div>
                <span className={styles.infoValue}>{employee.fullName}</span>
              </div>
              {employee.email && (
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Email</span>
                  </div>
                  <span className={styles.infoValue}>{employee.email}</span>
                </div>
              )}
              {employee.phone && (
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9842 21.5573 21.2126 21.3522 21.3979C21.1472 21.5832 20.9053 21.7212 20.6441 21.8021C20.3828 21.883 20.1081 21.9049 19.8382 21.8662C16.7425 21.4952 13.787 20.3686 11.19 18.5582C8.77382 16.8918 6.72533 14.7115 5.19 12.1682C3.3598 9.49541 2.21447 6.55408 1.83822 3.55822C1.79949 3.28834 1.82144 3.01359 1.90234 2.75235C1.98324 2.49111 2.12119 2.2492 2.30649 2.04419C2.49179 1.83918 2.72018 1.67564 2.97519 1.56404C3.2302 1.45244 3.50595 1.39547 3.78447 1.39659H6.78447C7.21228 1.39397 7.62771 1.55272 7.94356 1.83922C8.2594 2.12572 8.45142 2.51932 8.48447 2.94659C8.61641 4.43915 8.95021 5.90568 9.47447 7.29659C9.61214 7.64051 9.65658 8.01977 9.60247 8.39022C9.54836 8.76067 9.39782 9.10757 9.16822 9.39659L7.63822 10.9266C9.37369 13.442 11.5776 15.6459 14.0932 17.3813L15.6232 15.8513C15.9122 15.6217 16.2591 15.4711 16.6296 15.417C16.9999 15.3629 17.3792 15.4074 17.7232 15.545C19.1141 16.0692 20.5806 16.403 22.0732 16.535C22.5005 16.5682 22.8941 16.7604 23.1806 17.0764C23.4671 17.3924 23.6258 17.808 23.6232 18.2359L23.6232 18.2359Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Phone</span>
                  </div>
                  <span className={styles.infoValue}>{employee.phone}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <div className={styles.infoLabelWrapper}>
                  <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.infoLabel}>Department</span>
                </div>
                <span className={styles.infoValue}>
                  <span className={`${styles.badge} ${styles[`badge-${employee.department.toLowerCase().replace(/\s+/g, '-')}`] || styles.badgeDefault}`}>
                    {employee.department}
                  </span>
                </span>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabelWrapper}>
                  <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 21V17C16 15.8954 15.1046 15 14 15H10C8.89543 15 8 15.8954 8 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.infoLabel}>Position</span>
                </div>
                <span className={styles.infoValue}>{employee.position}</span>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabelWrapper}>
                  <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.infoLabel}>Basic Salary</span>
                </div>
                <span className={`${styles.infoValue} ${styles.salaryValue}`}>{formatSalary(employee.basicSalary)}</span>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabelWrapper}>
                  <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.infoLabel}>Hire Date</span>
                </div>
                <span className={styles.infoValue}>{formatDate(employee.hireDate)}</span>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabelWrapper}>
                  <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.infoLabel}>Status</span>
                </div>
                <span className={styles.infoValue}>
                  <span className={`${styles.statusBadge} ${styles[`status-${employee.status.toLowerCase()}`]}`}>
                    {employee.status}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Account Access Card - Hidden for Accountant and HR */}
          {user?.role !== 'Accountant' && user?.role !== 'HR' && (
            <div className={styles.accountCard}>
            <div className={styles.cardHeaderSection}>
              <svg className={styles.sectionIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className={styles.cardTitle}>Account Access</h3>
            </div>

            {accountError && (
              <div className={styles.accountError}>{accountError}</div>
            )}

            {accountSuccess && (
              <div className={styles.accountSuccess}>{accountSuccess}</div>
            )}

            {employee.userAccount && !accountEditMode && (
              <div className={styles.accountInfo}>
                <div className={styles.accountInfoRow}>
                  <span className={styles.accountLabel}>Email</span>
                  <span className={styles.accountValue}>{employee.email || '-'}</span>
                </div>
                <div className={styles.accountInfoRow}>
                  <span className={styles.accountLabel}>Username</span>
                  <span className={styles.accountValue}>{employee.userAccount.username}</span>
                </div>
                <div className={styles.accountInfoRow}>
                  <span className={styles.accountLabel}>Role</span>
                  <span className={styles.accountValue}>{employee.userAccount.role}</span>
                </div>
                <p className={styles.accountNote}>
                  Use "Edit Account Access" to update username, role, or reset password.
                </p>
                <div className={styles.accountActions}>
                  <button
                    className={styles.secondaryActionButton}
                    onClick={() => setAccountEditMode(true)}
                  >
                    Edit Account Access
                  </button>
                </div>
              </div>
            )}

            {(!employee.userAccount || accountEditMode) && (
              <div className={styles.accountForm}>
                <div className={styles.accountGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="account-email">
                      Email
                    </label>
                    <input
                      id="account-email"
                      type="email"
                      className={styles.formInput}
                      value={accountEmail}
                      onChange={(event) => setAccountEmail(event.target.value)}
                      placeholder="Enter email address"
                      disabled={accountSubmitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="account-username">
                      Username
                    </label>
                    <input
                      id="account-username"
                      type="text"
                      className={styles.formInput}
                      value={accountUsername}
                      onChange={(event) => setAccountUsername(event.target.value)}
                      placeholder="Enter username"
                      disabled={accountSubmitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="account-password">
                      {employee.userAccount ? 'New Password (optional)' : 'Password'}
                    </label>
                    <input
                      id="account-password"
                      type="password"
                      className={styles.formInput}
                      value={accountPassword}
                      onChange={(event) => setAccountPassword(event.target.value)}
                      placeholder={employee.userAccount ? 'Enter new password to reset' : 'Enter password'}
                      disabled={accountSubmitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="account-role">
                      Role
                    </label>
                    <select
                      id="account-role"
                      className={styles.formInput}
                      value={accountRole}
                      onChange={(event) => setAccountRole(event.target.value as typeof accountRole)}
                      disabled={accountSubmitting}
                    >
                      <option value="Admin">Administrator</option>
                      <option value="HR">HR Manager</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Employee">Employee</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>

                <div className={styles.accountActions}>
                  {employee.userAccount ? (
                    <>
                      <button
                        className={styles.secondaryActionButton}
                        onClick={() => {
                          setAccountEditMode(false);
                          setAccountPassword('');
                          setAccountError('');
                          setAccountSuccess('');
                        }}
                        disabled={accountSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.primaryActionButton}
                        onClick={handleUpdateAccount}
                        disabled={accountSubmitting}
                      >
                        {accountSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.primaryActionButton}
                      onClick={handleCreateAccount}
                      disabled={accountSubmitting}
                    >
                      {accountSubmitting ? 'Creating Account...' : 'Create Login Account'}
                    </button>
                  )}
                </div>
              </div>
            )}
            </div>
          )}

          {/* Salary Components Summary */}
          <div className={styles.componentsSummary}>
            <div className={styles.summaryHeader}>
              <svg className={styles.summaryHeaderIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className={styles.summaryTitle}>Salary Components</h3>
            </div>
            <div className={styles.summaryRow}>
              <div className={styles.summaryCol}>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryIcon} ${styles.summaryIconAllowance}`}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4>Allowances</h4>
                  <p className={styles.summaryValue}>
                    {componentsLoading ? '...' : formatSalary(allowancesTotal)}
                  </p>
                  <p className={styles.summaryCount}>
                    {componentsLoading ? '...' : `${allowancesCount} allowance${allowancesCount !== 1 ? 's' : ''}`}
                  </p>
                  <button
                    className={styles.manageButton}
                    onClick={() => navigate(`/employees/${employee.id}/allowances`)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.3791 9.94419 19.8571 9.70531 19.3875C9.46643 18.9179 9.12391 18.5135 8.705 18.21L8.645 18.15C8.45934 17.964 8.23868 17.8165 7.99588 17.7159C7.75308 17.6152 7.49279 17.5634 7.23 17.5634C6.96721 17.5634 6.70692 17.6152 6.46412 17.7159C6.22132 17.8165 6.00066 17.964 5.815 18.15C5.62934 18.3363 5.48178 18.557 5.38118 18.7998C5.28057 19.0426 5.22879 19.3029 5.22879 19.5657C5.22879 19.8285 5.28057 20.0888 5.38118 20.3316C5.48178 20.5744 5.62934 20.7951 5.815 20.9814L5.875 21.0414C6.10551 21.2719 6.26018 21.5712 6.319 21.8956C6.37782 22.22 6.33812 22.5556 6.205 22.8571" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Manage
                  </button>
                </div>
              </div>
              <div className={styles.summaryCol}>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryIcon} ${styles.summaryIconDeduction}`}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L8.91 8.26L2 9.27L7 14.14L5.82 21.02L12 17.77L18.18 21.02L17 14.14L22 9.27L15.09 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4>Deductions</h4>
                  <p className={styles.summaryValue}>
                    {componentsLoading ? '...' : formatSalary(deductionsTotal)}
                  </p>
                  <p className={styles.summaryCount}>
                    {componentsLoading ? '...' : `${deductionsCount} deduction${deductionsCount !== 1 ? 's' : ''}`}
                  </p>
                  <button
                    className={styles.manageButton}
                    onClick={() => navigate(`/employees/${employee.id}/deductions`)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.3791 9.94419 19.8571 9.70531 19.3875C9.46643 18.9179 9.12391 18.5135 8.705 18.21L8.645 18.15C8.45934 17.964 8.23868 17.8165 7.99588 17.7159C7.75308 17.6152 7.49279 17.5634 7.23 17.5634C6.96721 17.5634 6.70692 17.6152 6.46412 17.7159C6.22132 17.8165 6.00066 17.964 5.815 18.15C5.62934 18.3363 5.48178 18.557 5.38118 18.7998C5.28057 19.0426 5.22879 19.3029 5.22879 19.5657C5.22879 19.8285 5.28057 20.0888 5.38118 20.3316C5.48178 20.5744 5.62934 20.7951 5.815 20.9814L5.875 21.0414C6.10551 21.2719 6.26018 21.5712 6.319 21.8956C6.37782 22.22 6.33812 22.5556 6.205 22.8571" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Manage
                  </button>
                </div>
              </div>
              <div className={styles.summaryCol}>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryIcon} ${styles.summaryIconBonus}`}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4>Bonuses</h4>
                  <p className={styles.summaryValue}>
                    {componentsLoading ? '...' : formatSalary(bonusesTotal)}
                  </p>
                  <p className={styles.summaryCount}>
                    {componentsLoading ? '...' : `${bonusesCount} bonus${bonusesCount !== 1 ? 'es' : ''}`}
                  </p>
                  <button
                    className={styles.manageButton}
                    onClick={() => navigate(`/employees/${employee.id}/bonuses`)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.3791 9.94419 19.8571 9.70531 19.3875C9.46643 18.9179 9.12391 18.5135 8.705 18.21L8.645 18.15C8.45934 17.964 8.23868 17.8165 7.99588 17.7159C7.75308 17.6152 7.49279 17.5634 7.23 17.5634C6.96721 17.5634 6.70692 17.6152 6.46412 17.7159C6.22132 17.8165 6.00066 17.964 5.815 18.15C5.62934 18.3363 5.48178 18.557 5.38118 18.7998C5.28057 19.0426 5.22879 19.3029 5.22879 19.5657C5.22879 19.8285 5.28057 20.0888 5.38118 20.3316C5.48178 20.5744 5.62934 20.7951 5.815 20.9814L5.875 21.0414C6.10551 21.2719 6.26018 21.5712 6.319 21.8956C6.37782 22.22 6.33812 22.5556 6.205 22.8571" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <button
              className={styles.quickActionButton}
              onClick={() => navigate(`/salary-slips/employee/${employee.id}`)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              View Salary History
            </button>
            <button
              className={styles.quickActionButton}
              onClick={() => navigate(`/salary-slips/generate?employeeId=${employee.id}`)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Generate Salary Slip
            </button>
            <button
              className={styles.primaryActionButton}
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit Employee
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
