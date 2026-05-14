import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../../services/api/auth.service';
import { useAuthStore } from '../../../services/state/authStore';
import styles from './Login.module.css';

// Form validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_PASSWORD = 'Demo123!';

const DEMO_ACCOUNTS: { role: string; username: string }[] = [
  { role: 'Admin', username: 'demo_admin' },
  { role: 'HR', username: 'demo_hr' },
  { role: 'Accountant', username: 'demo_accountant' },
  { role: 'Management', username: 'demo_management' },
  { role: 'Employee', username: 'demo_employee' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const fillDemoAccount = (username: string) => {
    setValue('username', username, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      const response = await authService.login(data);
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid username or password';
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError?.response?.data?.error || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Header Section */}
      <header className={styles.loginHeader}>
        <div className={styles.loginLogo}>
          <svg className={styles.logoIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#logoGradient)"/>
            <path d="M2 17L12 22L22 17" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#2563EB',stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#1E40AF',stopOpacity:1}} />
              </linearGradient>
            </defs>
          </svg>
          <h1>Employee Salary System</h1>
        </div>
      </header>

      {/* Main Login Form */}
      <main className={styles.loginMain}>
        <div className={styles.loginLayout}>
          <div className={styles.loginCard}>
          {/* Page Title */}
          <h2 className={styles.loginTitle}>Login</h2>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
            {/* Username Field */}
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.formLabel}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                id="username"
                className={styles.formInput}
                placeholder="Enter your username"
              />
              {errors.username && (
                <span className={styles.errorText}>{errors.username.message}</span>
              )}
            </div>

            {/* Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className={styles.formInput}
                placeholder="Enter your password"
              />
              {errors.password && (
                <span className={styles.errorText}>{errors.password.message}</span>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className={styles.formGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  {...register('remember')}
                  type="checkbox"
                  id="remember"
                  className={styles.checkboxInput}
                />
                <label htmlFor="remember" className={styles.checkboxLabel}>
                  Remember Me
                </label>
              </div>
            </div>

            {/* Login Button */}
            <div className={styles.formGroup}>
              <button
                type="submit"
                disabled={loading}
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFullWidth} ${styles.btnLarge}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>

        <aside className={styles.demoCard} aria-label="Demo accounts">
          <h3 className={styles.demoTitle}>Demo Accounts</h3>
          <p className={styles.demoNote}>Use any demo account to explore the system.</p>
          <p className={styles.demoPasswordHint}>
            Password for all: <span className={styles.demoPasswordValue}>Demo123!</span>
          </p>
          <ul className={styles.demoList}>
            {DEMO_ACCOUNTS.map(({ role, username }) => (
              <li key={username} className={styles.demoListItem}>
                <span className={styles.demoRole}>{role}</span>
                <button
                  type="button"
                  className={styles.demoUsernameBtn}
                  onClick={() => fillDemoAccount(username)}
                >
                  {username}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        </div>
      </main>
    </div>
  );
}

