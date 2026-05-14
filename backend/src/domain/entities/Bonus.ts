/**
 * Represents a Bonus entity in the domain layer.
 * This interface defines the structure and types for bonus data.
 * @interface Bonus
 */
export interface Bonus {
  id: number;
  employeeId: number;
  type: string; // e.g., 'performance', 'annual', 'special', etc.
  amount: number;
  awardedDate: Date; // Date when the bonus was awarded
  createdAt: Date;
  updatedAt: Date;
}

