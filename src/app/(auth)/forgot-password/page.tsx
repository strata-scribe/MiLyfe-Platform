'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Check your email</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            We sent a password reset link to <strong>{email}</strong>. Click it to set a new password.
          </p>
          <Link href="/login" className="btn-primary inline-block mt-6">Back to Sign In</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="MiLyfe" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Reset Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Enter your email and we&apos;ll send a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required autoComplete="email" />
          </div>
          <button type="submit" disabled={loading} className="btn-teal w-full disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password? <Link href="/login" className="text-teal-500 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
