/**
 * Accountant Dashboard
 * 
 * Simple dashboard for Accountant role.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar/Sidebar';
import Header from '../../components/layout/Header/Header';
import { salarySlipService, type SalarySlip } from '../../services/api/salary-slips.service';
import { reportsService } from '../../services/api/reports.service';
import styles from './Dashboard.module.css';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function AccountantDashboard() {
  const navigate = useNavigate();
  const [recentSlips, setRecentSlips] = useState<SalarySlip[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    const fetchSlips = async () => {
      try {
        setSlipsLoading(true);
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const response = await salarySlipService.getByMonthYear({ month: currentMonth, year: currentYear });
        if (response.success) {
          const sorted = response.data
            .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
            .slice(0, 5);
          setRecentSlips(sorted);
        }
      } catch (err) {
        console.error('Error fetching salary slips:', err);
      } finally {
        setSlipsLoading(false);
      }
    };

    const fetchReports = async () => {
      try {
        setReportsLoading(true);
        const response = await reportsService.getHistory({ type: 'monthly' });
        if (response.success) {
          const sorted = response.data
            .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
            .slice(0, 5);
          setRecentReports(sorted);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setReportsLoading(false);
      }
    };

    fetchSlips();
    fetchReports();
  }, []);

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

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        <main className={styles.mainContent}>
          <div className={styles.container}>
            {/* Welcome Section */}
            <div className={styles.section}>
              <h1 className={styles.pageTitle}>Accountant Dashboard</h1>
              <p className={styles.pageSubtitle}>Manage salary slips and generate reports.</p>
            </div>

            {/* Quick Actions */}
            <div className={styles.statsSection}>
              <div className={styles.row}>
                <div className={styles.col}>
                  <button 
                    className={styles.actionButton} 
                    onClick={() => navigate('/salary-slips/generate')}
                    style={{ width: '100%' }}
                  >
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
                  <button 
                    className={styles.actionButton} 
                    onClick={() => navigate('/reports/generate')}
                    style={{ width: '100%' }}
                  >
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
                    <span>Recent Salary Slips ({monthNames[currentMonth - 1]} {currentYear})</span>
                  </div>
                  <button 
                    className={styles.viewAllButton}
                    onClick={() => navigate('/salary-slips')}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.cardBody}>
                  {slipsLoading ? (
                    <div className={styles.loadingMessage}>
                      <p>Loading salary slips...</p>
                    </div>
                  ) : recentSlips.length === 0 ? (
                    <div className={styles.emptyMessage}>
                      <p>No salary slips for this month yet.</p>
                    </div>
                  ) : (
                    <div className={styles.slipsList}>
                      {recentSlips.map((slip) => (
                        <div 
                          key={slip.id} 
                          className={styles.slipItem}
                          onClick={() => navigate(`/salary-slips/${slip.id}`)}
                        >
                          <div className={styles.slipInfo}>
                            <div className={styles.slipMonth}>
                              Salary Slip #{slip.id}
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

            {/* Recent Reports */}
            <div className={styles.section}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderContent}>
                    <svg className={styles.cardHeaderIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Recent Reports</span>
                  </div>
                  <button 
                    className={styles.viewAllButton}
                    onClick={() => navigate('/reports')}
                  >
                    View All
                  </button>
                </div>
                <div className={styles.cardBody}>
                  {reportsLoading ? (
                    <div className={styles.loadingMessage}>
                      <p>Loading reports...</p>
                    </div>
                  ) : recentReports.length === 0 ? (
                    <div className={styles.emptyMessage}>
                      <p>No reports generated yet.</p>
                    </div>
                  ) : (
                    <div className={styles.activityList}>
                      {recentReports.map((report, index) => (
                        <div key={index} className={styles.activityItem}>
                          <svg className={styles.activityIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className={styles.activityText}>
                            {report.type === 'monthly' ? 'Monthly' : 'Annual'} Report - {report.month ? monthNames[report.month - 1] : ''} {report.year}
                          </span>
                          <span className={styles.activityTime}>{formatDate(report.generatedAt)}</span>
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

