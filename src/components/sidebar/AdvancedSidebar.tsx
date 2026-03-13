import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/context/SidebarContext';
import { useNavContext } from '@/hooks/useNavContext';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { SidebarHeader } from './SidebarHeader';
import { SidebarSearchTrigger } from './SidebarSearchTrigger';
import { SidebarNav } from './SidebarNav';
import { SidebarUserProfile } from './SidebarUserProfile';
import { CommandPalette } from './CommandPalette';
import { CreateGroupDialog } from './CreateGroupDialog';
import type { CustomGroup } from '@/types/sidebar';

export function AdvancedSidebar() {
  const { user } = useNavContext();
  const { isExpanded, setExpanded } = useSidebar();
  const { setIsOpen: setCommandPaletteOpen } = useCommandPalette();

  // Group dialog state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomGroup | null>(null);

  const handleToggle = useCallback(() => {
    setExpanded(!isExpanded);
  }, [isExpanded, setExpanded]);

  const handleCreateGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: CustomGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  // Don't render if not logged in
  if (!user) return null;

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 hidden xl:flex flex-col',
          isExpanded ? 'w-64' : 'w-20'
        )}
      >
        {/* Header: Logo + Toggle */}
        <SidebarHeader isExpanded={isExpanded} onToggle={handleToggle} />

        {/* Search Trigger */}
        <SidebarSearchTrigger
          isExpanded={isExpanded}
          onClick={() => setCommandPaletteOpen(true)}
        />

        {/* Navigation */}
        <SidebarNav
          isExpanded={isExpanded}
          onCreateGroup={handleCreateGroup}
          onEditGroup={handleEditGroup}
        />

        {/* User Profile & Logout */}
        <SidebarUserProfile isExpanded={isExpanded} />
      </div>

      {/* Command Palette (Ctrl+K) - renders globally */}
      <CommandPalette />

      {/* Create/Edit Group Dialog */}
      <CreateGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        editingGroup={editingGroup}
      />
    </>
  );
}
