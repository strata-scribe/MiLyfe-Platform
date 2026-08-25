'use client';

import { useState } from 'react';
import { MiChat } from './mi-chat';

/**
 * Ambient Mi Bubble — Floating action button that expands to a chat drawer.
 * Always present in the bottom-right corner of the platform.
 */
export function MiBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Open Mi assistant"
        >
          <span className="text-2xl">✨</span>
        </button>
      )}

      {/* Chat drawer */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 flex h-[80vh] w-full flex-col md:bottom-6 md:right-6 md:h-[600px] md:w-[400px] md:rounded-xl md:shadow-2xl overflow-hidden border bg-background">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <div>
                <p className="text-sm font-medium">Mi</p>
                <p className="text-xs opacity-80">Your helper</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary-foreground/20"
              aria-label="Close Mi"
            >
              ✕
            </button>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-hidden">
            <MiChat conversationId="ambient" />
          </div>
        </div>
      )}
    </>
  );
}
