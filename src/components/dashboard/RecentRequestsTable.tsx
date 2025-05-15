
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { WelfareRequest, StatusType, WelfareType } from '@/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentRequestsTableProps {
  requests: WelfareRequest[];
  limit?: number;
}

// Welfare type labels in Thai
const welfareTypeLabels: Record<WelfareType, string> = {
  wedding: 'ค่าแต่งงาน',
  training: 'ค่าอบรม',
  childbirth: 'ค่าคลอดบุตร',
  funeral: 'ค่าช่วยเหลืองานศพ',
  glasses: 'ค่าตัดแว่น',
  dental: 'ค่าทำฟัน',
  fitness: 'ค่าออกกำลังกาย',
};

export function RecentRequestsTable({ requests, limit = 5 }: RecentRequestsTableProps) {
  // Sort by createdAt (newest first) and limit
  const sortedRequests = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  // Status badge
  const StatusBadge = ({ status }: { status: StatusType }) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">รออนุมัติ</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">ไม่อนุมัติ</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>คำร้องล่าสุด</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{formatDate(request.createdAt)}</TableCell>
                  <TableCell>{request.userName}</TableCell>
                  <TableCell>{welfareTypeLabels[request.type] || request.type}</TableCell>
                  <TableCell>{request.amount.toLocaleString()} บาท</TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                </TableRow>
              ))}

              {sortedRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    ไม่มีคำร้องล่าสุด
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
