
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useWelfare } from '@/context/WelfareContext';
import { RequestReviewCard } from '@/components/admin/RequestReviewCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const { welfareRequests } = useWelfare();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  
  // Make sure only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>ข้อผิดพลาดด้านสิทธิ์การเข้าถึง</AlertTitle>
          <AlertDescription>
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }
  
  // Filter requests by status
  const pendingRequests = welfareRequests.filter(req => req.status === 'pending');
  const approvedRequests = welfareRequests.filter(req => req.status === 'approved');
  const rejectedRequests = welfareRequests.filter(req => req.status === 'rejected');
  
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">อนุมัติคำร้อง</h1>
        <p className="text-gray-600">ตรวจสอบและอนุมัติคำร้องขอสวัสดิการ</p>
      </div>
      
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800">
            รออนุมัติ ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
            อนุมัติแล้ว ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
            ไม่อนุมัติ ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">ไม่มีคำร้องที่รอการอนุมัติ</p>
            </div>
          ) : (
            pendingRequests.map(request => (
              <RequestReviewCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">ไม่มีคำร้องที่อนุมัติแล้ว</p>
            </div>
          ) : (
            approvedRequests.map(request => (
              <RequestReviewCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">ไม่มีคำร้องที่ไม่อนุมัติ</p>
            </div>
          ) : (
            rejectedRequests.map(request => (
              <RequestReviewCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Admin;
