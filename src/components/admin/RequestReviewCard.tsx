
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { WelfareRequest, WelfareType, StatusType } from '@/types';
import { useWelfare } from '@/context/WelfareContext';
import { useNotification } from '@/context/NotificationContext';
import { Check, X, Loader2, FileText, User, Calendar, Building } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface RequestReviewCardProps {
  request: WelfareRequest;
}

const welfareTypeLabels: Record<WelfareType, string> = {
  wedding: 'ค่าแต่งงาน',
  training: 'ค่าอบรม',
  childbirth: 'ค่าคลอดบุตร',
  funeral: 'ค่าช่วยเหลืองานศพ',
  glasses: 'ค่าตัดแว่น',
  dental: 'ค่าทำฟัน',
  fitness: 'ค่าออกกำลังกาย',
};

const statusConfig = {
  pending: { label: 'รออนุมัติ', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'อนุมัติแล้ว', className: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'ไม่อนุมัติ', className: 'bg-red-100 text-red-800 border-red-200' },
};

export function RequestReviewCard({ request }: RequestReviewCardProps) {
  const [notes, setNotes] = useState(request.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateRequestStatus, isLoading } = useWelfare();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const handleUpdateStatus = async (status: StatusType) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    await updateRequestStatus(request.id, status, notes);
    
    addNotification({
      userId: request.userId,
      title: `คำร้องของคุณ ${status === 'approved' ? 'ได้รับการอนุมัติ' : 'ถูกปฏิเสธ'}`,
      message: `คำร้องขอสวัสดิการ "${welfareTypeLabels[request.type]}" ได้รับการอัปเดตแล้ว ${notes ? `หมายเหตุ: ${notes}` : ''}`,
      type: status === 'approved' ? 'success' : 'warning',
    });

    setIsSubmitting(false);
  };

  const renderAttachments = () => {
    if (!request.attachments || request.attachments.length === 0) {
      return <p className="text-sm text-muted-foreground">ไม่มีเอกสารแนบ</p>;
    }
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {request.attachments.map((file, index) => (
          <a href={file} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md text-xs hover:bg-muted/80">
            <FileText className="h-3 w-3" />
            <span>เอกสารแนบ {index + 1}</span>
          </a>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg mb-1">{welfareTypeLabels[request.type]}</CardTitle>
          <p className="text-xl font-bold">{request.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p>
        </div>
        <Badge variant="outline" className={cn('text-xs', statusConfig[request.status].className)}>
          {statusConfig[request.status].label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{request.userName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{request.userDepartment}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>วันที่เกิดค่าใช้จ่าย: {new Date(request.date).toLocaleDateString('th-TH')}</span>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium">รายละเอียดคำร้อง:</p>
          <p className="text-sm text-muted-foreground pl-2 border-l-2 ml-1 mt-1">{request.details}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">เอกสารแนบ:</p>
          {renderAttachments()}
        </div>
        
        {request.status === 'pending' && (
          <div>
            <label htmlFor={`notes-${request.id}`} className="text-sm font-medium">เพิ่มหมายเหตุ (ถ้ามี):</label>
            <Textarea
              id={`notes-${request.id}`}
              placeholder="เช่น เหตุผลในการอนุมัติหรือปฏิเสธ"
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}
        
        {(request.status === 'approved' || request.status === 'rejected') && request.notes && (
          <div>
            <p className="text-sm font-medium">หมายเหตุจากผู้ตรวจสอบ:</p>
            <p className="text-sm text-muted-foreground pl-2 border-l-2 ml-1 mt-1">{request.notes}</p>
          </div>
        )}
      </CardContent>
      
      {request.status === 'pending' && (
        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => handleUpdateStatus('rejected')}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            ไม่อนุมัติ
          </Button>
          
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleUpdateStatus('approved')}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            อนุมัติ
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
