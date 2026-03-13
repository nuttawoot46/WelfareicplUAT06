import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { SidebarPreferences, CustomGroup } from '@/types/sidebar';
import { DEFAULT_SIDEBAR_PREFERENCES } from '@/types/sidebar';
import { useAuth } from '@/context/AuthContext';

// ═══════════ Actions ═══════════

type SidebarAction =
  | { type: 'SET_PREFERENCES'; payload: SidebarPreferences }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'REORDER_SECTIONS'; payload: string[] }
  | { type: 'TOGGLE_SECTION_COLLAPSED'; payload: string }
  | { type: 'CREATE_GROUP'; payload: CustomGroup }
  | { type: 'UPDATE_GROUP'; payload: { id: string; label?: string; color?: string } }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'MOVE_ITEM_TO_GROUP'; payload: { itemId: string; groupId: string } }
  | { type: 'REMOVE_ITEM_FROM_GROUP'; payload: { itemId: string; groupId: string } }
  | { type: 'REORDER_GROUP_ITEMS'; payload: { groupId: string; itemIds: string[] } }
  | { type: 'SET_SIDEBAR_EXPANDED'; payload: boolean };

// ═══════════ Reducer ═══════════

function sidebarReducer(state: SidebarPreferences, action: SidebarAction): SidebarPreferences {
  switch (action.type) {
    case 'SET_PREFERENCES':
      return action.payload;

    case 'TOGGLE_FAVORITE': {
      const id = action.payload;
      const isFav = state.favoriteIds.includes(id);
      return {
        ...state,
        favoriteIds: isFav
          ? state.favoriteIds.filter(fid => fid !== id)
          : [...state.favoriteIds, id],
      };
    }

    case 'REORDER_SECTIONS':
      return { ...state, sectionOrder: action.payload };

    case 'TOGGLE_SECTION_COLLAPSED': {
      const sectionId = action.payload;
      const isCollapsed = state.collapsedSections.includes(sectionId);
      return {
        ...state,
        collapsedSections: isCollapsed
          ? state.collapsedSections.filter(s => s !== sectionId)
          : [...state.collapsedSections, sectionId],
      };
    }

    case 'CREATE_GROUP':
      return {
        ...state,
        customGroups: [...state.customGroups, action.payload],
      };

    case 'UPDATE_GROUP':
      return {
        ...state,
        customGroups: state.customGroups.map(g =>
          g.id === action.payload.id
            ? { ...g, ...action.payload }
            : g
        ),
      };

    case 'DELETE_GROUP':
      return {
        ...state,
        customGroups: state.customGroups.filter(g => g.id !== action.payload),
      };

    case 'MOVE_ITEM_TO_GROUP': {
      const { itemId, groupId } = action.payload;
      return {
        ...state,
        customGroups: state.customGroups.map(g => {
          if (g.id === groupId) {
            if (g.itemIds.includes(itemId)) return g;
            return { ...g, itemIds: [...g.itemIds, itemId] };
          }
          // ลบ item จาก group อื่นๆ
          return { ...g, itemIds: g.itemIds.filter(id => id !== itemId) };
        }),
      };
    }

    case 'REMOVE_ITEM_FROM_GROUP': {
      const { itemId, groupId } = action.payload;
      return {
        ...state,
        customGroups: state.customGroups.map(g =>
          g.id === groupId
            ? { ...g, itemIds: g.itemIds.filter(id => id !== itemId) }
            : g
        ),
      };
    }

    case 'REORDER_GROUP_ITEMS': {
      const { groupId, itemIds } = action.payload;
      return {
        ...state,
        customGroups: state.customGroups.map(g =>
          g.id === groupId ? { ...g, itemIds } : g
        ),
      };
    }

    case 'SET_SIDEBAR_EXPANDED':
      return { ...state, sidebarExpanded: action.payload };

    default:
      return state;
  }
}

// ═══════════ Context ═══════════

interface SidebarContextType {
  preferences: SidebarPreferences;
  dispatch: React.Dispatch<SidebarAction>;
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
  createGroup: (label: string, color: string) => void;
  updateGroup: (id: string, updates: { label?: string; color?: string }) => void;
  deleteGroup: (id: string) => void;
  moveItemToGroup: (itemId: string, groupId: string) => void;
  removeItemFromGroup: (itemId: string, groupId: string) => void;
  toggleSectionCollapsed: (sectionId: string) => void;
  isSectionCollapsed: (sectionId: string) => boolean;
  isExpanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

// ═══════════ localStorage helpers ═══════════

function getStorageKey(email?: string): string {
  return `sidebar_prefs_${email || 'anonymous'}`;
}

function loadPreferences(email?: string): SidebarPreferences {
  try {
    const stored = localStorage.getItem(getStorageKey(email));
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SIDEBAR_PREFERENCES, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SIDEBAR_PREFERENCES };
}

function savePreferences(prefs: SidebarPreferences, email?: string): void {
  try {
    localStorage.setItem(getStorageKey(email), JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

// ═══════════ Provider ═══════════

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const email = user?.email;

  const [preferences, dispatch] = useReducer(
    sidebarReducer,
    email,
    () => loadPreferences(email)
  );

  // Reload preferences when user changes
  useEffect(() => {
    const loaded = loadPreferences(email);
    dispatch({ type: 'SET_PREFERENCES', payload: loaded });
  }, [email]);

  // Persist on every change
  useEffect(() => {
    savePreferences(preferences, email);
  }, [preferences, email]);

  // ── Helper functions ──

  const toggleFavorite = useCallback((itemId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: itemId });
  }, []);

  const isFavorite = useCallback((itemId: string) => {
    return preferences.favoriteIds.includes(itemId);
  }, [preferences.favoriteIds]);

  const createGroup = useCallback((label: string, color: string) => {
    const newGroup: CustomGroup = {
      id: `group_${Date.now()}`,
      label,
      color,
      itemIds: [],
      order: preferences.customGroups.length,
    };
    dispatch({ type: 'CREATE_GROUP', payload: newGroup });
  }, [preferences.customGroups.length]);

  const updateGroup = useCallback((id: string, updates: { label?: string; color?: string }) => {
    dispatch({ type: 'UPDATE_GROUP', payload: { id, ...updates } });
  }, []);

  const deleteGroup = useCallback((id: string) => {
    dispatch({ type: 'DELETE_GROUP', payload: id });
  }, []);

  const moveItemToGroup = useCallback((itemId: string, groupId: string) => {
    dispatch({ type: 'MOVE_ITEM_TO_GROUP', payload: { itemId, groupId } });
  }, []);

  const removeItemFromGroup = useCallback((itemId: string, groupId: string) => {
    dispatch({ type: 'REMOVE_ITEM_FROM_GROUP', payload: { itemId, groupId } });
  }, []);

  const toggleSectionCollapsed = useCallback((sectionId: string) => {
    dispatch({ type: 'TOGGLE_SECTION_COLLAPSED', payload: sectionId });
  }, []);

  const isSectionCollapsed = useCallback((sectionId: string) => {
    return preferences.collapsedSections.includes(sectionId);
  }, [preferences.collapsedSections]);

  const setExpanded = useCallback((expanded: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_EXPANDED', payload: expanded });
  }, []);

  const value: SidebarContextType = {
    preferences,
    dispatch,
    toggleFavorite,
    isFavorite,
    createGroup,
    updateGroup,
    deleteGroup,
    moveItemToGroup,
    removeItemFromGroup,
    toggleSectionCollapsed,
    isSectionCollapsed,
    isExpanded: preferences.sidebarExpanded,
    setExpanded,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextType {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return ctx;
}
