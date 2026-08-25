'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { completeOnboarding } from '@/lib/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, ArrowRight, MapPin, User, Sparkles } from 'lucide-react';

const STEPS = ['Profile', 'Neighborhood', 'Welcome'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    // Final step — use server action (claims welcome reward + updates profile)
    startTransition(async () => {
      const result = await completeOnboarding({
        display_name: displayName,
        bio,
        neighborhood: neighborhood || undefined,
        interests: [],
      });

      if (result.success) {
        router.push('/home');
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step
                  ? 'bg-teal-500 text-white'
                  : i === step
                  ? 'bg-harbor-800 text-white'
                  : 'bg-gray-200 dark:bg-harbor-800 text-gray-500'
              }`}
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 ${i < step ? 'bg-teal-500' : 'bg-gray-200 dark:bg-harbor-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card space-y-6">
        {step === 0 && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                <User className="h-5 w-5 text-teal-600" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-harbor-800 dark:text-white">Tell us about you</h1>
                <p className="text-sm text-gray-500">How should the community know you?</p>
              </div>
            </div>
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium mb-1">Display Name</label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">Short Bio</label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What brings you to MiLyfe?"
                maxLength={200}
              />
              <p className="text-xs text-gray-400 mt-1">{bio.length}/200</p>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                <MapPin className="h-5 w-5 text-teal-600" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-harbor-800 dark:text-white">Your Neighborhood</h1>
                <p className="text-sm text-gray-500">Optional — helps connect you locally</p>
              </div>
            </div>
            <div>
              <label htmlFor="neighborhood" className="block text-sm font-medium mb-1">Neighborhood</label>
              <Input
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="e.g., Downtown, Eastside, Oak Park..."
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="text-center py-4">
            <div className="inline-flex p-3 rounded-full bg-mly-100 dark:bg-mly-900/20 mb-4">
              <Sparkles className="h-8 w-8 text-mly-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-harbor-800 dark:text-white mb-2">
              Welcome to MiLyfe!
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              You&apos;ve received <span className="font-bold text-mly-600">50 $MLY</span> to get started.
              Check your wallet, explore the community, and make your first connection.
            </p>
            <div className="bg-gray-50 dark:bg-harbor-900 rounded-xl p-4 text-left space-y-2">
              <p className="text-sm font-medium text-harbor-800 dark:text-white">What&apos;s next:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Check your Wallet for your welcome $MLY</li>
                <li>• Visit the Forum to introduce yourself</li>
                <li>• Explore your Standing facets</li>
                <li>• Connect with neighbors</li>
              </ul>
            </div>
          </div>
        )}

        <Button onClick={handleNext} variant="harbor" size="lg" className="w-full" disabled={isPending}>
          {step < STEPS.length - 1 ? (
            <>Next <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></>
          ) : isPending ? 'Setting up...' : (
            <>Enter MiLyfe <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
