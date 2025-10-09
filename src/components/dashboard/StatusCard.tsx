import { StatusType } from "@/types/database.types";
import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  count: number;
  status: StatusType;
  icon: React.ReactNode;
}

export function StatusCard({ title, count, status, icon }: StatusCardProps) {
  const getColorsByStatus = () => {
    switch (status) {
      case 'pending_manager':
      case 'pending_hr':
      case 'pending_accounting':
        return {
          gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
          textLight: 'text-orange-100',
          iconBg: 'bg-yellow-400/30'
        };
      case 'completed':
        return {
          gradient: 'bg-gradient-to-br from-green-500 to-green-600',
          textLight: 'text-green-100',
          iconBg: 'bg-green-400/30'
        };
      case 'rejected_manager':
      case 'rejected_hr':
      case 'rejected_accounting':
      case 'rejected_special_approval': 
        return {
          gradient: 'bg-gradient-to-br from-red-500 to-red-600',
          textLight: 'text-red-100',
          iconBg: 'bg-red-400/30'
        };
      default:
        return {
          gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
          textLight: 'text-blue-100',
          iconBg: 'bg-blue-400/30'
        };
    }
  };

  const colors = getColorsByStatus();

  return (
    <Card className={`${colors.gradient} border-0 text-white shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`${colors.textLight} text-sm font-medium`}>{title}</p>
            <p className="text-2xl font-bold">{count}</p>
            <p className={`text-xs ${colors.textLight}`}>รายการ</p>
          </div>
          <div className={`${colors.iconBg} p-3 rounded-full`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
