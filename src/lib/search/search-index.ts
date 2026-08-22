/**
 * Global search index for MiLyfe platform.
 * Combines static app routes with dynamic Supabase content.
 */

export interface SearchResult {
  id: string;
  type: 'app' | 'feature' | 'person' | 'content';
  title: string;
  description: string;
  href: string;
  icon: string;
  app?: string;
  keywords: string[];
}

// Static search entries for all apps and key features
export const APP_INDEX: SearchResult[] = [
  // Main apps
  { id: 'home', type: 'app', title: 'Home', description: 'Your dashboard and community pulse', href: '/home', icon: '🏠', keywords: ['home', 'dashboard', 'feed', 'inicio'] },
  { id: 'city', type: 'app', title: 'MiCity', description: 'Report issues, events, votes, and jobs', href: '/city', icon: '🏙️', keywords: ['city', 'report', 'issues', 'events', 'vote', 'ciudad'] },
  { id: 'health', type: 'app', title: 'MiHealth', description: 'Daily check-in, mood tracking, streaks', href: '/health', icon: '❤️', keywords: ['health', 'checkin', 'mood', 'streak', 'wellness', 'salud'] },
  { id: 'connect', type: 'app', title: 'MiConnect', description: 'Messages, groups, and neighbors', href: '/connect', icon: '💬', keywords: ['connect', 'chat', 'messages', 'neighbors', 'mensajes'] },
  { id: 'wallet', type: 'app', title: 'Wallet', description: '$MLY balance, send, receive, exchange', href: '/wallet', icon: '💰', keywords: ['wallet', 'money', 'mly', 'send', 'receive', 'balance', 'cartera'] },
  { id: 'rights', type: 'app', title: 'MiRights', description: 'Constitutional rights and police encounter tools', href: '/rights', icon: '⚖️', keywords: ['rights', 'constitution', 'police', 'lawyer', 'derechos'] },
  { id: 'media', type: 'app', title: 'MiMedia', description: 'Video, music, radio, and podcasts', href: '/media', icon: '🎬', keywords: ['media', 'video', 'music', 'radio', 'podcast', 'upload'] },
  { id: 'learn', type: 'app', title: 'MiLearn', description: 'Courses, quizzes, and skill building', href: '/learn', icon: '📚', keywords: ['learn', 'courses', 'education', 'quiz', 'skills', 'aprender'] },
  { id: 'career', type: 'app', title: 'MiCareer', description: 'Resume builder, jobs, interview prep', href: '/career', icon: '💼', keywords: ['career', 'resume', 'jobs', 'interview', 'skills', 'carrera'] },
  { id: 'business', type: 'app', title: 'Business Hub', description: 'Register business, POS, directory', href: '/business', icon: '🏪', keywords: ['business', 'register', 'pos', 'directory', 'negocio'] },
  { id: 'guild', type: 'app', title: 'MiGuild', description: 'Peace economy, block patrol, conflict mediation', href: '/guild', icon: '🛡️', keywords: ['guild', 'peace', 'patrol', 'mediate', 'conflict', 'gremio'] },
  { id: 'family', type: 'app', title: 'MiFamily', description: 'Family calendar, budget, and coordination', href: '/family', icon: '👨‍👩‍👧‍👦', keywords: ['family', 'calendar', 'budget', 'kids', 'familia'] },
  { id: 'shop', type: 'app', title: 'MiShop', description: 'Buy and sell with $MLY', href: '/shop', icon: '🛍️', keywords: ['shop', 'buy', 'sell', 'marketplace', 'tienda'] },
  { id: 'feed', type: 'app', title: 'Neighborhood Feed', description: 'Social posts from your block', href: '/feed', icon: '📣', keywords: ['feed', 'social', 'posts', 'neighborhood', 'muro'] },
  { id: 'housing', type: 'app', title: 'Housing Board', description: 'Rentals, roommates, and sublets', href: '/housing', icon: '🏠', keywords: ['housing', 'rent', 'roommate', 'sublet', 'apartment', 'vivienda'] },
  { id: 'rideshare', type: 'app', title: 'Rideshare', description: 'Community rides paid with $MLY', href: '/rideshare', icon: '🚗', keywords: ['rideshare', 'ride', 'drive', 'carpool', 'viaje'] },

  // Key features
  { id: 'report-issue', type: 'feature', title: 'Report an Issue', description: 'Report a community problem', href: '/city', icon: '🚨', app: 'City', keywords: ['report', 'issue', 'problem', 'pothole', 'trash', 'broken'] },
  { id: 'send-mly', type: 'feature', title: 'Send $MLY', description: 'Transfer $MLY to someone', href: '/wallet', icon: '📤', app: 'Wallet', keywords: ['send', 'transfer', 'pay', 'enviar'] },
  { id: 'daily-checkin', type: 'feature', title: 'Daily Check-in', description: 'Log your mood and earn $MLY', href: '/health', icon: '✅', app: 'Health', keywords: ['checkin', 'check-in', 'mood', 'daily', 'registro'] },
  { id: 'constitution', type: 'feature', title: 'Constitution', description: 'Read your constitutional rights', href: '/rights', icon: '📜', app: 'Rights', keywords: ['constitution', 'amendments', 'bill of rights', 'constitución'] },
  { id: 'police-tools', type: 'feature', title: 'Police Encounter Tools', description: 'Record stops, know what to say', href: '/rights', icon: '🚨', app: 'Rights', keywords: ['police', 'stopped', 'record', 'encounter', 'badge'] },
  { id: 'upload-media', type: 'feature', title: 'Upload Content', description: 'Upload video, music, or podcasts', href: '/media', icon: '⬆️', app: 'Media', keywords: ['upload', 'video', 'music', 'podcast', 'create', 'subir'] },
  { id: 'create-event', type: 'feature', title: 'Create Event', description: 'Organize a community event', href: '/city', icon: '📅', app: 'City', keywords: ['event', 'create', 'organize', 'community', 'evento'] },
  { id: 'resume-builder', type: 'feature', title: 'Resume Builder', description: 'Build and export your resume', href: '/career', icon: '📄', app: 'Career', keywords: ['resume', 'cv', 'builder', 'export', 'currículum'] },
  { id: 'register-business', type: 'feature', title: 'Register Business', description: 'List your business to accept $MLY', href: '/business', icon: '🏪', app: 'Business', keywords: ['register', 'business', 'store', 'registrar'] },
  { id: 'join-guild', type: 'feature', title: 'Join the Guild', description: 'Earn $MLY protecting your block', href: '/guild', icon: '🤝', app: 'Guild', keywords: ['join', 'guild', 'earn', 'block keeper', 'unirse'] },
  { id: 'governance', type: 'feature', title: 'Governance & Voting', description: 'Vote on community proposals', href: '/govern', icon: '🗳️', app: 'Governance', keywords: ['vote', 'governance', 'proposal', 'democracy', 'votar'] },
  { id: 'notifications', type: 'feature', title: 'Notifications', description: 'View your alerts and updates', href: '/notifications', icon: '🔔', keywords: ['notifications', 'alerts', 'updates', 'notificaciones'] },
  { id: 'settings', type: 'feature', title: 'Settings', description: 'Language, accessibility, account settings', href: '/settings', icon: '⚙️', keywords: ['settings', 'preferences', 'language', 'accessibility', 'configuración'] },
  { id: 'profile', type: 'feature', title: 'Profile', description: 'Your account and display name', href: '/profile', icon: '👤', keywords: ['profile', 'account', 'name', 'avatar', 'perfil'] },
];

/**
 * Search the static app index
 */
export function searchApps(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/);

  return APP_INDEX
    .map((item) => {
      let score = 0;
      const searchable = [
        item.title.toLowerCase(),
        item.description.toLowerCase(),
        ...item.keywords,
      ].join(' ');

      for (const term of terms) {
        if (item.title.toLowerCase().includes(term)) score += 10;
        if (item.keywords.some((k) => k.includes(term))) score += 8;
        if (item.description.toLowerCase().includes(term)) score += 5;
        if (searchable.includes(term)) score += 2;
      }

      return { ...item, score };
    })
    .filter((item) => (item as SearchResult & { score: number }).score > 0)
    .sort((a, b) => (b as SearchResult & { score: number }).score - (a as SearchResult & { score: number }).score)
    .slice(0, 12);
}
