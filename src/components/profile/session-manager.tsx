'use client';

import { useState } from 'react';
import { Shield, LogOut, Key, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signOutOtherSessions, signOutEverywhere, changePassword } from '@/lib/actions/session';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function SessionManager() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSignOutOthers() {
    setLoading('others');
    const result = await signOutOtherSessions();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('All other sessions have been signed out');
    }
    setLoading(null);
  }

  async function handleSignOutAll() {
    if (!confirm('This will sign you out everywhere, including this device. Continue?')) return;
    setLoading('all');
    const result = await signOutEverywhere();
    if (result.error) {
      toast.error(result.error);
    } else {
      router.push('/login');
    }
    setLoading(null);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading('password');
    const result = await changePassword(newPassword);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Password changed. All other sessions revoked.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    }
    setLoading(null);
  }

  return (
    <div className="rounded-xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-5 space-y-4">
      <h2 className="font-semibold text-harbor-800 dark:text-white flex items-center gap-2">
        <Shield className="h-4 w-4 text-teal-500" aria-hidden="true" />
        Security & Sessions
      </h2>

      <div className="space-y-3">
        {/* Sign out other sessions */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50 dark:bg-harbor-900/50">
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Sign out other devices</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Keep this session, sign out all others</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOutOthers}
            disabled={loading === 'others'}
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            {loading === 'others' ? 'Working...' : 'Sign out others'}
          </Button>
        </div>

        {/* Sign out everywhere */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50 dark:bg-harbor-900/50">
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Sign out everywhere</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sign out on all devices including this one</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSignOutAll}
            disabled={loading === 'all'}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            {loading === 'all' ? 'Working...' : 'Sign out all'}
          </Button>
        </div>

        {/* Change password */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-harbor-900/50">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-harbor-800 dark:text-white">Change password</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Updates password and revokes other sessions</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                <Key className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Change
              </Button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label htmlFor="new-password" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  New password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Confirm password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={loading === 'password'}>
                  {loading === 'password' ? 'Saving...' : 'Update password'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
