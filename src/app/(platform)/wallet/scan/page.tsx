'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  const startScanner = async () => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Parse MiLyfe QR: "milyfe:pay:USER_ID:DISPLAY_NAME"
          if (decodedText.startsWith('milyfe:pay:')) {
            const parts = decodedText.split(':');
            setResult(parts[2]); // user ID
            setRecipientName(parts[3] || 'Unknown');
            scanner.stop();
            setScanning(false);
          }
        },
        () => {} // Ignore scan failures
      );
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    scannerRef.current?.stop();
    setScanning(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !result || !amount) return;
    setSending(true);
    setError('');

    const amt = parseFloat(amount);
    if (amt <= 0) { setError('Invalid amount'); setSending(false); return; }

    await supabase.from('mly_transactions').insert({
      from_id: user.id,
      to_id: result,
      amount: amt,
      type: 'transfer',
      description: note.trim() || `Payment to ${recipientName}`,
    });
    await supabase.rpc('increment_balance', { user_id: result, amount: amt });
    await supabase.rpc('increment_balance', { user_id: user.id, amount: -amt });

    setSent(true);
    setSending(false);
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  if (sent) {
    return (
      <div className="space-y-6 animate-slide-up text-center py-12">
        <div className="text-5xl">✅</div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Sent ${amount} MLY</h1>
        <p className="text-gray-500">To {recipientName}</p>
        <button onClick={() => router.push('/wallet')} className="btn-teal">Back to Wallet</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/wallet')} className="text-teal-500 text-sm">← Wallet</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Scan & Pay</h1>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div id="qr-reader" ref={containerRef} className="w-full rounded-xl overflow-hidden bg-black min-h-[300px]" />

          {!scanning ? (
            <button onClick={startScanner} className="btn-teal w-full">
              📷 Open Camera to Scan
            </button>
          ) : (
            <button onClick={stopScanner} className="btn-primary w-full">
              Stop Scanner
            </button>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <p className="text-xs text-gray-400 text-center">Point your camera at a MiLyfe payment QR code.</p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="card space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Paying</p>
            <p className="text-lg font-bold text-harbor-800 dark:text-white">{recipientName}</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount ($MLY)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input-field text-2xl font-bold text-center" placeholder="0" min="1" required />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className="input-field !py-2 text-sm" placeholder="What's it for?" />
          </div>

          <button type="submit" disabled={sending} className="btn-gold w-full disabled:opacity-50">
            {sending ? 'Sending...' : `Pay $${amount || '0'} MLY`}
          </button>

          <button type="button" onClick={() => { setResult(null); setRecipientName(''); }} className="text-xs text-gray-400 w-full text-center">
            Scan different code
          </button>
        </form>
      )}
    </div>
  );
}
