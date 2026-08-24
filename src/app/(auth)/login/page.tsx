'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/home');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to your MiLyfe account
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="Your password"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
        )}

        <Button type="submit" variant="harbor" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        New to MiLyfe?{' '}
        <Link href="/signup" className="text-teal-600 hover:underline font-medium">
          Create an account
        </Link>
      </p>
    </div>
  );
}
