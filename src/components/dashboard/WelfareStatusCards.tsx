import React from 'react';
import { Clipboard, CheckCircle2, XCircle } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { useWelfareRequests } from '@/hooks/useWelfareRequests';

export function WelfareStatusCards() {
  const { requests } = useWelfareRequests();

  // Count requests by status (new detailed statuses)
  const pendingManagerCount = requests.filter(r => !r.status || r.status.toLowerCase() === 'pending_manager').length;
  const pendingAccountingCount = requests.filter(r => r.status?.toLowerCase() === 'pending_accounting').length;
  const pendingHRCount = requests.filter(r => r.status?.toLowerCase() === 'pending_hr').length;
  const completedCount = requests.filter(r => r.status?.toLowerCase() === 'completed').length;
  const rejectedManagerCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_manager').length;
  const rejectedAccountingCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_accounting').length;
  const rejectedHRCount = requests.filter(r => r.status?.toLowerCase() === 'rejected_hr').length;

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
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
        title="ปฏิเสธโดย HR"
        count={rejectedHRCount}
        status="rejected_hr"
        icon={<XCircle className="h-5 w-5 text-purple-700" />}
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
