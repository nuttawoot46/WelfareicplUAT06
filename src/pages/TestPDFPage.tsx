import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateAndDownloadSalesAdvancePDF } from '@/components/pdf/SalesAdvancePDFGenerator';
import { generateAndDownloadSalesExpenseClearingPDF } from '@/components/pdf/SalesExpenseClearingPDFGenerator';
import { WelfareRequest, User } from '@/types';
import { FileText, Loader2 } from 'lucide-react';

// Mock signature (simple SVG as base64)
const MOCK_SIGNATURE = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <path d="M10 45 Q30 10 50 35 T90 25 T130 40 T170 20 T190 35" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>
`);

const MOCK_SIGNATURE_2 = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <path d="M15 40 Q40 5 65 30 T115 20 T165 35 T185 25" stroke="#0044aa" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>
`);

const MOCK_SIGNATURE_3 = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <path d="M20 35 Q45 8 70 38 T120 15 T160 40 T190 20" stroke="#006633" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>
`);

const mockUser: User = {
  id: 'test-user-001',
  name: 'กมล ยศอิ',
  email: 'kamol@icpladda.com',
  position: 'Marketing Representative',
  department: 'ฝ่ายขาย',
};

const mockEmployee = {
  Name: 'กมล ยศอิ',
  Position: 'Marketing Representative',
  Team: 'ฝ่ายขาย',
  start_date: '2024-01-15',
};

const mockAdvanceData: WelfareRequest = {
  id: 9999,
  userId: 'test-user-001',
  userName: 'กมล ยศอิ',
  userDepartment: 'ฝ่ายขาย',
  type: 'advance',
  status: 'completed',
  amount: 15000,
  date: '2026-02-13',
  details: 'จัดกิจกรรมประชุมเกษตรกร ณ อำเภอเมือง จ.นครราชสีมา เพื่อแนะนำผลิตภัณฑ์ใหม่',
  runNumber: 'ADV20260200001',
  createdAt: '2026-02-10T09:00:00Z',
  updatedAt: '2026-02-13T14:00:00Z',
  start_date: '2026-02-15',
  end_date: '2026-02-16',
  advanceDepartment: 'ฝ่ายขาย',
  advanceDistrict: 'A01',
  advanceActivityType: 'จัดประชุมเกษตรกร',
  advanceDealerName: 'ร้านเกษตรพัฒนา',
  advanceSubdealerName: 'ร้านชาวนาสุข',
  advanceAmphur: 'เมือง',
  advanceProvince: 'นครราชสีมา',
  advanceParticipants: 50,
  bankAccountName: 'นาย กมล ยศอิ',
  bankName: 'ธนาคารกสิกรไทย',
  bankAccountNumber: '123-4-56789-0',
  userSignature: MOCK_SIGNATURE,
  // Executive approval
  executiveApproverName: 'ปทิตตา จันทร์กลิ่น',
  executiveApproverPosition: 'Marketing Executive',
  executiveApprovedAt: '2026-02-11T10:30:00Z',
  executiveSignature: MOCK_SIGNATURE_2,
  // Manager approval
  managerApproverName: 'แวน จันทร์ทอง',
  managerApproverPosition: 'ผู้จัดการ',
  managerApprovedAt: '2026-02-12T15:00:00Z',
  managerSignature: MOCK_SIGNATURE_3,
  advanceExpenseItems: JSON.stringify([
    { name: 'ค่าอาหาร และ เครื่องดื่ม', taxRate: 0, requestAmount: 5000, taxAmount: 0, netAmount: 5000 },
    { name: 'ค่าที่พัก', taxRate: 0, requestAmount: 3000, taxAmount: 0, netAmount: 3000 },
    { name: 'ค่าเช่าสถานที่', taxRate: 5, requestAmount: 4000, taxAmount: 200, netAmount: 3800 },
    { name: 'งบสนับสนุนร้านค้า', taxRate: 3, requestAmount: 3000, taxAmount: 90, netAmount: 2910 },
  ]),
};

const mockExpenseClearingData: WelfareRequest = {
  id: 9998,
  userId: 'test-user-001',
  userName: 'กมล ยศอิ',
  userDepartment: 'ฝ่ายขาย',
  type: 'expense-clearing',
  status: 'completed',
  amount: 1200,
  date: '2026-02-13',
  details: 'เคลียร์ค่าใช้จ่ายจากการจัดกิจกรรมประชุมเกษตรกร',
  runNumber: 'EXP20260200001',
  createdAt: '2026-02-17T09:00:00Z',
  updatedAt: '2026-02-20T14:00:00Z',
  start_date: '2026-02-15',
  end_date: '2026-02-16',
  advanceDepartment: 'ฝ่ายขาย',
  advanceActivityType: 'จัดประชุมเกษตรกร',
  advanceDealerName: 'ร้านเกษตรพัฒนา',
  advanceSubdealerName: 'ร้านชาวนาสุข',
  advanceAmphur: 'เมือง',
  advanceProvince: 'นครราชสีมา',
  advanceParticipants: 50,
  originalAdvanceRunNumber: 'ADV20260200001',
  originalAdvanceRequestId: 9999,
  userSignature: MOCK_SIGNATURE,
  // Executive approval
  executiveApproverName: 'ปทิตตา จันทร์กลิ่น',
  executiveApproverPosition: 'Marketing Executive',
  executiveApprovedAt: '2026-02-18T10:30:00Z',
  executiveSignature: MOCK_SIGNATURE_2,
  // Manager approval
  managerApproverName: 'แวน จันทร์ทอง',
  managerApproverPosition: 'ผู้จัดการ',
  managerApprovedAt: '2026-02-19T15:00:00Z',
  managerSignature: MOCK_SIGNATURE_3,
  expenseClearingItems: JSON.stringify([
    { name: 'ค่าอาหาร และ เครื่องดื่ม', taxRate: 0, requestAmount: 5000, usedAmount: 4500, vatAmount: 0, taxAmount: 0, netAmount: 4500, refund: 500 },
    { name: 'ค่าที่พัก', taxRate: 0, requestAmount: 3000, usedAmount: 2800, vatAmount: 0, taxAmount: 0, netAmount: 2800, refund: 200 },
    { name: 'ค่าเช่าสถานที่', taxRate: 5, requestAmount: 4000, usedAmount: 3500, vatAmount: 245, taxAmount: 175, netAmount: 3570, refund: 430 },
    { name: 'งบสนับสนุนร้านค้า', taxRate: 3, requestAmount: 3000, usedAmount: 2950, vatAmount: 0, taxAmount: 88.5, netAmount: 2861.5, refund: 138.5 },
  ]),
};

export default function TestPDFPage() {
  const [loadingAdvance, setLoadingAdvance] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(false);

  const handleDownloadAdvancePDF = async () => {
    setLoadingAdvance(true);
    try {
      await generateAndDownloadSalesAdvancePDF(
        mockAdvanceData,
        mockUser,
        mockEmployee,
        MOCK_SIGNATURE,         // userSignature
        MOCK_SIGNATURE_3,       // managerSignature
        undefined               // accountingSignature
      );
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingAdvance(false);
    }
  };

  const handleDownloadExpensePDF = async () => {
    setLoadingExpense(true);
    try {
      await generateAndDownloadSalesExpenseClearingPDF(
        mockExpenseClearingData,
        mockUser,
        mockEmployee,
        MOCK_SIGNATURE,         // userSignature
        MOCK_SIGNATURE_3,       // managerSignature
        undefined               // accountingSignature
      );
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingExpense(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">ทดสอบ PDF ลายเซ็น 3 ช่อง</h1>
      <p className="text-gray-500 mb-8">ผู้ขอเบิก (MR) → ผู้ตรวจสอบ (ME) → ผู้อนุมัติ (Manager)</p>

      <div className="space-y-6">
        {/* Mock data summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-1">
          <div><strong>ผู้ขอเบิก:</strong> กมล ยศอิ (MR, เขต A01)</div>
          <div><strong>Executive (ME):</strong> ปทิตตา จันทร์กลิ่น</div>
          <div><strong>Manager:</strong> แวน จันทร์ทอง</div>
        </div>

        {/* Download buttons */}
        <div className="grid grid-cols-1 gap-4">
          <Button
            onClick={handleDownloadAdvancePDF}
            disabled={loadingAdvance}
            className="h-16 text-lg bg-blue-600 hover:bg-blue-700"
          >
            {loadingAdvance ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <FileText className="mr-2 h-5 w-5" />
            )}
            ดาวน์โหลด PDF เบิกเงินล่วงหน้า (ฝ่ายขาย)
          </Button>

          <Button
            onClick={handleDownloadExpensePDF}
            disabled={loadingExpense}
            className="h-16 text-lg bg-green-600 hover:bg-green-700"
          >
            {loadingExpense ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <FileText className="mr-2 h-5 w-5" />
            )}
            ดาวน์โหลด PDF เคลียร์ค่าใช้จ่าย (ฝ่ายขาย)
          </Button>
        </div>
      </div>
    </div>
  );
}
