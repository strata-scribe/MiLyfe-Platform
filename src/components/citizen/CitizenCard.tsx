'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
  Download,
  RotateCw,
  QrCode,
  Shield,
  Heart,
  Hammer,
  BookOpen,
  Eye,
  Megaphone,
  Store,
  HandHelping,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Facet {
  name: string;
  icon: React.ReactNode;
  level: number;
}

interface CitizenCardProps {
  citizen: {
    id: string;
    name: string;
    handle: string;
    joinDate: string;
    avatarUrl?: string;
    facets?: Facet[];
  };
  className?: string;
}

const DEFAULT_FACETS: Facet[] = [
  { name: 'Neighbor', icon: <Heart className="w-4 h-4" />, level: 3 },
  { name: 'Maker', icon: <Hammer className="w-4 h-4" />, level: 5 },
  { name: 'Teacher', icon: <BookOpen className="w-4 h-4" />, level: 2 },
  { name: 'Keeper', icon: <Shield className="w-4 h-4" />, level: 4 },
  { name: 'Voice', icon: <Megaphone className="w-4 h-4" />, level: 1 },
  { name: 'Shop', icon: <Store className="w-4 h-4" />, level: 0 },
  { name: 'Helper', icon: <HandHelping className="w-4 h-4" />, level: 6 },
  { name: 'Carer', icon: <Eye className="w-4 h-4" />, level: 2 },
];

export function CitizenCard({ citizen, className }: CitizenCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (cardRef.current === null) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: 'transparent',
      });
      const link = document.createElement('a');
      link.download = `citizen-card-${citizen.handle}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export citizen card', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const facets = citizen.facets || DEFAULT_FACETS;

  return (
    <div className={cn("relative group", className)} style={{ perspective: '1000px' }}>
      <motion.div
        ref={cardRef}
        className="w-full max-w-sm mx-auto h-[500px] relative cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={handleFlip}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front of Card */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -z-10" />

          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <Avatar
                src={citizen.avatarUrl}
                name={citizen.name}
                size="lg"
                className="border-2 border-indigo-500/30"
              />
              <div>
                <h3 className="font-bold text-xl leading-tight">{citizen.name}</h3>
                <p className="text-indigo-400 font-medium">@{citizen.handle}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Joined</p>
            <p className="text-sm font-medium">{new Date(citizen.joinDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="flex-grow">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Standing Facets</p>
            <div className="grid grid-cols-2 gap-3">
              {facets.map((facet, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-2 border border-slate-700/30">
                  <div className="text-indigo-400">
                    {facet.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-medium text-slate-300">{facet.name}</span>
                      <span className="text-slate-500 font-mono">Lv.{facet.level}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min((facet.level / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-700/50">
             <div className="flex items-center space-x-1 text-slate-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>MiLyfe Verified</span>
             </div>
             <RotateCw className="w-4 h-4 text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Back of Card */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-bl from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-2xl border border-slate-700/50 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
            <div className="text-center mb-8">
              <h3 className="font-bold text-xl mb-1">{citizen.name}</h3>
              <p className="text-slate-400 text-sm">Citizen ID: {citizen.id}</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-inner mb-8">
               <div className="w-48 h-48 bg-slate-100 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300">
                  <div className="text-center text-slate-400">
                    <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <span className="text-sm font-medium">Scan to Verify</span>
                  </div>
               </div>
            </div>

            <div className="w-full mt-auto pt-4 border-t border-slate-700/50 flex justify-center">
              <RotateCw className="w-4 h-4 text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
      </motion.div>

      {/* Export Action */}
      <div className="mt-6 flex justify-center">
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleExport();
          }}
          disabled={isExporting}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export as PNG'}
        </Button>
      </div>
    </div>
  );
}
