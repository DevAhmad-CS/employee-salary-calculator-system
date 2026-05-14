/**
 * Personal Information Page
 * 
 * Read-only page displaying user's personal information.
 * Shows: Username, Role, Employee ID (formatted).
 * Cannot be edited by the user.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { profileService, type Profile } from '../../../services/api/profile.service';
import styles from './PersonalInfo.module.css';

export default function PersonalInfo() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string>('');

  // Format Employee ID (e.g., 1 -> EMP001)
  const formatEmployeeId = (id: number | null | undefined): string => {
    if (!id) return 'N/A';
    return `EMP${String(id).padStart(3, '0')}`;
  };

  // Format role display name
  const formatRole = (role: string) => {
    const roleMap: Record<string, string> = {
      Admin: 'Administrator',
      'HR': 'HR Manager',
      Accountant: 'Accountant',
      Employee: 'Employee',
      Management: 'Management',
    };
    return roleMap[role] || role;
  };

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setFetching(true);
        setError('');
        const response = await profileService.getProfile();
        if (response.success) {
          setProfile(response.data);
        } else {
          setError(response.error || 'Failed to fetch profile');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
        setError(errorMessage);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, []);

  if (fetching) {
    return (
      <div className={styles.personalInfoContainer}>
        <Sidebar />
        <div className={styles.mainContentWrapper}>
          <Header />
          <main className={styles.mainContent}>
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <span>Loading Profile...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.personalInfoContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Personal Information</h2>
              <p className={styles.pageSubtitle}>View your personal details and account information</p>
            </div>
            <button
              className={styles.btnSecondary}
              onClick={() => navigate('/profile')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Profile
            </button>
          </div>

          {/* Display Section - Read Only */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Personal Details</h3>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {error}
              </div>
            )}

            {profile && (
              <div className={styles.infoDisplay}>
                {/* Username */}
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Username</span>
                  </div>
                  <span className={styles.infoValue}>{profile.username}</span>
                </div>

                {/* Role */}
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Role</span>
                  </div>
                  <span className={styles.infoValue}>{formatRole(profile.role)}</span>
                </div>

                {/* Employee ID */}
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Employee ID</span>
                  </div>
                  <span className={styles.infoValue}>
                    {profile.employeeId ? (
                      <span className={styles.employeeIdBadge}>{formatEmployeeId(profile.employeeId)}</span>
                    ) : (
                      <span className={styles.noEmployeeId}>N/A</span>
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.readOnlyNote}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>This information is read-only. Contact your administrator to make changes.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
