/**
 * Generate Report Page
 * 
 * Allows users to generate monthly or annual financial reports.
 * Matches mockup design exactly with tabs and form sections.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { reportsService, type ReportType } from '../../../services/api/reports.service';
import { employeeService } from '../../../services/api/employee.service';
import { useAuthStore } from '../../../services/state/authStore';
import type { Employee } from '../../../services/api/employee.service';
import { getApiErrorMessage } from '../../../utils/errorHandler';
import styles from './GenerateReport.module.css';

// Month names for display
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Form validation schema for monthly reports
const monthlyReportSchema = z.object({
  month: z.number().min(1, 'Month is required').max(12, 'Invalid month'),
  year: z.number().min(2000, 'Year must be at least 2000').max(2100, 'Invalid year'),
  department: z.string().optional(),
  employeeId: z.number().optional(),
  minSalary: z.number().min(0, 'Min salary must be positive').optional(),
  maxSalary: z.number().min(0, 'Max salary must be positive').optional(),
});

// Form validation schema for annual reports
const annualReportSchema = z.object({
  year: z.number().min(2000, 'Year must be at least 2000').max(2100, 'Invalid year'),
  department: z.string().optional(),
  employeeId: z.number().optional(),
  minSalary: z.number().min(0, 'Min salary must be positive').optional(),
  maxSalary: z.number().min(0, 'Max salary must be positive').optional(),
});

type MonthlyReportFormData = z.infer<typeof monthlyReportSchema>;
type AnnualReportFormData = z.infer<typeof annualReportSchema>;

export default function GenerateReport() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ReportType>('monthly');

  // Check if user has permission to generate reports
  useEffect(() => {
    if (!user) return;
    
    // Only Admin, HR, and Accountant can generate reports
    const allowedRoles = ['Admin', 'HR', 'Accountant'];
    if (!allowedRoles.includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [, setLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [employeeSearchAnnual, setEmployeeSearchAnnual] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Monthly form
  const monthlyForm = useForm<MonthlyReportFormData>({
    resolver: zodResolver(monthlyReportSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  // Annual form
  const annualForm = useForm<AnnualReportFormData>({
    resolver: zodResolver(annualReportSchema),
    defaultValues: {
      year: new Date().getFullYear(),
    },
  });

  const handleTabChange = (tab: ReportType) => {
    setActiveTab(tab);
    setError('');
  };

  const onMonthlySubmit = async (data: MonthlyReportFormData) => {
    try {
      setLoading(true);
      setError('');

      const response = await reportsService.generate({
        type: 'monthly',
        month: data.month,
        year: data.year,
        ...(data.department && { department: data.department }),
        ...(data.employeeId && { employeeId: data.employeeId }),
        ...(data.minSalary !== undefined && { minSalary: data.minSalary }),
        ...(data.maxSalary !== undefined && { maxSalary: data.maxSalary }),
      });

      // Check if response is successful
      if (response && response.success) {
        // Navigate to monthly report page
        navigate(`/reports/monthly?month=${data.month}&year=${data.year}`);
      } else {
        setError(response?.error || 'Failed to generate monthly report');
      }
    } catch (err: unknown) {
      console.error('Error generating monthly report:', err);
      setError(getApiErrorMessage(err) || 'Failed to generate monthly report');
    } finally {
      setLoading(false);
    }
  };

  const onAnnualSubmit = async (data: AnnualReportFormData) => {
    try {
      setLoading(true);
      setError('');

      const response = await reportsService.generate({
        type: 'annual',
        year: data.year,
        ...(data.department && { department: data.department }),
        ...(data.employeeId && { employeeId: data.employeeId }),
        ...(data.minSalary !== undefined && { minSalary: data.minSalary }),
        ...(data.maxSalary !== undefined && { maxSalary: data.maxSalary }),
      });

      // Check if response is successful
      if (response && response.success) {
        // Navigate to annual report page
        navigate(`/reports/annual?year=${data.year}`);
      } else {
        setError(response?.error || 'Failed to generate annual report');
      }
    } catch (err: unknown) {
      console.error('Error generating annual report:', err);
      setError(getApiErrorMessage(err) || 'Failed to generate annual report');
    } finally {
      setLoading(false);
    }
  };

  const clearMonthlyFilters = () => {
    monthlyForm.reset({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
    setEmployeeSearch('');
  };

  const clearAnnualFilters = () => {
    annualForm.reset({
      year: new Date().getFullYear(),
    });
    setEmployeeSearchAnnual('');
  };

  // Generate year options (current year and previous 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i);

  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        
        // Fetch all active employees using pagination
        const allEmployees: Employee[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;
        
        while (hasMore) {
          const response = await employeeService.getAll({ 
            status: 'Active',
            limit,
            page
          });
          
          if (response && response.success && response.data) {
            const employees = response.data.employees || [];
            allEmployees.push(...employees);
            
            const total = response.data.total || 0;
            const fetched = allEmployees.length;
            hasMore = fetched < total;
            page++;
          } else {
            break;
          }
        }
        
        setEmployees(allEmployees);
      } catch (err: unknown) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className={styles.generateReportContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Generate Report</h2>
              <p className={styles.pageSubtitle}>Create monthly or annual financial reports</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate('/reports/history')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Report History
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate('/dashboard')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Report Type Tabs */}
          <div className={styles.tabsSection}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tabButton} ${activeTab === 'monthly' ? styles.active : ''}`}
                onClick={() => handleTabChange('monthly')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Monthly Report
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'annual' ? styles.active : ''}`}
                onClick={() => handleTabChange('annual')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Annual Report
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}

          {/* Monthly Report Form */}
          <div className={`${styles.formCard} ${activeTab === 'monthly' ? styles.active : styles.hidden}`}>
            <form className={styles.generateForm} onSubmit={monthlyForm.handleSubmit(onMonthlySubmit)}>
              {/* Period Selection Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <svg className={styles.sectionIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className={styles.sectionTitle}>Period Selection</h3>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Month *
                    </label>
                    <select
                      className={styles.formInput}
                      {...monthlyForm.register('month', { valueAsNumber: true })}
                    >
                      {monthNames.map((name, index) => (
                        <option key={index + 1} value={index + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                    {monthlyForm.formState.errors.month && (
                      <span className={styles.errorText}>{monthlyForm.formState.errors.month.message}</span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Year *
                    </label>
                    <select
                      className={styles.formInput}
                      {...monthlyForm.register('year', { valueAsNumber: true })}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {monthlyForm.formState.errors.year && (
                      <span className={styles.errorText}>{monthlyForm.formState.errors.year.message}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <svg className={styles.sectionIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className={styles.sectionTitle}>Filters (Optional)</h3>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Department
                  </label>
                  <select
                    className={styles.formInput}
                    {...monthlyForm.register('department')}
                  >
                    <option value="">All Departments</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Employee Name
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Search by employee name..."
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      // Find employee by name
                      const foundEmployee = employees.find(
                        emp => emp.fullName.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      if (foundEmployee) {
                        monthlyForm.setValue('employeeId', foundEmployee.id);
                      } else {
                        monthlyForm.setValue('employeeId', undefined);
                      }
                    }}
                  />
                </div>
                {/* Advanced Filters (Collapsible) */}
                <div className={styles.advancedFiltersToggle}>
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters (Salary Range)
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                    >
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                {showAdvancedFilters && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Min Salary
                      </label>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        {...monthlyForm.register('minSalary', { valueAsNumber: true })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Max Salary
                      </label>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        {...monthlyForm.register('maxSalary', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={`${styles.btnPrimary} ${styles.btnLarge}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.spinningIcon}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Generate Monthly Report
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={`${styles.btnSecondary} ${styles.btnLarge}`}
                  onClick={clearMonthlyFilters}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Clear Filters
                </button>
              </div>
            </form>
          </div>

          {/* Annual Report Form */}
          <div className={`${styles.formCard} ${activeTab === 'annual' ? styles.active : styles.hidden}`}>
            <form className={styles.generateForm} onSubmit={annualForm.handleSubmit(onAnnualSubmit)}>
              {/* Period Selection Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <svg className={styles.sectionIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className={styles.sectionTitle}>Period Selection</h3>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Year *
                  </label>
                  <select
                    className={styles.formInput}
                    {...annualForm.register('year', { valueAsNumber: true })}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {annualForm.formState.errors.year && (
                    <span className={styles.errorText}>{annualForm.formState.errors.year.message}</span>
                  )}
                </div>
              </div>

              {/* Filters Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <svg className={styles.sectionIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className={styles.sectionTitle}>Filters (Optional)</h3>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Department
                  </label>
                  <select
                    className={styles.formInput}
                    {...annualForm.register('department')}
                  >
                    <option value="">All Departments</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Employee Name
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Search by employee name..."
                    value={employeeSearchAnnual}
                    onChange={(e) => {
                      setEmployeeSearchAnnual(e.target.value);
                      // Find employee by name
                      const foundEmployee = employees.find(
                        emp => emp.fullName.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      if (foundEmployee) {
                        annualForm.setValue('employeeId', foundEmployee.id);
                      } else {
                        annualForm.setValue('employeeId', undefined);
                      }
                    }}
                  />
                </div>
                {/* Advanced Filters (Collapsible) */}
                <div className={styles.advancedFiltersToggle}>
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters (Salary Range)
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                    >
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                {showAdvancedFilters && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Min Salary
                      </label>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        {...annualForm.register('minSalary', { valueAsNumber: true })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Max Salary
                      </label>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        {...annualForm.register('maxSalary', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={`${styles.btnPrimary} ${styles.btnLarge}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.spinningIcon}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Generate Annual Report
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={`${styles.btnSecondary} ${styles.btnLarge}`}
                  onClick={clearAnnualFilters}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Clear Filters
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

