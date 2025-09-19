import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { AccountingStatusCards } from '@/components/dashboard/AccountingStatusCards';
import AccountingStatusChart from '@/components/dashboard/AccountingStatusChart';
import { AccountingBenefitSummary } from '@/components/dashboard/AccountingBenefitSummary';
import { AccountingBudgetCard } from '@/components/dashboard/AccountingBudgetCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { File } from 'lucide-react';
import N8nChatbot from '@/components/chatbot/N8nChatbot';

const AccountingDashboard = () => {
  const { user } = useAuth();
  const { welfareRequests } = useWelfare();

  return (
    <Layout>
      {/* Employee's Remaining Budget Card - Only show for employees */}
      {user?.role === 'employee' && (
        <div className="mb-8">
          <AccountingBudgetCard
            requests={welfareRequests}
            userId={user.id}
            maxBudget={50000}
          />
        </div>
      )}

      {/* Status Cards */}
      <div className="mb-10">
        <AccountingStatusCards />
      </div>

      {user?.role === 'employee' && (
        <div className="mb-8 flex justify-center">
          <Link to="/accounting-forms">
            <Button className="btn-hover-effect bg-welfare-cyan hover:bg-welfare-cyan/90">
              <File className="mr-2 h-5 w-5" />
              ยื่นคำร้องขอบัญชี
            </Button>
          </Link>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <AccountingStatusChart />
      </div>

      {/* Benefit Limit Summary */}
      <AccountingBenefitSummary />

      {/* N8n Chatbot */}
      <N8nChatbot />
    </Layout>
  );
};

export default AccountingDashboard;