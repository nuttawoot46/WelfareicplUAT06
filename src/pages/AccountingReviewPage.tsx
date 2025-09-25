import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Calculator, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';



const AccountingReviewPage: React.FC = () => {
  const navigate = useNavigate();



  return (
    <Layout>
      <div className="p-6">
        <button
          className="mb-4 flex items-center text-gray-600 hover:text-blue-600 transition"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          กลับ
        </button>

        <h1 className="text-3xl font-bold mb-2">ระบบตรวจสอบบัญชี</h1>
        <p className="text-gray-600 mb-8">เลือกประเภทการตรวจสอบที่ต้องการ</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Welfare Accounting Review */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-pink-100 p-3 rounded-lg mr-4">
                <Heart className="h-8 w-8 text-pink-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">ตรวจสอบสวัสดิการ</h2>
                <p className="text-gray-600">จัดการคำขอสวัสดิการพนักงาน</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                รายการรอตรวจสอบสวัสดิการ
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                ประวัติการขอสวัสดิการ
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BarChart3 className="h-4 w-4 mr-2" />
                รายงานการเบิกสวัสดิการ
              </div>
            </div>

            <Button 
              onClick={() => navigate('/welfare-accounting-review')}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            >
              เข้าสู่ระบบตรวจสอบสวัสดิการ
            </Button>
          </div>

          {/* General Accounting Review */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">ตรวจสอบบัญชีทั่วไป</h2>
                <p className="text-gray-600">จัดการคำขอเบิกล่วงหน้า เคลียร์ค่าใช้จ่าย และอบรม</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                รายการรอตรวจสอบ (เบิกล่วงหน้า, เคลียร์ค่าใช้จ่าย, อบรม)
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                ประวัติการขอทั่วไป
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BarChart3 className="h-4 w-4 mr-2" />
                รายงานการเบิกทั่วไป
              </div>
            </div>

            <Button 
              onClick={() => navigate('/general-accounting-review')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              เข้าสู่ระบบตรวจสอบบัญชีทั่วไป
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">ข้อมูลสรุป</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">-</div>
              <div className="text-sm text-gray-600">รอตรวจสอบสวัสดิการ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">-</div>
              <div className="text-sm text-gray-600">รอตรวจสอบทั่วไป</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">-</div>
              <div className="text-sm text-gray-600">อนุมัติแล้วเดือนนี้</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">-</div>
              <div className="text-sm text-gray-600">ยอดเงินรวมเดือนนี้</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export { AccountingReviewPage };
