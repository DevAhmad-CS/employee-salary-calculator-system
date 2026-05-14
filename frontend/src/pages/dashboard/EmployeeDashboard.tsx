/**
 * Employee Dashboard
 * 
 * Dashboard for Employee role - displays employee information and salary slips.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar/Sidebar';
import Header from '../../components/layout/Header/Header';
import { profileService } from '../../services/api/profile.service';
import { employeeService, type Employee } from '../../services/api/employee.service';
import { salarySlipService, type SalarySlip } from '../../services/api/salary-slips.service';
import { useAuthStore } from '../../services/state/authStore';
import styles from './Dashboard.module.css';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Get profile to get employeeId
        const profileResponse = await profileService.getProfile();
        const profile = profileResponse.data;
        
        if (!profile.employeeId) {
          setError('Employee ID not found in profile');
          setLoading(false);
          return;
        }

        // Get employee data
        const employeeResponse = await employeeService.getById(profile.employeeId);
        setEmployee(employeeResponse.data);

        // Get salary slips for employee
        const slipsResponse = await salarySlipService.getByEmployeeId(profile.employeeId);
        const sortedSlips = slipsResponse.data
          .sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return b.month - a.month;
          })
          .slice(0, 6); // Last 6 slips
        setSlips(sortedSlips);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch employee data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <span>Loading your dashboard...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>{error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const latestSlip = slips.length > 0 ? slips[0] : null;

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        <main className={styles.mainContent}>
          <div className={styles.container}>
            {/* Welcome Section */}
            <div className={styles.section}>
              <h1 className={styles.pageTitle}>Welcome, {employee?.fullName || 'Employee'}!</h1>
              <p className={styles.pageSubtitle}>Here's your dashboard with your information and salary slips.</p>
            </div>

            {/* Employee Information Cards */}
            <div className={styles.statsSection}>
              <div className={styles.row}>
                <div className={styles.col}>
                  <div className={styles.statCard}>
                    <div className={styles.statCardHeader}>
                      <div className={`${styles.statIcon} ${styles.statIcon1}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h3 className={styles.statTitle}>Department</h3>
                    </div>
                    <div className={styles.statCardBody}>
                      <p className={styles.statValue}>{employee?.department || 'N/A'}</p>
                      <p className={styles.statLabel}>{employee?.position || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.col}>
                  <div className={styles.statCard}>
                    <div className={styles.statCardHeader}>
                      <div className={`${styles.statIcon} ${styles.statIcon2}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 8V12L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h3 className={styles.statTitle}>Basic Salary</h3>
                    </div>
                    <div className={styles.statCardBody}>
                      <p className={styles.statValue}>{employee ? formatCurrency(employee.basicSalary) : '$0.00'}</p>
                      <p className={styles.statLabel}>Monthly base salary</p>
                    </div>
                  </div>
                </div>

                <div className={styles.col}>
                  <div className={styles.statCard}>
                    <div className={styles.statCardHeader}>
                      <div className={`${styles.statIcon} ${styles.statIcon3}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h3 className={styles.statTitle}>Salary Slips</h3>
                    </div>
                    <div className={styles.statCardBody}>
                      <p className={styles.statValue}>{slips.length}</p>
                      <p className={styles.statLabel}>Total slips available</p>
                    </div>
                  </div>
                </div>

                {latestSlip && (
                  <div className={styles.col}>
                    <div className={styles.statCard}>
                      <div className={styles.statCardHeader}>
                        <div className={`${styles.statIcon} ${styles.statIcon4}`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V7.5C15 7.77614 14.7761 8 14.5 8H9.5C9.22386 8 9 7.77614 9 7.5V6.5L3 7V9L9 8.5V9.5C9 9.77614 9.22386 10 9.5 10H14.5C14.7761 10 15 9.77614 15 9.5V8.5L21 9ZM12 13.5C11.0335 13.5 10.1 13.7346 9.26724 14.1809C8.43448 14.6272 7.72576 15.2721 7.20401 16.0615C6.68226 16.8509 6.36195 17.7619 6.26976 18.7076C6.17756 19.6533 6.31638 20.6048 6.67389 21.4857C7.03139 22.3666 7.59741 23.1515 8.32233 23.7678C9.04725 24.3841 9.91083 24.8142 10.8394 25.0244C11.768 25.2346 12.7342 25.2184 13.6548 24.9776C14.5755 24.7368 15.4245 24.2789 16.1266 23.6464C16.8287 23.014 17.3644 22.2275 17.6871 21.3538C18.0098 20.4801 18.1093 19.5452 17.9768 18.632C17.8443 17.7188 17.484 16.8556 16.9289 16.1151C16.3739 15.3747 15.6411 14.7797 14.7957 14.3864C13.9503 13.9931 13.0166 13.8133 12.0803 13.8628C11.144 13.9123 10.2331 14.1895 9.42809 14.6688C8.62308 15.1481 7.94719 15.8147 7.46118 16.6077C6.97517 17.4008 6.69346 18.2966 6.64027 19.2202" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className={styles.statTitle}>Latest Salary</h3>
                      </div>
                      <div className={styles.statCardBody}>
                        <p className={styles.statValue}>{formatCurrency(latestSlip.netSalary)}</p>
                        <p className={styles.statLabel}>{monthNames[latestSlip.month - 1]} {latestSlip.year}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Salary Slips */}
            <div className={styles.section}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderContent}>
                    <svg className={styles.cardHeaderIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>My Salary Slips</span>
                  </div>
                  <button 
                    className={styles.viewAllButton}
                    onClick={() => navigate('/salary-slips')}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.cardBody}>
                  {slips.length === 0 ? (
                    <div className={styles.emptyMessage}>
                      <p>No salary slips available yet.</p>
                    </div>
                  ) : (
                    <div className={styles.slipsList}>
                      {slips.map((slip) => (
                        <div 
                          key={slip.id} 
                          className={styles.slipItem}
                          onClick={() => navigate(`/salary-slips/${slip.id}`)}
                        >
                          <div className={styles.slipInfo}>
                            <div className={styles.slipMonth}>
                              {monthNames[slip.month - 1]} {slip.year}
                            </div>
                            <div className={styles.slipDate}>
                              Generated: {formatDate(slip.generatedAt)}
                            </div>
                          </div>
                          <div className={styles.slipAmount}>
                            {formatCurrency(slip.netSalary)}
                          </div>
                          <svg className={styles.slipArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

