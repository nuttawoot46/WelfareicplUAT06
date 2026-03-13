import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SidebarMenuItem } from './SidebarMenuItem';
import { useSidebar } from '@/context/SidebarContext';
import type { MenuSectionDef, MenuItemDef } from '@/types/sidebar';

interface SidebarSectionProps {
  section: MenuSectionDef;
  items: MenuItemDef[];
  isExpanded: boolean;
}

export function SidebarSection({ section, items, isExpanded }: SidebarSectionProps) {
  const location = useLocation();
  const { isSectionCollapsed, toggleSectionCollapsed } = useSidebar();
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  const isCollapsed = isSectionCollapsed(section.id);
  const isSubmenuActive = section.activePaths.some(path => location.pathname.includes(path));
  const itemIds = useMemo(() => items.map(i => i.id), [items]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section_${section.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Home section: render as single link, not collapsible
  if (section.id === 'home') {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {items.map(item => (
          <SidebarMenuItem
            key={item.id}
            item={item}
            isExpanded={isExpanded}
            isDraggable={false}
          />
        ))}
      </div>
    );
  }

  const Icon = section.icon;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative">
      {/* Section Header */}
      <div
        className={cn(
          'nav-link group cursor-pointer',
          isSubmenuActive ? 'nav-link-active' : ''
        )}
        onClick={() => isExpanded && toggleSectionCollapsed(section.id)}
        onMouseEnter={() => !isExpanded && setFlyoutOpen(true)}
        onMouseLeave={() => !isExpanded && setFlyoutOpen(false)}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {isExpanded && (
          <>
            <span className="transition-all duration-300 text-gray-900 font-medium">{section.label}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 ml-auto transition-transform duration-200',
                !isCollapsed && 'rotate-180'
              )}
            />
          </>
        )}
      </div>

      {/* Expanded sidebar: collapsible submenu */}
      {isExpanded && !isCollapsed && (
        <div className="mt-1 ml-6 space-y-0.5">
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {items.map(item => (
              <SidebarMenuItem
                key={item.id}
                item={item}
                isExpanded={isExpanded}
              />
            ))}
          </SortableContext>
        </div>
      )}

      {/* Collapsed sidebar: flyout popup */}
      {!isExpanded && flyoutOpen && (
        <div
          className="absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-xl border z-50 p-2"
          onMouseEnter={() => setFlyoutOpen(true)}
          onMouseLeave={() => setFlyoutOpen(false)}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {section.label}
          </div>
          {items.map(item => (
            <SidebarMenuItem
              key={item.id}
              item={item}
              isExpanded={true}
              isInFlyout={true}
              isDraggable={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
