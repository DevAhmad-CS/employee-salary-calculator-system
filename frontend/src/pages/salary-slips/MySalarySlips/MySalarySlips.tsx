/**
 * My Salary Slips Page
 * 
 * Displays employee's own salary slips with filtering by month and year.
 * Matches mockup design exactly with filter section and table.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { salarySlipService } from '../../../services/api/salary-slips.service';
import { profileService } from '../../../services/api/profile.service';
import { useAuthStore } from '../../../services/state/authStore';
import type { SalarySlip } from '../../../services/api/salary-slips.service';
import styles from './MySalarySlips.module.css';

// Month names for display
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MySalarySlips() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Filter state
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(0); // 0 = All Months
  const [year, setYear] = useState<number>(0); // 0 = All Years

  // Fetch salary slips for the logged-in employee
  useEffect(() => {
    const fetchSlips = async () => {
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Get employee ID from profile (not user.id)
        const profileResponse = await profileService.getProfile();
        const profile = profileResponse.data;

        if (!profile.employeeId) {
          setError('Employee ID not found in profile');
          setLoading(false);
          return;
        }

        // Fetch all slips for the employee
        const response = await salarySlipService.getByEmployeeId(profile.employeeId);
        let slipsData = response.data;

        // Filter by month and year if selected
        if (month > 0) {
          slipsData = slipsData.filter((slip) => slip.month === month);
        }
        if (year > 0) {
          slipsData = slipsData.filter((slip) => slip.year === year);
        }

        // Sort by year and month (newest first)
        slipsData.sort((a, b) => {
          if (b.year !== a.year) {
            return b.year - a.year;
          }
          return b.month - a.month;
        });

        setSlips(slipsData);
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch salary slips';
        setError(axiosError?.response?.data?.error || errorMessage);
        setSlips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlips();
  }, [user?.id, month, year]); // Note: employeeId comes from profile, not user.id

  // Handle apply filters
  const handleApplyFilters = () => {
    // Filters are already applied via useEffect
    // This function can be used for additional logic if needed
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className={styles.mySalarySlipsContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.errorMessage}>
              <p>Please log in to view your salary slips</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mySalarySlipsContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>My Salary Slips</h2>
              <p className={styles.pageSubtitle}>View your personal salary slip history</p>
            </div>
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

          {/* Filter Section */}
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <svg className={styles.filterIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Filter History</h3>
            </div>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Month
                </label>
                <select
                  className={styles.filterSelect}
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  <option value="0">All Months</option>
                  {monthNames.map((name, index) => (
                    <option key={index + 1} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Year
                </label>
                <select
                  className={styles.filterSelect}
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  <option value="0">All Years</option>
                  {Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - i).map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.filterActions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleApplyFilters}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}

          {/* Salary Slips Table */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <svg className={styles.tableHeaderIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>My Salary Slips</h3>
            </div>
            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.loadingMessage}>
                  <p>Loading salary slips...</p>
                </div>
              ) : slips.length === 0 ? (
                <div className={styles.emptyMessage}>
                  <p>No salary slips found{month > 0 || year > 0 ? ' matching your filters' : ''}.</p>
                </div>
              ) : (
                <table className={styles.mySlipsTable}>
                  <thead>
                    <tr>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Month
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Year
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Net Salary
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Generated Date
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.3791 9.94419 19.8571 9.70531 19.3875C9.46643 18.9179 9.12391 18.5135 8.705 18.21L8.645 18.15C8.45934 17.964 8.23868 17.8165 7.99588 17.7159C7.75308 17.6152 7.49279 17.5634 7.23 17.5634C6.96721 17.5634 6.70692 17.6152 6.46412 17.7159C6.22132 17.8165 6.00066 17.964 5.815 18.15C5.62934 18.3363 5.48178 18.557 5.38118 18.7998C5.28057 19.0426 5.22879 19.3029 5.22879 19.5657C5.22879 19.8285 5.28057 20.0888 5.38118 20.3316C5.48178 20.5744 5.62934 20.7951 5.815 20.9814L5.875 21.0414C6.10551 21.2719 6.26018 21.5712 6.319 21.8956C6.37782 22.22 6.33812 22.5556 6.205 22.8571" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {slips.map((slip) => (
                      <tr key={slip.id}>
                        <td>
                          <span className={styles.monthBadge}>
                            {monthNames[slip.month - 1]}
                          </span>
                        </td>
                        <td>{slip.year}</td>
                        <td className={styles.salaryAmount}>{formatCurrency(slip.netSalary)}</td>
                        <td>{formatDate(slip.generatedAt)}</td>
                        <td>
                          <button
                            className={`${styles.actionButton} ${styles.viewButton}`}
                            onClick={() => navigate(`/salary-slips/${slip.id}`)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

