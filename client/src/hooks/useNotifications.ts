import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export interface Notification {
  id: number;
  notificationId: string;
  userId: string;
  audienceRole: string;
  title: string;
  body: string;
  type: string;
  requestId: string | null;
  statusEventId: string | null;
  metadata: any;
  readAt: string | null;
  deliveryState: string;
  expiresAt: string | null;
  createdAt: string;
}

/**
 * Hook to fetch and manage notifications for the authenticated user
 * Features:
 * - Auto-polling every 30 seconds
 * - Toast notifications for new unread notifications
 * - Mark as read functionality
 * - Unread count tracking
 */
export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const previousUnreadCount = useRef<number>(0);

  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch unread count
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: true,
  });

  const unreadCount = countData?.count || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      // Invalidate ALL notification-related queries to keep UI in sync
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      // Also invalidate customer/operator specific views if they exist
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
    },
  });

  // Show toast notifications for new unread notifications
  useEffect(() => {
    // Only show toasts if count increased and we have notifications
    if (unreadCount > previousUnreadCount.current && notifications.length > 0) {
      const newNotifications = notifications
        .filter(n => !n.readAt)
        .slice(0, unreadCount - previousUnreadCount.current)
        .reverse(); // Show newest first

      newNotifications.forEach((notification, index) => {
        // Stagger toasts slightly to avoid overlap
        setTimeout(() => {
          toast({
            title: notification.title,
            description: notification.body,
            duration: 5000,
          });
        }, index * 300);
      });
    }

    previousUnreadCount.current = unreadCount;
  }, [unreadCount, notifications, toast]);

  // Get unread notifications
  const unreadNotifications = notifications.filter(n => !n.readAt);

  // Get read notifications
  const readNotifications = notifications.filter(n => n.readAt);

  return {
    notifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
}
