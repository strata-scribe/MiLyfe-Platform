'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateListingStatus } from '@/lib/actions/street';
import { toast } from 'sonner';

interface ListingDetailViewProps {
  listing: any;
  userId: string;
}

export function ListingDetailView({ listing, userId }: ListingDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isOwner = listing.seller_id === userId;
  const seller = listing.profiles;

  function handleMarkSold() {
    startTransition(async () => {
      const result = await updateListingStatus(listing.id, 'sold');
      if (result.error) toast.error(result.error);
      else { toast.success('Marked as sold'); router.refresh(); }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await updateListingStatus(listing.id, 'removed');
      if (result.error) toast.error(result.error);
      else { toast.success('Listing removed'); router.push('/street'); }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Link href="/street" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to Street
      </Link>

      {/* Images */}
      {listing.images && listing.images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
          {listing.images.map((url: string, i: number) => (
            <img
              key={i}
              src={url}
              alt={`${listing.title} photo ${i + 1}`}
              className={`w-full object-cover ${i === 0 ? 'col-span-2 h-64' : 'h-40'}`}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-6xl">
          📦
        </div>
      )}

      {/* Title + Price */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="capitalize">{listing.category}</span>
            {listing.condition && (
              <>
                <span>·</span>
                <span className="capitalize">{listing.condition.replace('_', ' ')}</span>
              </>
            )}
            {listing.location_text && (
              <>
                <span>·</span>
                <span>📍 {listing.location_text}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-green-600">
            {listing.price_type === 'free' ? 'Free' : `${listing.price_mly} $MLY`}
          </p>
          <p className="text-xs text-muted-foreground capitalize">{listing.price_type}</p>
        </div>
      </div>

      {/* Status badge */}
      {listing.status !== 'active' && (
        <div className={`rounded-md px-3 py-2 text-sm font-medium ${
          listing.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {listing.status === 'sold' ? 'This item has been sold' : 'This listing has been removed'}
        </div>
      )}

      {/* Description */}
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">Description</h2>
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{listing.description}</p>
      </div>

      {/* Seller info */}
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">Seller</h2>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold overflow-hidden">
            {seller?.avatar_url ? (
              <img src={seller.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              seller?.display_name?.slice(0, 2).toUpperCase() || '?'
            )}
          </div>
          <div>
            <p className="font-medium">{seller?.display_name || seller?.username}</p>
            <p className="text-xs text-muted-foreground">@{seller?.username}{seller?.neighborhood ? ` · ${seller.neighborhood}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {listing.status === 'active' && (
        <div className="space-y-2">
          {!isOwner && (
            <Link
              href={`/wallet?send=${seller?.id}&amount=${listing.price_mly}&reason=Purchase: ${listing.title}`}
              className="block w-full rounded-md bg-primary py-3 text-center text-sm font-medium text-primary-foreground"
            >
              Buy for {listing.price_mly} $MLY
            </Link>
          )}

          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={handleMarkSold}
                disabled={isPending}
                className="flex-1 rounded-md bg-green-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Mark as Sold
              </button>
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="rounded-md border border-red-200 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <p className="text-xs text-muted-foreground text-center">
        Listed {new Date(listing.created_at).toLocaleDateString()}
        {listing.expires_at && ` · Expires ${new Date(listing.expires_at).toLocaleDateString()}`}
        {` · ${listing.views || 0} views`}
      </p>
    </div>
  );
}
