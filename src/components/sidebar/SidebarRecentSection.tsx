import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { useRecentlyVisited } from '@/hooks/useRecentlyVisited';
import { getItemById } from '@/config/menuRegistry';

interface SidebarRecentSectionProps {
  isExpanded: boolean;
}

export function SidebarRecentSection({ isExpanded }: SidebarRecentSectionProps) {
  const { recentVisits } = useRecentlyVisited();
  const location = useLocation();

  if (!isExpanded || recentVisits.length === 0) return null;

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-4 py-1.5">
        <Clock className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">เข้าล่าสุด</span>
      </div>

      <div className="space-y-0.5">
        {recentVisits.map(visit => {
          const menuItem = getItemById(visit.itemId);
          const Icon = menuItem?.icon;
          const isActive = location.pathname === visit.path;

          return (
            <Link
              key={visit.path}
              to={visit.path}
              className={cn(
                'flex items-center gap-3 px-4 py-1.5 text-sm rounded-lg transition-colors duration-200',
                'text-gray-400 hover:text-gray-700 hover:bg-gray-50',
                isActive && 'text-gray-700 bg-gray-50'
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
              <span className="truncate text-xs">{visit.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mx-4 my-2 border-b border-gray-100" />
    </div>
  );
}
