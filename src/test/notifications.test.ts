import test from 'node:test';
import assert from 'node:assert';
import {
  routeNotification,
  PrivacySettings,
  NotificationRequest,
  isQuietHours,
} from '../lib/notifications/router';

test('isQuietHours handles same-day quiet hours correctly', () => {
  const quietHours = {
    enabled: true,
    start: '08:00',
    end: '17:00',
    timezone: 'UTC'
  };

  const withinQuietHours = new Date('2023-10-10T12:00:00Z');
  assert.strictEqual(isQuietHours(withinQuietHours, quietHours), true);

  const outsideQuietHours = new Date('2023-10-10T06:00:00Z');
  assert.strictEqual(isQuietHours(outsideQuietHours, quietHours), false);
});

test('isQuietHours handles cross-midnight quiet hours correctly', () => {
  const quietHours = {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC'
  };

  const beforeMidnight = new Date('2023-10-10T23:00:00Z');
  assert.strictEqual(isQuietHours(beforeMidnight, quietHours), true);

  const afterMidnight = new Date('2023-10-10T02:00:00Z');
  assert.strictEqual(isQuietHours(afterMidnight, quietHours), true);

  const daytime = new Date('2023-10-10T12:00:00Z');
  assert.strictEqual(isQuietHours(daytime, quietHours), false);
});

test('isQuietHours uses timezone correctly', () => {
  const quietHours = {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'America/New_York'
  };

  // NY is UTC-4 (or UTC-5). Let's pick a time where it matters.
  // 03:00 UTC is 23:00 EDT (NY time) the previous day -> within quiet hours
  const nyTimeWithin = new Date('2023-10-10T03:00:00Z');
  assert.strictEqual(isQuietHours(nyTimeWithin, quietHours), true);

  // 16:00 UTC is 12:00 EDT (NY time) -> outside quiet hours
  const nyTimeOutside = new Date('2023-10-10T16:00:00Z');
  assert.strictEqual(isQuietHours(nyTimeOutside, quietHours), false);
});

test('routeNotification filters out notifications below minimum urgency', () => {
  const settings: PrivacySettings = {
    channels: { in_app: true, push: true, email: true, sms: true },
    dnd: false,
    quietHours: { enabled: false, start: '00:00', end: '00:00', timezone: 'UTC' },
    minUrgency: 'high'
  };

  const notification: NotificationRequest = { urgency: 'low', type: 'info' };

  const result = routeNotification(notification, settings);
  // Based on logic, if below min urgency but in_app is enabled, it returns ['in_app']
  assert.deepStrictEqual(result, ['in_app']);
});

test('routeNotification suppresses entirely if below min urgency and in_app disabled', () => {
  const settings: PrivacySettings = {
    channels: { in_app: false, push: true, email: true, sms: true },
    dnd: false,
    quietHours: { enabled: false, start: '00:00', end: '00:00', timezone: 'UTC' },
    minUrgency: 'medium'
  };

  const notification: NotificationRequest = { urgency: 'low', type: 'info' };
  const result = routeNotification(notification, settings);
  assert.deepStrictEqual(result, []);
});

test('routeNotification restricts to non-interruptive channels during DND', () => {
  const settings: PrivacySettings = {
    channels: { in_app: true, push: true, email: true, sms: true },
    dnd: true,
    quietHours: { enabled: false, start: '00:00', end: '00:00', timezone: 'UTC' },
    minUrgency: 'low'
  };

  const notification: NotificationRequest = { urgency: 'medium', type: 'info' };
  const result = routeNotification(notification, settings);
  assert.deepStrictEqual(result.sort(), ['email', 'in_app'].sort());
});

test('routeNotification bypasses DND for critical urgency', () => {
  const settings: PrivacySettings = {
    channels: { in_app: true, push: true, email: true, sms: true },
    dnd: true,
    quietHours: { enabled: false, start: '00:00', end: '00:00', timezone: 'UTC' },
    minUrgency: 'low'
  };

  const notification: NotificationRequest = { urgency: 'critical', type: 'alert' };
  const result = routeNotification(notification, settings);
  assert.deepStrictEqual(result.sort(), ['email', 'in_app', 'push', 'sms'].sort());
});

test('routeNotification respects channel preferences', () => {
  const settings: PrivacySettings = {
    channels: { in_app: true, push: false, email: true, sms: false },
    dnd: false,
    quietHours: { enabled: false, start: '00:00', end: '00:00', timezone: 'UTC' },
    minUrgency: 'low'
  };

  const notification: NotificationRequest = { urgency: 'medium', type: 'info' };
  const result = routeNotification(notification, settings);
  assert.deepStrictEqual(result.sort(), ['email', 'in_app'].sort());
});

test('routeNotification respects quiet hours', () => {
  const settings: PrivacySettings = {
    channels: { in_app: true, push: true, email: true, sms: true },
    dnd: false,
    quietHours: { enabled: true, start: '22:00', end: '08:00', timezone: 'UTC' },
    minUrgency: 'low'
  };

  const notification: NotificationRequest = { urgency: 'high', type: 'info' };

  // Time is 02:00 UTC (inside quiet hours)
  const timeInside = new Date('2023-10-10T02:00:00Z');
  const resultInside = routeNotification(notification, settings, timeInside);
  assert.deepStrictEqual(resultInside.sort(), ['email', 'in_app'].sort());

  // Time is 12:00 UTC (outside quiet hours)
  const timeOutside = new Date('2023-10-10T12:00:00Z');
  const resultOutside = routeNotification(notification, settings, timeOutside);
  assert.deepStrictEqual(resultOutside.sort(), ['email', 'in_app', 'push', 'sms'].sort());
});
