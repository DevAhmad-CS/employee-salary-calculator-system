/**
 * Represents a Deduction entity in the domain layer.
 * This interface defines the structure and types for deduction data.
 * @interface Deduction
 */
export interface Deduction {
  id: number;
  employeeId: number;
  type: string; // e.g., 'tax', 'insurance', 'loan', etc.
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

