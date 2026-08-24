import Link from 'next/link';
import { ArrowRight, Users, Wallet, Shield, Vote, Heart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  { icon: Wallet, title: 'Earn $MLY', description: 'Universal basic income for every citizen. Spend, save, or give back.' },
  { icon: Users, title: 'Connect', description: 'Real relationships with real neighbors. Not followers — connections.' },
  { icon: Vote, title: 'Govern Together', description: 'Direct democracy. Every voice counts. Propose, vote, build.' },
  { icon: Shield, title: 'Standing', description: '8 facets of reputation. Earned through action, not popularity.' },
  { icon: Heart, title: 'Health & Wellness', description: 'Check in, track your journey, find resources when you need them.' },
  { icon: BookOpen, title: 'Community Wiki', description: 'Shared knowledge. Built by citizens, for citizens.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-20 md:pt-20 md:pb-32 text-center">
          <nav className="flex items-center justify-between mb-16" aria-label="Landing navigation">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-harbor-800 dark:text-white">Mi</span>
              <span className="text-2xl font-bold text-teal-500">Lyfe</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button variant="harbor" size="sm">Join</Button>
              </Link>
            </div>
          </nav>

          <h1 className="text-4xl md:text-6xl font-bold text-harbor-800 dark:text-white leading-tight text-balance">
            Your City. Your Life.{' '}
            <span className="text-teal-500">Your Platform.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-balance">
            A community-owned civic platform where every citizen earns, governs, 
            connects, and thrives. No ads. No algorithms. Just people.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button variant="harbor" size="lg" className="w-full sm:w-auto">
                Become a citizen
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/wiki">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Learn more
              </Button>
            </Link>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-teal-100/30 dark:bg-teal-900/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-mly-100/30 dark:bg-mly-900/10 blur-3xl" aria-hidden="true" />
      </header>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-4 pb-20 md:pb-32" aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card group">
              <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 p-2.5 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-harbor-800 dark:text-white mb-1">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-harbor-800 dark:bg-harbor-900 py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-balance">
            Built for the people who need it most
          </h2>
          <p className="text-harbor-200 mb-8 text-balance">
            Governed by the people who use it. Built by the people who believe in it.
          </p>
          <Link href="/signup">
            <Button variant="mly" size="lg">
              Join MiLyfe — It&apos;s free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Community-owned. Open source. People-powered.
        </p>
      </footer>
    </div>
  );
}
