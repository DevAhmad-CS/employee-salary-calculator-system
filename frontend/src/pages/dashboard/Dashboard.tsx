import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar/Sidebar';
import Header from '../../components/layout/Header/Header';
import { dashboardService, type DashboardStatistics } from '../../services/api/dashboard.service';
import { salarySlipService, type SalarySlip } from '../../services/api/salary-slips.service';
import { employeeService, type Employee } from '../../services/api/employee.service';
import { reportsService } from '../../services/api/reports.service';
import { profileService } from '../../services/api/profile.service';
import { userService, type User } from '../../services/api/user.service';
import { useAuthStore } from '../../services/state/authStore';
import { getErrorMessage } from '../../utils/errorHandler';
import styles from './Dashboard.module.css';

/**
 * Dashboard Page
 * 
 * Main dashboard page displaying statistics and overview.
 * Matches mockup design exactly with Chart Section, Quick Actions, and Recent Activity.
 * Uses Sidebar and Header layout components.
 */
interface ChartDataPoint {
  month: string;
  value: number;
  percentage: number;
}

interface DepartmentChartData {
  department: string;
  count: number;
  percentage: number;
}

interface RecentActivity {
  type: 'salary-slip' | 'employee' | 'report';
  text: string;
  time: string;
  icon: JSX.Element;
}

import EmployeeDashboard from './EmployeeDashboard';
import AccountantDashboard from './AccountantDashboard';

export default function Dashboard() {
  const { user } = useAuthStore();

  // Route to appropriate dashboard based on role
  if (user?.role === 'Employee') {
    return <EmployeeDashboard />;
  }

  if (user?.role === 'Accountant') {
    return <AccountantDashboard />;
  }

  // Admin, HR Manager, or Management - show full dashboard
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartMaxValue, setChartMaxValue] = useState(500);
  const [departmentChartData, setDepartmentChartData] = useState<DepartmentChartData[]>([]);
  const [departmentChartLoading, setDepartmentChartLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await dashboardService.getStatistics();
        if (response.success) {
          setStatistics(response.data);
        } else {
          setError(response.error || 'Failed to fetch dashboard statistics');
        }
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err, 'Failed to fetch dashboard statistics');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Fetch chart data (last 6 months)
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12
        
        const months: ChartDataPoint[] = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const values: number[] = [];
        
        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
          let month = currentMonth - i;
          let year = currentYear;
          
          if (month <= 0) {
            month += 12;
            year -= 1;
          }
          
          try {
            const response = await salarySlipService.getByMonthYear({ month, year });
            if (response.success && response.data && response.data.length > 0) {
              const totalSalary = response.data.reduce((sum, slip) => sum + slip.netSalary, 0);
              const valueInK = Math.round(totalSalary / 1000); // Convert to thousands
              values.push(valueInK);
              
              months.push({
                month: monthNames[month - 1],
                value: valueInK,
                percentage: 0, // Will be calculated after
              });
            } else {
              // No data for this month
              months.push({
                month: monthNames[month - 1],
                value: 0,
                percentage: 0,
              });
            }
          } catch {
            // Error fetching this month - skip it
            months.push({
              month: monthNames[month - 1],
              value: 0,
              percentage: 0,
            });
          }
        }
        
        // Calculate max value dynamically (max value + 20% padding, minimum 100K)
        const maxValue = values.length > 0 
          ? Math.max(100, Math.ceil(Math.max(...values) * 1.2 / 50) * 50) // Round up to nearest 50K
          : 500; // Default max value
        
        setChartMaxValue(maxValue);
        
        // Calculate percentages based on dynamic max value
        months.forEach((month) => {
          if (month.value > 0) {
            month.percentage = Math.min(90, Math.max(5, (month.value / maxValue) * 90)); // 5% to 90%
          }
        });
        
        setChartData(months);
      } catch (err: unknown) {
        console.error('Error fetching chart data:', err);
        // Set empty chart data on error
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, []);

  // Fetch department distribution data
  useEffect(() => {
    const fetchDepartmentData = async () => {
      try {
        setDepartmentChartLoading(true);
        
        // Fetch all employees to calculate department distribution
        const allEmployees: any[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;
        
        while (hasMore) {
          const response = await employeeService.getAll({ page, limit, status: 'Active' });
          if (response.success && response.data) {
            allEmployees.push(...response.data.employees);
            const total = response.data.total || 0;
            hasMore = allEmployees.length < total;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        // Calculate department distribution
        const departmentMap = new Map<string, number>();
        allEmployees.forEach(emp => {
          const count = departmentMap.get(emp.department) || 0;
          departmentMap.set(emp.department, count + 1);
        });
        
        const totalEmployees = allEmployees.length;
        const departments: DepartmentChartData[] = Array.from(departmentMap.entries())
          .map(([department, count]) => ({
            department,
            count,
            percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count); // Sort by count descending
        
        setDepartmentChartData(departments);
      } catch (err: unknown) {
        console.error('Error fetching department data:', err);
        setDepartmentChartData([]);
      } finally {
        setDepartmentChartLoading(false);
      }
    };

    fetchDepartmentData();
  }, []);

  // Fetch recent activity with user information
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setActivityLoading(true);
        const activities: RecentActivity[] = [];
        
        // Cache for users to avoid multiple requests
        const userCache = new Map<number, User>();
        
        // Helper function to get user name
        const getUserName = async (userId: number | undefined): Promise<string | null> => {
          if (!userId) return null;
          if (userCache.has(userId)) {
            return userCache.get(userId)!.username;
          }
          try {
            const userResponse = await userService.getById(userId);
            if (userResponse.success && userResponse.data) {
              userCache.set(userId, userResponse.data);
              return userResponse.data.username;
            }
          } catch {
            // Skip if error
          }
          return null;
        };
        
        // Get recent salary slips with generatedBy info
        try {
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          const slipsResponse = await salarySlipService.getByMonthYear({ month: currentMonth, year: currentYear });
          
          if (slipsResponse.success && slipsResponse.data && slipsResponse.data.length > 0) {
            const recentSlips = slipsResponse.data
              .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
              .slice(0, 3); // Get last 3 slips
            
            for (const slip of recentSlips) {
              const timeAgo = getTimeAgo(new Date(slip.generatedAt));
              const generatedByName = slip.generatedBy ? await getUserName(slip.generatedBy) : null;
              
              let activityText = `Salary slip generated for ${slip.month}/${slip.year}`;
              if (generatedByName) {
                activityText = `${generatedByName} generated a salary slip`;
              }
              
              activities.push({
                type: 'salary-slip',
                text: activityText,
                time: timeAgo,
                icon: (
                  <svg className={styles.activityIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              });
            }
          }
        } catch {
          // Skip if error
        }
        
        // Get recent reports with generatedBy info
        try {
          const reportsResponse = await reportsService.getHistory({ type: 'monthly' });
          if (reportsResponse.success && reportsResponse.data && reportsResponse.data.length > 0) {
            const latestReport = reportsResponse.data[0];
            const generatedByName = latestReport.generatedBy ? await getUserName(latestReport.generatedBy) : null;
            
            let reportText = 'Monthly report generated';
            if (generatedByName) {
              reportText = `${generatedByName} generated a monthly report`;
            }
            
            activities.push({
              type: 'report',
              text: reportText,
              time: getTimeAgo(new Date(latestReport.generatedAt)),
              icon: (
                <svg className={styles.activityIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
            });
          }
        } catch {
          // Skip if error
        }
        
        setRecentActivity(activities.slice(0, 3)); // Max 3 activities
      } catch (err: unknown) {
        console.error('Error fetching recent activity:', err);
        setRecentActivity([]);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Helper function to generate Y-axis labels
  const generateYAxisLabels = (maxValue: number): string[] => {
    const labels: string[] = [];
    const steps = 5;
    const stepValue = maxValue / steps;
    
    for (let i = steps; i >= 0; i--) {
      const value = Math.round(stepValue * i);
      labels.push(`$${value}K`);
    }
    
    return labels;
  };

  // Default values for loading/error states
  const displayStats = statistics || {
    totalEmployees: 0,
    totalMonthlySalary: 0,
    averageSalary: 0,
    totalDepartments: 0,
  };

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <Header />
      
      <main className={styles.mainContent}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h2>Dashboard</h2>
        </div>

        {/* Statistics Cards Row */}
        <div className={styles.statsSection}>
          <div className={styles.row}>
            {/* Card 1: Total Employees */}
            <div className={styles.col}>
              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <div className={`${styles.statIcon} ${styles.statIcon1}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className={styles.statTitle}>Total Employees</h3>
                </div>
                <div className={styles.statCardBody}>
                  {loading ? (
                    <div className={styles.loadingSpinner}></div>
                  ) : error ? (
                    <p className={styles.errorText}>Error loading data</p>
                  ) : (
                    <>
                      <p className={styles.statValue}>{displayStats.totalEmployees}</p>
                      <p className={styles.statLabel}>Active employees</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Total Monthly Salary */}
            <div className={styles.col}>
              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <div className={`${styles.statIcon} ${styles.statIcon2}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 1V23" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className={styles.statTitle}>Total Monthly Salary</h3>
                </div>
                <div className={styles.statCardBody}>
                  {loading ? (
                    <div className={styles.loadingSpinner}></div>
                  ) : error ? (
                    <p className={styles.errorText}>Error loading data</p>
                  ) : (
                    <>
                      <p className={styles.statValue}>${displayStats.totalMonthlySalary.toLocaleString()}</p>
                      <p className={styles.statLabel}>Current month</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Average Salary */}
            <div className={styles.col}>
              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <div className={`${styles.statIcon} ${styles.statIcon3}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className={styles.statTitle}>Average Salary</h3>
                </div>
                <div className={styles.statCardBody}>
                  {loading ? (
                    <div className={styles.loadingSpinner}></div>
                  ) : error ? (
                    <p className={styles.errorText}>Error loading data</p>
                  ) : (
                    <>
                      <p className={styles.statValue}>${displayStats.averageSalary.toLocaleString()}</p>
                      <p className={styles.statLabel}>Per employee</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: Total Departments */}
            <div className={styles.col}>
              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <div className={`${styles.statIcon} ${styles.statIcon4}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className={styles.statTitle}>Departments</h3>
                </div>
                <div className={styles.statCardBody}>
                  {loading ? (
                    <div className={styles.loadingSpinner}></div>
                  ) : error ? (
                    <p className={styles.errorText}>Error loading data</p>
                  ) : (
                    <>
                      <p className={styles.statValue}>{displayStats.totalDepartments}</p>
                      <p className={styles.statLabel}>Active departments</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section - Two Columns */}
        <div className={styles.chartSection}>
          <div className={styles.row}>
            {/* Column 1: Monthly Salary Trends - Line Chart */}
            <div className={styles.col}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.chartHeaderContent}>
                    <svg className={styles.chartHeaderIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Monthly Salary Trends</span>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  {chartLoading ? (
                    <div className={styles.loadingMessage}>
                      <p>Loading chart data...</p>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className={styles.emptyMessage}>
                      <p>No chart data available</p>
                    </div>
                  ) : (
                    <div className={styles.lineChartContainer}>
                      {/* Y-Axis Labels */}
                      <div className={styles.lineChartYAxis}>
                        {generateYAxisLabels(chartMaxValue).map((label, index) => (
                          <div key={index} className={styles.yLabel}>{label}</div>
                        ))}
                      </div>
                      
                      {/* Chart Area */}
                      <div className={styles.lineChartArea}>
                        {/* Grid Lines */}
                        <div className={styles.lineChartGrid}>
                          {generateYAxisLabels(chartMaxValue).map((_, index) => (
                            <div key={index} className={styles.gridLine}></div>
                          ))}
                        </div>
                        
                        {/* SVG Line Chart */}
                        <svg className={styles.lineChartSvg} viewBox="0 0 500 300" preserveAspectRatio="none">
                          {/* Gradient for line fill */}
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.05" />
                            </linearGradient>
                          </defs>
                          
                          {/* Area under line */}
                          <path
                            d={`M 0,300 ${chartData.map((item, index) => {
                              const x = (index / (chartData.length - 1 || 1)) * 500;
                              const y = 300 - (item.percentage / 100) * 280;
                              return `L ${x},${y}`;
                            }).join(' ')} L 500,300 Z`}
                            fill="url(#lineGradient)"
                            className={styles.lineChartAreaFill}
                          />
                          
                          {/* Line */}
                          <polyline
                            points={chartData.map((item, index) => {
                              const x = (index / (chartData.length - 1 || 1)) * 500;
                              const y = 300 - (item.percentage / 100) * 280;
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={styles.lineChartLine}
                          />
                          
                          {/* Data Points */}
                          {chartData.map((item, index) => {
                            const x = (index / (chartData.length - 1 || 1)) * 500;
                            const y = 300 - (item.percentage / 100) * 280;
                            return (
                              <g key={index}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="6"
                                  fill="#2563EB"
                                  stroke="#FFFFFF"
                                  strokeWidth="2"
                                  className={styles.lineChartPoint}
                                />
                                {/* Value Label */}
                                {item.value > 0 && (
                                  <text
                                    x={x}
                                    y={y - 15}
                                    textAnchor="middle"
                                    className={styles.lineChartValue}
                                  >
                                    ${item.value}K
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                        
                        {/* X-Axis Labels */}
                        <div className={styles.lineChartXAxis}>
                          {chartData.map((item, index) => (
                            <div key={index} className={styles.xLabel}>{item.month}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Department Distribution - Horizontal Bar Chart */}
            <div className={styles.col}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.chartHeaderContent}>
                    <svg className={styles.chartHeaderIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Department Distribution</span>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  {departmentChartLoading ? (
                    <div className={styles.loadingMessage}>
                      <p>Loading department data...</p>
                    </div>
                  ) : departmentChartData.length === 0 ? (
                    <div className={styles.emptyMessage}>
                      <p>No department data available</p>
                    </div>
                  ) : (
                    <div className={styles.departmentChartContainer}>
                      {departmentChartData.map((dept, index) => (
                        <div key={index} className={styles.departmentBarWrapper}>
                          <div className={styles.departmentBarInfo}>
                            <span className={styles.departmentName}>{dept.department}</span>
                            <span className={styles.departmentCount}>{dept.count} employees</span>
                            <span className={styles.departmentPercentage}>{dept.percentage}%</span>
                          </div>
                          <div className={styles.departmentBarContainer}>
                            <div
                              className={styles.departmentBar}
                              style={{ width: `${dept.percentage}%` }}
                            >
                              <div className={styles.departmentBarFill}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className={styles.quickActionsSection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              Quick Actions
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <div className={styles.col}>
                  <button className={styles.actionButton} onClick={() => navigate('/employees/add')}>
                    <div className={styles.actionIcon}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className={styles.actionText}>Add Employee</span>
                  </button>
                </div>
                <div className={styles.col}>
                  <button className={styles.actionButton} onClick={() => navigate('/salary-slips/generate')}>
                    <div className={styles.actionIcon}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className={styles.actionText}>Generate Salary Slip</span>
                  </button>
                </div>
                <div className={styles.col}>
                  <button className={styles.actionButton} onClick={() => navigate('/reports/generate')}>
                    <div className={styles.actionIcon}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 13H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className={styles.actionText}>Generate Report</span>
                  </button>
                </div>
                <div className={styles.col}>
                  <button className={styles.actionButton} onClick={() => navigate('/employees')}>
                    <div className={styles.actionIcon}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className={styles.actionText}>View All Employees</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className={styles.recentActivitySection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              Recent Activity
            </div>
            <div className={styles.cardBody}>
              {activityLoading ? (
                <div className={styles.loadingMessage}>
                  <p>Loading recent activity...</p>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className={styles.emptyMessage}>
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className={styles.activityList}>
                  {recentActivity.map((activity, index) => (
                    <div key={index} className={styles.activityItem}>
                      {activity.icon}
                      <span className={styles.activityText}>{activity.text}</span>
                      <span className={styles.activityTime}>{activity.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
