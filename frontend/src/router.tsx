import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login/Login';
import Dashboard from './pages/dashboard/Dashboard';
import EmployeeList from './pages/employees/EmployeeList/EmployeeList';
import AddEmployee from './pages/employees/AddEmployee/AddEmployee';
import EditEmployee from './pages/employees/EditEmployee/EditEmployee';
import EmployeeDetails from './pages/employees/EmployeeDetails/EmployeeDetails';
import ManageAllowances from './pages/employees/ManageAllowances/ManageAllowances';
import ManageDeductions from './pages/employees/ManageDeductions/ManageDeductions';
import ManageBonuses from './pages/employees/ManageBonuses/ManageBonuses';
import GenerateSlip from './pages/salary-slips/GenerateSlip/GenerateSlip';
import ViewAllSlips from './pages/salary-slips/ViewAllSlips/ViewAllSlips';
import SlipDetails from './pages/salary-slips/SlipDetails/SlipDetails';
import SlipPreview from './pages/salary-slips/SlipPreview/SlipPreview';
import MySalarySlips from './pages/salary-slips/MySalarySlips/MySalarySlips';
import GenerateReport from './pages/reports/GenerateReport/GenerateReport';
import MonthlyReport from './pages/reports/MonthlyReport/MonthlyReport';
import AnnualReport from './pages/reports/AnnualReport/AnnualReport';
import ReportHistory from './pages/reports/ReportHistory/ReportHistory';
import ProfileOverview from './pages/profile/ProfileOverview/ProfileOverview';
import PersonalInfo from './pages/profile/PersonalInfo/PersonalInfo';
import ChangePassword from './pages/profile/ChangePassword/ChangePassword';
import AccountSettings from './pages/profile/AccountSettings/AccountSettings';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/employees',
    element: (
      <ProtectedRoute>
        <EmployeeList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/employees/add',
    element: (
      <ProtectedRoute>
        <AddEmployee />
      </ProtectedRoute>
    ),
  },
  {
    path: '/employees/:id/edit',
    element: (
      <ProtectedRoute>
        <EditEmployee />
      </ProtectedRoute>
    ),
  },
  {
    path: '/employees/:id',
    element: (
      <ProtectedRoute>
        <EmployeeDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: '/employees/:id/allowances',
    element: (
      <ProtectedRoute>
        <ManageAllowances />
      </ProtectedRoute>
    ),
  },
  {
    path: '/employees/:id/deductions',
    element: (
      <ProtectedRoute>
        <ManageDeductions />
      </ProtectedRoute>
    ),
  },
  {
    path: '/employees/:id/bonuses',
    element: (
      <ProtectedRoute>
        <ManageBonuses />
      </ProtectedRoute>
    ),
  },
  {
    path: '/salary-slips',
    element: (
      <ProtectedRoute>
        <ViewAllSlips />
      </ProtectedRoute>
    ),
  },
  {
    path: '/salary-slips/generate',
    element: (
      <ProtectedRoute>
        <GenerateSlip />
      </ProtectedRoute>
    ),
  },
  {
    path: '/salary-slips/:id',
    element: (
      <ProtectedRoute>
        <SlipDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: '/salary-slips/:id/preview',
    element: (
      <ProtectedRoute>
        <SlipPreview />
      </ProtectedRoute>
    ),
  },
  {
    path: '/salary-slips/my-slips',
    element: (
      <ProtectedRoute>
        <MySalarySlips />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <Navigate to="/reports/generate" replace />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/generate',
    element: (
      <ProtectedRoute>
        <GenerateReport />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/monthly',
    element: (
      <ProtectedRoute>
        <MonthlyReport />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/annual',
    element: (
      <ProtectedRoute>
        <AnnualReport />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/history',
    element: (
      <ProtectedRoute>
        <ReportHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfileOverview />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/overview',
    element: (
      <ProtectedRoute>
        <ProfileOverview />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/personal-info',
    element: (
      <ProtectedRoute>
        <PersonalInfo />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/change-password',
    element: (
      <ProtectedRoute>
        <ChangePassword />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/account-settings',
    element: (
      <ProtectedRoute>
        <AccountSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
]);

