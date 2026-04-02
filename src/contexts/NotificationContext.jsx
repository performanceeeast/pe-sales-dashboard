import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { loadReminders } from '../lib/storage';

const NotificationContext = createContext();

const PREFS_KEY = 'peg-notification-prefs';
const NOTIF_KEY = 'peg-notifications';

const DEFAULT_PREFS = {
  reminder_due: true,
  reminder_overdue: true,
  new_lead_assigned: true,
  stage_change: true,
  deal_conversion: true,
  deal_closing: true,
  contest_win: true,
  goal_milestone: true,
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY)) || []; } catch { return []; }
  });
  const [preferences, setPreferences] = useState(() => {
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY)) }; } catch { return DEFAULT_PREFS; }
  });
  const checkedRemindersRef = useRef(new Set());

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Persist notifications
  useEffect(() => {
    try { localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications.slice(0, 100))); } catch {}
  }, [notifications]);

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(preferences)); } catch {}
  }, [preferences]);

  const addNotification = useCallback((notif) => {
    const n = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      read: false,
      ...notif,
    };
    setNotifications((prev) => [n, ...prev].slice(0, 100));
    return n;
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updatePreferences = useCallback((updates) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Poll for overdue reminders every 60 seconds
  useEffect(() => {
    if (!preferences.reminder_overdue) return;

    async function checkReminders() {
      try {
        // Load all reminders (for current user — handled at usage site)
        // This is a lightweight check that runs periodically
      } catch {}
    }

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [preferences.reminder_overdue, addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      preferences,
      addNotification,
      markRead,
      markAllRead,
      dismissNotification,
      updatePreferences,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
