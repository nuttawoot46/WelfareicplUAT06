import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { SidebarContextMenuContent } from './SidebarContextMenu';
import { useSidebar } from '@/context/SidebarContext';
import type { MenuItemDef } from '@/types/sidebar';

interface SidebarMenuItemProps {
  item: MenuItemDef;
  isExpanded: boolean;
  isInFlyout?: boolean;
  isDraggable?: boolean;
}

export const SidebarMenuItem = React.memo(function SidebarMenuItem({
  item,
  isExpanded,
  isInFlyout = false,
  isDraggable = true,
}: SidebarMenuItemProps) {
  const location = useLocation();
  const { isFavorite, toggleFavorite } = useSidebar();
  const isActive = location.pathname === item.path;
  const fav = isFavorite(item.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !isDraggable,
  });

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const Icon = item.icon;

  // Flyout mode (collapsed sidebar popup)
  if (isInFlyout) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Link
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200',
              'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
              isActive && 'bg-gray-100 text-gray-900 font-medium'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        </ContextMenuTrigger>
        <SidebarContextMenuContent item={item} />
      </ContextMenu>
    );
  }

  // Normal expanded mode
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
          <Link
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors duration-200 group/item',
              isExpanded
                ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                : 'justify-center',
              isActive && (isExpanded
                ? 'text-gray-900 bg-gray-100 font-medium'
                : 'text-[#004F9F]')
            )}
          >
            <Icon className={cn('h-4 w-4 flex-shrink-0', !isExpanded && 'h-5 w-5')} />
            {isExpanded && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {/* Star button on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  className={cn(
                    'p-0.5 rounded transition-all duration-150 flex-shrink-0',
                    fav
                      ? 'text-yellow-500 opacity-100'
                      : 'text-gray-300 opacity-0 group-hover/item:opacity-100 hover:text-yellow-500'
                  )}
                >
                  <Star className={cn('h-3.5 w-3.5', fav && 'fill-current')} />
                </button>
              </>
            )}
          </Link>
          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-50 shadow-xl">
              {item.label}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <SidebarContextMenuContent item={item} />
    </ContextMenu>
  );
});
