'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/onboarding');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <img src="/logo.png" alt="MiLyfe" className="h-10 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">
          Join MiLyfe
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Your city. Your life. Your platform.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-harbor-800 dark:text-gray-200 mb-1">
            Username
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="your_username"
            required
            autoComplete="username"
            minLength={3}
            maxLength={24}
            pattern="[a-z0-9_]+"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-harbor-800 dark:text-gray-200 mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-harbor-800 dark:text-gray-200 mb-1">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
        )}

        <Button type="submit" variant="harbor" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-teal-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
