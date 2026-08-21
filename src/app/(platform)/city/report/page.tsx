'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { ImageCapture } from '@/components/ui/image-capture';

const categories = [
  { value: 'infrastructure', label: 'Infrastructure', icon: '🔧', desc: 'Roads, lights, water' },
  { value: 'safety', label: 'Safety', icon: '⚠️', desc: 'Hazards, crosswalks' },
  { value: 'environment', label: 'Environment', icon: '🌱', desc: 'Dumping, pollution' },
  { value: 'community', label: 'Community', icon: '🤝', desc: 'Noise, disputes' },
  { value: 'transit', label: 'Transit', icon: '🚌', desc: 'Buses, routes, stops' },
];

export default function ReportIssuePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { user } = useAppStore();
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to report an issue.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }

    setLoading(true);
    setError('');

    // Get location if available
    let lat: number | null = null;
    let lng: number | null = null;

    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Location not available — that's fine
      }
    }

    // Upload image if provided
    let imageUrl: string | null = null;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('issues')
        .upload(fileName, imageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('issues')
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from('city_issues').insert({
      reporter_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      address: address.trim() || null,
      location_lat: lat,
      location_lng: lng,
      image_url: imageUrl,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      // Award MLY for reporting
      await supabase.from('mly_transactions').insert({
        to_id: user.id,
        amount: 10,
        type: 'earn',
        description: 'Reported a city issue',
      });

      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 animate-slide-up text-center py-12">
        <div className="text-6xl">📋</div>
        <h1 className="text-2xl font-bold text-harbor-800 dark:text-white">Issue Reported!</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Your community thanks you. +10 $MLY earned.
        </p>
        <p className="text-sm text-gray-400">
          Your neighbors can now upvote this issue to raise its priority.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setCategory(''); setAddress(''); }} className="btn-teal">
            Report Another
          </button>
          <button onClick={() => router.push('/city')} className="btn-primary">
            Back to MiCity
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <button onClick={() => router.back()} className="text-sm text-teal-500 mb-2 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Report an Issue</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Help your neighborhood. Earn $MLY. Make change happen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What type of issue?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all',
                  category === cat.value
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-gray-200 dark:border-harbor-700 hover:border-gray-300'
                )}
              >
                <span className="text-xl">{cat.icon}</span>
                <p className="text-sm font-medium text-harbor-800 dark:text-white mt-1">{cat.label}</p>
                <p className="text-xs text-gray-500">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            What&apos;s the problem? (short)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="e.g., Broken streetlight on 5th Ave"
            required
            maxLength={120}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Details (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field resize-none h-24"
            placeholder="Any extra info that helps — how long it's been there, who it affects, etc."
            maxLength={500}
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location / Address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
            placeholder="e.g., Corner of MLK Blvd and 3rd St"
          />
          <p className="text-xs text-gray-400 mt-1">
            We&apos;ll also capture your GPS (if you allow it) for accuracy.
          </p>
        </div>

        {/* Image Capture */}
        <ImageCapture
          onImageSelected={(file) => setImageFile(file)}
          onClear={() => setImageFile(null)}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !title.trim() || !category}
          className="btn-teal w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Report (+10 MLY)'}
        </button>
      </form>
    </div>
  );
}
