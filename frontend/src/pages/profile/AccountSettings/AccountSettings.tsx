/**
 * Account Settings Page
 * 
 * Page for managing account preferences and security settings.
 * Matches mockup design exactly with animations.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { useAuthStore } from '../../../services/state/authStore';
import { employeeService, type Employee } from '../../../services/api/employee.service';
import styles from './AccountSettings.module.css';

// Form validation schema
const accountSettingsSchema = z.object({
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  currencyFormat: z.enum(['USD', 'EUR', 'JOD']),
  autoLogout: z.enum(['15', '30', '60', '120', '0']),
});

type AccountSettingsFormData = z.infer<typeof accountSettingsSchema>;

interface SelectedEmployee {
  id: number;
  fullName: string;
  department: string;
  position: string;
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Search state
  const [searchMethod, setSearchMethod] = useState<'direct' | 'department'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployee | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departmentEmployees, setDepartmentEmployees] = useState<Employee[]>([]);
  const [selectedDepartmentEmployee, setSelectedDepartmentEmployee] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('');
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AccountSettingsFormData>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      dateFormat: 'DD/MM/YYYY',
      currencyFormat: 'USD',
      autoLogout: '15',
    },
  });

  // Check if user is admin
  const isAdmin = authUser?.role === 'Admin';

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await employeeService.getAll({ page: 1, limit: 1000 });
        if (response.success && response.data) {
          const uniqueDepartments = Array.from(
            new Set(response.data.employees.map((emp: Employee) => emp.department))
          );
          setDepartments(uniqueDepartments.sort());
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };

    if (isAdmin) {
      fetchDepartments();
    }
  }, [isAdmin]);

  // Search employees (debounced)
  useEffect(() => {
    if (searchMethod !== 'direct' || !searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await employeeService.getAll({
          page: 1,
          limit: 20,
          search: searchQuery,
        });
        if (response.success && response.data) {
          setSearchResults(response.data.employees || []);
        }
      } catch (err) {
        console.error('Error searching employees:', err);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMethod]);

  // Load employees by department
  useEffect(() => {
    if (searchMethod !== 'department' || !selectedDepartment) {
      setDepartmentEmployees([]);
      setSelectedDepartmentEmployee('');
      return;
    }

    const fetchDepartmentEmployees = async () => {
      try {
        const response = await employeeService.getAll({
          page: 1,
          limit: 1000,
          department: selectedDepartment,
        });
        if (response.success && response.data) {
          setDepartmentEmployees(response.data.employees || []);
        }
      } catch (err) {
        console.error('Error fetching department employees:', err);
        setDepartmentEmployees([]);
      }
    };

    fetchDepartmentEmployees();
  }, [selectedDepartment, searchMethod]);

  // Handle department employee selection
  useEffect(() => {
    if (selectedDepartmentEmployee) {
      const employee = departmentEmployees.find(
        (emp) => emp.id.toString() === selectedDepartmentEmployee
      );
      if (employee) {
        selectEmployee(employee);
      }
    } else {
      setSelectedEmployee(null);
    }
  }, [selectedDepartmentEmployee, departmentEmployees]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => {
          setSearchResults([]);
        }, 200);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSearchMethod = (method: 'direct' | 'department') => {
    setSearchMethod(method);
    setSearchQuery('');
    setSelectedDepartment('');
    setSelectedDepartmentEmployee('');
    setSelectedEmployee(null);
    setSearchResults([]);
    setDepartmentEmployees([]);
  };

  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee({
      id: employee.id,
      fullName: employee.fullName,
      department: employee.department,
      position: employee.position,
    });
    setSearchQuery('');
    setSearchResults([]);
    setNewEmployeeRole(''); // Reset role selection
  };

  const clearEmployeeSelection = () => {
    setSelectedEmployee(null);
    setSearchQuery('');
    setSelectedDepartment('');
    setSelectedDepartmentEmployee('');
    setNewEmployeeRole('');
  };

  const handleForceLogout = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee first');
      return;
    }

    if (window.confirm(`Are you sure you want to force logout ${selectedEmployee.fullName}?`)) {
      try {
        // TODO: Implement force logout API call
        setSuccess(`Employee ${selectedEmployee.fullName} has been logged out successfully.`);
        setTimeout(() => setSuccess(''), 5000);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to force logout employee';
        setError(errorMessage);
      }
    }
  };

  const handleChangeRole = async () => {
    if (!selectedEmployee || !newEmployeeRole) {
      setError('Please select an employee and a new role');
      return;
    }

    if (
      window.confirm(
        `Change ${selectedEmployee.fullName}'s role to "${newEmployeeRole}"?`
      )
    ) {
      try {
        // TODO: Implement change role API call
        setSuccess(`Role changed successfully. ${selectedEmployee.fullName} is now ${newEmployeeRole}.`);
        setTimeout(() => setSuccess(''), 5000);
        setSelectedEmployee(null);
        setNewEmployeeRole('');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to change employee role';
        setError(errorMessage);
      }
    }
  };

  const onSubmit = async (_data: AccountSettingsFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // TODO: Implement save settings API call
      // For now, just simulate success
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      reset({
        dateFormat: 'DD/MM/YYYY',
        currencyFormat: 'USD',
        autoLogout: '15',
      });
      clearEmployeeSelection();
      setSuccess('Settings have been reset to defaults.');
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  return (
    <div className={styles.accountSettingsContainer}>
      <Sidebar />
      <Header />

      <main className={styles.mainContent}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h2>Account Settings</h2>
            <p className={styles.pageSubtitle}>Manage your account preferences and security settings</p>
          </div>
          <button className={styles.btnSecondary} onClick={() => navigate('/profile')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Profile
          </button>
        </div>

        {/* Form Card */}
        <div className={styles.formSection}>
          <form className={styles.settingsForm} onSubmit={handleSubmit(onSubmit)}>
            {/* Display Preferences */}
            <div className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01129 9.77251C4.28058 9.5799 4.48571 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3>Display Preferences</h3>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="dateFormat" className={styles.formLabel}>
                  <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Date Format
                </label>
                <select id="dateFormat" className={styles.formInput} {...register('dateFormat')}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
                {errors.dateFormat && <p className={styles.errorText}>{errors.dateFormat.message}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="currencyFormat" className={styles.formLabel}>
                  <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Currency Format
                </label>
                <select id="currencyFormat" className={styles.formInput} {...register('currencyFormat')}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="JOD">JOD (JD)</option>
                </select>
                {errors.currencyFormat && <p className={styles.errorText}>{errors.currencyFormat.message}</p>}
              </div>
            </div>

            {/* Security Settings */}
            <div className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3>Security Settings</h3>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="autoLogout" className={styles.formLabel}>
                  <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Auto-logout Timeout
                </label>
                <select id="autoLogout" className={styles.formInput} {...register('autoLogout')}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="0">Never</option>
                </select>
                {errors.autoLogout && <p className={styles.errorText}>{errors.autoLogout.message}</p>}
                <p className={styles.helpText}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Automatically log out after period of inactivity
                </p>
              </div>
            </div>

            {/* Admin-only Security Settings */}
            {isAdmin && (
              <div className={`${styles.settingsSection} ${styles.adminOnlySection}`}>
                <div className={styles.sectionHeader}>
                  <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h3>Admin Security Management</h3>
                </div>
                <p className={`${styles.helpText} ${styles.adminNotice}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  This section is only available for Administrators
                </p>

                {/* Search Method Toggle */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Search Method</label>
                  <div className={styles.searchMethodToggle}>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${searchMethod === 'direct' ? styles.active : ''}`}
                      onClick={() => toggleSearchMethod('direct')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 21L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Direct Search
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${searchMethod === 'department' ? styles.active : ''}`}
                      onClick={() => toggleSearchMethod('department')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      By Department
                    </button>
                  </div>
                </div>

                {/* Direct Search Method */}
                {searchMethod === 'direct' && (
                  <div className={styles.searchSection}>
                    <div className={styles.formGroup}>
                      <label htmlFor="employeeSearch" className={styles.formLabel}>Search Employee</label>
                      <input
                        ref={searchInputRef}
                        type="text"
                        id="employeeSearch"
                        className={styles.formInput}
                        placeholder="Enter employee name or ID"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchResults.length > 0 && (
                        <div ref={searchResultsRef} className={styles.searchResults}>
                          {searchResults.map((emp) => (
                            <div
                              key={emp.id}
                              className={styles.searchResultItem}
                              onClick={() => selectEmployee(emp)}
                            >
                              <strong>{emp.fullName}</strong> (ID: {emp.id}) - {emp.department}
                            </div>
                          ))}
                        </div>
                      )}
                      {searchQuery && searchQuery.length >= 2 && searchResults.length === 0 && (
                        <div ref={searchResultsRef} className={styles.searchResults}>
                          <div className={`${styles.searchResultItem} ${styles.noResults}`}>No employees found</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Department-Based Search Method */}
                {searchMethod === 'department' && (
                  <div className={styles.searchSection}>
                    <div className={styles.formGroup}>
                      <label htmlFor="employeeDepartment" className={styles.formLabel}>Department</label>
                      <select
                        id="employeeDepartment"
                        className={styles.formInput}
                        value={selectedDepartment}
                        onChange={(e) => {
                          setSelectedDepartment(e.target.value);
                          setSelectedDepartmentEmployee('');
                        }}
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="employeeFromDepartment" className={styles.formLabel}>Employee</label>
                      <select
                        id="employeeFromDepartment"
                        className={styles.formInput}
                        value={selectedDepartmentEmployee}
                        onChange={(e) => setSelectedDepartmentEmployee(e.target.value)}
                        disabled={!selectedDepartment || departmentEmployees.length === 0}
                      >
                        <option value="">Select Employee</option>
                        {departmentEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id.toString()}>
                            {emp.fullName} (ID: {emp.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Selected Employee Display */}
                {selectedEmployee && (
                  <div className={styles.selectedEmployeeInfo}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Selected Employee</label>
                      <div className={styles.selectedEmployeeBox}>
                        <div className={styles.selectedEmployeeDetails}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div>
                            <strong>{selectedEmployee.fullName}</strong>
                            <span className={styles.employeeMeta}>
                              ID: {selectedEmployee.id} | {selectedEmployee.department} | {selectedEmployee.position}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`${styles.btnSecondary} ${styles.btnSmall}`}
                          onClick={clearEmployeeSelection}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {selectedEmployee && (
                  <div className={styles.adminActions}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Force Logout</label>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={handleForceLogout}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Force Logout Employee
                      </button>
                      <p className={styles.helpText}>Immediately log out the selected employee</p>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="newEmployeeRole" className={styles.formLabel}>Change Role</label>
                      <div className={styles.roleChangeGroup}>
                        <select
                          id="newEmployeeRole"
                          className={styles.formInput}
                          value={newEmployeeRole}
                          onChange={(e) => setNewEmployeeRole(e.target.value)}
                        >
                          <option value="">Select New Role</option>
                          <option value="Admin">Admin</option>
                          <option value="Accountant">Accountant</option>
                          <option value="Management">Management</option>
                          <option value="Employee">Employee</option>
                        </select>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          onClick={handleChangeRole}
                          disabled={!newEmployeeRole}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Change Role
                        </button>
                      </div>
                      <p className={styles.helpText}>Update the selected employee's system role</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Success/Error Messages */}
            {success && <p className={styles.successText}>{success}</p>}
            {error && <p className={styles.errorText}>{error}</p>}

            {/* Form Actions */}
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? (
                  <div className={styles.spinner}></div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 21V13H9V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 3V8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
              <button type="button" className={styles.btnSecondary} onClick={handleResetToDefaults}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Reset to Defaults
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

