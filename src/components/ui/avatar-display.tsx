'use client';

/**
 * Avatar Display Component
 * 
 * Uses DiceBear open-source avatar API (no API key, fully free, SVG-based).
 * Generates unique avatars based on user config or seed string.
 * Styles: adventurer, avataaars, big-ears, bottts, croodles, fun-emoji, lorelei, micah, miniavs, personas, pixel-art
 */

interface AvatarDisplayProps {
  seed: string; // Usually user ID or display name
  style?: 'adventurer' | 'avataaars' | 'big-ears' | 'bottts' | 'fun-emoji' | 'lorelei' | 'micah' | 'pixel-art' | 'personas';
  size?: number;
  className?: string;
  skinColor?: string;
  hairColor?: string;
  backgroundColor?: string;
}

export function AvatarDisplay({
  seed,
  style = 'adventurer',
  size = 128,
  className = '',
  backgroundColor = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
}: AvatarDisplayProps) {
  // DiceBear API generates deterministic SVG avatars from a seed
  const params = new URLSearchParams({
    seed,
    size: size.toString(),
    backgroundColor,
  });

  const url = `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`;

  return (
    <div className={`rounded-full overflow-hidden shadow-lg ${className}`} style={{ width: size, height: size }}>
      <img
        src={url}
        alt={`Avatar for ${seed}`}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

/**
 * Avatar selector — lets user pick from different styles
 */
interface AvatarSelectorProps {
  seed: string;
  selectedStyle: string;
  onSelect: (style: string) => void;
}

const AVATAR_STYLES = [
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'avataaars', label: 'Classic' },
  { id: 'big-ears', label: 'Big Ears' },
  { id: 'bottts', label: 'Robot' },
  { id: 'fun-emoji', label: 'Emoji' },
  { id: 'lorelei', label: 'Lorelei' },
  { id: 'micah', label: 'Micah' },
  { id: 'pixel-art', label: 'Pixel' },
  { id: 'personas', label: 'Personas' },
];

export function AvatarSelector({ seed, selectedStyle, onSelect }: AvatarSelectorProps) {
  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="flex justify-center">
        <AvatarDisplay seed={seed} style={selectedStyle as any} size={96} />
      </div>

      {/* Style grid */}
      <div className="grid grid-cols-3 gap-2">
        {AVATAR_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
              selectedStyle === style.id
                ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                : 'border-gray-200 dark:border-harbor-700 hover:border-gray-300'
            }`}
          >
            <img
              src={`https://api.dicebear.com/9.x/${style.id}/svg?seed=${seed}&size=48`}
              alt={style.label}
              className="w-10 h-10 rounded-full"
              loading="lazy"
            />
            <span className="text-[10px] text-gray-600 dark:text-gray-400">{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
