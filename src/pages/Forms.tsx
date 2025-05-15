
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { WelfareFormSelector } from '@/components/forms/WelfareFormSelector';
import { WelfareForm } from '@/components/forms/WelfareForm';
import { WelfareType } from '@/types';

const Forms = () => {
  const [selectedType, setSelectedType] = useState<WelfareType | null>(null);
  
  const handleSelectType = (type: WelfareType) => {
    setSelectedType(type);
  };
  
  const handleBack = () => {
    setSelectedType(null);
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">แบบฟอร์มขอสวัสดิการ</h1>
        <p className="text-gray-600">เลือกประเภทสวัสดิการที่ต้องการยื่นขอ</p>
      </div>
      
      {selectedType ? (
        <WelfareForm type={selectedType} onBack={handleBack} />
      ) : (
        <WelfareFormSelector onSelect={handleSelectType} />
      )}
    </Layout>
  );
};

export default Forms;
