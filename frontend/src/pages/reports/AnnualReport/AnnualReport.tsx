/**
 * Annual Report Page
 * 
 * Displays annual financial report with statistics and employee breakdown.
 * Matches mockup design exactly with all sections and animations.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { reportsService } from '../../../services/api/reports.service';
import { salarySlipService } from '../../../services/api/salary-slips.service';
import { employeeService } from '../../../services/api/employee.service';
import type { GeneratedReport } from '../../../services/api/reports.service';
import type { Employee } from '../../../services/api/employee.service';
import { useAuthStore } from '../../../services/state/authStore';
import styles from './AnnualReport.module.css';

// Month names for display
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface MonthlyBreakdown {
  month: number;
  monthName: string;
  totalEmployees: number;
  totalPayroll: number;
  averageSalary: number;
}

interface TopEmployee {
  employeeId: number;
  employeeName: string;
  department: string;
  position: string;
  annualGrossSalary: number;
  annualNetSalary: number;
}

export default function AnnualReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  const [topEmployees, setTopEmployees] = useState<TopEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Get year from URL params
  const year = parseInt(searchParams.get('year') || '0');

  // Quick filters state
  const [quickDepartment, setQuickDepartment] = useState<string>('');
  const [quickEmployeeSearch, setQuickEmployeeSearch] = useState<string>('');

  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      if (!year) {
        setError('Year is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Generate report
        const reportResponse = await reportsService.generate({
          type: 'annual',
          year,
        });

        setReport(reportResponse.data);

        // Calculate monthly breakdown
        const monthlyData: MonthlyBreakdown[] = [];
        for (let month = 1; month <= 12; month++) {
          try {
            const slipsResponse = await salarySlipService.getByMonthYear({ month, year });
            const slips = slipsResponse.data;
            
            if (slips.length > 0) {
              const uniqueEmployees = new Set(slips.map(s => s.employeeId));
              const totalPayroll = slips.reduce((sum, s) => sum + s.netSalary, 0);
              const averageSalary = totalPayroll / slips.length;

              monthlyData.push({
                month,
                monthName: monthNames[month - 1],
                totalEmployees: uniqueEmployees.size,
                totalPayroll,
                averageSalary,
              });
            }
          } catch {
            // Skip months with no data
          }
        }

        setMonthlyBreakdown(monthlyData);

        // Calculate top employees by annual salary
        const employeeAnnualSalaries = new Map<number, { gross: number; net: number; employee?: Employee }>();
        
        for (let month = 1; month <= 12; month++) {
          try {
            const slipsResponse = await salarySlipService.getByMonthYear({ month, year });
            const slips = slipsResponse.data;

            for (const slip of slips) {
              if (!employeeAnnualSalaries.has(slip.employeeId)) {
                try {
                  const employeeResponse = await employeeService.getById(slip.employeeId);
                  employeeAnnualSalaries.set(slip.employeeId, {
                    gross: 0,
                    net: 0,
                    employee: employeeResponse.data,
                  });
                } catch {
                  employeeAnnualSalaries.set(slip.employeeId, {
                    gross: 0,
                    net: 0,
                  });
                }
              }

              const data = employeeAnnualSalaries.get(slip.employeeId)!;
              data.gross += slip.basicSalary + slip.totalAllowances + slip.totalBonus;
              data.net += slip.netSalary;
            }
          } catch {
            // Skip months with no data
          }
        }

        // Convert to array and sort by net salary
        const topEmployeesList: TopEmployee[] = Array.from(employeeAnnualSalaries.entries())
          .map(([employeeId, data]) => ({
            employeeId,
            employeeName: data.employee?.fullName || 'Unknown',
            department: data.employee?.department || 'Unknown',
            position: data.employee?.position || 'N/A',
            annualGrossSalary: data.gross,
            annualNetSalary: data.net,
          }))
          .sort((a, b) => b.annualNetSalary - a.annualNetSalary)
          .slice(0, 10); // Top 10

        setTopEmployees(topEmployeesList);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch report data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [year]);

  // Filter top employees
  const filteredTopEmployees = topEmployees.filter((emp) => {
    if (quickDepartment && emp.department !== quickDepartment) {
      return false;
    }
    if (quickEmployeeSearch.trim()) {
      const query = quickEmployeeSearch.toLowerCase();
      return (
        emp.employeeName.toLowerCase().includes(query) ||
        formatEmployeeId(emp.employeeId).toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate annual totals
  const annualTotals = monthlyBreakdown.reduce(
    (acc, month) => {
      acc.totalEmployees += month.totalEmployees;
      acc.totalPayroll += month.totalPayroll;
      return acc;
    },
    { totalEmployees: 0, totalPayroll: 0 }
  );

  const annualAverage = annualTotals.totalPayroll / (monthlyBreakdown.length || 1);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format employee ID
  const formatEmployeeId = (id: number) => {
    return `EMP${String(id).padStart(3, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get department badge class
  const getDepartmentBadgeClass = (department: string) => {
    const dept = department?.toLowerCase() || '';
    if (dept.includes('it')) return styles.badgeIt;
    if (dept.includes('hr')) return styles.badgeHr;
    if (dept.includes('finance')) return styles.badgeFinance;
    return styles.badgeIt;
  };

  // Handle quick filters
  const handleApplyQuickFilters = () => {
    // Filters are applied via filteredTopEmployees
  };

  const handleClearQuickFilters = () => {
    setQuickDepartment('');
    setQuickEmployeeSearch('');
  };

  if (loading) {
    return (
      <div className={styles.annualReportContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.loadingMessage}>
              <p>Loading report...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.annualReportContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.errorMessage}>
              <p>{error || 'Failed to load report'}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.annualReportContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Annual Report</h2>
              <p className={styles.pageSubtitle}>
                <svg className={styles.periodIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {year} (January - December)
              </p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.btnSecondary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download PDF
              </button>
              <button className={styles.btnSecondary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9V2H18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 14V22H6V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 6H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Print
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate('/reports/generate')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Generate Report
              </button>
            </div>
          </div>

          {/* Active Filters Section */}
          <div className={styles.activeFiltersSection}>
            <div className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Active Filters</h3>
              </div>
              <div className={styles.filterTags}>
                <span className={styles.filterTag}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Department: All
                </span>
                <button
                  className={`${styles.btnSmall} ${styles.btnSecondary}`}
                  onClick={() => navigate('/reports/generate')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Modify Filters
                </button>
              </div>
            </div>
          </div>

          {/* Report Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardHeader}>
                <svg className={styles.summaryIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Total Employees</h3>
              </div>
              <p className={styles.summaryValue}>{report.statistics.totalEmployees}</p>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardHeader}>
                <svg className={styles.summaryIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Total Annual Salaries</h3>
              </div>
              <p className={styles.summaryValue}>{formatCurrency(report.statistics.totalSalaries)}</p>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardHeader}>
                <svg className={styles.summaryIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Average Annual Salary</h3>
              </div>
              <p className={styles.summaryValue}>{formatCurrency(report.statistics.averageSalary)}</p>
            </div>
          </div>

          {/* Report Details Section */}
          <div className={styles.reportDetailsSection}>
            <div className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Report Details</h3>
              </div>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabelWrapper}>
                    <svg className={styles.detailLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.detailLabel}>Report Period</span>
                  </div>
                  <span className={styles.detailValue}>
                    {year} (January - December)
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabelWrapper}>
                    <svg className={styles.detailLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.detailLabel}>Generated On</span>
                  </div>
                  <span className={styles.detailValue}>{formatDate(report.generatedAt)}</span>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabelWrapper}>
                    <svg className={styles.detailLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.detailLabel}>Generated By</span>
                  </div>
                  <span className={styles.detailValue}>{user?.username || 'Admin User'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filters Section */}
          <div className={styles.quickFiltersSection}>
            <div className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Quick Filters</h3>
              </div>
              <div className={styles.quickFilters}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Department
                  </label>
                  <select
                    className={styles.formInput}
                    value={quickDepartment}
                    onChange={(e) => setQuickDepartment(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 21L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Employee Name
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Search employee name..."
                    value={quickEmployeeSearch}
                    onChange={(e) => setQuickEmployeeSearch(e.target.value)}
                  />
                </div>
                <div className={styles.filterActions}>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleApplyQuickFilters}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Apply
                  </button>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleClearQuickFilters}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown Summary */}
          <div className={styles.breakdownSection}>
            <div className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 3H15C16.1046 3 17 3.89543 17 5V19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19V5C7 3.89543 7.89543 3 9 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Monthly Breakdown Summary</h3>
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.reportTable}>
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
                          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Total Employees
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Total Payroll
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Average Salary
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBreakdown.map((month) => (
                      <tr key={month.month}>
                        <td>
                          <span className={styles.badgeMonthly}>{month.monthName}</span>
                        </td>
                        <td>{month.totalEmployees}</td>
                        <td className={styles.salaryAmount}>{formatCurrency(month.totalPayroll)}</td>
                        <td className={styles.salaryAmount}>{formatCurrency(month.averageSalary)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className={styles.tableTotal}>
                      <td><strong>Annual Total</strong></td>
                      <td><strong>{annualTotals.totalEmployees}</strong></td>
                      <td className={styles.salaryAmount}><strong>{formatCurrency(annualTotals.totalPayroll)}</strong></td>
                      <td className={styles.salaryAmount}><strong>{formatCurrency(annualAverage)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Top Employees by Annual Salary */}
          <div className={styles.employeeTableSection}>
            <div className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Top Employees by Annual Salary</h3>
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Employee ID
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Name
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Department
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 21V17C16 15.8954 15.1046 15 14 15H10C8.89543 15 8 15.8954 8 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Position
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Annual Gross Salary
                      </th>
                      <th>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Annual Net Salary
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopEmployees.map((emp) => (
                      <tr key={emp.employeeId}>
                        <td className={styles.employeeId}>{formatEmployeeId(emp.employeeId)}</td>
                        <td>{emp.employeeName}</td>
                        <td>
                          <span className={`${styles.badge} ${getDepartmentBadgeClass(emp.department)}`}>
                            {emp.department}
                          </span>
                        </td>
                        <td>{emp.position}</td>
                        <td className={styles.salaryAmount}>{formatCurrency(emp.annualGrossSalary)}</td>
                        <td className={`${styles.salaryAmount} ${styles.net}`}>
                          {formatCurrency(emp.annualNetSalary)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

