
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { WelfareRequest, WelfareType, StatusType } from '@/types';
import { useWelfare } from '@/context/WelfareContext';
import { useNotification } from '@/context/NotificationContext';
import { Check, X, AlertCircle, Loader2, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

export function RequestReviewCard({ request }: RequestReviewCardProps) {
  const [notes, setNotes] = useState(request.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateRequestStatus, isLoading } = useWelfare();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const handleUpdateStatus = async (status: StatusType) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    // Update request status
    updateRequestStatus(request.id, status, notes);
    
    // Add notification for the employee
    addNotification({
      userId: request.userId,
      title: status === 'approved' ? 'คำร้องได้รับการอนุมัติ' : 'คำร้องไม่ได้รับการอนุมัติ',
      message: status === 'approved'
        ? `คำร้องขอสวัสดิการ${welfareTypeLabels[request.type]} ของคุณได้รับการอนุมัติแล้ว`
        : `คำร้องขอสวัสดิการ${welfareTypeLabels[request.type]} ของคุณไม่ได้รับการอนุมัติ ${notes ? `หมายเหตุ: ${notes}` : ''}`,
      type: status === 'approved' ? 'success' : 'warning',
    });

    // Simulate API delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  };

  // Render attachments
  const renderAttachments = () => {
    if (!request.attachments || request.attachments.length === 0) {
      return <p className="text-sm text-muted-foreground">ไม่มีเอกสารแนบ</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {request.attachments.map((file, index) => (
          <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
            <FileText className="h-3 w-3" />
            {file}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={`welfare-card ${
      request.status === 'pending' 
        ? 'welfare-card-pending' 
        : request.status === 'approved' 
          ? 'welfare-card-approved' 
          : 'welfare-card-rejected'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {welfareTypeLabels[request.type]} - {request.amount.toLocaleString()} บาท
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              โดย: {request.userName} ({request.userDepartment})
            </p>
          </div>
          <Badge
            variant="outline" 
            className={
              request.status === 'pending'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : request.status === 'approved'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-red-100 text-red-800 border-red-200'
            }
          >
            {request.status === 'pending' 
              ? 'รออนุมัติ' 
              : request.status === 'approved' 
                ? 'อนุมัติแล้ว' 
                : 'ไม่อนุมัติ'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">รายละเอียด:</p>
          <p className="text-sm">{request.details}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">วันที่เกิดค่าใช้จ่าย:</p>
          <p className="text-sm">{request.date}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">เอกสารแนบ:</p>
          {renderAttachments()}
        </div>
        
        {request.status === 'pending' && (
          <div>
            <label htmlFor={`notes-${request.id}`} className="text-sm font-medium">หมายเหตุ:</label>
            <Textarea
              id={`notes-${request.id}`}
              placeholder="ระบุหมายเหตุ (ถ้ามี)"
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}
        
        {(request.status === 'approved' || request.status === 'rejected') && request.notes && (
          <div>
            <p className="text-sm font-medium">หมายเหตุ:</p>
            <p className="text-sm">{request.notes}</p>
          </div>
        )}
      </CardContent>
      
      {request.status === 'pending' && (
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
            onClick={() => handleUpdateStatus('rejected')}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            ไม่อนุมัติ
          </Button>
          
          <Button
            variant="outline"
            className="border-green-500 text-green-500 hover:bg-green-50"
            onClick={() => handleUpdateStatus('approved')}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            อนุมัติ
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
