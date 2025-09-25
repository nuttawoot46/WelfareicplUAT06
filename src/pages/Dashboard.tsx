import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { BarChart3, Calculator, FileText, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();

  // Get user information with priority to profile data
  const displayName = profile?.display_name ||
    `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    "User";

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            สวัสดี, {displayName}
          </h1>
          <p className="text-gray-600">
            เลือกแดชบอร์ดที่คุณต้องการดู
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Welfare Dashboard Card */}
          <Card className="transition-all border-l-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 border-l-welfare-blue">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-welfare-blue/10 text-welfare-blue mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">แดชบอร์ดสวัสดิการ</CardTitle>
              <CardDescription>
                ดูข้อมูลสวัสดิการ สถานะคำร้อง และสรุปสิทธิประโยชน์
              </CardDescription>
            </CardHeader>
            <CardContent>
              
            </CardContent>
          </Card>

          {/* Accounting Dashboard Card */}
          <Card className="transition-all border-l-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 border-l-welfare-cyan">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-welfare-cyan/10 text-welfare-cyan mb-4">
                <Calculator className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">แดชบอร์ดบัญชี</CardTitle>
              <CardDescription>
                ดูข้อมูลบัญชี การเบิกจ่าย และสถานะการอนุมัติ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/accounting-dashboard">
                <Button className="w-full bg-welfare-cyan hover:bg-welfare-cyan/90">
                  <Calculator className="mr-2 h-4 w-4" />
                  เข้าสู่แดชบอร์ดบัญชี
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/welfare-forms">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-welfare-blue" />
                  <span className="font-medium">ยื่นคำร้องสวัสดิการ</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/accounting-forms">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-welfare-cyan" />
                  <span className="font-medium">ยื่นคำร้องบัญชี</span>
                </CardContent>
              </Card>
            </Link>

            <Link to="/notifications">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">ดูการแจ้งเตือน</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
