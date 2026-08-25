'use client';

/**
 * Standing Radar Chart — Visualizes 8 standing facets as a radar/spider chart.
 * Pure SVG, no dependencies. Animated on mount.
 */

interface StandingRadarProps {
  facets: {
    neighbor: number;
    carer: number;
    maker: number;
    teacher: number;
    keeper: number;
    voice: number;
    shop: number;
    helper: number;
  };
  size?: number;
}

const FACET_LABELS = [
  { key: 'neighbor', label: 'Neighbor', icon: '🏘️' },
  { key: 'carer', label: 'Carer', icon: '💜' },
  { key: 'maker', label: 'Maker', icon: '🔧' },
  { key: 'teacher', label: 'Teacher', icon: '📚' },
  { key: 'keeper', label: 'Keeper', icon: '🛡️' },
  { key: 'voice', label: 'Voice', icon: '🗳️' },
  { key: 'shop', label: 'Shop', icon: '🛒' },
  { key: 'helper', label: 'Helper', icon: '🤝' },
];

export function StandingRadar({ facets, size = 280 }: StandingRadarProps) {
  const center = size / 2;
  const radius = size * 0.35;
  const levels = 4; // Concentric rings

  // Calculate point positions for each facet
  const points = FACET_LABELS.map((facet, i) => {
    const angle = (Math.PI * 2 * i) / FACET_LABELS.length - Math.PI / 2;
    const value = ((facets as any)[facet.key] || 0) / 100; // Normalize to 0-1
    return {
      x: center + Math.cos(angle) * radius * value,
      y: center + Math.sin(angle) * radius * value,
      labelX: center + Math.cos(angle) * (radius + 30),
      labelY: center + Math.sin(angle) * (radius + 30),
      axisX: center + Math.cos(angle) * radius,
      axisY: center + Math.sin(angle) * radius,
      ...facet,
      value: (facets as any)[facet.key] || 0,
    };
  });

  const dataPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background rings */}
        {Array.from({ length: levels }).map((_, i) => {
          const r = (radius * (i + 1)) / levels;
          const ringPoints = FACET_LABELS.map((_, j) => {
            const angle = (Math.PI * 2 * j) / FACET_LABELS.length - Math.PI / 2;
            return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
          }).join(' ');
          return (
            <polygon
              key={i}
              points={ringPoints}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-muted-foreground/20"
            />
          );
        })}

        {/* Axis lines */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.axisX}
            y2={p.axisY}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted-foreground/20"
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="hsl(var(--primary) / 0.2)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="transition-all duration-700"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="hsl(var(--primary))"
            className="transition-all duration-700"
          />
        ))}

        {/* Labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {p.icon} {p.value.toFixed(0)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-2 grid grid-cols-4 gap-2 text-center">
        {points.map((p) => (
          <div key={p.key} className="text-xs">
            <span>{p.icon}</span>
            <p className="font-medium">{p.label}</p>
            <p className="text-muted-foreground">{p.value.toFixed(1)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
