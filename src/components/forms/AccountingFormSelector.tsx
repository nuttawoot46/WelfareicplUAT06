import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AccountingFormType = 'advance' | 'general-advance' | 'expense-clearing' | 'general-expense-clearing';

interface AccountingOption {
  id: AccountingFormType;
  title: string;
  description?: string;
  icon: JSX.Element;
  color: string;
}

interface AccountingFormSelectorProps {
  onSelect: (type: AccountingFormType) => void;
}

// Icon for advance payment (sales)
const AdvanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 9v6"/>
    <path d="M9 12h6"/>
  </svg>
);

// Icon for general advance payment
const GeneralAdvanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);

// Icon for expense clearing
const ExpenseClearingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4"/>
    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.35 0 4.48.9 6.07 2.38"/>
    <path d="M17 4v4h-4"/>
  </svg>
);



export function AccountingFormSelector({ onSelect }: AccountingFormSelectorProps) {
  const [selected, setSelected] = useState<AccountingFormType | null>(null);

  const accountingOptions: AccountingOption[] = [
    {
      id: 'advance',
      title: 'เบิกเงินล่วงหน้า (ฝ่ายขาย)',
      description: 'สำหรับการขออนุมัติเบิกเงินล่วงหน้าสำหรับภารกิจฝ่ายขาย',
      icon: <AdvanceIcon />,
      color: 'text-welfare-cyan',
    },
    {
      id: 'general-advance',
      title: 'เบิกเงินล่วงหน้า (ทั่วไป)',
      description: 'สำหรับการขออนุมัติเบิกเงินล่วงหน้าสำหรับกิจกรรมทั่วไป',
      icon: <GeneralAdvanceIcon />,
      color: 'text-purple-600',
    },
    {
      id: 'expense-clearing',
      title: 'เคลียร์ค่าใช้จ่าย (ฝ่ายขาย)',
      description: 'สำหรับการเคลียร์ค่าใช้จ่ายจากการเบิกเงินล่วงหน้าฝ่ายขาย',
      icon: <ExpenseClearingIcon />,
      color: 'text-green-600',
    },
    {
      id: 'general-expense-clearing',
      title: 'เคลียร์ค่าใช้จ่าย (ทั่วไป)',
      description: 'สำหรับการเคลียร์ค่าใช้จ่ายจากการเบิกเงินล่วงหน้าทั่วไป',
      icon: <ExpenseClearingIcon />,
      color: 'text-purple-600',
    },
  ];

  const handleSelect = (type: AccountingFormType) => {
    setSelected(type);
    onSelect(type);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">เลือกประเภทฟอร์มบัญชี</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountingOptions.map((option) => (
          <Card 
            key={option.id}
            className={cn(
              "transition-all border-l-4 cursor-pointer hover:shadow-lg hover:-translate-y-1",
              selected === option.id 
                ? "ring-2 ring-primary ring-offset-2" 
                : "",
              "border-l-welfare-blue"
            )}
            onClick={() => handleSelect(option.id)}
          >
            <CardHeader className="pb-2">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center bg-gray-100", 
                option.color
              )}>
                {option.icon}
              </div>
              <CardTitle className="mt-4">
                {option.title}
              </CardTitle>
              <CardDescription>
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                variant="ghost" 
                className={option.color}
                onClick={() => handleSelect(option.id)}
              >
                เลือก
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}