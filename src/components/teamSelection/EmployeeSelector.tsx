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
      <div className="p-[2px] rounded-md bg-gradient-to-r from-[rgb(111,133,200)] via-[rgb(240,191,170)] via-[rgb(225,158,200)] to-[rgb(108,161,199)]">
        <SelectTrigger 
          id="employee" 
          className="w-full bg-white !border-0"
        >
          <SelectValue placeholder="เลือกพนักงาน" />
        </SelectTrigger>
      </div>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>กำลังโหลด...</SelectItem>
        ) : employees.length > 0 ? (
          employees.map((employee, index) => (
            <SelectItem key={`${employee.Name}-${index}`} value={employee.Name || ''}>
              {employee.Name}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="empty" disabled>ไม่พบพนักงานในทีมที่เลือก</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};
