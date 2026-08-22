'use client';

import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

/**
 * Initialize PostHog analytics.
 * Privacy-respecting: no cookies by default, respects DNT, minimal data collection.
 */
export function initAnalytics() {
  if (initialized || !POSTHOG_KEY || typeof window === 'undefined') return;

  // Respect Do Not Track
  if (navigator.doNotTrack === '1') return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    
    // Privacy settings
    persistence: 'localStorage', // No cookies
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // Manual events only — no auto-capturing clicks
    
    // Disable session recording unless opted in
    disable_session_recording: true,
    
    // Don't send IP addresses
    ip: false,
    
    // Respect user opt-out
    opt_out_capturing_by_default: false,
    respect_dnt: true,

    // Reduce data collection
    property_denylist: ['$current_url', '$referrer', '$referring_domain'],

    loaded: (ph) => {
      // Disable in development
      if (process.env.NODE_ENV === 'development') {
        ph.opt_out_capturing();
      }
    },
  });

  initialized = true;
}

/**
 * Track a custom event
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized || typeof window === 'undefined') return;
  posthog.capture(event, properties);
}

/**
 * Identify a user (after login)
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!initialized || typeof window === 'undefined') return;
  posthog.identify(userId, properties);
}

/**
 * Reset identity (on logout)
 */
export function resetAnalytics() {
  if (!initialized || typeof window === 'undefined') return;
  posthog.reset();
}

/**
 * Opt user out of analytics
 */
export function optOut() {
  if (typeof window === 'undefined') return;
  posthog.opt_out_capturing();
}

/**
 * Opt user back into analytics
 */
export function optIn() {
  if (typeof window === 'undefined') return;
  posthog.opt_in_capturing();
}

// Pre-defined event names for consistency
export const EVENTS = {
  // Auth
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',

  // Engagement
  HEALTH_CHECKIN: 'health_checkin',
  ISSUE_REPORTED: 'issue_reported',
  VOTE_CAST: 'vote_cast',
  MLY_SENT: 'mly_sent',
  MLY_RECEIVED: 'mly_received',

  // Content
  MEDIA_UPLOADED: 'media_uploaded',
  COURSE_STARTED: 'course_started',
  COURSE_COMPLETED: 'course_completed',

  // Social
  MESSAGE_SENT: 'message_sent',
  FEED_POST: 'feed_post',
  SHOP_LISTING: 'shop_listing',
  SHOP_PURCHASE: 'shop_purchase',

  // Features
  VOICE_NAV_USED: 'voice_nav_used',
  SEARCH_USED: 'search_used',
  PDF_EXPORTED: 'pdf_exported',
  TTS_USED: 'tts_used',
} as const;
