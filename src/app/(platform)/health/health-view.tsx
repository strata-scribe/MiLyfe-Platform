'use client';

import { useState } from 'react';
import { Heart, Smile, Meh, Frown, Zap, Moon, Plus, MapPin, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Tables } from '@/types/database';

const MOOD_ICONS = ['😫', '😔', '😐', '🙂', '😁'];
const MOOD_LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Great'];

interface Props {
  userId: string;
  checkins: Tables<'health_checkins'>[];
  resources: Tables<'health_resources'>[];
}

export function HealthView({ userId, checkins, resources }: Props) {
  const [showCheckin, setShowCheckin] = useState(false);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toDateString();
  const hasCheckedInToday = checkins.some(
    (c) => new Date(c.created_at).toDateString() === today
  );

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.from('health_checkins').insert({
      user_id: userId,
      mood,
      energy,
      sleep_hours: sleep ? parseFloat(sleep) : null,
      notes: notes.trim() || '',
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check-in recorded!');
      setShowCheckin(false);
      setNotes('');
    }
    setSubmitting(false);
  }

  // Calculate streak
  const streak = (() => {
    let count = 0;
    const dates = checkins.map(c => new Date(c.created_at).toDateString());
    const uniqueDates = Array.from(new Set(dates));
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      if (uniqueDates.includes(d.toDateString())) {
        count++;
      } else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Health</h1>
        <p className="page-subtitle">Track your wellness, find resources</p>
      </div>

      <Tabs defaultValue="checkin">
        <TabsList className="w-full">
          <TabsTrigger value="checkin" className="flex-1">Check-in</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="checkin">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="text-center py-4">
              <p className="text-2xl font-bold text-teal-600">{streak}</p>
              <p className="text-xs text-gray-500">Day streak</p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-2xl font-bold text-harbor-800 dark:text-white">{checkins.length}</p>
              <p className="text-xs text-gray-500">Total check-ins</p>
            </Card>
          </div>

          {hasCheckedInToday && !showCheckin ? (
            <Card className="text-center py-8">
              <Heart className="h-8 w-8 text-teal-500 mx-auto mb-2" aria-hidden="true" />
              <p className="font-medium text-harbor-800 dark:text-white">You&apos;ve checked in today</p>
              <p className="text-sm text-gray-500 mt-1">Come back tomorrow for your streak</p>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-teal-500" aria-hidden="true" />
                  Daily Check-in
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCheckin} className="space-y-5">
                  {/* Mood */}
                  <div>
                    <label className="text-sm font-medium block mb-2">How are you feeling?</label>
                    <div className="flex justify-between" role="radiogroup" aria-label="Mood level">
                      {MOOD_ICONS.map((icon, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setMood(i + 1)}
                          className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                            mood === i + 1
                              ? 'bg-teal-50 dark:bg-teal-900/20 scale-110'
                              : 'hover:bg-gray-50 dark:hover:bg-harbor-900'
                          }`}
                          aria-label={MOOD_LABELS[i]}
                          aria-pressed={mood === i + 1}
                        >
                          <span className="text-2xl">{icon}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5">{MOOD_LABELS[i]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Energy */}
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      <Zap className="h-3.5 w-3.5 inline mr-1 text-mly-500" aria-hidden="true" />
                      Energy level (1-5)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setEnergy(val)}
                          className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                            energy === val
                              ? 'bg-mly-500 text-harbor-900'
                              : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-400'
                          }`}
                          aria-pressed={energy === val}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep */}
                  <div>
                    <label htmlFor="sleep" className="text-sm font-medium block mb-2">
                      <Moon className="h-3.5 w-3.5 inline mr-1 text-indigo-500" aria-hidden="true" />
                      Hours slept (optional)
                    </label>
                    <input
                      id="sleep"
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={sleep}
                      onChange={(e) => setSleep(e.target.value)}
                      className="w-24 h-10 rounded-xl border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-950 px-3 text-sm"
                      placeholder="7.5"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="text-sm font-medium block mb-2">Notes (optional)</label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything on your mind..."
                      maxLength={300}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Check-in'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          {checkins.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No check-ins yet. Start your wellness journey today.</p>
          ) : (
            <div className="space-y-2">
              {checkins.map((c) => (
                <Card key={c.id} className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{MOOD_ICONS[c.mood - 1]}</span>
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(c.created_at), 'MMM d, yyyy')}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {c.energy && <span>⚡ {c.energy}/5</span>}
                          {c.sleep_hours && <span>🌙 {c.sleep_hours}h</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{MOOD_LABELS[c.mood - 1]}</Badge>
                  </div>
                  {c.notes && <p className="text-xs text-gray-500 mt-2 ml-10">{c.notes}</p>}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources">
          {resources.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No resources listed yet.</p>
          ) : (
            <div className="space-y-3">
              {resources.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{r.name}</h3>
                        <Badge variant="secondary" className="capitalize mt-1 text-[10px]">
                          {r.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      {r.accepts_mly && <Badge variant="mly">$MLY</Badge>}
                    </div>
                    {r.description && (
                      <p className="text-xs text-gray-500 mt-2">{r.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {r.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden="true" />{r.address}
                        </span>
                      )}
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="flex items-center gap-1 text-teal-600 hover:underline">
                          <Phone className="h-3 w-3" aria-hidden="true" />{r.phone}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
