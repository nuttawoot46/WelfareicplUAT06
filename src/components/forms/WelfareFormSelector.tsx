
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WelfareType } from '@/types';
import { cn } from '@/lib/utils';

interface WelfareOption {
  id: WelfareType;
  title: string;
  description: string;
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

export function WelfareFormSelector({ onSelect }: WelfareFormSelectorProps) {
  const [selected, setSelected] = useState<WelfareType | null>(null);

  const welfareOptions: WelfareOption[] = [
    {
      id: 'wedding',
      title: 'ค่าแต่งงาน',
      description: 'สำหรับพนักงานที่กำลังจะแต่งงาน',
      icon: <WeddingIcon />,
      color: 'text-welfare-blue',
    },
    {
      id: 'training',
      title: 'ค่าอบรม',
      description: 'ค่าใช้จ่ายในการเข้าอบรมหลักสูตรต่างๆ',
      icon: <TrainingIcon />,
      color: 'text-welfare-teal',
    },
    {
      id: 'childbirth',
      title: 'ค่าคลอดบุตร',
      description: 'สำหรับพนักงานที่มีบุตร',
      icon: <ChildbirthIcon />,
      color: 'text-welfare-pink',
    },
    {
      id: 'funeral',
      title: 'ค่าช่วยเหลืองานศพ',
      description: 'สำหรับงานศพญาติสายตรง',
      icon: <FuneralIcon />,
      color: 'text-welfare-purple',
    },
    {
      id: 'glasses',
      title: 'ค่าตัดแว่น',
      description: 'ค่าแว่นตาหรือคอนแทคเลนส์',
      icon: <GlassesIcon />,
      color: 'text-welfare-blue',
    },
    {
      id: 'dental',
      title: 'ค่าทำฟัน',
      description: 'ค่ารักษาทางทันตกรรม',
      icon: <DentalIcon />,
      color: 'text-welfare-orange',
    },
    {
      id: 'fitness',
      title: 'ค่าออกกำลังกาย',
      description: 'ค่าสมาชิกฟิตเนสหรืออุปกรณ์กีฬา',
      icon: <FitnessIcon />,
      color: 'text-welfare-green',
    },
  ];

  const handleSelect = (type: WelfareType) => {
    setSelected(type);
    onSelect(type);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">เลือกประเภทสวัสดิการ</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {welfareOptions.map((option) => (
          <Card 
            key={option.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg border-l-4",
              selected === option.id 
                ? "ring-2 ring-primary ring-offset-2" 
                : "hover:-translate-y-1",
              `border-l-welfare-${option.id === 'wedding' ? 'blue' : 
                option.id === 'training' ? 'teal' :
                option.id === 'childbirth' ? 'pink' :
                option.id === 'funeral' ? 'purple' :
                option.id === 'glasses' ? 'blue' :
                option.id === 'dental' ? 'orange' : 'green'}`
            )}
            onClick={() => handleSelect(option.id)}
          >
            <CardHeader className="pb-2">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", option.color, "bg-gray-100")}>
                {option.icon}
              </div>
              <CardTitle className="mt-4">{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                variant="ghost" 
                className={option.color}
                onClick={() => handleSelect(option.id)}
              >
                เลือก
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
