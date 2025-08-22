import { useInternalTraining } from '@/context/InternalTrainingContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { StatusType } from '@/types';

export function InternalTrainingStatusCard() {
  const { user } = useAuth();
  const { trainingRequests } = useInternalTraining();

  if (!user) return null;

  // Filter requests for current user
  const userRequests = trainingRequests.filter(request => request.user_id === user.id);

  // Count by status
  const statusCounts = {
    pending: userRequests.filter(r => r.status.includes('pending')).length,
    completed: userRequests.filter(r => r.status === 'completed').length,
    rejected: userRequests.filter(r => r.status.includes('rejected')).length,
    total: userRequests.length
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('pending')) return <Clock className="h-4 w-4 text-yellow-500" />;
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status.includes('rejected')) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = (status: StatusType) => {
    const statusMap = {
      'pending_manager': 'รอผู้จัดการอนุมัติ',
      'pending_hr': 'รอ HR อนุมัติ',
      'pending_accounting': 'รอบัญชีอนุมัติ',
      'completed': 'อนุมัติแล้ว',
      'rejected_manager': 'ปฏิเสธโดยผู้จัดการ',
      'rejected_hr': 'ปฏิเสธโดย HR',
      'rejected_accounting': 'ปฏิเสธโดยบัญชี'
    };
    return statusMap[status] || status;
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">คำร้องอบรมภายใน</CardTitle>
        </div>
        <CardDescription>
          สถานะคำร้องการอบรมภายในองค์กรของคุณ
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statusCounts.total === 0 ? (
          <div className="text-center py-6">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">ยังไม่มีคำร้องอบรมภายใน</p>
            <Link to="/internal-training">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                สร้างคำร้องใหม่
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Summary */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
                <div className="text-xs text-yellow-700">รอดำเนินการ</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
                <div className="text-xs text-green-700">อนุมัติแล้ว</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
                <div className="text-xs text-red-700">ปฏิเสธ</div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">คำร้องล่าสุด</h4>
              {userRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="font-medium text-sm truncate max-w-[150px]">
                        {request.course_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {getStatusText(request.status)}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Link to="/internal-training" className="flex-1">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                  สร้างคำร้องใหม่
                </Button>
              </Link>
              {statusCounts.total > 3 && (
                <Button size="sm" variant="outline" className="flex-1">
                  ดูทั้งหมด ({statusCounts.total})
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}