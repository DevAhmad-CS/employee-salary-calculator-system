/**
 * Manage Bonuses Page
 * 
 * Allows managing bonuses for a specific employee.
 * Includes a table of current bonuses and a form to add new ones.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { bonusesService } from '../../../services/api/bonuses.service';
import { employeeService } from '../../../services/api/employee.service';
import type { Bonus } from '../../../services/api/bonuses.service';
import type { Employee } from '../../../services/api/employee.service';
import styles from './ManageBonuses.module.css';

// Form validation schema
const bonusSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  notes: z.string().optional(),
});

type BonusFormData = z.infer<typeof bonusSchema>;

export default function ManageBonuses() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{ type: string; amount: number; notes?: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BonusFormData>({
    resolver: zodResolver(bonusSchema),
  });

  // Fetch employee and bonuses data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Invalid employee ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const [employeeResponse, bonusesResponse] = await Promise.all([
          employeeService.getById(parseInt(id)),
          bonusesService.getByEmployeeId(parseInt(id)),
        ]);

        setEmployee(employeeResponse.data);
        setBonuses(bonusesResponse.data);
      } catch (err: unknown) {
        setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err instanceof Error ? err.message : 'Unknown error') || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle add bonus
  const onSubmit = async (data: BonusFormData) => {
    if (!id) return;

    try {
      setError('');
      const response = await bonusesService.create({
        employeeId: parseInt(id),
        type: data.type,
        amount: data.amount,
      });

      setBonuses([...bonuses, response.data]);
      reset();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err instanceof Error ? err.message : 'Unknown error') || 'Failed to create bonus');
    }
  };

  // Handle edit bonus
  const handleEdit = (bonus: Bonus) => {
    setEditingId(bonus.id);
    setEditFormData({
      type: bonus.type,
      amount: bonus.amount,
      notes: '', // Notes not stored in backend yet
    });
  };

  // Handle update bonus
  const handleUpdate = async (bonusId: number) => {
    if (!editFormData) return;

    try {
      setError('');
      const response = await bonusesService.update(bonusId, {
        type: editFormData.type,
        amount: editFormData.amount,
      });
      setBonuses(bonuses.map((b) => (b.id === bonusId ? response.data : b)));
      setEditingId(null);
      setEditFormData(null);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err instanceof Error ? err.message : 'Unknown error') || 'Failed to update bonus');
    }
  };

  // Handle delete bonus
  const handleDelete = async (bonusId: number) => {
    if (!window.confirm('Are you sure you want to delete this bonus?')) {
      return;
    }

    try {
      setError('');
      await bonusesService.delete(bonusId);
      setBonuses(bonuses.filter((b) => b.id !== bonusId));
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err instanceof Error ? err.message : 'Unknown error') || 'Failed to delete bonus');
    }
  };

  // Calculate total bonuses
  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.manageBonusesContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.loadingMessage}>
              <p>Loading bonuses...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className={styles.manageBonusesContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.manageBonusesContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Manage Bonuses</h2>
              {employee && (
                <p className={styles.employeeName}>
                  <svg className={styles.employeeIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Employee: {employee.fullName}
                </p>
              )}
            </div>
            <button className={styles.btnSecondary} onClick={() => navigate(`/employees/${id}`)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Details
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}

          {/* Current Bonuses List */}
          <div className={styles.listSection}>
            <div className={styles.sectionHeaderCard}>
              <svg className={styles.sectionIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Current Bonuses</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.componentsTable}>
                <thead>
                  <tr>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 21V17C16 15.8954 15.1046 15 14 15H10C8.89543 15 8 15.8954 8 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Type
                      </div>
                    </th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Amount
                      </div>
                    </th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg className={styles.thIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.3791 9.94419 19.8571 9.70531 19.3875C9.46643 18.9179 9.12391 18.5135 8.705 18.21L8.645 18.15C8.45934 17.964 8.23868 17.8165 7.99588 17.7159C7.75308 17.6152 7.49279 17.5634 7.23 17.5634C6.96721 17.5634 6.70692 17.6152 6.46412 17.7159C6.22132 17.8165 6.00066 17.964 5.815 18.15C5.62934 18.3363 5.48178 18.557 5.38118 18.7998C5.28057 19.0426 5.22879 19.3029 5.22879 19.5657C5.22879 19.8285 5.28057 20.0888 5.38118 20.3316C5.48178 20.5744 5.62934 20.7951 5.815 20.9814L5.875 21.0414C6.10551 21.2719 6.26018 21.5712 6.319 21.8956C6.37782 22.22 6.33812 22.5556 6.205 22.8571" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={styles.emptyMessage}>
                        No bonuses found. Add one below.
                      </td>
                    </tr>
                  ) : (
                    bonuses.map((bonus) => (
                      <tr key={bonus.id}>
                        <td>
                          {editingId === bonus.id ? (
                            <input
                              type="text"
                              value={editFormData?.type || ''}
                              onChange={(e) => setEditFormData({ ...editFormData!, type: e.target.value })}
                              className={styles.editInput}
                            />
                          ) : (
                            <span className={styles.badgeBonus}>{bonus.type}</span>
                          )}
                        </td>
                        <td className={styles.amountCell}>
                          {editingId === bonus.id ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editFormData?.amount || ''}
                              onChange={(e) => setEditFormData({ ...editFormData!, amount: parseFloat(e.target.value) || 0 })}
                              className={styles.editInput}
                            />
                          ) : (
                            formatCurrency(bonus.amount)
                          )}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            {editingId === bonus.id ? (
                              <>
                                <button
                                  className={styles.btnSmall}
                                  onClick={() => handleUpdate(bonus.id)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Save
                                </button>
                                <button
                                  className={styles.btnSmall}
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditFormData(null);
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className={`${styles.btnSmall} ${styles.btnEdit}`}
                                  onClick={() => handleEdit(bonus)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  className={`${styles.btnSmall} ${styles.btnDelete}`}
                                  onClick={() => handleDelete(bonus.id)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.totalSection}>
              <svg className={styles.totalIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <strong>Total Bonuses: <span className={styles.totalAmount}>{formatCurrency(totalBonuses)}</span></strong>
            </div>
          </div>

          {/* Add New Bonus Form */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeaderCard}>
              <svg className={styles.sectionIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Add New Bonus</h3>
            </div>
            <form className={styles.addForm} onSubmit={handleSubmit(onSubmit)}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="type" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 21V17C16 15.8954 15.1046 15 14 15H10C8.89543 15 8 15.8954 8 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                    Type *
                  </label>
                  <select
                    id="type"
                    {...register('type')}
                    className={styles.formInput}
                  >
                    <option value="">Select type</option>
                    <option value="Performance">Performance</option>
                    <option value="Annual">Annual</option>
                    <option value="Special">Special</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.type && (
                    <span className={styles.errorText}>{errors.type.message}</span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="amount" className={styles.formLabel}>
                    <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Amount *
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className={styles.formInput}
                  />
                  {errors.amount && (
                    <span className={styles.errorText}>{errors.amount.message}</span>
                  )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.formLabel}>
                  <svg className={styles.labelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notes
                </label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  className={styles.formInput}
                  placeholder="Enter notes or description (optional)"
                  rows={3}
                />
                {errors.notes && (
                  <span className={styles.errorText}>{errors.notes.message}</span>
                )}
              </div>
              <div className={styles.formActionsSingle}>
                <button type="submit" className={styles.btnPrimary}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add Bonus
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

