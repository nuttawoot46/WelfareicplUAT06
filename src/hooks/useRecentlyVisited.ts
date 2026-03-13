import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MENU_ITEMS } from '@/config/menuRegistry';
import type { RecentVisit } from '@/types/sidebar';

const MAX_RECENT = 5;

function getStorageKey(email?: string): string {
  return `sidebar_recent_${email || 'anonymous'}`;
}

function loadRecent(email?: string): RecentVisit[] {
  try {
    const stored = localStorage.getItem(getStorageKey(email));
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

function saveRecent(visits: RecentVisit[], email?: string): void {
  try {
    localStorage.setItem(getStorageKey(email), JSON.stringify(visits));
  } catch {
    // ignore
  }
}

export function useRecentlyVisited() {
  const { user } = useAuth();
  const email = user?.email;
  const location = useLocation();
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>(() => loadRecent(email));

  // Reload when user changes
  useEffect(() => {
    setRecentVisits(loadRecent(email));
  }, [email]);

  // Track page visits
  useEffect(() => {
    const path = location.pathname;
    const menuItem = MENU_ITEMS.find(item => item.path === path);
    if (!menuItem) return;

    setRecentVisits(prev => {
      // ลบ duplicate
      const filtered = prev.filter(v => v.path !== path);
      const newVisit: RecentVisit = {
        itemId: menuItem.id,
        path: menuItem.path,
        label: menuItem.label,
        timestamp: Date.now(),
      };
      const updated = [newVisit, ...filtered].slice(0, MAX_RECENT);
      saveRecent(updated, email);
      return updated;
    });
  }, [location.pathname, email]);

  const clearRecent = useCallback(() => {
    setRecentVisits([]);
    saveRecent([], email);
  }, [email]);

  return { recentVisits, clearRecent };
}
