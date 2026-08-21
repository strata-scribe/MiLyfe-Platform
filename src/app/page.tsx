import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center">
        {/* Real Logo */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="MiLyfe"
            width={205}
            height={75}
            priority
            className="h-16 md:h-20 w-auto"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-harbor-800 dark:text-white mb-4 text-balance leading-tight">
          Your City. Your Life.
          <br />
          <span className="text-teal-500">Your Platform.</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-8 md:mb-10 text-balance">
          One app for civic engagement, health, community commerce, and mutual aid.
          Powered by <strong className="text-mly-600">$MLY</strong> — worth $1 each. Earn by participating.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/signup" className="btn-teal text-center text-lg px-8 py-4">
            Join Free
          </Link>
          <Link href="/login" className="btn-primary text-center text-lg px-8 py-4">
            Sign In
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">$0 to start. Free forever. Community-owned.</p>
      </section>

      {/* What You Get */}
      <section className="px-6 py-12 md:py-16 bg-gray-50 dark:bg-harbor-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-harbor-800 dark:text-white text-center mb-8">
            Everything your community needs. One app.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {[
              { icon: '🏛️', name: 'City', desc: 'Report issues. Vote. Shape policy.' },
              { icon: '💰', name: 'Pocket', desc: '$MLY wallet. Shop local. Rideshare.' },
              { icon: '📚', name: 'Learn', desc: 'Know your rights. Build skills.' },
              { icon: '🤝', name: 'Aid', desc: 'Help neighbors. Get help.' },
              { icon: '🎬', name: 'Media', desc: 'Video. Music. Radio. Podcasts.' },
            ].map((app) => (
              <div key={app.name} className="card text-center hover:scale-105 transition-transform p-4 md:p-6">
                <div className="text-3xl md:text-4xl mb-2">{app.icon}</div>
                <h3 className="font-bold text-harbor-800 dark:text-white text-sm md:text-base">{app.name}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MLY Value Prop */}
      <section className="px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-harbor-800 dark:text-white mb-6">
            <span className="text-mly-500">$MLY</span> = $1 USD
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-2xl font-bold text-teal-500">+$10</p>
              <p className="text-sm text-gray-500 mt-1">Daily UBI for active members</p>
            </div>
            <div className="card p-5">
              <p className="text-2xl font-bold text-teal-500">+$5</p>
              <p className="text-sm text-gray-500 mt-1">Every health check-in</p>
            </div>
            <div className="card p-5">
              <p className="text-2xl font-bold text-teal-500">+$10</p>
              <p className="text-sm text-gray-500 mt-1">Report a city issue</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Spend at local businesses. Exchange peer-to-peer. Your money. Your rules.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center border-t border-gray-100 dark:border-harbor-800">
        <Image
          src="/logo.png"
          alt="MiLyfe"
          width={120}
          height={44}
          className="h-8 w-auto mx-auto mb-3 opacity-60"
        />
        <p className="text-xs text-gray-400">
          Decentralized. Community-Owned. People-Powered. Protected by the Constitution.
        </p>
      </footer>
    </main>
  );
}
