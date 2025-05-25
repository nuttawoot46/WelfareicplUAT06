
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee } from '@/types';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  disabled: boolean;
  isLoading: boolean;
}

export const EmployeeSelector = ({
  employees,
  selectedEmployee,
  onEmployeeChange,
  disabled,
  isLoading
}: EmployeeSelectorProps) => {
  return (
    <Select 
      value={selectedEmployee} 
      onValueChange={onEmployeeChange}
      disabled={disabled}
    >
      <SelectTrigger id="employee" className="w-full">
        <SelectValue placeholder="เลือกพนักงาน" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>กำลังโหลด...</SelectItem>
        ) : employees.length > 0 ? (
          employees.map((employee, index) => (
            <SelectItem key={`${employee.ชื่อพนักงาน}-${index}`} value={employee.ชื่อพนักงาน || ''}>
              {employee.ชื่อพนักงาน}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="empty" disabled>ไม่พบพนักงานในทีมที่เลือก</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};
