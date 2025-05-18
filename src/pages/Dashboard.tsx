
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { WelfareTypeChart } from '@/components/dashboard/WelfareTypeChart';
import WelfareStatusChart from '@/components/dashboard/WelfareStatusChart';
import { RecentRequestsTable } from '@/components/dashboard/RecentRequestsTable';
import { RemainingBudgetCard } from '@/components/dashboard/RemainingBudgetCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { File, ClipboardCheck, ClipboardX, Clipboard } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { welfareRequests, getRequestsByUser } = useWelfare();
  
  // Get requests for the current user if they're an employee
  const userRequests = user?.role === 'employee' 
    ? getRequestsByUser(user.id)
    : welfareRequests;

  // Count requests by status
  const pendingCount = userRequests.filter(req => req.status === 'pending').length;
  const approvedCount = userRequests.filter(req => req.status === 'approved').length;
  const rejectedCount = userRequests.filter(req => req.status === 'rejected').length;
  
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">สวัสดี, {user?.name || 'ผู้ใช้'}</h1>
        <p className="text-gray-600">ยินดีต้อนรับสู่ระบบสวัสดิการพนักงาน</p>
      </div>
      
      {/* Employee's Remaining Budget Card - Only show for employees */}
      {user?.role === 'employee' && (
        <div className="mb-8">
          <RemainingBudgetCard 
            requests={welfareRequests} 
            userId={user.id} 
            maxBudget={10000}
          />
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <StatusCard 
          title="ไม่อนุมัติ" 
          count={rejectedCount} 
          status="rejected"
          icon={<ClipboardX className="h-5 w-5" />}
        />
      </div>
      
      {user?.role === 'employee' && (
        <div className="mb-8 flex justify-center">
          <Link to="/forms">
            <Button className="btn-hover-effect bg-welfare-blue hover:bg-welfare-blue/90">
              <File className="mr-2 h-5 w-5" />
              ยื่นคำร้องขอสวัสดิการ
            </Button>
          </Link>
        </div>
      )}
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <WelfareTypeChart requests={userRequests} />
        <WelfareStatusChart requests={userRequests} />
      </div>
      
      {/* Recent Requests Table */}
      <RecentRequestsTable requests={userRequests} limit={5} />
    </Layout>
  );
};

export default Dashboard;
