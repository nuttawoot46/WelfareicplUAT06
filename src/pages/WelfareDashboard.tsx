import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useWelfare } from '@/context/WelfareContext';
import { WelfareRequest } from '@/types';
import { WelfareStatusCards } from '@/components/dashboard/WelfareStatusCards';
import WelfareStatusChart from '@/components/dashboard/WelfareStatusChart';
import { BenefitLimitSummary } from '@/components/dashboard/BenefitLimitSummary';
import { RemainingBudgetCard } from '@/components/dashboard/RemainingBudgetCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { File, ClipboardCheck, ClipboardX, Clipboard } from 'lucide-react';
import { AnimatedBorderShadow } from '@/components/effects/AnimatedBorderShadow';
import N8nChatbot from '@/components/chatbot/N8nChatbot';

const WelfareDashboard = () => {
  const { user, profile} = useAuth();
  const { welfareRequests } = useWelfare();
  
  // Filter out accounting requests (advance and expense-clearing) - only show welfare requests
  const welfareOnlyRequests = welfareRequests.filter(r => r.type !== 'advance' && r.type !== 'expense-clearing');
  // Get user information with priority to profile data
const displayName = profile?.display_name ||
  `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
  user?.user_metadata?.full_name ||
  user?.email?.split('@')[0] ||
  "User";
const email = user?.email || '';
const department = profile?.department || '';
const position = profile?.position || '';
const displayInitial = displayName.charAt(0).toUpperCase();  
  return (
    <Layout>
      
      {/* Employee's Remaining Budget Card - Only show for employees */}
      {user?.role === 'employee' && (
        <div className="mb-8">
          <RemainingBudgetCard 
            requests={welfareOnlyRequests} 
            userId={user.id} 
            maxBudget={10000}
          />
        </div>
      )}
      
      {/* Status Cards */}
      <div className="mb-10">
        <WelfareStatusCards />
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
      <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-8">
        <WelfareStatusChart />
      </div>
      
      {/* Benefit Limit Summary */}
      <BenefitLimitSummary />
      
      {/* N8n Chatbot */}
      <N8nChatbot />
    </Layout>
  );
};

export default WelfareDashboard;