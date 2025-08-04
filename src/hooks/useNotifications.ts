"use client";

import { db, realtime, TABLES } from "@/lib/supabase/client";
import type { Notification } from "@/types";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./useAuth";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const notificationsData = await db.findMany<Notification>(
        TABLES.NOTIFICATIONS,
        {
          filter: { user_id: user.id },
          orderBy: { column: "created_at", ascending: false },
          limit: 50,
        }
      );

      setNotifications(notificationsData);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      try {
        await db.update<Notification>(TABLES.NOTIFICATIONS, notificationId, {
          is_read: true,
        });

        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
      } catch (err: any) {
        console.error("Error marking notification as read:", err);
        toast.error("Failed to mark notification as read");
      }
    },
    [user]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);

      await Promise.all(
        unreadNotifications.map((notification) =>
          db.update<Notification>(TABLES.NOTIFICATIONS, notification.id, {
            is_read: true,
          })
        )
      );

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );

      toast.success("All notifications marked as read");
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err);
      toast.error("Failed to mark all notifications as read");
    }
  }, [user, notifications]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      try {
        await db.delete(TABLES.NOTIFICATIONS, notificationId);

        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );

        toast.success("Notification deleted");
      } catch (err: any) {
        console.error("Error deleting notification:", err);
        toast.error("Failed to delete notification");
      }
    },
    [user]
  );

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!user) return;

    try {
      await Promise.all(
        notifications.map((notification) =>
          db.delete(TABLES.NOTIFICATIONS, notification.id)
        )
      );

      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (err: any) {
      console.error("Error clearing all notifications:", err);
      toast.error("Failed to clear all notifications");
    }
  }, [user, notifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Load notifications on mount and when user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const channel = realtime.subscribe(
      TABLES.NOTIFICATIONS,
      user.id,
      (payload: any) => {
        console.log("Notification update:", payload);

        const { eventType, new: newRecord, old: oldRecord } = payload;

        switch (eventType) {
          case "INSERT":
            if (newRecord.user_id === user.id) {
              setNotifications((prev) => [newRecord, ...prev]);

              // Show toast for new notification
              if (!newRecord.is_read) {
                toast(newRecord.title, {
                  icon: getNotificationIcon(newRecord.type),
                  duration: 5000,
                });
              }
            }
            break;

          case "UPDATE":
            if (newRecord.user_id === user.id) {
              setNotifications((prev) =>
                prev.map((notification) =>
                  notification.id === newRecord.id ? newRecord : notification
                )
              );
            }
            break;

          case "DELETE":
            if (oldRecord.user_id === user.id) {
              setNotifications((prev) =>
                prev.filter((notification) => notification.id !== oldRecord.id)
              );
            }
            break;
        }
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
  };
}

// Helper function to get notification icon
function getNotificationIcon(type: string): string {
  switch (type) {
    case "budget_alert":
      return "⚠️";
    case "emi_reminder":
      return "💳";
    case "lending_reminder":
      return "👥";
    case "goal_reminder":
      return "🎯";
    default:
      return "📢";
  }
}

// Hook for creating notifications (admin/system use)
export function useCreateNotification() {
  const { user } = useAuth();

  const createNotification = useCallback(
    async (
      title: string,
      message: string,
      type: Notification["type"],
      data?: Record<string, any>
    ) => {
      if (!user) return;

      try {
        const notification = await db.create<Notification>(
          TABLES.NOTIFICATIONS,
          {
            user_id: user.id,
            title,
            message,
            type,
            data,
            is_read: false,
          }
        );

        return notification;
      } catch (err: any) {
        console.error("Error creating notification:", err);
        throw err;
      }
    },
    [user]
  );

  return { createNotification };
}

// Hook for managing notification permissions
export function useNotificationPermissions() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return;

      const notification = new Notification(title, {
        icon: "/icon-192.png",
        badge: "/icon-96.png",
        ...options,
      });

      return notification;
    },
    [isSupported, permission]
  );

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
}
