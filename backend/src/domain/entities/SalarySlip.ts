/**
 * Represents a SalarySlip entity in the domain layer.
 * This interface defines the structure and types for salary slip data.
 * @interface SalarySlip
 */
export interface SalarySlip {
  id: number;
  employeeId: number;
  month: number; // 1-12
  year: number;
  basicSalary: number;
  totalAllowances: number;
  totalBonus: number;
  totalDeductions: number;
  netSalary: number;
  generatedAt: Date;
  generatedBy?: number; // User ID who generated the slip
}

