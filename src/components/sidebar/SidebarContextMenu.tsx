import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { Star, StarOff, FolderPlus, ExternalLink } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import type { MenuItemDef } from '@/types/sidebar';

interface SidebarContextMenuProps {
  item: MenuItemDef;
}

export function SidebarContextMenuContent({ item }: SidebarContextMenuProps) {
  const { isFavorite, toggleFavorite, preferences, moveItemToGroup, removeItemFromGroup } = useSidebar();
  const fav = isFavorite(item.id);

  // หา group ที่ item อยู่ (ถ้ามี)
  const currentGroup = preferences.customGroups.find(g => g.itemIds.includes(item.id));

  return (
    <ContextMenuContent className="w-56">
      {/* Toggle Favorite */}
      <ContextMenuItem onClick={() => toggleFavorite(item.id)}>
        {fav ? (
          <>
            <StarOff className="mr-2 h-4 w-4" />
            ลบจากรายการโปรด
          </>
        ) : (
          <>
            <Star className="mr-2 h-4 w-4" />
            เพิ่มในรายการโปรด
          </>
        )}
      </ContextMenuItem>

      <ContextMenuSeparator />

      {/* Move to group */}
      {preferences.customGroups.length > 0 && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderPlus className="mr-2 h-4 w-4" />
            ย้ายไปกลุ่ม
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {preferences.customGroups.map(group => (
              <ContextMenuItem
                key={group.id}
                onClick={() => moveItemToGroup(item.id, group.id)}
              >
                <span
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                {group.label}
                {group.itemIds.includes(item.id) && (
                  <span className="ml-auto text-xs text-gray-400">อยู่แล้ว</span>
                )}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      )}

      {/* Remove from group */}
      {currentGroup && (
        <ContextMenuItem onClick={() => removeItemFromGroup(item.id, currentGroup.id)}>
          <FolderPlus className="mr-2 h-4 w-4 rotate-45" />
          ลบจากกลุ่ม "{currentGroup.label}"
        </ContextMenuItem>
      )}

      <ContextMenuSeparator />

      {/* Open in new tab */}
      <ContextMenuItem onClick={() => window.open(item.path, '_blank')}>
        <ExternalLink className="mr-2 h-4 w-4" />
        เปิดในแท็บใหม่
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
