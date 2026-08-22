/**
 * MiLyfe Notification System
 * 
 * Handles 3 delivery channels:
 * 1. In-app (Supabase Realtime — instant)
 * 2. Web Push (Service Worker — background)
 * 3. Email (Resend — digests and urgent)
 */

export type NotificationType = 'info' | 'ubi' | 'system' | 'social' | 'safety' | 'governance' | 'reward' | 'warning';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface BulkNotificationPayload {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}
