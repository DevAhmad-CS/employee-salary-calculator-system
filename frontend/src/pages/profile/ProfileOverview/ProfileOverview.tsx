/**
 * Profile Overview Page
 * 
 * Displays user profile overview with summary card, quick actions, and account information.
 * Matches mockup design exactly with animations.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { profileService, type Profile } from '../../../services/api/profile.service';
import { useAuthStore } from '../../../services/state/authStore';
import styles from './ProfileOverview.module.css';

export default function ProfileOverview() {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await profileService.getProfile();
        if (response.success) {
          setProfile(response.data);
        } else {
          setError(response.error || 'Failed to fetch profile');
        }
      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : 'Unknown error') || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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

  // Get display name (use profile username or auth user username)
  const displayName = profile?.username || authUser?.username || 'User';
  const displayRole = profile ? formatRole(profile.role) : (authUser ? formatRole(authUser.role) : '');
  // Use email from API only (no mock data)
  const displayEmail = profile?.email || null;

  if (loading) {
    return (
      <div className={styles.profileOverviewContainer}>
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

  if (error) {
    return (
      <div className={styles.profileOverviewContainer}>
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

  return (
    <div className={styles.profileOverviewContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        <main className={styles.mainContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Profile Overview</h2>
              <p className={styles.pageSubtitle}>Manage your account settings and personal information</p>
            </div>
          </div>

          {/* Profile Summary Card */}
          <div className={styles.profileSummaryCard}>
            <div className={styles.profileHeader}>
              <div className={styles.profileAvatar}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="url(#avatarGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="url(#avatarGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#2563EB',stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#1E40AF',stopOpacity:1}} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className={styles.profileInfo}>
                <h3>{displayName}</h3>
                <p className={styles.userRole}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {displayRole}
                </p>
                <p className={styles.userEmail}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {displayEmail || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.profileActions}>
            <div className={styles.actionCards}>
              <button className={styles.actionCard} onClick={() => navigate('/profile/personal-info')}>
                <div className={styles.actionIconWrapper}>
                  <svg className={styles.actionIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4>Personal Information</h4>
                <p>Update your personal details</p>
              </button>
              <button className={styles.actionCard} onClick={() => navigate('/profile/change-password')}>
                <div className={styles.actionIconWrapper}>
                  <svg className={styles.actionIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4>Change Password</h4>
                <p>Update your account password</p>
              </button>
              <button className={styles.actionCard} onClick={() => navigate('/profile/account-settings')}>
                <div className={styles.actionIconWrapper}>
                  <svg className={styles.actionIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.3791 9.94419 19.8571 9.70531 19.3875C9.46643 18.9179 9.12391 18.5135 8.705 18.21L8.645 18.15C8.45934 17.964 8.23868 17.8165 7.99588 17.7159C7.75308 17.6152 7.49279 17.5634 7.23 17.5634C6.96721 17.5634 6.70692 17.6152 6.46412 17.7159C6.22132 17.8165 6.00066 17.964 5.815 18.15C5.62934 18.3363 5.48178 18.557 5.38118 18.7998C5.28057 19.0426 5.22879 19.3029 5.22879 19.5657C5.22879 19.8285 5.28057 20.0888 5.38118 20.3316C5.48178 20.5744 5.62934 20.7951 5.815 20.9814L5.875 21.0414C6.10551 21.2719 6.26018 21.5712 6.319 21.8956C6.37782 22.22 6.33812 22.5556 6.205 22.8571" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4>Account Settings</h4>
                <p>Manage preferences</p>
              </button>
            </div>
          </div>

          {/* Account Information */}
          {profile && (
            <div className={styles.accountInfoCard}>
              <div className={styles.sectionHeader}>
                <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Account Information</h3>
              </div>
              <div className={styles.infoGrid}>
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
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Role</span>
                  </div>
                  <span className={styles.infoValue}>{formatRole(profile.role)}</span>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Account Created</span>
                  </div>
                  <span className={styles.infoValue}>{formatDate(profile.createdAt)}</span>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabelWrapper}>
                    <svg className={styles.infoLabelIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.infoLabel}>Last Login</span>
                  </div>
                  <span className={styles.infoValue}>Recently</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

