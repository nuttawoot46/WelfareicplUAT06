import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavContext } from '@/hooks/useNavContext';
import { MENU_ITEMS, MENU_SECTIONS } from '@/config/menuRegistry';
import { isVisible } from '@/lib/menuVisibility';
import type { MenuItemDef, NavContextData } from '@/types/sidebar';

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const {
    userRole, isExecutive, isSuperAdmin, isAdmin, hasSalesZone, user,
  } = useNavContext();

  const navCtx: NavContextData = useMemo(() => ({
    userRole: userRole || '',
    isExecutive: isExecutive || false,
    isSuperAdmin: isSuperAdmin || false,
    isAdmin: isAdmin || false,
    hasSalesZone: hasSalesZone || false,
    userEmail: user?.email,
  }), [userRole, isExecutive, isSuperAdmin, isAdmin, hasSalesZone, user?.email]);

  // Visible items only
  const visibleItems = useMemo(() => {
    return MENU_ITEMS.filter(item => isVisible(item.visibility, navCtx));
  }, [navCtx]);

  // Filtered by search query
  const results = useMemo(() => {
    if (!query.trim()) return visibleItems;
    const q = query.toLowerCase().trim();
    return visibleItems.filter(item => {
      if (item.label.toLowerCase().includes(q)) return true;
      if (item.searchKeywords?.some(kw => kw.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query, visibleItems]);

  // Group results by section
  const groupedResults = useMemo(() => {
    const groups: { sectionId: string; sectionLabel: string; items: MenuItemDef[] }[] = [];
    const sectionMap = new Map<string, MenuItemDef[]>();

    for (const item of results) {
      const existing = sectionMap.get(item.sectionId);
      if (existing) {
        existing.push(item);
      } else {
        sectionMap.set(item.sectionId, [item]);
      }
    }

    for (const [sectionId, items] of sectionMap) {
      const section = MENU_SECTIONS.find(s => s.id === sectionId);
      groups.push({
        sectionId,
        sectionLabel: section?.label || sectionId,
        items: items.sort((a, b) => a.order - b.order),
      });
    }

    return groups;
  }, [results]);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectItem = useCallback((item: MenuItemDef) => {
    navigate(item.path);
    setIsOpen(false);
    setQuery('');
  }, [navigate]);

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    groupedResults,
    selectItem,
  };
}
