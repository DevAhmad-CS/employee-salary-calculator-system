/**
 * Salary Slip Details Page
 * 
 * Displays detailed information about a salary slip.
 * Matches mockup design exactly with slip-details-card structure.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { salarySlipService } from '../../../services/api/salary-slips.service';
import { employeeService } from '../../../services/api/employee.service';
import { allowancesService } from '../../../services/api/allowances.service';
import { deductionsService } from '../../../services/api/deductions.service';
import { bonusesService } from '../../../services/api/bonuses.service';
import type { SalarySlip } from '../../../services/api/salary-slips.service';
import type { Employee } from '../../../services/api/employee.service';
import type { Allowance } from '../../../services/api/allowances.service';
import type { Deduction } from '../../../services/api/deductions.service';
import type { Bonus } from '../../../services/api/bonuses.service';
import styles from './SlipDetails.module.css';

// Month names for display
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SlipDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [slip, setSlip] = useState<SalarySlip | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);

  // Fetch salary slip and related data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Invalid salary slip ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Fetch salary slip
        const slipResponse = await salarySlipService.getById(parseInt(id));
        const slipData = slipResponse.data;
        setSlip(slipData);

        // Fetch employee data
        const employeeResponse = await employeeService.getById(slipData.employeeId);
        setEmployee(employeeResponse.data);

        // Fetch allowances, deductions, and bonuses for the employee
        try {
          const allowancesResponse = await allowancesService.getByEmployeeId(slipData.employeeId);
          setAllowances(allowancesResponse.data || []);
        } catch (err) {
          console.error('Error fetching allowances:', err);
        }

        try {
          const deductionsResponse = await deductionsService.getByEmployeeId(slipData.employeeId);
          setDeductions(deductionsResponse.data || []);
        } catch (err) {
          console.error('Error fetching deductions:', err);
        }

        try {
          const bonusesResponse = await bonusesService.getByEmployeeId(slipData.employeeId);
          setBonuses(bonusesResponse.data || []);
        } catch (err) {
          console.error('Error fetching bonuses:', err);
        }
      } catch (err: unknown) {
        setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err instanceof Error ? err.message : 'Unknown error') || 'Failed to fetch salary slip data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

  // Calculate gross salary
  const grossSalary = slip ? slip.basicSalary + slip.totalAllowances + slip.totalBonus : 0;

  if (loading) {
    return (
      <div className={styles.slipDetailsContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.loadingMessage}>
              <p>Loading salary slip data...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!slip) {
    return (
      <div className={styles.slipDetailsContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.errorMessage}>
              <p>{error || 'Salary slip not found'}</p>
              <button
                className={styles.backButton}
                onClick={() => navigate('/salary-slips')}
              >
                Back to Salary Slips
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.slipDetailsContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Salary Slip Details</h2>
              <p className={styles.pageSubtitle}>
                <svg className={styles.periodIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {monthNames[slip.month - 1]} {slip.year}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.btnSecondary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9V2H18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 14V22H6V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 6H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Print
              </button>
              <button className={styles.btnSecondary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download PDF
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate('/salary-slips')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to All Slips
              </button>
            </div>
          </div>

          {/* Salary Slip Details Card */}
          <div className={styles.slipDetailsCard}>
            {/* Slip Header */}
            <div className={styles.slipHeader}>
              <div className={styles.slipHeaderContent}>
                <svg className={styles.slipHeaderIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h3>Salary Slip</h3>
                  <p className={styles.slipPeriod}>{monthNames[slip.month - 1]} {slip.year}</p>
                </div>
              </div>
            </div>

            {/* Employee Information Section */}
            <div className={styles.slipSection}>
              <div className={styles.sectionHeaderCard}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h4>Employee Information</h4>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Name</span>
                  </div>
                  <span className={styles.infoValue}>{employee?.fullName || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Employee ID</span>
                  </div>
                  <span className={`${styles.infoValue} ${styles.employeeIdBadge}`}>
                    {employee ? formatEmployeeId(employee.id) : 'N/A'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Department</span>
                  </div>
                  <span className={styles.infoValue}>
                    {employee?.department ? (
                      <span className={styles.badge}>{employee.department}</span>
                    ) : 'N/A'}
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
                  <span className={styles.infoValue}>{employee?.position || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Salary Breakdown Section */}
            <div className={styles.slipSection}>
              <div className={styles.sectionHeaderCard}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h4>Salary Breakdown</h4>
              </div>
              <div className={styles.breakdownTable}>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Basic Salary</span>
                  <span className={`${styles.breakdownValue} ${styles.positive}`}>{formatCurrency(slip.basicSalary)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Total Allowances</span>
                  <span className={`${styles.breakdownValue} ${styles.positive}`}>+{formatCurrency(slip.totalAllowances)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Total Bonus</span>
                  <span className={`${styles.breakdownValue} ${styles.positive}`}>+{formatCurrency(slip.totalBonus)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Gross Salary</span>
                  <span className={`${styles.breakdownValue} ${styles.gross}`}>{formatCurrency(grossSalary)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Total Deductions</span>
                  <span className={`${styles.breakdownValue} ${styles.negative}`}>-{formatCurrency(slip.totalDeductions)}</span>
                </div>
                <div className={styles.breakdownDivider}></div>
                <div className={`${styles.breakdownRow} ${styles.total}`}>
                  <span className={styles.breakdownLabel}>Net Salary</span>
                  <span className={`${styles.breakdownValue} ${styles.netAmount}`}>{formatCurrency(slip.netSalary)}</span>
                </div>
              </div>
            </div>

            {/* Allowances Details Section */}
            {allowances.length > 0 && (
              <div className={styles.slipSection}>
                <div className={styles.sectionHeaderCard}>
                  <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h4>Allowances Details</h4>
                </div>
                <div className={styles.detailsTable}>
                  {allowances.map((allowance) => (
                    <div key={allowance.id} className={styles.detailsRow}>
                      <div className={styles.detailItemFull}>
                        <svg className={styles.detailIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className={styles.detailName}>{allowance.type}</span>
                        <span className={`${styles.detailAmount} ${styles.positive}`}>{formatCurrency(allowance.amount)}</span>
                      </div>
                      {allowance.notes && (
                        <div className={styles.detailNote}>{allowance.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bonuses Details Section */}
            {bonuses.length > 0 && (
              <div className={styles.slipSection}>
                <div className={styles.sectionHeaderCard}>
                  <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h4>Bonuses Details</h4>
                </div>
                <div className={styles.detailsTable}>
                  {bonuses.map((bonus) => (
                    <div key={bonus.id} className={styles.detailsRow}>
                      <div className={styles.detailItemFull}>
                        <svg className={styles.detailIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className={styles.detailName}>{bonus.type}</span>
                        <span className={`${styles.detailAmount} ${styles.bonus}`}>{formatCurrency(bonus.amount)}</span>
                      </div>
                      {bonus.notes && (
                        <div className={styles.detailNote}>{bonus.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deductions Details Section */}
            {deductions.length > 0 && (
              <div className={styles.slipSection}>
                <div className={styles.sectionHeaderCard}>
                  <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L8.91 8.26L2 9.27L7 14.14L5.82 21.02L12 17.77L18.18 21.02L17 14.14L22 9.27L15.09 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h4>Deductions Details</h4>
                </div>
                <div className={styles.detailsTable}>
                  {deductions.map((deduction) => (
                    <div key={deduction.id} className={styles.detailsRow}>
                      <div className={styles.detailItemFull}>
                        <svg className={styles.detailIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L8.91 8.26L2 9.27L7 14.14L5.82 21.02L12 17.77L18.18 21.02L17 14.14L22 9.27L15.09 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className={styles.detailName}>{deduction.type}</span>
                        <span className={`${styles.detailAmount} ${styles.negative}`}>-{formatCurrency(deduction.amount)}</span>
                      </div>
                      {deduction.notes && (
                        <div className={styles.detailNote}>{deduction.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
