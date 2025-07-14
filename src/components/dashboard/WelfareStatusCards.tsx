import React from 'react';
import { Clipboard, CheckCircle2, XCircle } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { useWelfareRequests } from '@/hooks/useWelfareRequests';

export function WelfareStatusCards() {
  const { requests } = useWelfareRequests();

  // Count requests by status
  const pendingCount = requests.filter(r => !r.status || r.status.toLowerCase() === 'pending').length;
  const approvedCount = requests.filter(r => r.status?.toLowerCase() === 'approved').length;
  const rejectedCount = requests.filter(r => r.status?.toLowerCase() === 'rejected').length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatusCard
        title="รออนุมัติ"
        count={pendingCount}
        status="pending"
        icon={<Clipboard className="h-5 w-5" />}
      />
      <StatusCard
        title="อนุมัติแล้ว"
        count={approvedCount}
        status="approved"
        icon={<CheckCircle2 className="h-5 w-5" />}
      />
      <StatusCard
        title="ไม่อนุมัติ"
        count={rejectedCount}
        status="rejected"
        icon={<XCircle className="h-5 w-5" />}
      />
    </div>
  );
}
