/**
 * Notification Service
 * Handles in-app notifications, email preferences, and notification delivery
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export type NotificationType =
  | 'task_reminder'
  | 'task_completed'
  | 'status_update'
  | 'document_uploaded'
  | 'document_approved'
  | 'closing_reminder'
  | 'message_received';

interface Notification {
  type: NotificationType;
  title: string;
  message: string;
  propertyId?: string;
  metadata?: Record<string, any>;
}

export const notificationService = {
  /**
   * Create in-app notification
   */
  async createNotification(
    userId: string,
    notification: Notification
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          property_id: notification.propertyId,
          metadata: notification.metadata,
          read: false,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Notification service error:', error);
      return false;
    }
  },

  /**
   * Get user's notifications
   */
  async getNotifications(userId: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  /**
   * Clear all notifications for a user
   */
  async clearAll(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  },

  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Return defaults if not found
      return data || {
        user_id: userId,
        email_task_reminders: true,
        email_status_updates: true,
        email_document_notifications: true,
        email_closing_reminders: true,
        push_notifications: true,
        notification_frequency: 'immediate', // or 'daily_digest'
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, preferences: Record<string, any>) {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  },

  /**
   * Send task reminder notification
   */
  async sendTaskReminder(userId: string, task: any) {
    return this.createNotification(userId, {
      type: 'task_reminder',
      title: `Task Due: ${task.name}`,
      message: `${task.name} is due on ${new Date(task.dueDate).toLocaleDateString()}`,
      propertyId: task.propertyId,
      metadata: {
        taskId: task.id,
        dueDate: task.dueDate,
      },
    });
  },

  /**
   * Send status update notification
   */
  async sendStatusUpdate(userId: string, update: any) {
    return this.createNotification(userId, {
      type: 'status_update',
      title: `Status Update: ${update.propertyAddress}`,
      message: `Your transaction status has been updated to ${update.newStatus}`,
      propertyId: update.propertyId,
      metadata: {
        previousStatus: update.previousStatus,
        newStatus: update.newStatus,
      },
    });
  },

  /**
   * Send closing reminder notification
   */
  async sendClosingReminder(userId: string, closing: any) {
    const daysUntil = Math.ceil(
      (new Date(closing.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return this.createNotification(userId, {
      type: 'closing_reminder',
      title: 'Closing Reminder',
      message: `Your closing is in ${daysUntil} days on ${new Date(closing.date).toLocaleDateString()}`,
      propertyId: closing.propertyId,
      metadata: {
        closingDate: closing.date,
        closingTime: closing.time,
      },
    });
  },
};
