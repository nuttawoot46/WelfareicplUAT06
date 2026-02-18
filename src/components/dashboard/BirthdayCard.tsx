import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Cake } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeBirthday {
  name: string;
  team: string;
  day: number;
  isToday: boolean;
}

export function BirthdayCard() {
  const [birthdays, setBirthdays] = useState<EmployeeBirthday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasColumn, setHasColumn] = useState(true);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('Employee')
          .select('Name, date_of_birth, Team')
          .not('date_of_birth', 'is', null);

        if (error) {
          // Column may not exist yet
          if (error.message?.includes('date_of_birth') || error.code === '42703') {
            setHasColumn(false);
          }
          console.error('Error fetching birthdays:', error);
          return;
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        const thisMonthBirthdays = (data || [])
          .filter((emp: any) => {
            if (!emp.date_of_birth) return false;
            const dob = new Date(emp.date_of_birth);
            return dob.getMonth() === currentMonth;
          })
          .map((emp: any) => {
            const dob = new Date(emp.date_of_birth);
            return {
              name: emp.Name || 'ไม่ระบุชื่อ',
              team: emp.Team || '',
              day: dob.getDate(),
              isToday: dob.getDate() === currentDay,
            };
          })
          .sort((a, b) => a.day - b.day);

        setBirthdays(thisMonthBirthdays);
      } catch (error) {
        console.error('Error loading birthdays:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBirthdays();
  }, []);

  const monthName = new Date().toLocaleDateString('th-TH', { month: 'long' });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Cake className="h-5 w-5 text-pink-500" />
          วันเกิดพนักงานเดือน{monthName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasColumn ? (
          <p className="text-center text-sm text-gray-500 py-4">
            ยังไม่มีข้อมูลวันเกิดในระบบ
          </p>
        ) : birthdays.length > 0 ? (
          <div className="space-y-3">
            {birthdays.map((emp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-semibold text-sm">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {emp.name}
                      {emp.isToday && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                          วันนี้!
                        </span>
                      )}
                    </p>
                    {emp.team && (
                      <p className="text-xs text-gray-500">{emp.team}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {emp.day} {monthName.substring(0, monthName.length > 6 ? 6 : monthName.length)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 py-4">
            ไม่มีพนักงานเกิดเดือนนี้
          </p>
        )}
      </CardContent>
    </Card>
  );
}
