import { cn } from "@/lib/utils";
import { StatusType } from "@/types/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  count: number;
  status: StatusType;
  icon: React.ReactNode;
}

export function StatusCard({ title, count, status, icon }: StatusCardProps) {
  const getColorsByStatus = (): {
    bg: string;
    text: string;
    border: string;
    iconBg: string;
    darkBg: string;
    darkText: string;
    darkBorder: string;
    darkIconBg: string;
  } => {
    switch (status) {
      case 'pending_manager':
      case 'pending_hr':
      case 'pending_accounting':
        return {
          bg: 'bg-gradient-to-br from-orange-300 via-orange-300 to-yellow-200',
          text: 'text-orange-700',
          border: 'border-transparent',
          iconBg: 'bg-white/40',
          darkBg: 'dark:bg-gradient-to-br dark:from-orange-400 dark:via-orange-500 dark:to-yellow-400',
          darkText: 'dark:text-white',
          darkBorder: 'dark:border-transparent',
          darkIconBg: 'dark:bg-white/20'
        };
      case 'completed':
        return {
          bg: 'bg-gradient-to-br from-green-200 via-green-300 to-teal-200',
          text: 'text-green-800',
          border: 'border-transparent',
          iconBg: 'bg-white/40',
          darkBg: 'dark:bg-gradient-to-br dark:from-green-400 dark:via-green-500 dark:to-teal-400',
          darkText: 'dark:text-white',
          darkBorder: 'dark:border-transparent',
          darkIconBg: 'dark:bg-white/20'
        };
      case 'rejected_manager':
      case 'rejected_hr':
      case 'rejected_accounting':
        return {
          bg: 'bg-gradient-to-br from-red-500 via-red-0 to-pink-0',
          text: 'text-red-800',
          border: 'border-transparent',
          iconBg: 'bg-white/40',
          darkBg: 'dark:bg-gradient-to-br dark:from-red-400 dark:via-red-500 dark:to-pink-400',
          darkText: 'dark:text-white',
          darkBorder: 'dark:border-transparent',
          darkIconBg: 'dark:bg-white/20'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-blue-200 via-blue-300 to-indigo-200',
          text: 'text-blue-800',
          border: 'border-transparent',
          iconBg: 'bg-white/40',
          darkBg: 'dark:bg-gradient-to-br dark:from-blue-400 dark:via-blue-500 dark:to-indigo-400',
          darkText: 'dark:text-white',
          darkBorder: 'dark:border-transparent',
          darkIconBg: 'dark:bg-white/20'
        };
    }
  };

  const colors = getColorsByStatus();

  return (
    <Card className={cn(
      "java-card overflow-hidden backdrop-blur-sm dark-glow",
      colors.bg,
      colors.border,
      colors.darkBg,
      colors.darkBorder
    )}>
      <CardHeader className="pb-2">
        <CardTitle className={cn(
          "text-lg font-medium flex items-center gap-2",
          colors.text,
          colors.darkText
        )}>
          <div className={cn(
            "p-2 rounded-md",
            colors.iconBg,
            colors.darkIconBg
          )}>
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline">
          <p className={cn(
            "text-3xl font-bold dark-value",
            colors.text,
            colors.darkText
          )}>{count}</p>
          <p className={cn(
            "ml-2 text-sm dark-text-medium-contrast",
            colors.text,
            colors.darkText
          )}>รายการ</p>
        </div>
      </CardContent>
    </Card>
  );
}
