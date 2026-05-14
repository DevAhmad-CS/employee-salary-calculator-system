/**
 * Generate Report Use Case.
 * Handles the business logic for generating monthly and annual financial reports.
 * @class GenerateReportUseCase
 */
import { ISalarySlipRepository } from '../../../domain/interfaces/ISalarySlipRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { SalarySlip } from '../../../domain/entities/SalarySlip';

/**
 * Interface for the Generate Report Use Case request data.
 * @interface GenerateReportRequest
 */
export interface GenerateReportRequest {
  type: 'monthly' | 'annual';
  month?: number; // Required for monthly reports (1-12)
  year: number;
  department?: string; // Optional filter
  employeeId?: number; // Optional filter
  minSalary?: number; // Optional filter
  maxSalary?: number; // Optional filter
}

/**
 * Interface for report statistics.
 * @interface ReportStatistics
 */
export interface ReportStatistics {
  totalEmployees: number;
  totalSalaries: number;
  averageSalary: number;
  totalSlips: number;
  departmentBreakdown?: DepartmentBreakdown[];
  employeeBreakdown?: EmployeeBreakdown[];
}

/**
 * Interface for department breakdown in reports.
 * @interface DepartmentBreakdown
 */
export interface DepartmentBreakdown {
  department: string;
  employeeCount: number;
  totalSalary: number;
  averageSalary: number;
}

/**
 * Interface for employee breakdown in reports.
 * @interface EmployeeBreakdown
 */
export interface EmployeeBreakdown {
  employeeId: number;
  employeeName: string;
  department: string;
  netSalary: number;
  month?: number; // For annual reports
}

/**
 * Interface for the Generate Report Use Case response.
 * @interface GenerateReportResponse
 */
export interface GenerateReportResponse {
  type: 'monthly' | 'annual';
  period: {
    month?: number;
    year: number;
    monthName?: string;
  };
  statistics: ReportStatistics;
  generatedAt: Date;
}

export class GenerateReportUseCase {
  /**
   * Creates an instance of GenerateReportUseCase.
   * @param {ISalarySlipRepository} salarySlipRepository - The salary slip repository to get salary slip data.
   * @param {IEmployeeRepository} employeeRepository - The employee repository to get employee data.
   */
  constructor(
    private salarySlipRepository: ISalarySlipRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  /**
   * Executes the report generation process.
   * @param {GenerateReportRequest} request - The request containing report type and filters.
   * @returns {Promise<GenerateReportResponse>} A promise that resolves to the generated report data.
   * @throws {Error} If validation fails or data cannot be retrieved.
   */
  async execute(request: GenerateReportRequest): Promise<GenerateReportResponse> {
    // Validate input
    if (!request.type || !['monthly', 'annual'].includes(request.type)) {
      throw new Error('Invalid report type. Must be "monthly" or "annual".');
    }

    if (!request.year || request.year <= 0) {
      throw new Error('Invalid year.');
    }

    if (request.type === 'monthly' && (!request.month || request.month < 1 || request.month > 12)) {
      throw new Error('Invalid month. Must be between 1 and 12 for monthly reports.');
    }

    // Get salary slips based on report type
    let slips: SalarySlip[] = [];

    if (request.type === 'monthly') {
      // Get all slips for the specified month and year
      slips = await this.salarySlipRepository.findByMonthYear(request.month!, request.year);
    } else {
      // For annual reports, get slips for all months in the year
      const allSlips: SalarySlip[] = [];
      for (let month = 1; month <= 12; month++) {
        const monthSlips = await this.salarySlipRepository.findByMonthYear(month, request.year);
        allSlips.push(...monthSlips);
      }
      slips = allSlips;
    }

    // Apply filters
    let filteredSlips = slips;

    if (request.department || request.employeeId || request.minSalary !== undefined || request.maxSalary !== undefined) {
      filteredSlips = await this.applyFilters(slips, request);
    }

    // Calculate statistics
    const statistics = await this.calculateStatistics(filteredSlips, request.type);

    // Get period information
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const period = {
      month: request.month,
      year: request.year,
      monthName: request.month ? monthNames[request.month - 1] : undefined,
    };

    return {
      type: request.type,
      period,
      statistics,
      generatedAt: new Date(),
    };
  }

  /**
   * Applies filters to salary slips.
   * @private
   * @param {SalarySlip[]} slips - The salary slips to filter.
   * @param {GenerateReportRequest} request - The request containing filter criteria.
   * @returns {Promise<SalarySlip[]>} A promise that resolves to the filtered salary slips.
   */
  private async applyFilters(
    slips: SalarySlip[],
    request: GenerateReportRequest
  ): Promise<SalarySlip[]> {
    let filtered = slips;

    // Filter by employee ID
    if (request.employeeId) {
      filtered = filtered.filter((slip) => slip.employeeId === request.employeeId);
    }

    // Filter by department, min/max salary requires employee data
    if (request.department || request.minSalary !== undefined || request.maxSalary !== undefined) {
      const employeeIds = new Set(filtered.map((slip) => slip.employeeId));
      const employees = await Promise.all(
        Array.from(employeeIds).map(async (id) => {
          try {
            return await this.employeeRepository.findById(id);
          } catch {
            return null;
          }
        })
      );

      const employeeMap = new Map(
        employees.filter((emp) => emp !== null).map((emp) => [emp!.id, emp!])
      );

      filtered = filtered.filter((slip) => {
        const employee = employeeMap.get(slip.employeeId);
        if (!employee) return false;

        // Filter by department
        if (request.department && employee.department !== request.department) {
          return false;
        }

        // Filter by salary range
        if (request.minSalary !== undefined && slip.netSalary < request.minSalary) {
          return false;
        }
        if (request.maxSalary !== undefined && slip.netSalary > request.maxSalary) {
          return false;
        }

        return true;
      });
    }

    return filtered;
  }

  /**
   * Calculates statistics from salary slips.
   * @private
   * @param {SalarySlip[]} slips - The salary slips to calculate statistics from.
   * @param {string} type - The report type ('monthly' or 'annual').
   * @returns {Promise<ReportStatistics>} A promise that resolves to the calculated statistics.
   */
  private async calculateStatistics(
    slips: SalarySlip[],
    type: 'monthly' | 'annual'
  ): Promise<ReportStatistics> {
    if (slips.length === 0) {
      return {
        totalEmployees: 0,
        totalSalaries: 0,
        averageSalary: 0,
        totalSlips: 0,
        departmentBreakdown: [],
        employeeBreakdown: [],
      };
    }

    // Get unique employee IDs
    const uniqueEmployeeIds = new Set(slips.map((slip) => slip.employeeId));
    const totalEmployees = uniqueEmployeeIds.size;

    // Calculate totals
    const totalSalaries = slips.reduce((sum, slip) => sum + slip.netSalary, 0);
    const averageSalary = totalSalaries / slips.length;
    const totalSlips = slips.length;

    // Get employee data for breakdowns
    const employees = await Promise.all(
      Array.from(uniqueEmployeeIds).map(async (id) => {
        try {
          return await this.employeeRepository.findById(id);
        } catch {
          return null;
        }
      })
    );

    const employeeMap = new Map(
      employees.filter((emp) => emp !== null).map((emp) => [emp!.id, emp!])
    );

    // Calculate department breakdown
    const departmentMap = new Map<string, { count: number; totalSalary: number; employees: Set<number> }>();

    slips.forEach((slip) => {
      const employee = employeeMap.get(slip.employeeId);
      if (!employee) return;

      const dept = employee.department || 'Unknown';
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, { count: 0, totalSalary: 0, employees: new Set() });
      }

      const deptData = departmentMap.get(dept)!;
      deptData.count += 1;
      deptData.totalSalary += slip.netSalary;
      deptData.employees.add(slip.employeeId);
    });

    const departmentBreakdown: DepartmentBreakdown[] = Array.from(departmentMap.entries()).map(
      ([department, data]) => ({
        department,
        employeeCount: data.employees.size,
        totalSalary: data.totalSalary,
        averageSalary: data.totalSalary / data.count,
      })
    );

    // Calculate employee breakdown
    const employeeBreakdown: EmployeeBreakdown[] = Array.from(uniqueEmployeeIds).map((employeeId) => {
      const employee = employeeMap.get(employeeId);
      const employeeSlips = slips.filter((slip) => slip.employeeId === employeeId);
      const totalEmployeeSalary = employeeSlips.reduce((sum, slip) => sum + slip.netSalary, 0);

      return {
        employeeId,
        employeeName: employee?.fullName || 'Unknown',
        department: employee?.department || 'Unknown',
        netSalary: type === 'monthly' ? totalEmployeeSalary : totalEmployeeSalary / employeeSlips.length,
        month: type === 'annual' ? employeeSlips[0]?.month : undefined,
      };
    });

    return {
      totalEmployees,
      totalSalaries,
      averageSalary,
      totalSlips,
      departmentBreakdown,
      employeeBreakdown,
    };
  }
}

