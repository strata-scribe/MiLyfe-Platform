import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MiLyfe — Your City. Your Lyfe. Your Platform.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a6e 0%, #0d1b33 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 72, fontWeight: 'bold', color: '#ffffff' }}>Mi</span>
          <span style={{ fontSize: 72, fontWeight: 'bold', color: '#00C1AE' }}>Lyfe</span>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: 32, color: '#c5d4e8', margin: 0, marginBottom: 40 }}>
          Your City. Your Lyfe. Your Platform.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 'bold', color: '#FFC107' }}>$MLY</span>
            <span style={{ fontSize: 16, color: '#9fb8d9' }}>Community Currency</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 'bold', color: '#00C1AE' }}>160</span>
            <span style={{ fontSize: 16, color: '#9fb8d9' }}>Bounties</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 'bold', color: '#ffffff' }}>14</span>
            <span style={{ fontSize: 16, color: '#9fb8d9' }}>Core Routes</span>
          </div>
        </div>

        {/* Footer */}
        <p style={{ position: 'absolute', bottom: 32, fontSize: 14, color: '#5b87bf' }}>
          Community-owned. Open source. People-powered.
        </p>
      </div>
    ),
    { ...size }
  );
}
