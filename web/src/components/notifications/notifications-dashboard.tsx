"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { notificationsApi } from "@/lib/api";
import { Bell, Heart, MessageSquare, Sparkles, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function NotificationsDashboard() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
      }
    } catch (e) {
      console.log("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "match":
        return <Heart className="w-5 h-5 text-red-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin text-primary">
            <Bell className="w-8 h-8" />
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <Bell className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h4 className="text-xl font-bold text-foreground">All caught up</h4>
          <p className="text-muted-foreground">You have no new notifications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                notif.is_read
                  ? "bg-card/50 border-transparent opacity-70"
                  : "bg-card border-border shadow-sm"
              }`}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
            >
              <div className="p-3 bg-accent rounded-xl shrink-0">
                {getIcon(notif.notification_type)}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="font-bold text-foreground text-sm">
                  {notif.title}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {notif.content}
                </p>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mt-3">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
              {!notif.is_read && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_8px_rgba(255,69,0,0.6)]" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
