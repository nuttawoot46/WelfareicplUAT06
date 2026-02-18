import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  count: number;
  status: string;
  icon: React.ReactNode;
  description?: string;
}

export function StatusCard({ title, count, status, icon, description }: StatusCardProps) {
  const getColorsByStatus = () => {
    switch (status) {
      case 'pending_manager':
        return {
          border: 'border-t-yellow-400',
          title: 'text-yellow-800',
          count: 'text-yellow-800',
          iconBg: 'bg-yellow-100 text-yellow-800',
        };
      case 'pending_hr':
        return {
          border: 'border-t-amber-400',
          title: 'text-amber-900',
          count: 'text-amber-900',
          iconBg: 'bg-amber-200 text-amber-900',
        };
      case 'pending_special_approval':
        return {
          border: 'border-t-amber-400',
          title: 'text-amber-900',
          count: 'text-amber-900',
          iconBg: 'bg-amber-200 text-amber-900',
        };
      case 'pending_accounting':
        return {
          border: 'border-t-amber-400',
          title: 'text-amber-900',
          count: 'text-amber-900',
          iconBg: 'bg-amber-200 text-amber-900',
        };
      case 'completed':
        return {
          border: 'border-t-green-400',
          title: 'text-green-800',
          count: 'text-green-800',
          iconBg: 'bg-green-100 text-green-800',
        };
      case 'rejected_manager':
      case 'rejected_hr':
      case 'rejected_accounting':
      case 'rejected_special_approval':
        return {
          border: 'border-t-red-400',
          title: 'text-red-800',
          count: 'text-red-800',
          iconBg: 'bg-red-100 text-red-800',
        };
      default:
        return {
          border: 'border-t-gray-400',
          title: 'text-gray-800',
          count: 'text-gray-800',
          iconBg: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const colors = getColorsByStatus();

  return (
    <Card className={`bg-white border-t-4 ${colors.border} shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-3 md:p-5 text-center">
        <div className="flex items-center justify-center mb-2">
          <div className={`${colors.iconBg} p-2 rounded-full`}>
            {icon}
          </div>
        </div>
        <p className={`${colors.title} text-xs font-semibold mb-1`}>{title}</p>
        <p className={`${colors.count} text-2xl md:text-3xl font-bold mb-1`}>{count}</p>
        <p className="text-xs text-muted-foreground">{description || 'รายการ'}</p>
      </CardContent>
    </Card>
  );
}
