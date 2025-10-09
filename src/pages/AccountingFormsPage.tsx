import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AccountingFormSelector } from '@/components/forms/AccountingFormSelector';
import { WelfareForm } from '@/components/forms/WelfareForm';
import { AdvanceForm } from '@/components/forms/AdvanceForm';
import { GeneralAdvanceForm } from '@/components/forms/GeneralAdvanceForm';
import { ExpenseClearingForm } from '@/components/forms/ExpenseClearingForm';

type AccountingFormType = 'advance' | 'general-advance' | 'expense-clearing';

export function AccountingFormsPage() {
  const [selectedType, setSelectedType] = useState<AccountingFormType | null>(null);

  const handleTypeSelect = (type: AccountingFormType) => {
    setSelectedType(type);
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ฟอร์มสำหรับบัญชี</h1>
        <p className="text-gray-600">เลือกประเภทฟอร์มบัญชีที่ต้องการยื่นขอ</p>
      </div>
      
      {selectedType ? (
        selectedType === 'advance' ? (
          <AdvanceForm onBack={handleBack} />
        ) : selectedType === 'general-advance' ? (
          <GeneralAdvanceForm onBack={handleBack} />
        ) : selectedType === 'expense-clearing' ? (
          <ExpenseClearingForm onBack={handleBack} />
        ) : (
          <WelfareForm 
            type={selectedType as any}
            onBack={handleBack}
          />
        )
      ) : (
        <AccountingFormSelector onSelect={handleTypeSelect} />
      )}
    </Layout>
  );
}