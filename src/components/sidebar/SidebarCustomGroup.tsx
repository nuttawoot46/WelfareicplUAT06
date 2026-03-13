import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SidebarMenuItem } from './SidebarMenuItem';
import { useSidebar } from '@/context/SidebarContext';
import { getItemById } from '@/config/menuRegistry';
import type { CustomGroup, MenuItemDef } from '@/types/sidebar';

interface SidebarCustomGroupProps {
  group: CustomGroup;
  isExpanded: boolean;
  onEdit: (group: CustomGroup) => void;
}

export function SidebarCustomGroup({ group, isExpanded, onEdit }: SidebarCustomGroupProps) {
  const { deleteGroup } = useSidebar();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `group_drop_${group.id}`,
    data: { type: 'group', groupId: group.id },
  });

  const groupItems = useMemo(() => {
    return group.itemIds
      .map(id => getItemById(id))
      .filter((item): item is MenuItemDef => item !== undefined);
  }, [group.itemIds]);

  if (!isExpanded) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg transition-colors duration-200',
        isOver && 'bg-gray-50 ring-1 ring-dashed ring-gray-300'
      )}
    >
      {/* Group Header */}
      <div
        className="flex items-center gap-2 px-4 py-1.5 cursor-pointer group/grp"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1 truncate">
          {group.label}
        </span>

        {/* Edit / Delete buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/grp:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(group); }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
            className="p-1 text-gray-400 hover:text-red-500 rounded"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-gray-400 transition-transform duration-200',
            !isCollapsed && 'rotate-180'
          )}
        />
      </div>

      {/* Group Items */}
      {!isCollapsed && (
        <div className="ml-2 space-y-0.5">
          {groupItems.length === 0 ? (
            <p className="px-4 py-2 text-xs text-gray-400 italic">
              ลากเมนูมาวางที่นี่
            </p>
          ) : (
            <>
              {groupItems.map(item => (
                <SidebarMenuItem
                  key={`grp_${group.id}_${item.id}`}
                  item={item}
                  isExpanded={isExpanded}
                  isDraggable={false}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
