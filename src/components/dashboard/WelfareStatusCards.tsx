import React from 'react';
import { CheckCircle2, XCircle, Clock, Search, ShieldCheck, Receipt, FileWarning } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { useWelfareRequests } from '@/hooks/useWelfareRequests';

export function WelfareStatusCards() {
  const { requests } = useWelfareRequests();

  // Requests are already filtered for welfare types only (excludes advance, general-advance, expense-clearing, general-expense-clearing)

  // Count requests by status (welfare flow: manager -> HR -> special/accounting -> completed)
  const pendingManagerCount = requests.filter(r => r.status?.toLowerCase() === 'pending_manager').length;
  const pendingHRCount = requests.filter(r => r.status?.toLowerCase() === 'pending_hr').length;
  const pendingSpecialCount = requests.filter(r => r.status?.toLowerCase() === 'pending_special_approval').length;
  const pendingAccountingCount = requests.filter(r => r.status?.toLowerCase() === 'pending_accounting').length;
  const pendingRevisionCount = requests.filter(r => r.status?.toLowerCase() === 'pending_revision').length;
  const completedCount = requests.filter(r => r.status?.toLowerCase() === 'completed').length;
  const rejectedManagerCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_manager').length;
  const rejectedHRCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_hr').length;
  const rejectedSpecialCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_special_approval').length;
  const rejectedAccountingCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_accounting').length;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
      <StatusCard
        title="รอหัวหน้าอนุมัติ"
        count={pendingManagerCount}
        status="pending_manager"
        icon={<Clock className="h-5 w-5" />}
        description="รายการ"
      />
      <StatusCard
        title="รอ HR ตรวจสอบ"
        count={pendingHRCount}
        status="pending_hr"
        icon={<Search className="h-5 w-5" />}
        description="รายการ"
      />
      <StatusCard
        title="รอผู้บริหารอนุมัติ"
        count={pendingSpecialCount}
        status="pending_special_approval"
        icon={<ShieldCheck className="h-5 w-5" />}
        description="รายการ"
      />
      <StatusCard
        title="รอบัญชีตรวจสอบ"
        count={pendingAccountingCount}
        status="pending_accounting"
        icon={<Receipt className="h-5 w-5" />}
        description="รายการ"
      />
      {pendingRevisionCount > 0 && (
        <StatusCard
          title="รอเอกสารเพิ่มเติม"
          count={pendingRevisionCount}
          status="pending_revision"
          icon={<FileWarning className="h-5 w-5" />}
          description="รายการ"
        />
      )}
      <StatusCard
        title="เสร็จสมบูรณ์"
        count={completedCount}
        status="completed"
        icon={<CheckCircle2 className="h-5 w-5" />}
        description="รายการ"
      />
      <StatusCard
        title="หัวหน้าปฏิเสธ"
        count={rejectedManagerCount}
        status="rejected_manager"
        icon={<XCircle className="h-5 w-5" />}
        description="รายการ"
      />
      <StatusCard
        title="HR ปฏิเสธ"
        count={rejectedHRCount}
        status="rejected_hr"
        icon={<XCircle className="h-5 w-5" />}
        description="รายการ"
      />
      <StatusCard
        title="ผู้บริหารปฏิเสธ"
        count={rejectedSpecialCount}
        status="rejected_special_approval"
        icon={<XCircle className="h-5 w-5" />}
        description="รายการ"
      />
      <StatusCard
        title="บัญชีปฏิเสธ"
        count={rejectedAccountingCount}
        status="rejected_accounting"
        icon={<XCircle className="h-5 w-5" />}
        description="รายการ"
      />
    </div>
  );
}
