import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WelfareType } from '@/types';
import { cn } from '@/lib/utils';
import { useWelfare } from '@/context/WelfareContext';
import { useAuth } from '@/context/AuthContext';
import { BenefitLimit, getBenefitLimits } from '@/services/welfareApi';
import { getFormVisibility, FormVisibility } from '@/services/formVisibilityApi';

interface WelfareOption {
  id: WelfareType;
  title: string;
  description?: string | React.ReactNode;
  icon: JSX.Element;
  color: string;
}

interface WelfareFormSelectorProps {
  onSelect: (type: WelfareType) => void;
}

// Icons for welfare types
const WeddingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
    <path d="M8 12a4 4 0 0 1 8 0"/>
    <path d="M9 9h.01"/>
    <path d="M15 9h.01"/>
  </svg>
);

const TrainingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
);

const ChildbirthIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12h.01"/>
    <path d="M15 12h.01"/>
    <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
    <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 5 3.3"/>
  </svg>
);

const FuneralIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8c0 4.5-6 9-6 9s-6-4.5-6-9a6 6 0 0 1 12 0"/>
    <path d="M14 8a2 2 0 0 1-4 0 2 2 0 0 1 4 0"/>
  </svg>
);

const GlassesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="14" r="4"/>
    <circle cx="18" cy="14" r="4"/>
    <path d="M10 14h4"/>
  </svg>
);

const DentalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 3h.01"/>
    <path d="M13 3h.01"/>
    <path d="M11 7h.01"/>
    <path d="M13 7h.01"/>
    <path d="M11 11h.01"/>
    <path d="M13 11h.01"/>
    <path d="M11 15h.01"/>
    <path d="M13 15h.01"/>
    <path d="M2 14h.01"/>
    <path d="M22 14h.01"/>
    <path d="M7 14h10"/>
    <path d="M20 14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-7"/>
    <path d="M4 14a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h7"/>
  </svg>
);

const FitnessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M12 11v5"/>
    <path d="M9 14h6"/>
    <path d="M15 4v4H9V4"/>
  </svg>
);

const InternalTrainingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M12 11h4"/>
    <path d="M12 16h4"/>
    <path d="M8 11h.01"/>
    <path d="M8 16h.01"/>
  </svg>
);

const EmploymentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);



export function WelfareFormSelector({ onSelect }: WelfareFormSelectorProps) {
  const [selected, setSelected] = useState<WelfareType | null>(null);
  const [benefitLimits, setBenefitLimits] = useState<BenefitLimit[]>([]);
  const [visibilitySettings, setVisibilitySettings] = useState<FormVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { getChildbirthCount, getFuneralUsedTypes } = useWelfare();

  // เฉพาะ admin, manager, accountingandmanager เท่านั้นที่เห็นเมนูขออนุมัติจ้างงาน
  const canAccessEmploymentApproval = ['admin', 'manager', 'accountingandmanager'].includes(
    profile?.role?.toLowerCase() || ''
  );

  // ดึงข้อมูลยอดเงินคงเหลือและการแสดงฟอร์ม
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [limits, visibility] = await Promise.all([
          getBenefitLimits(),
          getFormVisibility()
        ]);
        setBenefitLimits(limits);
        setVisibilitySettings(visibility);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ฟังก์ชันตรวจสอบอายุงาน (180 วัน)
  const getWorkDuration = (): number => {
    if (!profile?.start_date) return 0;
    
    const startDate = new Date(profile.start_date);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // ตรวจสอบว่าฟอร์มถูกซ่อนโดย admin หรือไม่
  const isFormVisibleByAdmin = (type: WelfareType): boolean => {
    const setting = visibilitySettings.find(s => s.form_type === type);
    return setting?.is_visible ?? true;
  };

  // ฟังก์ชันตรวจสอบว่าประเภทสวัสดิการสามารถเลือกได้หรือไม่
  const isWelfareTypeAvailable = (type: WelfareType): { available: boolean; reason?: string } => {
    // ตรวจสอบว่าฟอร์มถูกซ่อนโดย admin หรือไม่
    if (!isFormVisibleByAdmin(type)) {
      return { available: false, reason: 'ฟอร์มนี้ถูกปิดใช้งานชั่วคราว' };
    }

    // Exclude accounting types from welfare forms
    if (type === 'advance' || type === 'expense-clearing') {
      return { available: false, reason: 'ใช้ฟอร์มบัญชีแทน' };
    }
    
    // Training, Internal Training และ Employment Approval สามารถเลือกได้ตลอด (ไม่มีข้อจำกัดอายุงานหรืองบประมาณ)
    if (type === 'training' || type === 'internal_training' || type === 'employment-approval') {
      return { available: true };
    }

    // สำหรับค่าช่วยเหลืองานศพ ตรวจสอบว่ายังมีประเภทที่ใช้ได้หรือไม่
    if (type === 'funeral' && profile?.employee_id) {
      const funeralInfo = getFuneralUsedTypes(String(profile.employee_id));
      if (funeralInfo.availableTypes.length === 0) {
        return {
          available: false,
          reason: 'ใช้สิทธิ์ครบทุกประเภทแล้ว'
        };
      }
      return { available: true };
    }

    // ประเภทที่ต้องตรวจสอบอายุงาน 180 วัน
    const workDurationRestrictedTypes: WelfareType[] = ['glasses', 'dental', 'wedding', 'childbirth'];
    
    if (workDurationRestrictedTypes.includes(type)) {
      const workDays = getWorkDuration();
      if (workDays < 180) {
        return {
          available: false,
          reason: `ต้องทำงานครบ 180 วัน (ปัจจุบัน ${workDays} วัน)`
        };
      }
    }

    // สำหรับค่าคลอดบุตร ตรวจสอบจำนวนบุตรคงเหลือแทนวงเงิน
    if (type === 'childbirth' && profile?.employee_id) {
      const childbirthInfo = getChildbirthCount(String(profile.employee_id));
      if (childbirthInfo.remaining <= 0) {
        return {
          available: false,
          reason: 'เบิกครบ 3 คนแล้ว'
        };
      }
      return { available: true };
    }

    // ตรวจสอบยอดเงินคงเหลือ
    const limit = benefitLimits.find(limit => limit.type === type);
    if (!limit || limit.remaining <= 0) {
      return {
        available: false,
        reason: 'เงินคงเหลือหมด'
      };
    }

    return { available: true };
  };

  // ฟังก์ชันดึงข้อมูลยอดเงินคงเหลือสำหรับแสดงผล
  const getRemainingAmount = (type: WelfareType): number => {
    // Exclude accounting types
    if (type === 'advance' || type === 'expense-clearing') {
      return 0;
    }
    
    // สำหรับ glasses และ dental ใช้ budget_dentalglasses ร่วมกัน
    if (type === 'glasses' || type === 'dental') {
      const limit = benefitLimits.find(limit => limit.type === 'dental');
      return limit ? limit.remaining : (profile?.budget_dentalglasses ?? 0);
    }
    
    const limit = benefitLimits.find(limit => limit.type === type);
    return limit ? limit.remaining : 0;
  };

  // ฟังก์ชันดึงข้อมูลยอดเงินที่ใช้ไปแล้วสำหรับแสดงผล
  const getUsedAmount = (type: WelfareType): number => {
    // Exclude accounting types
    if (type === 'advance' || type === 'expense-clearing') {
      return 0;
    }
    
    // สำหรับ glasses และ dental ใช้ budget_dentalglasses ร่วมกัน
    if (type === 'glasses' || type === 'dental') {
      const limit = benefitLimits.find(limit => limit.type === 'dental');
      return limit ? limit.used : 0;
    }
    
    const limit = benefitLimits.find(limit => limit.type === type);
    return limit ? limit.used : 0;
  };

  // ฟังก์ชันสร้างข้อความแสดงยอดเงิน
  const getBudgetDescription = (type: WelfareType): string | React.ReactNode => {
    if (type === 'internal_training') {
      return 'สำหรับการขออนุมัติจัดอบรมภายในองค์กร';
    }

    if (type === 'employment-approval') {
      return 'สำหรับการขออนุมัติจ้างพนักงานใหม่หรือทดแทนตำแหน่ง';
    }

    // สำหรับค่าช่วยเหลืองานศพ ไม่แสดงรายละเอียด
    if (type === 'funeral') {
      return '';
    }

    // สำหรับค่าคลอดบุตร แสดงจำนวนบุตรคงเหลือแทนวงเงิน
    if (type === 'childbirth' && profile?.employee_id) {
      const childbirthInfo = getChildbirthCount(String(profile.employee_id));
      return `เบิกไปแล้ว: ${childbirthInfo.total} คน | คงเหลือ: ${childbirthInfo.remaining} คน (สูงสุด 3 คน)`;
    }

    const remaining = getRemainingAmount(type);
    const used = getUsedAmount(type);

    // สำหรับ glasses และ dental เพิ่มข้อความอธิบายว่าใช้วงเงินเดียวกัน
    if (type === 'glasses' || type === 'dental') {
      return (
        <>
          ใช้ไป: {used.toLocaleString()} บาท | คงเหลือ: {remaining.toLocaleString()} บาท{' '}
          <span className="text-red-500 font-bold">(ค่าตัดแว่นสายตาและค่ารักษาทัตกรรมใช้วงเงินเดียวกัน)</span>
        </>
      );
    }

    // สำหรับค่าออกกำลังกาย เพิ่มข้อความว่าคงเหลือต่อเดือน
    if (type === 'fitness') {
      return `ใช้ไป: ${used.toLocaleString()} บาท | คงเหลือ: ${remaining.toLocaleString()} บาท/เดือน`;
    }

    return `ใช้ไป: ${used.toLocaleString()} บาท | คงเหลือ: ${remaining.toLocaleString()} บาท`;
  };

  // Welfare forms only (exclude employment-approval)
  const welfareOptions: WelfareOption[] = [
    {
      id: 'training',
      title: 'ค่าอบรม',
      description: getBudgetDescription('training'),
      icon: <TrainingIcon />,
      color: 'text-welfare-teal',
    },
    {
      id: 'glasses',
      title: 'ค่าตัดแว่นสายตา',
      description: getBudgetDescription('glasses'),
      icon: <GlassesIcon />,
      color: 'text-welfare-blue',
    },
    {
      id: 'dental',
      title: 'ค่ารักษาทัตกรรม',
      description: getBudgetDescription('dental'),
      icon: <DentalIcon />,
      color: 'text-welfare-orange',
    },
    {
      id: 'fitness',
      title: 'ค่าออกกำลังกาย',
      description: getBudgetDescription('fitness'),
      icon: <FitnessIcon />,
      color: 'text-welfare-green',
    },
    {
      id: 'medical',
      title: 'ของเยี่ยมกรณีเจ็บป่วย',
      description: getBudgetDescription('medical'),
      icon: <img src="/Icon/medical_icon.png" alt="Medical Icon" style={{ width: 24, height: 24 }} />,
      color: 'text-welfare-red',
    },
    {
      id: 'wedding',
      title: 'สวัสดิการงานสมรส',
      description: getBudgetDescription('wedding'),
      icon: <WeddingIcon />,
      color: 'text-welfare-blue',
    },
    {
      id: 'childbirth',
      title: 'ค่าคลอดบุตร',
      description: getBudgetDescription('childbirth'),
      icon: <ChildbirthIcon />,
      color: 'text-welfare-pink',
    },
    {
      id: 'funeral',
      title: 'ค่าช่วยเหลืองานศพ',
      description: getBudgetDescription('funeral'),
      icon: <FuneralIcon />,
      color: 'text-welfare-purple',
    },
    {
      id: 'internal_training',
      title: 'อบรมภายใน',
      description: getBudgetDescription('internal_training'),
      icon: <InternalTrainingIcon />,
      color: 'text-welfare-indigo',
    },
  ];

  // Employment approval forms
  const employmentOptions: WelfareOption[] = [
    {
      id: 'employment-approval',
      title: 'ขออนุมัติการจ้างงาน',
      description: 'สำหรับการขออนุมัติจ้างพนักงานใหม่หรือทดแทนตำแหน่ง',
      icon: <EmploymentIcon />,
      color: 'text-blue-600',
    },
  ];

  const handleSelect = (type: WelfareType) => {
    // ตรวจสอบว่าสามารถเลือกได้หรือไม่
    const availability = isWelfareTypeAvailable(type);
    if (!availability.available) {
      return; // ไม่ให้เลือกถ้าไม่ผ่านเงื่อนไข
    }
    
    setSelected(type);
    onSelect(type);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">เลือกประเภทสวัสดิการและอบรม</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div className="h-4 bg-gray-200 rounded mt-4"></div>
                <div className="h-3 bg-gray-200 rounded mt-2"></div>
              </CardHeader>
              <CardFooter>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const visibleWelfareOptions = welfareOptions.filter(option => isFormVisibleByAdmin(option.id));
  const visibleEmploymentOptions = employmentOptions.filter(option => isFormVisibleByAdmin(option.id));

  // แสดง Tab ขออนุมัติจ้างงาน เฉพาะเมื่อ: 1) มีสิทธิ์ตาม role และ 2) มี form ที่แสดงได้
  const showEmploymentTab = canAccessEmploymentApproval && visibleEmploymentOptions.length > 0;

  const renderFormCards = (options: WelfareOption[]) => {
    if (options.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            ไม่มีฟอร์มที่สามารถใช้งานได้ในขณะนี้
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((option) => {
          const availability = isWelfareTypeAvailable(option.id);
          const isDisabled = !availability.available;
          
          return (
            <Card 
              key={option.id}
              className={cn(
                "transition-all border-l-4",
                isDisabled 
                  ? "opacity-50 cursor-not-allowed" 
                  : "cursor-pointer hover:shadow-lg",
                selected === option.id 
                  ? "ring-2 ring-primary ring-offset-2" 
                  : !isDisabled && "hover:-translate-y-1",
                `border-l-welfare-${option.id === 'wedding' ? 'blue' : 
                  option.id === 'training' ? 'blue' :
                  option.id === 'childbirth' ? 'blue' :
                  option.id === 'funeral' ? 'blue' :
                  option.id === 'glasses' ? 'blue' :
                  option.id === 'dental' ? 'blue' :
                  option.id === 'fitness' ? 'blue' :
                  option.id === 'medical' ? 'blue' :
                  option.id === 'internal_training' ? 'blue' : 'blue'}`
              )}
              onClick={() => !isDisabled && handleSelect(option.id)}
            >
              <CardHeader className="pb-2">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center", 
                  isDisabled ? "bg-gray-200 text-gray-400" : cn(option.color, "bg-gray-100")
                )}>
                  {option.icon}
                </div>
                <CardTitle className={cn("mt-4", isDisabled && "text-gray-400")}>
                  {option.title}
                </CardTitle>
                <CardDescription className={cn("text-base", isDisabled && "text-gray-400")}>
                  {option.description}
                  {isDisabled && (
                    <span className="block text-red-500 text-sm mt-1">
                      ไม่สามารถเลือกได้ ({availability.reason})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className={cn(
                    isDisabled ? "text-gray-400 cursor-not-allowed" : option.color
                  )}
                  onClick={() => !isDisabled && handleSelect(option.id)}
                  disabled={isDisabled}
                >
                  {isDisabled ? "ไม่สามารถเลือกได้" : "เลือก"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">เลือกประเภท</h1>
      
      <Tabs defaultValue="welfare" className="w-full">
        <TabsList className={cn("grid w-full mb-6 bg-gray-100 border border-gray-200 p-1.5 rounded-xl h-auto", showEmploymentTab ? "grid-cols-2" : "grid-cols-1")}>
          <TabsTrigger
            value="welfare"
            className="rounded-lg border border-transparent bg-white/60 text-gray-600 font-semibold text-base py-3 shadow-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 transition-all"
          >
            สวัสดิการ
          </TabsTrigger>
          {showEmploymentTab && (
            <TabsTrigger
              value="employment"
              className="rounded-lg border border-transparent bg-white/60 text-gray-600 font-semibold text-base py-3 shadow-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-emerald-600 transition-all"
            >
              ขออนุมัติจ้างงาน
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="welfare">
          {renderFormCards(visibleWelfareOptions)}
        </TabsContent>

        {showEmploymentTab && (
          <TabsContent value="employment">
            {renderFormCards(visibleEmploymentOptions)}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
