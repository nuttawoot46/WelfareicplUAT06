import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SidebarMenuItem } from './SidebarMenuItem';
import { useSidebar } from '@/context/SidebarContext';
import { getItemById } from '@/config/menuRegistry';
import type { MenuItemDef } from '@/types/sidebar';

interface SidebarFavoritesSectionProps {
  isExpanded: boolean;
}

export function SidebarFavoritesSection({ isExpanded }: SidebarFavoritesSectionProps) {
  const { preferences } = useSidebar();

  const favoriteItems = useMemo(() => {
    return preferences.favoriteIds
      .map(id => getItemById(id))
      .filter((item): item is MenuItemDef => item !== undefined);
  }, [preferences.favoriteIds]);

  if (favoriteItems.length === 0) return null;

  const itemIds = favoriteItems.map(i => `fav_${i.id}`);

  return (
    <div className="mb-2">
      {isExpanded && (
        <div className="flex items-center gap-2 px-4 py-1.5">
          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">รายการโปรด</span>
        </div>
      )}

      <div className={isExpanded ? 'space-y-0.5' : 'space-y-1'}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {favoriteItems.map(item => (
            <SidebarMenuItem
              key={`fav_${item.id}`}
              item={item}
              isExpanded={isExpanded}
              isDraggable={false}
            />
          ))}
        </SortableContext>
      </div>

      {isExpanded && <div className="mx-4 my-2 border-b border-gray-100" />}
    </div>
  );
}
