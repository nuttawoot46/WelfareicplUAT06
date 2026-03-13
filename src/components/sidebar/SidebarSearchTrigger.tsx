import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarSearchTriggerProps {
  isExpanded: boolean;
  onClick: () => void;
}

export function SidebarSearchTrigger({ isExpanded, onClick }: SidebarSearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mx-3 my-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-400 rounded-lg border border-gray-200 hover:border-gray-300 hover:text-gray-500 transition-colors duration-200 bg-gray-50/50',
        !isExpanded && 'justify-center mx-2 px-2'
      )}
    >
      <Search className="h-4 w-4 flex-shrink-0" />
      {isExpanded && (
        <>
          <span className="flex-1 text-left">ค้นหาเมนู...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </>
      )}
    </button>
  );
}
