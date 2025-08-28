import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WelfareType } from '@/types';
import { cn } from '@/lib/utils';
import { useWelfare } from '@/context/WelfareContext';
import { useAuth } from '@/context/AuthContext';
import { BenefitLimit, getBenefitLimits } from '@/services/welfareApi';

interface WelfareOption {
  id: WelfareType;
  title: string;
  description?: string;
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

const AdvanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 9v6"/>
    <path d="M9 12h6"/>
  </svg>
);

export function WelfareFormSelector({ onSelect }: WelfareFormSelectorProps) {
  const [selected, setSelected] = useState<WelfareType | null>(null);
  const [benefitLimits, setBenefitLimits] = useState<BenefitLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { getRemainingBudget } = useWelfare();

  // ดึงข้อมูลยอดเงินคงเหลือ
  useEffect(() => {
    const fetchBenefitLimits = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const limits = await getBenefitLimits();
        setBenefitLimits(limits);
      } catch (error) {
        console.error('Error fetching benefit limits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBenefitLimits();
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

  // ฟังก์ชันตรวจสอบว่าประเภทสวัสดิการสามารถเลือกได้หรือไม่
  const isWelfareTypeAvailable = (type: WelfareType): { available: boolean; reason?: string } => {
    // Training, Internal Training และ Advance สามารถเลือกได้ตลอด (ไม่มีข้อจำกัดอายุงานหรืองบประมาณ)
    if (type === 'training' || type === 'internal_training' || type === 'advance') {
      return { available: true };
    }
    
    // ประเภทที่ต้องตรวจสอบอายุงาน 180 วัน
    const workDurationRestrictedTypes: WelfareType[] = ['glasses', 'dental', 'fitness'];
    
    if (workDurationRestrictedTypes.includes(type)) {
      const workDays = getWorkDuration();
      if (workDays < 180) {
        return { 
          available: false, 
          reason: `ต้องทำงานครบ 180 วัน (ปัจจุบัน ${workDays} วัน)` 
        };
      }
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
    // สำหรับ glasses และ dental ใช้ budget_dentalglasses ร่วมกัน
    if (type === 'glasses' || type === 'dental') {
      const limit = benefitLimits.find(limit => limit.type === 'dental');
      return limit ? limit.remaining : (profile?.budget_dentalglasses ?? 0);
    }
    
    const limit = benefitLimits.find(limit => limit.type === type);
    return limit ? limit.remaining : 0;
  };

  const welfareOptions: WelfareOption[] = [
    {
      id: 'wedding',
      title: 'สวัสดิการงานสมรส',
      description: `คงเหลือ: ${getRemainingAmount('wedding').toLocaleString()} บาท`,
      icon: <WeddingIcon />,
      color: 'text-welfare-blue',
    },
    {
      id: 'training',
      title: 'ค่าอบรม',
      description: `คงเหลือ: ${getRemainingAmount('training').toLocaleString()} บาท`,
      icon: <TrainingIcon />,
      color: 'text-welfare-teal',
    },
    {
      id: 'childbirth',
      title: 'ค่าคลอดบุตร',
      description: `คงเหลือ: ${getRemainingAmount('childbirth').toLocaleString()} บาท`,
      icon: <ChildbirthIcon />,
      color: 'text-welfare-pink',
    },
    {
      id: 'funeral',
      title: 'ค่าช่วยเหลืองานศพ',
      description: `คงเหลือ: ${getRemainingAmount('funeral').toLocaleString()} บาท`,
      icon: <FuneralIcon />,
      color: 'text-welfare-purple',
    },
    {
      id: 'glasses',
      title: 'ค่าตัดแว่น',
      description: `คงเหลือ: ${getRemainingAmount('glasses').toLocaleString()} บาท`,
      icon: <GlassesIcon />,
      color: 'text-welfare-blue',
    },
    {
      id: 'dental',
      title: 'ค่าทำฟัน',
      description: `คงเหลือ: ${getRemainingAmount('dental').toLocaleString()} บาท`,
      icon: <DentalIcon />,
      color: 'text-welfare-orange',
    },
    {
      id: 'fitness',
      title: 'ค่าออกกำลังกาย',
      description: `คงเหลือ: ${getRemainingAmount('fitness').toLocaleString()} บาท`,
      icon: <FitnessIcon />,
      color: 'text-welfare-green',
    },
    {
      id: 'medical',
      title: 'ของเยี่ยมกรณีเจ็บป่วย',
      description: `คงเหลือ: ${getRemainingAmount('medical').toLocaleString()} บาท`,
      icon: <img src="/Icon/medical_icon.png" alt="Medical Icon" style={{ width: 24, height: 24 }} />,
      color: 'text-welfare-red',
    },
    {
      id: 'internal_training',
      title: 'อบรมภายใน',
      description: 'สำหรับการขออนุมัติจัดอบรมภายในองค์กร',
      icon: <InternalTrainingIcon />,
      color: 'text-welfare-indigo',
    },
    {
      id: 'advance',
      title: 'เบิกเงินทดลอง',
      description: 'สำหรับการขออนุมัติเบิกเงินทดลองสำหรับภารกิจต่างๆ',
      icon: <AdvanceIcon />,
      color: 'text-welfare-cyan',
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

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">เลือกประเภทสวัสดิการและอบรม</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {welfareOptions.map((option) => {
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
                  option.id === 'training' ? 'teal' :
                  option.id === 'childbirth' ? 'pink' :
                  option.id === 'funeral' ? 'purple' :
                  option.id === 'glasses' ? 'blue' :
                  option.id === 'dental' ? 'orange' :
                  option.id === 'fitness' ? 'green' :
                  option.id === 'medical' ? 'red' :
                  option.id === 'internal_training' ? 'indigo' : 
                  option.id === 'advance' ? 'cyan' : 'blue'}`
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
                <CardDescription className={cn(isDisabled && "text-gray-400")}>
                  {option.description}
                  {isDisabled && (
                    <span className="block text-red-500 text-xs mt-1">
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
    </div>
  );
}
