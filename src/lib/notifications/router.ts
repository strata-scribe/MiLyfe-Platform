export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';
export type NotificationUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:mm format (e.g., '22:00')
  end: string;   // HH:mm format (e.g., '08:00')
  timezone: string; // IANA timezone string (e.g., 'America/New_York')
}

export interface PrivacySettings {
  channels: Record<NotificationChannel, boolean>;
  dnd: boolean;
  quietHours: QuietHours;
  minUrgency: NotificationUrgency;
}

export interface NotificationRequest {
  urgency: NotificationUrgency;
  type: string;
  // Other metadata might go here
}

const URGENCY_LEVELS: Record<NotificationUrgency, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function isQuietHours(currentTime: Date, quietHours: QuietHours): boolean {
  if (!quietHours.enabled) return false;

  try {
    // Get current time in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: quietHours.timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    // Some formatters return "24:00" for midnight, so we handle it.
    let timeString = formatter.format(currentTime);
    if (timeString.startsWith('24:')) {
      timeString = '00:' + timeString.substring(3);
    }

    const [currentStrHours, currentStrMinutes] = timeString.split(':');
    let currentH = parseInt(currentStrHours, 10);
    // If the formatter returns '24', handle it
    if (currentH === 24) currentH = 0;
    const currentM = parseInt(currentStrMinutes, 10);

    const currentMinutes = currentH * 60 + currentM;

    const start = parseTime(quietHours.start);
    const startMinutes = start.hours * 60 + start.minutes;

    const end = parseTime(quietHours.end);
    const endMinutes = end.hours * 60 + end.minutes;

    if (startMinutes < endMinutes) {
      // Quiet hours in the same day (e.g., 08:00 to 17:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Quiet hours cross midnight (e.g., 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  } catch (error) {
    // Fallback if timezone is invalid
    return false;
  }
}

export function routeNotification(
  notification: NotificationRequest,
  settings: PrivacySettings,
  currentTime: Date = new Date()
): NotificationChannel[] {
  // 1. Urgency Evaluation
  const notificationUrgencyLevel = URGENCY_LEVELS[notification.urgency];
  const minUrgencyLevel = URGENCY_LEVELS[settings.minUrgency];

  // If urgency doesn't meet minimum, only allow in_app, or if in_app is disabled, return empty
  if (notificationUrgencyLevel < minUrgencyLevel) {
     return settings.channels.in_app ? ['in_app'] : [];
  }

  // 2. Critical bypass
  const isCritical = notification.urgency === 'critical';

  // 3. Evaluate DND / Quiet Hours
  const inQuietHours = isQuietHours(currentTime, settings.quietHours);
  const isDndActive = settings.dnd || inQuietHours;

  const allowedChannels: NotificationChannel[] = [];

  for (const channel of Object.keys(settings.channels) as NotificationChannel[]) {
    // Check if user enabled the channel
    if (!settings.channels[channel]) {
      continue;
    }

    if (isCritical) {
      // Critical bypasses DND for all channels
      allowedChannels.push(channel);
    } else {
      if (isDndActive) {
         // If DND is active, only allow non-interruptive channels
         // We consider in_app and email as non-interruptive (they don't usually buzz/ring immediately in the same way push/sms do)
         // Wait, the prompt says "Determine deliverable channels". Typically, DND blocks push and SMS.
         // Let's assume in_app is always allowed if enabled during DND.
         // Let's also assume email is allowed during DND as it's passive.
         if (channel === 'in_app' || channel === 'email') {
           allowedChannels.push(channel);
         }
      } else {
         allowedChannels.push(channel);
      }
    }
  }

  return allowedChannels;
}
