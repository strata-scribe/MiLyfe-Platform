import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Logo / Brand Mark */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-harbor-800 via-teal-500 to-mly-500 flex items-center justify-center mb-8 animate-float">
          <span className="text-3xl font-bold text-white">Mi</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-harbor-800 dark:text-white mb-4 text-balance">
          Your City. Your Life.
          <br />
          <span className="text-teal-500">Your Platform.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10 text-balance">
          One app for civic engagement, health, community commerce, and mutual aid.
          Built by the people, for the people.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" className="btn-primary text-center">
            Get Started
          </Link>
          <Link href="/login" className="btn-teal text-center">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-harbor-950">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { icon: '🏛️', name: 'MiCity', desc: 'Report issues. Vote on change. Shape your block.' },
            { icon: '💚', name: 'MiHealth', desc: 'Track wellness. Check in. Get support.' },
            { icon: '🛍️', name: 'MiShop', desc: 'Buy local with $MLY credits. Support neighbors.' },
            { icon: '💬', name: 'MiConnect', desc: 'Message your community. Find your people.' },
            { icon: '🔐', name: 'MiVault', desc: 'Secure your ID. Own your documents.' },
          ].map((app) => (
            <div key={app.name} className="card text-center hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">{app.icon}</div>
              <h3 className="font-bold text-harbor-800 dark:text-white mb-1">{app.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{app.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>MiLyfe Platform — Decentralized. Community-Owned. People-Powered.</p>
        <p className="mt-1">$0 to start. Free forever for citizens.</p>
      </footer>
    </main>
  );
}
