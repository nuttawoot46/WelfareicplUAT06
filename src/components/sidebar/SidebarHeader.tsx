import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ isExpanded, onToggle }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2 px-4 border-b border-gray-100">
      <a
        href="/dashboard"
        className={cn(
          'flex items-center gap-2 transition-all duration-300 overflow-hidden',
          isExpanded ? 'w-auto' : 'w-12 justify-center'
        )}
      >
        <img
          src="/Picture/logo-Photoroom.jpg"
          alt="ICP Ladda"
          width="71"
          height="71"
          className="object-contain flex-shrink-0"
          style={{ width: '71px', height: '71px' }}
        />
        {isExpanded && (
          <>
            <div className="h-5 w-px bg-gray-300 flex-shrink-0" />
            <span className="text-lg font-bold tracking-tight text-[#004F9F]">Jinglebell</span>
          </>
        )}
      </a>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="hidden xl:flex text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-8 w-8"
      >
        {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}
