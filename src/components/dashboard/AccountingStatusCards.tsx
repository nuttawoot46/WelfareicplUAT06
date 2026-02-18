import React from 'react';
import { CheckCircle2, XCircle, Clock, Receipt } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { useAccountingRequests } from '@/hooks/useAccountingRequests';

export function AccountingStatusCards() {
  const { requests } = useAccountingRequests();

  // All requests are already filtered for accounting (advance and general-advance types)

  // Count requests by status (accounting flow: manager -> accounting, no HR)
  const pendingManagerCount = requests.filter(r => !r.status || r.status.toLowerCase() === 'pending_manager').length;
  const pendingAccountingCount = requests.filter(r => r.status?.toLowerCase() === 'pending_accounting').length;
  const completedCount = requests.filter(r => r.status?.toLowerCase() === 'completed').length;
  const rejectedManagerCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_manager').length;
  const rejectedAccountingCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_accounting').length;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
      <StatusCard
        title="รอดำเนินการ"
        count={pendingManagerCount}
        status="pending_manager"
        icon={<Clock className="h-5 w-5" />}
        description="รายการ - รออนุมัติหัวหน้า"
      />
      <StatusCard
        title="รอตรวจสอบโดยบัญชี"
        count={pendingAccountingCount}
        status="pending_accounting"
        icon={<Receipt className="h-5 w-5" />}
        description="รายการ - กำลังดำเนินการ"
      />
      <StatusCard
        title="เสร็จสมบูรณ์"
        count={completedCount}
        status="completed"
        icon={<CheckCircle2 className="h-5 w-5" />}
        description="รายการ - เดือนนี้"
      />
      <StatusCard
        title="ปฏิเสธโดยหัวหน้า"
        count={rejectedManagerCount}
        status="rejected_manager"
        icon={<XCircle className="h-5 w-5" />}
        description="รายการ"
      />
      <StatusCard
        title="ปฏิเสธโดยบัญชี"
        count={rejectedAccountingCount}
        status="rejected_accounting"
        icon={<XCircle className="h-5 w-5" />}
        description="รายการ"
      />
    </div>
  );
}
