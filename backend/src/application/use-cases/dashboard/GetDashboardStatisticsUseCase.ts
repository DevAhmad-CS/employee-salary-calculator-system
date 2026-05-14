/**
 * Get Dashboard Statistics Use Case
 * 
 * This use case retrieves dashboard statistics including:
 * - Total Employees
 * - Total Monthly Salary (current month)
 * - Average Salary
 * - Total Departments
 * 
 * @module application/use-cases/dashboard/GetDashboardStatisticsUseCase
 */

import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { ISalarySlipRepository } from '../../../domain/interfaces/ISalarySlipRepository';

/**
 * Interface for dashboard statistics response.
 * @interface DashboardStatistics
 */
export interface DashboardStatistics {
  totalEmployees: number;
  totalMonthlySalary: number;
  averageSalary: number;
  totalDepartments: number;
}

/**
 * Use case for retrieving dashboard statistics.
 * 
 * Calculates real-time statistics from employees and salary slips data.
 */
export class GetDashboardStatisticsUseCase {
  /**
   * Creates an instance of GetDashboardStatisticsUseCase.
   * @param {IEmployeeRepository} employeeRepository - The employee repository to get employee data.
   * @param {ISalarySlipRepository} salarySlipRepository - The salary slip repository to get salary slip data.
   */
  constructor(
    private employeeRepository: IEmployeeRepository,
    private salarySlipRepository: ISalarySlipRepository
  ) {}

  /**
   * Executes the dashboard statistics retrieval process.
   * @returns {Promise<DashboardStatistics>} A promise that resolves to dashboard statistics.
   * @throws {Error} If data retrieval encounters an error.
   */
  async execute(): Promise<DashboardStatistics> {
    try {
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = now.getFullYear();

      // Get all active employees
      const employeesResult = await this.employeeRepository.findAll({
        page: 1,
        limit: 10000, // Get all employees
        status: 'Active',
      });

      const totalEmployees = employeesResult.total;
      
      // Get unique departments
      const departmentsSet = new Set<string>();
      employeesResult.employees.forEach((emp) => {
        if (emp.department) {
          departmentsSet.add(emp.department);
        }
      });
      const totalDepartments = departmentsSet.size;

      // Get salary slips for current month
      const currentMonthSlips = await this.salarySlipRepository.findByMonthYear(
        currentMonth,
        currentYear
      );

      // Calculate total monthly salary from current month slips
      const totalMonthlySalary = currentMonthSlips.reduce(
        (sum, slip) => sum + slip.netSalary,
        0
      );

      // Calculate average salary
      // If we have slips for current month, use them; otherwise use employee basic salaries
      let averageSalary = 0;
      if (currentMonthSlips.length > 0) {
        averageSalary = totalMonthlySalary / currentMonthSlips.length;
      } else if (employeesResult.employees.length > 0) {
        // Fallback: calculate average from employee basic salaries
        const totalBasicSalary = employeesResult.employees.reduce(
          (sum, emp) => sum + (emp.basicSalary || 0),
          0
        );
        averageSalary = totalBasicSalary / employeesResult.employees.length;
      }

      return {
        totalEmployees,
        totalMonthlySalary: Math.round(totalMonthlySalary * 100) / 100, // Round to 2 decimal places
        averageSalary: Math.round(averageSalary * 100) / 100,
        totalDepartments,
      };
    } catch (error: any) {
      console.error('Error getting dashboard statistics:', error);
      throw new Error(`Failed to retrieve dashboard statistics: ${error.message}`);
    }
  }
}

