'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Store,
  Landmark,
  Wallet,
  Users,
  ShieldCheck,
  Ban,
  HeartHandshake,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export function GuestLanding() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-harbor-950">
      {/* Hero Section */}
      <section className="px-4 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Welcome to MiLyfe</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-harbor-900 dark:text-white mb-6 tracking-tight">
          Your City. Your Lyfe. <br />
          <span className="text-teal-600 dark:text-teal-400">Your Platform.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Explore a community-owned platform where citizens connect, govern, and thrive together.
          Take a look around and see what we're building.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Join the Community
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Explore Features
            </Button>
          </a>
        </div>
      </section>

      {/* Features Tour */}
      <section id="features" className="py-20 bg-white dark:bg-harbor-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-harbor-900 dark:text-white mb-4">
              Everything you need in one place
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Discover the tools designed to empower you and your neighbors.
            </p>
          </div>

          <Tabs defaultValue="marketplace" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 h-auto">
              <TabsTrigger value="marketplace" className="gap-2 py-3">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Marketplace</span>
              </TabsTrigger>
              <TabsTrigger value="governance" className="gap-2 py-3">
                <Landmark className="w-4 h-4" />
                <span className="hidden sm:inline">Governance</span>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-2 py-3">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2 py-3">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marketplace" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Local Marketplace</CardTitle>
                  <CardDescription>Trade goods and services within your community.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      Support local businesses and neighbors. Whether you're offering freelance services,
                      selling homemade goods, or looking for a ride, the marketplace connects you directly
                      with your community without middlemen fees.
                    </p>
                    <Link href="/signup">
                      <Button variant="secondary">Start Trading</Button>
                    </Link>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-harbor-800 w-full rounded-xl aspect-video flex items-center justify-center">
                    <Store className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="governance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Civic Governance</CardTitle>
                  <CardDescription>Have a real say in how your community operates.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      Participate in transparent decision-making. Vote on community initiatives,
                      propose changes, and delegate your voice to trusted neighbors on specific issues
                      through our liquid democracy system.
                    </p>
                    <Link href="/signup">
                      <Button variant="secondary">View Proposals</Button>
                    </Link>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-harbor-800 w-full rounded-xl aspect-video flex items-center justify-center">
                    <Landmark className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Community Wallet</CardTitle>
                  <CardDescription>Manage your $MLY and local economic impact.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      Earn, spend, and save $MLY, our community currency. Participate in the local economy,
                      track your contributions, and support mutual aid funds right from your pocket.
                    </p>
                    <Link href="/signup">
                      <Button variant="secondary">Open Wallet</Button>
                    </Link>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-harbor-800 w-full rounded-xl aspect-video flex items-center justify-center">
                    <Wallet className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meaningful Connection</CardTitle>
                  <CardDescription>Build real relationships in your neighborhood.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      Connect with the people around you. Join interest circles, coordinate neighborhood events,
                      and participate in time-banking and care exchanges without the noise of algorithmic feeds.
                    </p>
                    <Link href="/signup">
                      <Button variant="secondary">Find Neighbors</Button>
                    </Link>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-harbor-800 w-full rounded-xl aspect-video flex items-center justify-center">
                    <Users className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-harbor-900 dark:text-white mb-4">
            A different kind of platform
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Built on principles, not profit motives.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-transparent border-none shadow-none text-center">
            <CardHeader>
              <div className="mx-auto bg-teal-100 dark:bg-teal-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <CardTitle>Community Owned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Governed by the people who use it. Every citizen has a voice in how the platform evolves and operates.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-none shadow-none text-center">
            <CardHeader>
              <div className="mx-auto bg-teal-100 dark:bg-teal-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <CardTitle>Privacy First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Your data stays yours. With local-first architecture and end-to-end encryption options, you control your information.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-none shadow-none text-center">
            <CardHeader>
              <div className="mx-auto bg-teal-100 dark:bg-teal-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Ban className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <CardTitle>No Ads, No Algorithms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                We don't sell your attention. Experience a chronological, human-centered network designed for connection, not addiction.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-teal-900 text-white text-center px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to take part?</h2>
          <p className="text-teal-100 text-lg">
            Create your account today. It takes less than a minute to join your local network.
          </p>
          <div className="pt-4">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-teal-900 hover:text-teal-950">
                Become a Citizen
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
