export interface Employee {
    id: number;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    department: string;
    position: string;
    hireDate: Date;
    basicSalary: number;
    status: 'Active' | 'Inactive' | 'Terminated';
    createdAt: Date;
    updatedAt: Date;
}