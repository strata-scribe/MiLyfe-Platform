'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Award, Star, Heart, Target, Lightbulb, MapPin, CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

export type JourneyCategory = 'milestone' | 'contribution' | 'attestation' | 'quest' | 'all';

export interface JourneyItem {
  id: string;
  type: JourneyCategory;
  title: string;
  description: string;
  date: string;
  icon?: React.ReactNode;
  metadata?: any;
}

interface JourneyTimelineProps {
  items: JourneyItem[];
}

const CATEGORIES: { id: JourneyCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'milestone', label: 'Milestones' },
  { id: 'contribution', label: 'Contributions' },
  { id: 'attestation', label: 'Attestations' },
  { id: 'quest', label: 'Quests' },
];

const getTypeIcon = (type: JourneyCategory) => {
  switch (type) {
    case 'milestone': return <Award className="w-5 h-5 text-amber-500" />;
    case 'contribution': return <Heart className="w-5 h-5 text-rose-500" />;
    case 'attestation': return <Star className="w-5 h-5 text-purple-500" />;
    case 'quest': return <Target className="w-5 h-5 text-blue-500" />;
    default: return <Lightbulb className="w-5 h-5 text-gray-500" />;
  }
};

const getTypeColor = (type: JourneyCategory) => {
  switch (type) {
    case 'milestone': return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    case 'contribution': return 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
    case 'attestation': return 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800';
    case 'quest': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    default: return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  }
};

export function JourneyTimeline({ items }: JourneyTimelineProps) {
  const [filter, setFilter] = useState<JourneyCategory>('all');

  // Sort items descending
  const sortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter items
  const filteredItems = filter === 'all' ? sortedItems : sortedItems.filter(item => item.type === filter);

  // Group by month/year
  const groupedItems = filteredItems.reduce((acc, item) => {
    const dateObj = new Date(item.date);
    const monthYear = format(dateObj, 'MMMM yyyy');
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(item);
    return acc;
  }, {} as Record<string, JourneyItem[]>);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">

      {/* Filters */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-border/50">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setFilter(category.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === category.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative space-y-8">

        {/* Continuous Line */}
        <div className="absolute left-[27px] top-4 bottom-0 w-0.5 bg-border -z-10" />

        {Object.entries(groupedItems).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No journey events found for this category.
          </div>
        )}

        {Object.entries(groupedItems).map(([monthYear, monthItems], groupIndex) => (
          <div key={monthYear} className="relative z-0 space-y-6">

            {/* Date Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 shrink-0 flex justify-end">
                <div className="bg-background px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {format(new Date(monthItems[0].date), 'MMM')}
                </div>
              </div>
              <div className="flex-1 text-sm font-semibold text-foreground/80">
                {format(new Date(monthItems[0].date), 'yyyy')}
              </div>
            </div>

            {/* Items for this month */}
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {monthItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex gap-4 group relative z-10"
                  >
                    {/* Node */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center border-4 border-background shadow-sm",
                        getTypeColor(item.type)
                      )}>
                        {item.icon || getTypeIcon(item.type)}
                      </div>
                    </div>

                    {/* Content Card */}
                    <Card className="flex-1 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <span className="text-xs text-muted-foreground shrink-0 mt-1 sm:mt-0 bg-muted px-2 py-1 rounded-md inline-flex items-center w-max">
                          {format(new Date(item.date), 'MMM d, h:mm a')}
                        </span>
                      </div>

                      <p className="text-muted-foreground text-sm">
                        {item.description}
                      </p>

                      {/* Optional Location/Metadata display */}
                      {item.metadata?.location && (
                         <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{item.metadata.location}</span>
                         </div>
                      )}

                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
