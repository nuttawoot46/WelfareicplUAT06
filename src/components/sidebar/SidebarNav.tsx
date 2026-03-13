import { useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderPlus } from 'lucide-react';
import { SidebarFavoritesSection } from './SidebarFavoritesSection';
import { SidebarRecentSection } from './SidebarRecentSection';
import { SidebarSection } from './SidebarSection';
import { SidebarCustomGroup } from './SidebarCustomGroup';
import { useSidebar } from '@/context/SidebarContext';
import { useNavContext } from '@/hooks/useNavContext';
import { MENU_SECTIONS, getItemsBySection, getItemById } from '@/config/menuRegistry';
import { getVisibleSections, getVisibleItems } from '@/lib/menuVisibility';
import type { NavContextData, CustomGroup } from '@/types/sidebar';

interface SidebarNavProps {
  isExpanded: boolean;
  onCreateGroup: () => void;
  onEditGroup: (group: CustomGroup) => void;
}

export function SidebarNav({ isExpanded, onCreateGroup, onEditGroup }: SidebarNavProps) {
  const { preferences, dispatch, moveItemToGroup } = useSidebar();
  const { userRole, isExecutive, isSuperAdmin, isAdmin, hasSalesZone, user } = useNavContext();

  const navCtx: NavContextData = useMemo(() => ({
    userRole: userRole || '',
    isExecutive: isExecutive || false,
    isSuperAdmin: isSuperAdmin || false,
    isAdmin: isAdmin || false,
    hasSalesZone: hasSalesZone || false,
    userEmail: user?.email,
  }), [userRole, isExecutive, isSuperAdmin, isAdmin, hasSalesZone, user?.email]);

  // Visible sections sorted by user preference
  const visibleSections = useMemo(() => {
    const filtered = getVisibleSections(MENU_SECTIONS, navCtx);
    const orderMap = new Map(preferences.sectionOrder.map((id, idx) => [id, idx]));
    return [...filtered].sort((a, b) => {
      const aIdx = orderMap.get(a.id) ?? a.order;
      const bIdx = orderMap.get(b.id) ?? b.order;
      return aIdx - bIdx;
    });
  }, [navCtx, preferences.sectionOrder]);

  // Visible items per section, respecting custom order from preferences
  const sectionItems = useMemo(() => {
    const map: Record<string, ReturnType<typeof getVisibleItems>> = {};
    for (const section of visibleSections) {
      const items = getItemsBySection(section.id);
      const visible = getVisibleItems(items, navCtx);

      // Apply custom item order if exists
      const customOrder = preferences.itemOrder[section.id];
      if (customOrder && customOrder.length > 0) {
        const orderMap = new Map(customOrder.map((id, idx) => [id, idx]));
        visible.sort((a, b) => {
          const aIdx = orderMap.get(a.id);
          const bIdx = orderMap.get(b.id);
          if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
          if (aIdx !== undefined) return -1;
          if (bIdx !== undefined) return 1;
          return a.order - b.order;
        });
      }

      map[section.id] = visible;
    }
    return map;
  }, [visibleSections, navCtx, preferences.itemOrder]);

  const sectionSortableIds = useMemo(
    () => visibleSections.map(s => `section_${s.id}`),
    [visibleSections]
  );

  // Sensors: distance 8 to prevent click-drag conflict
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Section reorder
    if (activeId.startsWith('section_') && overId.startsWith('section_')) {
      const activeSection = activeId.replace('section_', '');
      const overSection = overId.replace('section_', '');
      const currentOrder = preferences.sectionOrder.length > 0
        ? preferences.sectionOrder
        : visibleSections.map(s => s.id);
      const oldIndex = currentOrder.indexOf(activeSection);
      const newIndex = currentOrder.indexOf(overSection);
      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch({
          type: 'REORDER_SECTIONS',
          payload: arrayMove(currentOrder, oldIndex, newIndex),
        });
      }
      return;
    }

    // Item dropped on group drop zone
    const overData = over.data?.current;
    if (overData?.type === 'group' && overData.groupId) {
      let itemId = activeId;
      if (itemId.startsWith('fav_')) itemId = itemId.replace('fav_', '');
      if (itemId.match(/^grp_[^_]+_/)) itemId = itemId.replace(/^grp_[^_]+_/, '');
      moveItemToGroup(itemId, overData.groupId);
      return;
    }

    // Item reorder within same section
    const activeItem = getItemById(activeId);
    const overItem = getItemById(overId);
    if (activeItem && overItem && activeItem.sectionId === overItem.sectionId) {
      const sectionId = activeItem.sectionId;
      const currentItems = sectionItems[sectionId] || [];
      const currentIds = currentItems.map(i => i.id);
      const oldIndex = currentIds.indexOf(activeId);
      const newIndex = currentIds.indexOf(overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch({
          type: 'REORDER_ITEMS',
          payload: {
            sectionId,
            itemIds: arrayMove(currentIds, oldIndex, newIndex),
          },
        });
      }
    }
  }, [preferences.sectionOrder, visibleSections, sectionItems, dispatch, moveItemToGroup]);

  return (
    <ScrollArea className="flex-1">
      <nav className="p-4 space-y-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {/* Favorites */}
          <SidebarFavoritesSection isExpanded={isExpanded} />

          {/* Recently Visited */}
          <SidebarRecentSection isExpanded={isExpanded} />

          {/* Main sections */}
          <SortableContext items={sectionSortableIds} strategy={verticalListSortingStrategy}>
            {visibleSections.map(section => (
              <SidebarSection
                key={section.id}
                section={section}
                items={sectionItems[section.id] || []}
                isExpanded={isExpanded}
              />
            ))}
          </SortableContext>

          {/* Custom Groups */}
          {preferences.customGroups.length > 0 && isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
              {preferences.customGroups.map(group => (
                <SidebarCustomGroup
                  key={group.id}
                  group={group}
                  isExpanded={isExpanded}
                  onEdit={onEditGroup}
                />
              ))}
            </div>
          )}

          {/* Create group button */}
          {isExpanded && (
            <button
              type="button"
              onClick={onCreateGroup}
              className="flex items-center gap-2 px-4 py-2 mt-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200 w-full"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>สร้างกลุ่มใหม่</span>
            </button>
          )}
        </DndContext>
      </nav>
    </ScrollArea>
  );
}
