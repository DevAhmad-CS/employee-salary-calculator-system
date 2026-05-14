/**
 * Employee List Page
 * 
 * Displays a paginated list of employees with search, filter, and action capabilities.
 * Uses Sidebar and Header layout components.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar/Sidebar';
import Header from '../../../components/layout/Header/Header';
import { employeeService } from '../../../services/api/employee.service';
import type { Employee, GetEmployeesParams } from '../../../services/api/employee.service';
import { useAuthStore } from '../../../services/state/authStore';
import styles from './EmployeeList.module.css';

export default function EmployeeList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Check if user has permission to access employees
  useEffect(() => {
    if (!user) return;
    
    // Only Admin, HR, and Accountant can access employee list
    const allowedRoles = ['Admin', 'HR', 'Accountant'];
    if (!allowedRoles.includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: number; name: string } | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  
  // Debounced search
  const [searchDebounce, setSearchDebounce] = useState('');

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError('');
        
        const params: GetEmployeesParams = {
          page,
          limit,
          search: searchDebounce || undefined,
          department: departmentFilter || undefined,
        };
        
        const response = await employeeService.getAll(params);
        
        if (response && response.success && response.data) {
          let filteredEmployees = response.data.employees || [];
          
          // Client-side position filter (since backend doesn't support it yet)
          if (positionFilter) {
            filteredEmployees = filteredEmployees.filter(emp => 
              emp.position.toLowerCase().includes(positionFilter.toLowerCase())
            );
          }
          
          setEmployees(filteredEmployees);
          setTotal(response.data.total || 0);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: unknown) {
        const axiosError = err as { 
          response?: { status?: number; data?: { error?: string; message?: string } }; 
          message?: string;
          code?: string;
        };
        console.error('Error fetching employees:', err);
        console.error('Error details:', {
          message: axiosError.message,
          response: axiosError.response,
          status: axiosError.response?.status,
          data: axiosError.response?.data,
        });
        
        let errorMessage = 'Failed to fetch employees';
        
        // Handle network errors
        if (!axiosError.response) {
          if (axiosError.code === 'ERR_NETWORK' || axiosError.message?.includes('Network Error')) {
            errorMessage = 'Cannot connect to server. Please check if the backend is running.';
          } else if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
            errorMessage = 'Request timeout. The server is taking too long to respond.';
          } else {
            errorMessage = `Network error: ${axiosError.message || 'Cannot connect to server'}`;
          }
        } else if (axiosError.response) {
          errorMessage = axiosError.response.data?.error || axiosError.response.data?.message || errorMessage;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
        
        setError(errorMessage);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [page, limit, searchDebounce, departmentFilter, positionFilter]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
      setPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle delete click - show confirmation card
  const handleDeleteClick = (id: number, name: string) => {
    setEmployeeToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  // Handle delete confirmation - actually delete the employee
  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    try {
      await employeeService.delete(employeeToDelete.id);
      // Close confirmation card
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
      // Show success card
      setShowDeleteSuccess(true);
      // Refresh the list after a short delay
      setTimeout(async () => {
        const params: GetEmployeesParams = {
          page,
          limit,
          search: searchDebounce || undefined,
          department: departmentFilter || undefined,
        };
        const response = await employeeService.getAll(params);
        setEmployees(response.data.employees);
        setTotal(response.data.total);
      }, 500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete employee';
      alert(axiosError?.response?.data?.error || errorMessage);
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  // Hide success card after animation
  useEffect(() => {
    if (showDeleteSuccess) {
      const timer = setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 2500); // Hide after 2.5 seconds (animation duration ~2s + buffer)
      return () => clearTimeout(timer);
    }
  }, [showDeleteSuccess]);

  // Handle clear filters
  const handleClearFilters = () => {
    setSearch('');
    setSearchDebounce('');
    setDepartmentFilter('');
    setPositionFilter('');
    setPage(1);
  };

  // Calculate pagination
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Format employee ID
  const formatEmployeeId = (id: number) => {
    return `EMP${String(id).padStart(3, '0')}`;
  };

  // Format salary
  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(salary);
  };

  return (
    <div className={styles.employeeListContainer}>
      <Sidebar />
      <div className={styles.mainContentWrapper}>
        <Header />
        
        <main className={styles.mainContent}>
          {/* Delete Confirmation Card */}
          {showDeleteConfirm && employeeToDelete && (
            <div className={styles.confirmCard}>
              <div className={styles.confirmCardOverlay} onClick={handleDeleteCancel}></div>
              <div className={styles.confirmCardContent}>
                <div className={styles.confirmCardIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.confirmCardTitle}>Confirm Deletion</h3>
                <p className={styles.confirmCardMessage}>
                  Are you sure you want to delete <strong>{employeeToDelete.name}</strong>? This action cannot be undone.
                </p>
                <div className={styles.confirmCardActions}>
                  <button
                    className={styles.confirmCancelButton}
                    onClick={handleDeleteCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.confirmDeleteButton}
                    onClick={handleDeleteConfirm}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Success Card */}
          {showDeleteSuccess && (
            <div className={styles.successCard}>
              <div className={styles.successCircle}>
                <svg className={styles.checkmark} viewBox="0 0 52 52">
                  <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                  <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              <h3 className={styles.successTitle}>Employee Deleted Successfully!</h3>
              <p className={styles.successMessage}>The employee has been removed from the system.</p>
            </div>
          )}

          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2>Employee List</h2>
              <p className={styles.pageSubtitle}>Manage and view all employees in the system</p>
            </div>
            <button
              className={styles.addButton}
              onClick={() => navigate('/employees/add')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Employee
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className={styles.filterSection}>
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by name, ID, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filterBoxes}>
              <div className={styles.filterGroup}>
                <svg className={styles.filterIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <select
                  className={styles.filterSelect}
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <svg className={styles.filterIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <select
                  className={styles.filterSelect}
                  value={positionFilter}
                  onChange={(e) => {
                    setPositionFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Positions</option>
                  <option value="Manager">Manager</option>
                  <option value="Developer">Developer</option>
                  <option value="Accountant">Accountant</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Sales Representative">Sales Representative</option>
                </select>
              </div>
              <button
                type="button"
                className={styles.clearFiltersButton}
                onClick={handleClearFilters}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Clear Filters
              </button>
            </div>
            <div className={styles.filterInfo}>
              <p className={styles.resultsCount}>
                Showing {employees.length} of {total} employees
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}

          {/* Employee Table */}
          <div className={styles.tableSection}>
            {loading ? (
              <div className={styles.loadingMessage}>
                <p>Loading employees...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className={styles.emptyMessage}>
                <p>No employees found</p>
              </div>
            ) : (
              <table className={styles.employeeTable}>
                <thead>
                  <tr>
                    <th>
                      <span>#</span>
                    </th>
                    <th>
                      <span>Employee ID</span>
                    </th>
                    <th>
                      <span>Name</span>
                    </th>
                    <th>
                      <span>Department</span>
                    </th>
                    <th>
                      <span>Position</span>
                    </th>
                    <th>
                      <span>Basic Salary</span>
                    </th>
                    <th>
                      <span>Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => {
                    const rowNumber = (page - 1) * limit + index + 1;
                    const employeeId = formatEmployeeId(employee.id);
                    const employeeName = employee.fullName;
                    const department = employee.department;
                    const position = employee.position;
                    const salary = formatSalary(employee.basicSalary);
                    
                    return (
                      <tr key={employee.id}>
                        <td>{rowNumber}</td>
                        <td>
                          <span className={styles.employeeId}>
                            {employeeId}
                          </span>
                        </td>
                        <td>
                          <a
                            href="#"
                            className={styles.employeeNameLink}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/employees/${employee.id}`);
                            }}
                          >
                            {employeeName}
                          </a>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles[`badge-${department.toLowerCase().replace(/\s+/g, '-')}`] || styles.badgeDefault}`}>
                            {department}
                          </span>
                        </td>
                        <td>{position}</td>
                        <td className={styles.salaryAmount}>
                          {salary}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={`${styles.actionButton} ${styles.viewButton}`}
                              onClick={() => navigate(`/employees/${employee.id}`)}
                            >
                              View
                            </button>
                            <button
                              className={`${styles.actionButton} ${styles.editButton}`}
                              onClick={() => navigate(`/employees/${employee.id}/edit`)}
                            >
                              Edit
                            </button>
                            <button
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={() => handleDeleteClick(employee.id, employee.fullName)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevPage}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                className={styles.paginationButton}
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

