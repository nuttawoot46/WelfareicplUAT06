import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen, LogIn, FileText, CreditCard, CheckCircle,
  PenTool, Users, ClipboardCheck, BarChart3, Briefcase,
  HelpCircle, Headphones, ChevronRight, Wallet, Receipt,
  UserCheck, FileCheck, DollarSign, Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const UserGuidePage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const userRole = profile?.role?.toLowerCase() || 'employee';

  const getDefaultTab = () => {
    if (userRole === 'accounting') return 'accounting';
    if (userRole === 'accountingandmanager') return 'accountingandmanager';
    if (userRole === 'manager') return 'manager';
    return 'employee';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      employee: 'พนักงานทั่วไป',
      manager: 'หัวหน้าทีม',
      hr: 'ฝ่าย HR',
      accounting: 'ฝ่ายบัญชี',
      accountingandmanager: 'บัญชี+หัวหน้าทีม',
      admin: 'ผู้ดูแลระบบ',
      superadmin: 'Super Admin',
    };
    return labels[role] || 'พนักงานทั่วไป';
  };

  return (
    <Layout>
    <div className="animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 text-gray-600 hover:text-[#004F9F] hover:bg-blue-50 -ml-2"
      >
        <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
        กลับ
      </Button>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#004F9F] to-[#0066CC] p-8 md:p-12 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white font-kanit">
                คู่มือการใช้งานระบบ
              </h1>
              <p className="text-blue-100 text-lg mt-1">
                ระบบจัดการสวัสดิการพนักงาน ICP Ladda
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 text-sm">
              <Shield className="h-4 w-4 mr-1.5" />
              บทบาทของคุณ: {getRoleLabel(userRole)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <QuickNavCard
          icon={<FileText className="h-6 w-6" />}
          title="เบิกสวัสดิการ"
          description="เบิกค่ารักษา ค่าแว่น ฯลฯ"
          color="from-blue-500 to-blue-600"
          href="/welfare-forms"
        />
        <QuickNavCard
          icon={<CreditCard className="h-6 w-6" />}
          title="เบิกเงินทดลอง"
          description="เบิกเงินล่วงหน้า"
          color="from-purple-500 to-indigo-600"
          href="/welfare-forms"
        />
        <QuickNavCard
          icon={<BarChart3 className="h-6 w-6" />}
          title="ดูสถานะ"
          description="ตรวจสอบคำขอ"
          color="from-orange-500 to-red-500"
          href="/welfare-dashboard"
        />
      </div>

      {/* Role-Based Tabs */}
      <Tabs defaultValue={getDefaultTab()} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-1.5 rounded-xl h-auto">
          <TabsTrigger
            value="employee"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#004F9F] data-[state=active]:to-[#0066CC] data-[state=active]:text-white data-[state=active]:shadow-md transition-all rounded-lg py-2.5 text-xs md:text-sm"
          >
            พนักงานทั่วไป
          </TabsTrigger>
          <TabsTrigger
            value="manager"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all rounded-lg py-2.5 text-xs md:text-sm"
          >
            หัวหน้าทีม
          </TabsTrigger>
          <TabsTrigger
            value="accounting"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all rounded-lg py-2.5 text-xs md:text-sm"
          >
            ฝ่ายบัญชี
          </TabsTrigger>
          <TabsTrigger
            value="accountingandmanager"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all rounded-lg py-2.5 text-xs md:text-sm"
          >
            บัญชี+หน.ทีม
          </TabsTrigger>
        </TabsList>

        {/* Employee Tab */}
        <TabsContent value="employee">
          <EmployeeGuide />
        </TabsContent>

        {/* Manager Tab */}
        <TabsContent value="manager">
          <ManagerGuide />
        </TabsContent>

        {/* Accounting Tab */}
        <TabsContent value="accounting">
          <AccountingGuide />
        </TabsContent>

        {/* Accounting + Manager Tab */}
        <TabsContent value="accountingandmanager">
          <AccountingManagerGuide />
        </TabsContent>
      </Tabs>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 font-kanit">
          <HelpCircle className="h-6 w-6 text-[#004F9F]" />
          คำถามที่พบบ่อย
        </h2>
        <FAQSection />
      </div>

      {/* Contact Support */}
      <div className="mt-12 mb-8">
        <Card className="border-0 bg-gradient-to-r from-gray-50 to-blue-50 shadow-md">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#004F9F] rounded-xl">
                <Headphones className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-kanit">ต้องการความช่วยเหลือ?</h3>
                <p className="text-gray-600">ติดต่อฝ่าย IT Support สำหรับปัญหาการใช้งานระบบ</p>
              </div>
            </div>
            <Link to="/support">
              <Button className="bg-[#004F9F] hover:bg-[#003D7A] text-white px-6 py-2.5 rounded-xl shadow-md">
                <Headphones className="h-4 w-4 mr-2" />
                ติดต่อ IT Support
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
    </Layout>
  );
};

// ======== Quick Navigation Card ========
const QuickNavCard = ({ icon, title, description, color, href }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  href: string;
}) => (
  <Link to={href}>
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 shadow-md h-full">
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color} text-white group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </CardContent>
    </Card>
  </Link>
);

// ======== Step Card ========
const StepCard = ({ step, title, description, icon }: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <Card className="border-l-4 border-l-[#004F9F] hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#004F9F] text-white flex items-center justify-center text-sm font-bold">
          {step}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <h4 className="font-semibold text-gray-900">{title}</h4>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ======== Section Header ========
const SectionHeader = ({ icon, title, color = 'text-[#004F9F]' }: {
  icon: React.ReactNode;
  title: string;
  color?: string;
}) => (
  <h3 className={`text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 font-kanit`}>
    <span className={color}>{icon}</span>
    {title}
  </h3>
);

// ======== Employee Guide ========
const EmployeeGuide = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Getting Started */}
    <div>
      <SectionHeader icon={<LogIn className="h-5 w-5" />} title="เริ่มต้นใช้งาน" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StepCard
          step={1}
          title="เข้าสู่ระบบ"
          description="คลิกปุ่ม 'เข้าสู่ระบบด้วย Microsoft' ใช้อีเมลบริษัท (@icpladda.com) ในการ Login"
          icon={<LogIn className="h-4 w-4 text-[#004F9F]" />}
        />
        <StepCard
          step={2}
          title="เลือกเมนูที่ต้องการ"
          description="หลังจาก Login สำเร็จ จะเข้าสู่หน้า Dashboard เลือกเมนูด้านซ้ายเพื่อใช้งาน"
          icon={<FileText className="h-4 w-4 text-[#004F9F]" />}
        />
        <StepCard
          step={3}
          title="ตรวจสอบสถานะ"
          description="ดูสถานะคำขอทั้งหมดได้ที่หน้า 'สวัสดิการของฉัน'"
          icon={<CheckCircle className="h-4 w-4 text-[#004F9F]" />}
        />
      </div>
    </div>

    {/* Welfare Claims */}
    <div>
      <SectionHeader icon={<Wallet className="h-5 w-5" />} title="วิธีเบิกสวัสดิการ" />
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="welfare-types" className="border rounded-lg px-4 mb-3 shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="font-medium">ประเภทสวัสดิการและวงเงิน</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <BudgetItem label="ค่าตัดแว่นสายตา + ทำฟัน" amount="2,000" note="งบรวมกัน" />
              <BudgetItem label="ค่าออกกำลังกาย" amount="300" note="ต่อเดือน" />
              <BudgetItem label="สวัสดิการงานสมรส" amount="3,000" />
              <BudgetItem label="ค่าคลอดบุตร" amount="8,000" note="สูงสุด 2 ครั้ง" />
              <BudgetItem label="ค่าช่วยเหลืองานศพ" amount="10,000" />
              <BudgetItem label="ของเยี่ยมกรณีเจ็บป่วย" amount="1,000" />
              <BudgetItem label="ค่าอบรมภายนอก" amount="ตามงบประมาณ" note="แตกต่างตามตำแหน่ง" />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="welfare-steps" className="border rounded-lg px-4 mb-3 shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-green-500" />
              <span className="font-medium">ขั้นตอนการเบิกสวัสดิการ</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-3 pt-2">
              <StepItem number={1} text="เข้าเมนู 'ฟอร์มเบิก' > เลือกแท็บ 'สวัสดิการ'" />
              <StepItem number={2} text="เลือกประเภทสวัสดิการที่ต้องการเบิก" />
              <StepItem number={3} text="กรอกข้อมูลให้ครบถ้วน พร้อมแนบเอกสารประกอบ" />
              <StepItem number={4} text="เซ็นชื่อดิจิทัลเพื่อยืนยันการเบิก" />
              <StepItem number={5} text="ระบบจะสร้าง PDF และส่งคำขอไปยังหัวหน้าทีม" />
              <StepItem number={6} text="ติดตามสถานะ: รออนุมัติ > หัวหน้า > HR > บัญชี > เสร็จสิ้น" />
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="advance" className="border rounded-lg px-4 mb-3 shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-500" />
              <span className="font-medium">วิธีเบิกเงินทดลอง</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-3 pt-2">
              <StepItem number={1} text="เข้าเมนู 'ฟอร์มเบิก' > เลือกประเภทที่ต้องการ (เงินทดลองทั่วไป/ฝ่ายขาย)" />
              <StepItem number={2} text="กรอกรายละเอียดค่าใช้จ่าย วัตถุประสงค์ และจำนวนเงิน" />
              <StepItem number={3} text="เซ็นชื่อดิจิทัลและส่งคำขอ" />
              <StepItem number={4} text="เมื่อใช้เงินเสร็จ ให้ทำ 'ปรับปรุงค่าใช้จ่าย' เพื่อเคลียร์เงินทดลอง" />
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="signature" className="border rounded-lg px-4 mb-3 shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-indigo-500" />
              <span className="font-medium">วิธีเซ็นชื่อดิจิทัล</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-3 pt-2">
              <StepItem number={1} text="เมื่อกรอกฟอร์มครบแล้ว คลิกปุ่ม 'เซ็นชื่อ'" />
              <StepItem number={2} text="ใช้เมาส์หรือนิ้ว (มือถือ) วาดลายเซ็นบนกรอบที่ปรากฏ" />
              <StepItem number={3} text="คลิก 'ล้าง' เพื่อวาดใหม่ หรือ 'บันทึก' เพื่อยืนยัน" />
              <StepItem number={4} text="ลายเซ็นจะถูกฝังในเอกสาร PDF อัตโนมัติ" />
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>

    {/* Status Tracking */}
    <div>
      <SectionHeader icon={<CheckCircle className="h-5 w-5" />} title="การติดตามสถานะ" />
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-0">
            <StatusStep label="ส่งคำขอ" color="bg-blue-500" />
            <StatusArrow />
            <StatusStep label="หัวหน้าอนุมัติ" color="bg-emerald-500" />
            <StatusArrow />
            <StatusStep label="HR อนุมัติ" color="bg-purple-500" />
            <StatusArrow />
            <StatusStep label="บัญชีอนุมัติ" color="bg-orange-500" />
            <StatusArrow />
            <StatusStep label="เสร็จสิ้น" color="bg-green-600" />
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>หมายเหตุ:</strong> คำขอที่มียอดเกิน 10,000 บาท จะต้องผ่านการอนุมัติโดย กรรมการผู้จัดการเพิ่มเติม
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// ======== Manager Guide ========
const ManagerGuide = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Manager Intro */}
    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
      <p className="text-emerald-800">
        <strong>บทบาทหัวหน้าทีม:</strong> นอกจากสิทธิ์ของพนักงานทั่วไปแล้ว คุณสามารถอนุมัติ/ปฏิเสธคำขอของสมาชิกในทีม และขออนุมัติจ้างงานได้
      </p>
    </div>

    {/* Approval */}
    <div>
      <SectionHeader icon={<ClipboardCheck className="h-5 w-5" />} title="วิธีอนุมัติคำขอสวัสดิการ" color="text-emerald-600" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StepCard
          step={1}
          title="เข้าหน้าอนุมัติ"
          description="คลิกเมนู 'อนุมัติคำขอ' ด้านซ้าย จะเห็นรายการคำขอที่รอการอนุมัติของทีมคุณ"
          icon={<ClipboardCheck className="h-4 w-4 text-emerald-600" />}
        />
        <StepCard
          step={2}
          title="ตรวจสอบรายละเอียด"
          description="คลิกที่คำขอเพื่อดูรายละเอียด ตรวจสอบจำนวนเงิน เอกสารแนบ และเหตุผลการเบิก"
          icon={<FileCheck className="h-4 w-4 text-emerald-600" />}
        />
        <StepCard
          step={3}
          title="อนุมัติหรือปฏิเสธ"
          description="เซ็นชื่อดิจิทัลเพื่ออนุมัติ หรือกรอกเหตุผลเพื่อปฏิเสธ คำขอจะถูกส่งต่อไป HR อัตโนมัติ"
          icon={<UserCheck className="h-4 w-4 text-emerald-600" />}
        />
      </div>
    </div>

    {/* Employment Approval */}
    <div>
      <SectionHeader icon={<Briefcase className="h-5 w-5" />} title="วิธีขออนุมัติจ้างงาน" color="text-emerald-600" />
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="employment" className="border rounded-lg px-4 mb-3 shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">ขั้นตอนขออนุมัติจ้างงาน</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-3 pt-2">
              <StepItem number={1} text="เข้าเมนู 'ฟอร์มเบิก' > เลือกแท็บ 'ขออนุมัติจ้างงาน'" />
              <StepItem number={2} text="เลือกประเภทการจ้าง (ใหม่/ทดแทน/ชั่วคราว/ต่อสัญญา)" />
              <StepItem number={3} text="กรอกรายละเอียดตำแหน่ง คุณสมบัติ และเหตุผล" />
              <StepItem number={4} text="เซ็นชื่อดิจิทัลและส่งคำขอ" />
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>

    {/* Reports */}
    <div>
      <SectionHeader icon={<BarChart3 className="h-5 w-5" />} title="รายงานทีม" color="text-emerald-600" />
      <Card className="border-0 shadow-md">
        <CardContent className="p-5">
          <p className="text-gray-700">
            ดูรายงานสรุปคำขอสวัสดิการของสมาชิกในทีมได้ที่หน้า <strong>'สวัสดิการของฉัน'</strong> โดยจะแสดงสถานะคำขอทั้งหมดที่คุณเป็นผู้อนุมัติ
          </p>
        </CardContent>
      </Card>
    </div>

    {/* Employee Guide Reference */}
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
      <p className="text-gray-700 text-sm">
        <strong>สิทธิ์พนักงานทั่วไป:</strong> หัวหน้าทีมสามารถเบิกสวัสดิการและเบิกเงินทดลองได้เช่นเดียวกับพนักงานทั่วไป ดูรายละเอียดได้ที่แท็บ 'พนักงานทั่วไป'
      </p>
    </div>
  </div>
);

// ======== Accounting Guide ========
const AccountingGuide = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Accounting Intro */}
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
      <p className="text-purple-800">
        <strong>บทบาทฝ่ายบัญชี:</strong> ตรวจสอบและอนุมัติการจ่ายเงินสวัสดิการ เงินทดลอง และปรับปรุงค่าใช้จ่ายที่ผ่านการอนุมัติจาก HR แล้ว
      </p>
    </div>

    {/* Payment Approval */}
    <div>
      <SectionHeader icon={<DollarSign className="h-5 w-5" />} title="วิธีอนุมัติจ่ายเงิน" color="text-purple-600" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StepCard
          step={1}
          title="ตรวจสอบคำขอ"
          description="เข้าเมนู 'อนุมัติบัญชี' เพื่อดูรายการที่รอการอนุมัติจ่ายเงิน"
          icon={<Receipt className="h-4 w-4 text-purple-600" />}
        />
        <StepCard
          step={2}
          title="ตรวจเอกสาร"
          description="ตรวจสอบเอกสารแนบ จำนวนเงิน และ PDF ที่สร้างจากระบบ ว่าถูกต้องครบถ้วน"
          icon={<FileCheck className="h-4 w-4 text-purple-600" />}
        />
        <StepCard
          step={3}
          title="อนุมัติจ่ายเงิน"
          description="คลิก 'อนุมัติ' เพื่อยืนยันการจ่ายเงิน สถานะจะเปลี่ยนเป็น 'เสร็จสิ้น'"
          icon={<CheckCircle className="h-4 w-4 text-purple-600" />}
        />
      </div>
    </div>

    {/* Accounting Review */}
    <div>
      <SectionHeader icon={<FileCheck className="h-5 w-5" />} title="หน้าตรวจสอบเอกสาร" color="text-purple-600" />
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="review" className="border rounded-lg px-4 mb-3 shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span className="font-medium">การใช้หน้าตรวจสอบ (Accounting Review)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-3 pt-2">
              <StepItem number={1} text="เข้าเมนู 'ตรวจสอบเอกสาร' เพื่อดูคำขอที่อนุมัติแล้ว" />
              <StepItem number={2} text="กรองตามประเภท สถานะ หรือช่วงวันที่" />
              <StepItem number={3} text="คลิกเพื่อดาวน์โหลด PDF หรือตรวจสอบรายละเอียด" />
              <StepItem number={4} text="ใช้หน้านี้เป็นข้อมูลสำหรับการจ่ายเงินจริง" />
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="accounting-forms" className="border rounded-lg px-4 mb-3 shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-500" />
              <span className="font-medium">ฟอร์มเบิกเงินทดลอง (ฝ่ายขาย)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-3 pt-2">
              <StepItem number={1} text="เข้าเมนู 'ฟอร์มบัญชี' เพื่อเบิกเงินทดลองสำหรับทีมขาย" />
              <StepItem number={2} text="เลือกประเภท: เบิกเงินทดลอง หรือ ปรับปรุงค่าใช้จ่าย" />
              <StepItem number={3} text="กรอกข้อมูลตัวแทน/ดีลเลอร์ พื้นที่ปฏิบัติงาน" />
              <StepItem number={4} text="ระบุรายการค่าใช้จ่าย (ค่าเดินทาง ค่าที่พัก ค่าเบี้ยเลี้ยง)" />
              <StepItem number={5} text="เซ็นชื่อดิจิทัลและส่งคำขอ" />
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>

    {/* Accounting Report */}
    <div>
      <SectionHeader icon={<BarChart3 className="h-5 w-5" />} title="รายงานบัญชี" color="text-purple-600" />
      <Card className="border-0 shadow-md">
        <CardContent className="p-5">
          <p className="text-gray-700">
            ดูรายงานสรุปได้ที่หน้า <strong>'Dashboard บัญชี'</strong> ซึ่งแสดงยอดรวมการเบิกจ่าย สถานะคำขอ และกราฟสรุปแยกตามประเภท
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);

// ======== Accounting + Manager Guide ========
const AccountingManagerGuide = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Intro */}
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
      <p className="text-orange-800">
        <strong>บทบาทบัญชี+หัวหน้าทีม:</strong> คุณมีสิทธิ์ทั้งการอนุมัติคำขอของทีม (เหมือนหัวหน้าทีม) และการอนุมัติจ่ายเงิน (เหมือนฝ่ายบัญชี)
      </p>
    </div>

    {/* Combined Capabilities */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Manager Side */}
      <Card className="border-t-4 border-t-emerald-500 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 font-kanit">
            <Users className="h-5 w-5 text-emerald-600" />
            สิทธิ์หัวหน้าทีม
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <FeatureItem text="อนุมัติคำขอสวัสดิการของทีม" />
            <FeatureItem text="ขออนุมัติจ้างงาน" />
            <FeatureItem text="ดูรายงานสรุปของทีม" />
          </ul>
        </CardContent>
      </Card>

      {/* Accounting Side */}
      <Card className="border-t-4 border-t-purple-500 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 font-kanit">
            <DollarSign className="h-5 w-5 text-purple-600" />
            สิทธิ์ฝ่ายบัญชี
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <FeatureItem text="อนุมัติจ่ายเงินสวัสดิการ" />
            <FeatureItem text="ตรวจสอบเอกสารการเบิก" />
            <FeatureItem text="เบิกเงินทดลอง (ฝ่ายขาย)" />
            <FeatureItem text="ดูรายงานบัญชี" />
          </ul>
        </CardContent>
      </Card>
    </div>

    {/* Workflow */}
    <div>
      <SectionHeader icon={<ClipboardCheck className="h-5 w-5" />} title="ขั้นตอนการทำงาน" color="text-orange-600" />
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="manager-flow" className="border rounded-lg px-4 mb-3 shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">อนุมัติคำขอทีม (Manager)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-3 pt-2">
              <StepItem number={1} text="เข้าเมนู 'อนุมัติคำขอ' ดูรายการที่รอการอนุมัติ" />
              <StepItem number={2} text="ตรวจสอบรายละเอียดคำขอ เอกสารแนบ" />
              <StepItem number={3} text="เซ็นชื่อดิจิทัลเพื่ออนุมัติ หรือกรอกเหตุผลปฏิเสธ" />
              <StepItem number={4} text="คำขอจะถูกส่งต่อไป HR อัตโนมัติ" />
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="accounting-flow" className="border rounded-lg px-4 mb-3 shadow-sm">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <span className="font-medium">อนุมัติจ่ายเงิน (Accounting)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-3 pt-2">
              <StepItem number={1} text="เข้าเมนู 'อนุมัติบัญชี' ดูรายการที่ผ่าน HR แล้ว" />
              <StepItem number={2} text="ตรวจสอบจำนวนเงิน PDF และเอกสารประกอบ" />
              <StepItem number={3} text="คลิก 'อนุมัติ' เพื่อยืนยันการจ่ายเงิน" />
              <StepItem number={4} text="สถานะจะเปลี่ยนเป็น 'เสร็จสิ้น'" />
            </ol>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>

    {/* Reference */}
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
      <p className="text-gray-700 text-sm">
        <strong>สิทธิ์พนักงานทั่วไป:</strong> คุณสามารถเบิกสวัสดิการและเบิกเงินทดลองได้เช่นเดียวกับพนักงานทั่วไป ดูรายละเอียดได้ที่แท็บ 'พนักงานทั่วไป'
      </p>
    </div>
  </div>
);

// ======== FAQ Section ========
const FAQSection = () => (
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value="faq-1" className="border rounded-lg px-4 mb-3 shadow-sm">
      <AccordionTrigger className="hover:no-underline">
        <span className="font-medium text-left">เบิกสวัสดิการแล้วเงินจะเข้าเมื่อไหร่?</span>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-gray-600">
          หลังจากคำขอผ่านการอนุมัติครบทุกขั้นตอน (หัวหน้า → HR → บัญชี) ฝ่ายบัญชีจะดำเนินการจ่ายเงินตามรอบการจ่ายของบริษัท
        </p>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="faq-2" className="border rounded-lg px-4 mb-3 shadow-sm">
      <AccordionTrigger className="hover:no-underline">
        <span className="font-medium text-left">ค่าแว่นกับค่ารักษาทัตกรรม ใช้วงเงินร่วมกันหรือไม่?</span>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-gray-600">
          ใช่ ค่าตัดแว่นสายตา (glasses) และค่ารักษาทัตกรรม (dental) ใช้วงเงินร่วมกัน 2,000 บาท ต่อปี หากเบิกค่าแว่นไปแล้ว 1,500 บาท จะเหลือเบิกค่ารักษาทัตกรรมได้อีก 500 บาท
        </p>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="faq-3" className="border rounded-lg px-4 mb-3 shadow-sm">
      <AccordionTrigger className="hover:no-underline">
        <span className="font-medium text-left">คำขอถูกปฏิเสธ ต้องทำอย่างไร?</span>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-gray-600">
          หากคำขอถูกปฏิเสธ จะมีเหตุผลแจ้งในระบบ คุณสามารถแก้ไขข้อมูลตามเหตุผลที่แจ้ง แล้วส่งคำขอใหม่ได้ วงเงินจะไม่ถูกหักจนกว่าคำขอจะได้รับการอนุมัติเสร็จสิ้น
        </p>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="faq-5" className="border rounded-lg px-4 mb-3 shadow-sm">
      <AccordionTrigger className="hover:no-underline">
        <span className="font-medium text-left">เบิกเงินทดลองแล้วต้องเคลียร์เมื่อไหร่?</span>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-gray-600">
          หลังจากเสร็จสิ้นภารกิจ ให้ทำ "ปรับปรุงค่าใช้จ่าย" โดยเร็วที่สุด โดยอ้างอิงเลขที่ใบเบิกเงินทดลอง แนบใบเสร็จ/หลักฐานการจ่ายเงินจริง
        </p>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="faq-6" className="border rounded-lg px-4 mb-3 shadow-sm">
      <AccordionTrigger className="hover:no-underline">
        <span className="font-medium text-left">ยอดเกิน 10,000 บาท ต้องทำอย่างไรเพิ่มเติม?</span>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-gray-600">
          คำขอที่มียอดเกิน 10,000 บาท จะต้องผ่านการอนุมัติโดย กรรมการผู้จัดการจากผู้บริหาร (กรรมการผู้จัดการ) เพิ่มเติม โดยระบบจะส่งคำขอไปอัตโนมัติ ไม่ต้องดำเนินการเพิ่มเติม
        </p>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="faq-7" className="border rounded-lg px-4 mb-3 shadow-sm">
      <AccordionTrigger className="hover:no-underline">
        <span className="font-medium text-left">Login ไม่ได้ ทำอย่างไร?</span>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-gray-600">
          ระบบใช้ Microsoft Account ของบริษัทในการ Login หากเข้าไม่ได้ ให้ตรวจสอบว่าใช้อีเมล @icpladda.com ถูกต้อง หากยังมีปัญหา ให้ติดต่อฝ่าย IT Support
        </p>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

// ======== Helper Components ========
const BudgetItem = ({ label, amount, note }: { label: string; amount: string; note?: string }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="flex items-center gap-2">
      <span className="font-semibold text-[#004F9F]">{amount} บาท</span>
      {note && <span className="text-xs text-gray-500">({note})</span>}
    </div>
  </div>
);

const StepItem = ({ number, text }: { number: number; text: string }) => (
  <li className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#004F9F]/10 text-[#004F9F] flex items-center justify-center text-xs font-bold">
      {number}
    </span>
    <span className="text-sm text-gray-700">{text}</span>
  </li>
);

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-2">
    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
    <span className="text-sm text-gray-700">{text}</span>
  </li>
);

const StatusStep = ({ label, color }: { label: string; color: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-4 h-4 rounded-full ${color}`}></div>
    <span className="text-xs text-gray-600 whitespace-nowrap">{label}</span>
  </div>
);

const StatusArrow = () => (
  <div className="hidden md:block w-8 h-0.5 bg-gray-300 mx-1"></div>
);

export default UserGuidePage;
