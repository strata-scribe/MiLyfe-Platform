'use server';

import { z } from 'zod';
import { action } from './safe-action';

/**
 * Example safe actions — use these patterns across the platform.
 */

export const sendFeedback = action
  .schema(z.object({
    type: z.enum(['bug', 'feature', 'general']),
    message: z.string().min(5, 'Message too short').max(2000),
    email: z.string().email().optional(),
  }))
  .action(async ({ parsedInput }) => {
    // In production: save to DB, send notification
    console.log('[Feedback]', parsedInput);
    return { success: true, message: 'Thank you for your feedback!' };
  });

export const requestMLY = action
  .schema(z.object({
    amount: z.number().min(1).max(1000),
    reason: z.string().min(10).max(500),
    user_id: z.string().uuid(),
  }))
  .action(async ({ parsedInput }) => {
    // In production: create $MLY transfer request
    console.log('[MLY Request]', parsedInput);
    return { success: true, request_id: crypto.randomUUID() };
  });

export const reportContent = action
  .schema(z.object({
    content_id: z.string().uuid(),
    content_type: z.enum(['post', 'comment', 'listing', 'user', 'message']),
    reason: z.enum(['spam', 'harassment', 'misinformation', 'illegal', 'other']),
    details: z.string().max(1000).optional(),
    reporter_id: z.string().uuid(),
  }))
  .action(async ({ parsedInput }) => {
    // In production: save report, notify moderators
    console.log('[Report]', parsedInput);
    return { success: true, report_id: crypto.randomUUID() };
  });

export const joinWaitlist = action
  .schema(z.object({
    email: z.string().email(),
    feature: z.string().min(1),
    name: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    console.log('[Waitlist]', parsedInput);
    return { success: true };
  });
