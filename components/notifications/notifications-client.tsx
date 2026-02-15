"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  MessageCircle,
  Reply,
  Bell,
  Check,
  CheckCheck,
} from "lucide-react";
import type { Notification, Profile, Post } from "@/lib/types";

interface NotificationWithDetails extends Notification {
  actor: Profile;
  post?: Post;
}

// Helper to generate post slug
function generateSlug(title: string | null, id: number): string {
  if (!title) return String(id);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}--${id}`;
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "upvote":
      return <Heart className="w-4 h-4 text-rose-500" />;
    case "comment":
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case "reply":
      return <Reply className="w-4 h-4 text-emerald-500" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: NotificationWithDetails;
  onMarkAsRead: (id: number) => void;
}) {
  const router = useRouter();
  const actor = notification.actor;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.post_id) {
      const postSlug = notification.post
        ? generateSlug(notification.post.title, notification.post_id)
        : String(notification.post_id);
      router.push(`/post/${postSlug}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 border-b border-border cursor-pointer transition-colors hover:bg-muted/50 ${
        !notification.is_read ? "bg-primary/5" : ""
      }`}
    >
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarImage src={actor?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {actor?.full_name?.charAt(0) || actor?.email?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center border border-border">
          <NotificationIcon type={notification.type} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">
            {actor?.full_name || actor?.email?.split("@")[0] || "Someone"}
          </span>{" "}
          <span className="text-muted-foreground">{notification.message}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>

      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-border">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

interface NotificationsClientProps {
  currentUserId: string;
}

export function NotificationsClient({
  currentUserId,
}: NotificationsClientProps) {
  const supabase = useSupabase();
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        *,
        actor:profiles!notifications_actor_id_fkey(*),
        post:posts(id, title, content)
      `
      )
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[v0] Error fetching notifications:", error);
      return;
    }

    setNotifications((data as NotificationWithDetails[]) || []);
    setIsLoading(false);
  }, [supabase, currentUserId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          // Fetch the full notification with actor details
          const { data } = await supabase
            .from("notifications")
            .select(
              `
              *,
              actor:profiles!notifications_actor_id_fkey(*),
              post:posts(id, title, content)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setNotifications((prev) => [
              data as NotificationWithDetails,
              ...prev,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId]);

  const markAsRead = async (id: number) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    setMarkingAllRead(true);
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMarkingAllRead(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div>
        {[...Array(5)].map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="px-4 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-medium">No notifications yet</h2>
        <p className="text-sm text-muted-foreground">
          {"When someone interacts with your posts, you'll see it here."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
          <span className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={markingAllRead}
            className="text-xs"
          >
            {markingAllRead ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Marking...
              </>
            ) : (
              <>
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all as read
              </>
            )}
          </Button>
        </div>
      )}

      <div>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
          />
        ))}
      </div>
    </div>
  );
}
