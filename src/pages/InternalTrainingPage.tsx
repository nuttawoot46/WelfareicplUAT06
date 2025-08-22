import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { InternalTrainingForm } from '@/components/forms/InternalTrainingForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Calculator, FileText, ArrowRight } from 'lucide-react';

const InternalTrainingPage = () => {
  const [showForm, setShowForm] = useState(false);
  const location = useLocation();
  
  // Check if there's an editId in the URL
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get('editId');

  const handleStartForm = () => {
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
  };

  // If there's an editId, show the form directly
  if (editId || showForm) {
    return (
      <Layout>
        <InternalTrainingForm 
          onBack={handleBack} 
          editId={editId ? Number(editId) : null}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ฟอร์มเบิกค่าอบรม (ภายใน)</h1>
          <p className="text-gray-600 mt-2">
            สำหรับการขออนุมัติจัดอบรมภายในองค์กร รวมถึงการคำนวณค่าใช้จ่ายและจำนวนผู้เข้าร่วม
          </p>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">รายละเอียดการอบรม</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                กรอกข้อมูลหลักสูตร วันที่ เวลา และสถานที่จัดอบรม
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">ผู้เข้าร่วม</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                ระบุจำนวนผู้เข้าร่วมแยกตามทีม/แผนก พร้อมคำนวณรวมอัตโนมัติ
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <Calculator className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">งบประมาณ</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                คำนวณค่าใช้จ่าย ภาษี และเฉลี่ยต่อคนอัตโนมัติ
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">หมายเหตุ</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                ข้อมูลเพิ่มเติมสำหรับการออกเอกสารทางภาษี
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">เริ่มต้นสร้างคำร้องอบรมภายใน</CardTitle>
            <CardDescription className="text-lg">
              กรอกข้อมูลการอบรมภายในองค์กรเพื่อขออนุมัติจากผู้บริหาร
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">ขั้นตอนการดำเนินการ</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>กรอกรายละเอียดการอบรม</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>ระบุจำนวนผู้เข้าร่วม</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>กรอกงบประมาณและค่าใช้จ่าย</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>ส่งคำร้องเพื่อขออนุมัติ</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleStartForm}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
            >
              เริ่มสร้างคำร้อง
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InternalTrainingPage;