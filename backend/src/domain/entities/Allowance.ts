/**
 * Represents an Allowance entity in the domain layer.
 * This interface defines the structure and types for allowance data.
 * @interface Allowance
 */
export interface Allowance {
  id: number;
  employeeId: number;
  type: string; // e.g., 'transport', 'housing', 'meal', etc.
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

