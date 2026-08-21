import { TopBar } from '@/components/shell/top-bar';
import { BottomNav } from '@/components/shell/bottom-nav';
import { MiButton } from '@/components/mi/mi-button';
import { MiPanel } from '@/components/mi/mi-panel';
import { AuthProvider } from '@/components/shell/auth-provider';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen pb-20 pt-14">
        <TopBar />
        <main className="max-w-lg mx-auto px-4 py-4">
          {children}
        </main>
        <MiButton />
        <MiPanel />
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
