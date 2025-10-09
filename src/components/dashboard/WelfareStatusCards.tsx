import React from 'react';
import { Clipboard, CheckCircle2, XCircle } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { useWelfareRequests } from '@/hooks/useWelfareRequests';

export function WelfareStatusCards() {
  const { requests } = useWelfareRequests();

  // Requests are already filtered for welfare types only (excludes advance, general-advance and expense-clearing)

  // Count requests by status (welfare flow: manager -> HR -> accounting -> completed)
  const pendingManagerCount = requests.filter(r => !r.status || r.status.toLowerCase() === 'pending_manager').length;
  const pendingHRCount = requests.filter(r => r.status?.toLowerCase() === 'pending_hr').length;
  const pendingSpecialCount = requests.filter(r => !r.status || r.status.toLowerCase() === 'pending_special_approval').length;
  const pendingAccountingCount = requests.filter(r => r.status?.toLowerCase() === 'pending_accounting').length;
  const completedCount = requests.filter(r => r.status?.toLowerCase() === 'completed').length;
  const rejectedManagerCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_manager').length;
  const rejectedHRCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_hr').length;
  const rejectedSpecialCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_special_approval').length;
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
        title="รอตรวจสอบโดย HR"
        count={pendingHRCount}
        status="pending_hr"
        icon={<Clipboard className="h-5 w-5 text-amber-700" />}
      />
      <StatusCard
        title="รอตรวจสอบโดย ผู้บริหาร"
        count={pendingSpecialCount}
        status="pending_special_approval"
        icon={<Clipboard className="h-5 w-5 text-amber-700" />}  
      />
      <StatusCard
        title="รออนุมัติโดยบัญชี"
        count={pendingAccountingCount}
        status="pending_accounting"
        icon={<Clipboard className="h-5 w-5" />}
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
        title="ปฏิเสธโดย HR"
        count={rejectedHRCount}
        status="rejected_hr"
        icon={<XCircle className="h-5 w-5 text-purple-700" />}
      />
      <StatusCard
        title="ปฏิเสธโดย ผู้บริหาร"
        count={rejectedSpecialCount}
        status="rejected_special_approval"
        icon={<XCircle className="h-5 w-5 text-purple-700" />}
      />
      <StatusCard
        title="ปฏิเสธโดย บัญชี"
        count={rejectedAccountingCount}
        status="rejected_accounting"
        icon={<XCircle className="h-5 w-5 text-purple-700" />}
      />
    </div>
  );
}
