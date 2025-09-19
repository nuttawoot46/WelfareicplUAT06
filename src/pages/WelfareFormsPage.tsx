import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { WelfareFormSelector } from '@/components/forms/WelfareFormSelector';
import { WelfareForm } from '@/components/forms/WelfareForm';
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
        <h1 className="text-3xl font-bold">ฟอร์มสวัสดิการ</h1>
        <p className="text-gray-600">เลือกประเภทสวัสดิการหรือการอบรมที่ต้องการยื่นขอ</p>
      </div>
      
      {selectedType ? (
        <WelfareForm type={selectedType} onBack={handleBack} />
      ) : (
        <WelfareFormSelector onSelect={handleTypeSelect} />
      )}
    </Layout>
  );
}