/**
 * Generate Salary Slip Page
 * 
 * Form page for generating a new salary slip for an employee.
 * Uses React Hook Form + Zod for validation.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { salarySlipService } from '../../../services/api/salary-slips.service';
import { employeeService } from '../../../services/api/employee.service';
import type { Employee } from '../../../services/api/employee.service';
import styles from './GenerateSlip.module.css';

// Form validation schema
const generateSlipSchema = z.object({
  employeeId: z.number().min(1, 'Employee is required'),
  month: z.number().min(1, 'Month is required').max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2000, 'Year must be at least 2000').max(2100, 'Year must be at most 2100'),
});

type GenerateSlipFormData = z.infer<typeof generateSlipSchema>;

// Month names for display
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function GenerateSlip() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Get current month and year as defaults
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateSlipFormData>({
    resolver: zodResolver(generateSlipSchema),
    defaultValues: {
      month: currentMonth,
      year: currentYear,
    },
  });

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        setError('');
        
        console.log('Fetching employees for GenerateSlip...');
        
        // Fetch all employees using pagination (max 100 per page)
        const allEmployees: Employee[] = [];
        let page = 1;
        const limit = 100; // Maximum allowed by backend
        let hasMore = true;
        
        while (hasMore) {
          const response = await employeeService.getAll({ 
            status: 'Active',
            limit,
            page
          });
          
          console.log(`Fetched page ${page}:`, response);
          
          if (response && response.success && response.data) {
            const employees = response.data.employees || [];
            allEmployees.push(...employees);
            
            // Check if there are more pages
            const total = response.data.total || 0;
            const fetched = allEmployees.length;
            hasMore = fetched < total;
            page++;
          } else {
            throw new Error('Invalid response format');
          }
        }
        
        console.log(`Total employees fetched: ${allEmployees.length}`);
        setEmployees(allEmployees);
      } catch (err: unknown) {
        console.error('Error fetching employees:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response,
          status: err.response?.status,
          data: err.response?.data,
        });
        
        let errorMessage = 'Failed to fetch employees';
        
        // Handle network errors
        if (!err.response) {
          if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
            errorMessage = 'Cannot connect to server. Please check if the backend is running.';
          } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
            errorMessage = 'Request timeout. The server is taking too long to respond.';
          } else {
            errorMessage = `Network error: ${err.message || 'Cannot connect to server'}`;
          }
        } else if (err.response) {
          errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const onSubmit = async (data: GenerateSlipFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await salarySlipService.generate({
        employeeId: data.employeeId,
        month: data.month,
        year: data.year,
      });

      setSuccess(`Salary slip generated successfully! Net Salary: ${response.data.netSalary.toLocaleString()}`);
      
      // Fetch employee data for preview
      try {
        const employeeResponse = await employeeService.getById(response.data.employeeId);
        
        // Redirect to preview page with slip and employee data
        navigate(`/salary-slips/${response.data.id}/preview`, {
          state: {
            slip: response.data,
            employee: employeeResponse.data,
          },
        });
      } catch (_err) {
        // If employee fetch fails, still navigate to preview
        navigate(`/salary-slips/${response.data.id}/preview`, {
          state: {
            slip: response.data,
          },
        });
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err instanceof Error ? err.message : 'Unknown error') || 'Failed to generate salary slip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.generateSlipContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Generate Salary Slip</h2>
              <p className={styles.pageSubtitle}>Create a new salary slip for an employee</p>
            </div>
            <button
              className={styles.backButton}
              onClick={() => navigate('/salary-slips')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Salary Slips
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className={styles.successMessage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form Card */}
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              {/* Employee Selection */}
              <div className={styles.formSection}>
                <label className={styles.label}>
                  <svg className={styles.labelIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Employee <span className={styles.required}>*</span>
                </label>
                <select
                  {...register('employeeId', { valueAsNumber: true })}
                  className={`${styles.select} ${errors.employeeId ? styles.inputError : ''}`}
                  disabled={loadingEmployees}
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} - {employee.department} ({employee.position})
                    </option>
                  ))}
                </select>
                {errors.employeeId && (
                  <span className={styles.errorText}>{errors.employeeId.message}</span>
                )}
              </div>

              {/* Month Selection */}
              <div className={styles.formSection}>
                <label className={styles.label}>
                  <svg className={styles.labelIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Month <span className={styles.required}>*</span>
                </label>
                <select
                  {...register('month', { valueAsNumber: true })}
                  className={`${styles.select} ${errors.month ? styles.inputError : ''}`}
                >
                  {monthNames.map((name, index) => (
                    <option key={index + 1} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <span className={styles.errorText}>{errors.month.message}</span>
                )}
              </div>

              {/* Year Input */}
              <div className={styles.formSection}>
                <label className={styles.label}>
                  <svg className={styles.labelIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Year <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  className={`${styles.input} ${errors.year ? styles.inputError : ''}`}
                  placeholder="Enter year (e.g., 2024)"
                  min="2000"
                  max="2100"
                />
                {errors.year && (
                  <span className={styles.errorText}>{errors.year.message}</span>
                )}
              </div>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading || loadingEmployees}
                >
                  {loading ? (
                    <>
                      <svg className={styles.spinner} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Generate Salary Slip
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => navigate('/salary-slips')}
                  disabled={loading || loadingEmployees}
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

