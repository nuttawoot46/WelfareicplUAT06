import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { WelfareFormSelector } from '@/components/forms/WelfareFormSelector';
import { WelfareForm } from '@/components/forms/WelfareForm';
import { EmploymentApprovalForm } from '@/components/forms/EmploymentApprovalForm';
import { WelfareType } from '@/types';

export function WelfareFormsPage() {
  const [selectedType, setSelectedType] = useState<WelfareType | null>(null);

  const handleTypeSelect = (type: WelfareType) => {
    setSelectedType(type);
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ฟอร์ม HR</h1>

      </div>

      {selectedType ? (
        selectedType === 'employment-approval' ? (
          <EmploymentApprovalForm />
        ) : (
          <WelfareForm type={selectedType} onBack={handleBack} />
        )
      ) : (
        <WelfareFormSelector onSelect={handleTypeSelect} />
      )}
    </Layout>
  );
}