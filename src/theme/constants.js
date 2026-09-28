// ─── Cyberpunk / Hacker Theme ──────────────────────────────────────
export const COLORS = {
  // Backgrounds
  bg: '#0a0a0f',
  bgCard: '#111118',
  bgCardAlt: '#16161f',
  bgModal: 'rgba(0,0,0,0.85)',
  bgInput: '#1a1a25',

  // Neon Accents
  neonGreen: '#00ff9d',
  neonBlue: '#00d4ff',
  neonPurple: '#b84dff',
  neonPink: '#ff2d87',
  neonYellow: '#ffe600',

  // Text
  textPrimary: '#e0e0e8',
  textSecondary: '#7a7a8e',
  textMuted: '#4a4a5e',

  // Borders
  border: '#22222e',
  borderGlow: 'rgba(0,255,157,0.25)',

  // Status
  success: '#00ff9d',
  danger: '#ff3b5c',
  warning: '#ffe600',

  // Gradients
  gradientGreen: ['#00ff9d', '#00d4ff'],
  gradientPurple: ['#b84dff', '#ff2d87'],
  gradientDark: ['#0a0a0f', '#111118'],
};

export const FONTS = {
  mono: 'monospace',
};

export const SHADOWS = {
  neonGlow: {
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  neonGlowBlue: {
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// XP rewards per task
export const XP_PER_TASK = 25;
export const XP_PER_TASK_DOUBLED = 50;

// Motivational messages on level-up
export const LEVEL_UP_MESSAGES = [
  '⚡ SYSTEM UPGRADED ⚡',
  '🔥 POWER LEVEL RISING 🔥',
  '💎 NEW THRESHOLD REACHED 💎',
  '🚀 BEYOND LIMITS 🚀',
  '⭐ ELITE STATUS UNLOCKED ⭐',
  '🎯 PRECISION MASTERY 🎯',
  '🌟 LEGENDARY ASCENT 🌟',
];

// Task completion messages
export const COMPLETION_MESSAGES = [
  '+{xp} XP // TASK EXECUTED',
  '+{xp} XP // PROTOCOL COMPLETE',
  '+{xp} XP // OPERATION SUCCESS',
  '+{xp} XP // OBJECTIVE CLEARED',
  '+{xp} XP // MISSION DONE',
];

export const RANK_TITLES = [
  'Initiate',       // 1
  'Recruit',        // 2
  'Operative',      // 3
  'Agent',          // 4
  'Specialist',     // 5
  'Commander',      // 6
  'Elite',          // 7
  'Vanguard',       // 8
  'Overlord',       // 9
  'Cyber Lord',     // 10
  'Neon Phantom',   // 11
  'Data Wraith',    // 12
  'Void Walker',    // 13
  'System Architect', // 14
  'Singularity',    // 15+
];

export function getRankTitle(level) {
  const idx = Math.min(level - 1, RANK_TITLES.length - 1);
  return RANK_TITLES[Math.max(0, idx)];
}
