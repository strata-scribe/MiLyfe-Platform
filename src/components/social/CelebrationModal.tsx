"use client";

import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerCelebration, CelebrationType } from '@/lib/celebrations';
import { Button } from '@/components/ui/button';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  celebrationType?: CelebrationType;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  celebrationType = 'milestone',
}) => {
  useEffect(() => {
    if (isOpen) {
      triggerCelebration(celebrationType);
    }
  }, [isOpen, celebrationType]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-harbor-800 bg-white dark:bg-harbor-950 p-6 shadow-lg duration-200 sm:rounded-2xl"
              >
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  {icon && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                      className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-full text-teal-600 dark:text-teal-400"
                    >
                      {icon}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Dialog.Title className="text-2xl font-bold tracking-tight text-harbor-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="text-gray-500 dark:text-gray-400">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>

                  <div className="pt-4 w-full">
                    <Button onClick={onClose} className="w-full" variant="mly">
                      Awesome!
                    </Button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
