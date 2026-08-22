'use client';

import { trackEvent, EVENTS } from './posthog';

/**
 * Pre-built tracking functions for common platform actions.
 * Import and call these from the relevant pages.
 */

export function trackHealthCheckin(mood: number, streak: number) {
  trackEvent(EVENTS.HEALTH_CHECKIN, { mood, streak });
}

export function trackIssueReported(category: string) {
  trackEvent(EVENTS.ISSUE_REPORTED, { category });
}

export function trackVoteCast(proposalId: string) {
  trackEvent(EVENTS.VOTE_CAST, { proposal_id: proposalId });
}

export function trackMLYSent(amount: number) {
  trackEvent(EVENTS.MLY_SENT, { amount });
}

export function trackMLYReceived(amount: number, source: string) {
  trackEvent(EVENTS.MLY_RECEIVED, { amount, source });
}

export function trackMediaUploaded(type: string, category: string) {
  trackEvent(EVENTS.MEDIA_UPLOADED, { type, category });
}

export function trackCourseStarted(courseId: string, title: string) {
  trackEvent(EVENTS.COURSE_STARTED, { course_id: courseId, title });
}

export function trackCourseCompleted(courseId: string, title: string) {
  trackEvent(EVENTS.COURSE_COMPLETED, { course_id: courseId, title });
}

export function trackMessageSent() {
  trackEvent(EVENTS.MESSAGE_SENT);
}

export function trackFeedPost(type: string) {
  trackEvent(EVENTS.FEED_POST, { type });
}

export function trackShopListing(category: string, price: number) {
  trackEvent(EVENTS.SHOP_LISTING, { category, price });
}

export function trackShopPurchase(price: number) {
  trackEvent(EVENTS.SHOP_PURCHASE, { price });
}

export function trackVoiceNavUsed(command: string, matched: boolean) {
  trackEvent(EVENTS.VOICE_NAV_USED, { command, matched });
}

export function trackSearchUsed(query: string, results: number) {
  trackEvent(EVENTS.SEARCH_USED, { query_length: query.length, results });
}

export function trackPdfExported() {
  trackEvent(EVENTS.PDF_EXPORTED);
}

export function trackTTSUsed(section: string) {
  trackEvent(EVENTS.TTS_USED, { section });
}

// Generic custom event
export function track(event: string, props?: Record<string, unknown>) {
  trackEvent(event, props);
}
