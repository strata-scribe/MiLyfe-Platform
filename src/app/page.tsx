import Link from 'next/link';
import { ArrowRight, Users, Wallet, Shield, Vote, Heart, BookOpen, Sparkles, TrendingUp, Globe, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createServiceSupabase } from '@/lib/supabase/server';

const FEATURES = [
  { icon: Wallet, title: 'Earn $MLY', description: 'Universal basic income for every citizen. Spend, save, or give back.', accent: 'from-mly-400 to-mly-600', bg: 'bg-mly-50 dark:bg-mly-900/20', iconColor: 'text-mly-600 dark:text-mly-400' },
  { icon: Users, title: 'Connect', description: 'Real relationships with real neighbors. Not followers — connections.', accent: 'from-teal-400 to-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', iconColor: 'text-teal-600 dark:text-teal-400' },
  { icon: Vote, title: 'Govern Together', description: 'Direct democracy. Every voice counts. Propose, vote, build.', accent: 'from-purple-400 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600 dark:text-purple-400' },
  { icon: Shield, title: 'Standing', description: '8 facets of reputation. Earned through action, not popularity.', accent: 'from-harbor-400 to-harbor-600', bg: 'bg-harbor-50 dark:bg-harbor-900/20', iconColor: 'text-harbor-600 dark:text-harbor-400' },
  { icon: Heart, title: 'Health & Wellness', description: 'Check in, track your journey, find resources when you need them.', accent: 'from-rose-400 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', iconColor: 'text-rose-600 dark:text-rose-400' },
  { icon: BookOpen, title: 'Community Wiki', description: 'Shared knowledge. Built by citizens, for citizens.', accent: 'from-indigo-400 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
];

const STEPS = [
  { number: '01', title: 'Sign up free', description: 'Create your citizen profile in 30 seconds. No credit card, no catch.', icon: Sparkles },
  { number: '02', title: 'Earn $MLY from day one', description: 'Receive universal basic income weekly. Spend it, save it, or give it back.', icon: TrendingUp },
  { number: '03', title: 'Shape your city', description: 'Vote on proposals, fund projects, build the community you want to see.', icon: Globe },
];

async function getCitizenCount() {
  try {
    const supabase = createServiceSupabase();
    const { data } = await supabase
      .from('community_treasury')
      .select('citizen_count')
      .single();
    return data?.citizen_count || 12847;
  } catch {
    return 12847;
  }
}

export default async function LandingPage() {
  const citizenCount = await getCitizenCount();

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark overflow-hidden">
      {/* Hero */}
      <header className="relative">
        {/* Aurora / Gradient Mesh Background */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-teal-200/40 via-teal-100/20 to-transparent dark:from-teal-800/20 dark:via-teal-900/10 blur-3xl animate-float" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[60%] h-[70%] rounded-full bg-gradient-to-tr from-mly-200/30 via-mly-100/15 to-transparent dark:from-mly-900/15 dark:via-mly-800/10 blur-3xl animate-float" style={{ animationDelay: '2s', animationDirection: 'reverse' }} />
          <div className="absolute top-[20%] left-[40%] w-[40%] h-[40%] rounded-full bg-gradient-to-b from-harbor-100/20 to-transparent dark:from-harbor-800/10 blur-3xl" />
          {/* Mesh grid overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.02)_1px,transparent_0)] bg-[size:32px_32px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-16 md:pt-12 md:pb-28">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20" aria-label="Landing navigation">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="MiLyfe" className="h-9 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button variant="harbor" size="sm" className="shadow-lg shadow-harbor-500/20">Join</Button>
              </Link>
            </div>
          </nav>

          {/* Hero content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50/80 dark:bg-teal-900/30 border border-teal-200/50 dark:border-teal-700/30 text-sm text-teal-700 dark:text-teal-300 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              {citizenCount.toLocaleString()} citizens and growing
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-balance">
              <span className="text-harbor-800 dark:text-white">Your City. Your </span>
              <span className="bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent">Lyfe.</span>
              <br />
              <span className="bg-gradient-to-r from-harbor-600 via-harbor-700 to-harbor-800 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Your Platform.</span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-balance leading-relaxed">
              A community-owned civic platform where every citizen earns, governs, 
              connects, and thrives. No ads. No algorithms. Just people.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button variant="harbor" size="lg" className="w-full sm:w-auto shadow-xl shadow-harbor-500/25 hover:shadow-harbor-500/40 transition-shadow">
                  Become a citizen
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/transparency">
                <Button variant="outline" size="lg" className="w-full sm:w-auto backdrop-blur-sm">
                  How it works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof Strip */}
      <section className="relative border-y border-gray-100 dark:border-harbor-800 bg-white/50 dark:bg-harbor-950/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
          <div>
            <p className="text-2xl font-bold tabular-nums text-harbor-800 dark:text-white">{citizenCount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Citizens</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-mly-600 dark:text-mly-400">$2.5M</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Treasury</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">35+</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Learning Modules</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400">100%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Community Owned</p>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-32" aria-labelledby="features-heading">
        <div className="text-center mb-16">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-harbor-800 dark:text-white">
            Everything your community needs
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            One platform. No fragmentation. Built by people who believe civic technology should be free.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description, bg, iconColor }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950/50 p-6 hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5"
            >
              <div className={`rounded-xl ${bg} p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-harbor-800 dark:text-white mb-2 text-lg">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative bg-gray-50/50 dark:bg-harbor-900/30 py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-harbor-800 dark:text-white">
              Three steps. Zero barriers.
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              From signup to shaping policy in under a minute.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ number, title, description, icon: Icon }) => (
              <div key={number} className="relative text-center md:text-left">
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold bg-gradient-to-br from-teal-400 to-teal-600 bg-clip-text text-transparent">{number}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-teal-300 to-transparent dark:from-teal-700 hidden md:block" />
                  </div>
                  <div className="rounded-xl bg-white dark:bg-harbor-900 border border-gray-100 dark:border-harbor-800 p-3 w-fit shadow-sm">
                    <Icon className="h-5 w-5 text-teal-500" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-harbor-800 dark:text-white">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-harbor-800 via-harbor-900 to-harbor-950 py-20 md:py-28">
        {/* CTA background decoration */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-mly-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-balance">
            Built for the people who need it most
          </h2>
          <p className="text-harbor-200 mb-10 text-lg text-balance">
            Governed by the people who use it. Built by the people who believe in it.
            Transparent by design. Free forever.
          </p>
          <Link href="/signup">
            <Button variant="mly" size="lg" className="shadow-xl shadow-mly-500/30 hover:shadow-mly-500/50 transition-shadow text-base">
              Join MiLyfe — It&apos;s free
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <img src="/logo.png" alt="MiLyfe" className="h-8 w-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Community-owned. Open source. People-powered. No ads. No algorithms. Just people.
              </p>
            </div>
            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold text-harbor-800 dark:text-white mb-3">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link href="/transparency" className="hover:text-teal-600 transition-colors">Transparency</Link></li>
                <li><Link href="/governance" className="hover:text-teal-600 transition-colors">Governance</Link></li>
                <li><Link href="/wiki" className="hover:text-teal-600 transition-colors">Wiki</Link></li>
                <li><Link href="/safety" className="hover:text-teal-600 transition-colors">Safety</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-harbor-800 dark:text-white mb-3">Community</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="https://github.com/RealMiLyfe/MiLyfe-Platform" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors inline-flex items-center gap-1"><Github className="h-3.5 w-3.5" /> Source Code</a></li>
                <li><Link href="/wiki" className="hover:text-teal-600 transition-colors">Constitution</Link></li>
                <li><Link href="/forum" className="hover:text-teal-600 transition-colors">Forum</Link></li>
                <li><Link href="/news" className="hover:text-teal-600 transition-colors">News</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-100 dark:border-harbor-800 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              &copy; {new Date().getFullYear()} MiLyfe Community. Licensed under MIT. Built with love for the people.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
