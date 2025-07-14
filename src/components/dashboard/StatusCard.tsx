import { cn } from "@/lib/utils";
import { StatusType } from "@/types";
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
      case 'pending':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          iconBg: 'bg-amber-100',
          darkBg: 'dark:bg-dark-glass dark:bg-opacity-40',
          darkText: 'dark:text-dark-yellow dark-text-high-contrast',
          darkBorder: 'dark:border-dark-yellow/30',
          darkIconBg: 'dark:bg-dark-yellow/10'
        };
      case 'approved':
        return {
          bg: 'bg-green-50',
          text: 'text-green-800',
          border: 'border-green-200',
          iconBg: 'bg-green-100',
          darkBg: 'dark:bg-dark-glass dark:bg-opacity-40',
          darkText: 'dark:text-dark-green dark-text-high-contrast',
          darkBorder: 'dark:border-dark-green/30',
          darkIconBg: 'dark:bg-dark-green/10'
        };
      case 'rejected':
        return {
          bg: 'bg-red-50',
          text: 'text-red-800',
          border: 'border-red-200',
          iconBg: 'bg-red-100',
          darkBg: 'dark:bg-dark-glass dark:bg-opacity-40',
          darkText: 'dark:text-dark-red dark-text-high-contrast',
          darkBorder: 'dark:border-dark-red/30',
          darkIconBg: 'dark:bg-dark-red/10'
        };
      default:
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-200',
          iconBg: 'bg-blue-100',
          darkBg: 'dark:bg-dark-glass dark:bg-opacity-40',
          darkText: 'dark:text-dark-blue dark-text-high-contrast',
          darkBorder: 'dark:border-dark-blue/30',
          darkIconBg: 'dark:bg-dark-blue/10'
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
