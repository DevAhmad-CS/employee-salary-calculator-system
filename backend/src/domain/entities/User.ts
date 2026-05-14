export interface User {
    id: number;
    username: string;
    passwordHash: string;
    role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
    employeeId?: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserWithoutPassword extends Omit<User, 'passwordHash'> {}