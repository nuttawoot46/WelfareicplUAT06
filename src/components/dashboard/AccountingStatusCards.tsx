import React from 'react';
import { Clipboard, CheckCircle2, XCircle } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { useAccountingRequests } from '@/hooks/useAccountingRequests';

export function AccountingStatusCards() {
  const { requests } = useAccountingRequests();

  // All requests are already filtered for accounting (advance type)

  // Count requests by status (accounting flow: manager -> accounting, no HR)
  const pendingManagerCount = requests.filter(r => !r.status || r.status.toLowerCase() === 'pending_manager').length;
  const pendingAccountingCount = requests.filter(r => r.status?.toLowerCase() === 'pending_accounting').length;
  const completedCount = requests.filter(r => r.status?.toLowerCase() === 'completed').length;
  const rejectedManagerCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_manager').length;
  const rejectedAccountingCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_accounting').length;

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      <StatusCard
        title="รออนุมัติโดยหัวหน้า"
        count={pendingManagerCount}
        status="pending_manager"
        icon={<Clipboard className="h-5 w-5" />}
      />
      <StatusCard
        title="รอตรวจสอบโดยบัญชี"
        count={pendingAccountingCount}
        status="pending_accounting"
        icon={<Clipboard className="h-5 w-5 text-amber-700" />}
      />
      <StatusCard
        title="เสร็จสมบูรณ์"
        count={completedCount}
        status="completed"
        icon={<CheckCircle2 className="h-5 w-5 text-green-700" />}
      />
      <StatusCard
        title="ปฏิเสธโดยหัวหน้า"
        count={rejectedManagerCount}
        status="rejected_manager"
        icon={<XCircle className="h-5 w-5 text-red-700" />}
      />
      <StatusCard
        title="ปฏิเสธโดยบัญชี"
        count={rejectedAccountingCount}
        status="rejected_accounting"
        icon={<XCircle className="h-5 w-5 text-pink-700" />}
      />
    </div>
  );
}