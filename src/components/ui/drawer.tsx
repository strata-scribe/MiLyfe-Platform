'use client';

import * as React from 'react';
import { Drawer as VaulDrawer } from 'vaul';
import { cn } from '@/lib/utils/cn';

/**
 * Mobile-native bottom sheet/drawer powered by Vaul.
 * Swipe to dismiss, spring physics, nested scrolling.
 */

const Drawer = ({ ...props }: React.ComponentProps<typeof VaulDrawer.Root>) => (
  <VaulDrawer.Root shouldScaleBackground {...props} />
);

const DrawerTrigger = VaulDrawer.Trigger;
const DrawerPortal = VaulDrawer.Portal;
const DrawerClose = VaulDrawer.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Overlay>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Overlay>
>(({ className, ...props }, ref) => (
  <VaulDrawer.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm', className)}
    {...props}
  />
));
DrawerOverlay.displayName = 'DrawerOverlay';

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Content>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <VaulDrawer.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-2xl border-t border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950',
        className
      )}
      {...props}
    >
      {/* Drag handle */}
      <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-gray-300 dark:bg-harbor-700" />
      <div className="max-h-[85vh] overflow-y-auto px-4 pb-6">
        {children}
      </div>
    </VaulDrawer.Content>
  </DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('pb-3', className)} {...props} />
);

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Title>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Title>
>(({ className, ...props }, ref) => (
  <VaulDrawer.Title
    ref={ref}
    className={cn('text-lg font-bold text-harbor-800 dark:text-white', className)}
    {...props}
  />
));
DrawerTitle.displayName = 'DrawerTitle';

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Description>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Description>
>(({ className, ...props }, ref) => (
  <VaulDrawer.Description
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));
DrawerDescription.displayName = 'DrawerDescription';

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
};
