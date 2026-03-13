import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Clock } from 'lucide-react';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useRecentlyVisited } from '@/hooks/useRecentlyVisited';
import { getItemById } from '@/config/menuRegistry';

export function CommandPalette() {
  const navigate = useNavigate();
  const { isOpen, setIsOpen, query, setQuery, groupedResults } = useCommandPalette();
  const { recentVisits } = useRecentlyVisited();

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  }, [navigate, setIsOpen, setQuery]);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="ค้นหาเมนู..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>ไม่พบเมนูที่ค้นหา</CommandEmpty>

        {/* Recently Visited - show only when no query */}
        {!query.trim() && recentVisits.length > 0 && (
          <>
            <CommandGroup heading="เข้าล่าสุด">
              {recentVisits.map(visit => {
                const menuItem = getItemById(visit.itemId);
                const Icon = menuItem?.icon;
                return (
                  <CommandItem
                    key={`recent_${visit.path}`}
                    value={`recent_${visit.label}`}
                    onSelect={() => handleSelect(visit.path)}
                  >
                    {Icon ? <Icon className="mr-2 h-4 w-4 text-gray-400" /> : <Clock className="mr-2 h-4 w-4 text-gray-400" />}
                    <span>{visit.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Menu items grouped by section */}
        {groupedResults.map(group => (
          <CommandGroup key={group.sectionId} heading={group.sectionLabel}>
            {group.items.map(item => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => handleSelect(item.path)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
