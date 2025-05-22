
import { TeamSelectionForm } from '@/components/teamSelection/TeamSelectionForm';
import { WelcomeBanner } from '@/components/teamSelection/WelcomeBanner';
import { useTeamEmployeeData } from '@/hooks/useTeamEmployeeData';

const TeamSelectionPage = () => {
  const { teams, employees, isLoading, error } = useTeamEmployeeData();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Selection Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4">
              WF
            </div>
            <h1 className="text-3xl font-bold text-gray-900">ระบบสวัสดิการพนักงาน</h1>
            <p className="text-gray-600 mt-2">กรุณาเลือกทีมและชื่อพนักงานเพื่อเข้าใช้งาน</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm mb-6">
              {error}
            </div>
          )}
          
          <TeamSelectionForm 
            teams={teams} 
            employees={employees} 
            isLoading={isLoading} 
          />
        </div>
      </div>
      
      {/* Right side - Decorative Background */}
      <WelcomeBanner />
    </div>
  );
};

export default TeamSelectionPage;
