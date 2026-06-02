import { TileType, ActionType } from '@/types/battle';

export const KINGDOM_COLORS: Record<string, { main: string; glow: string; text: string; bg: string }> = {
  alpha: { 
    main: '#3b82f6', 
    glow: 'rgba(59, 130, 246, 0.4)', 
    text: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  beta: { 
    main: '#ef4444', 
    glow: 'rgba(239, 68, 68, 0.4)', 
    text: 'text-red-400',
    bg: 'bg-red-500/10'
  },
  gamma: { 
    main: '#10b981', 
    glow: 'rgba(16, 185, 129, 0.4)', 
    text: 'text-green-400',
    bg: 'bg-green-500/10'
  },
  delta: { 
    main: '#8b5cf6', 
    glow: 'rgba(139, 92, 246, 0.4)', 
    text: 'text-purple-400',
    bg: 'bg-purple-500/10'
  },
  omega: { 
    main: '#f97316', 
    glow: 'rgba(249, 115, 22, 0.4)', 
    text: 'text-orange-400',
    bg: 'bg-orange-500/10'
  },
  unowned: { 
    main: '#4b5563', 
    glow: 'rgba(75, 85, 99, 0.1)', 
    text: 'text-gray-400',
    bg: 'bg-gray-800/20'
  }
};

export function getKingdomColorStyles(nameOrId: string = '') {
  const norm = nameOrId.toLowerCase().trim();
  if (!norm || norm === 'unowned' || norm === 'null') return KINGDOM_COLORS.unowned;
  if (norm.includes('alpha')) return KINGDOM_COLORS.alpha;
  if (norm.includes('beta')) return KINGDOM_COLORS.beta;
  if (norm.includes('gamma')) return KINGDOM_COLORS.gamma;
  if (norm.includes('delta')) return KINGDOM_COLORS.delta;
  if (norm.includes('omega')) return KINGDOM_COLORS.omega;

  // Fallback matchers in case names are arbitrary or IDs are used
  const keys = ['alpha', 'beta', 'gamma', 'delta', 'omega'];
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % keys.length;
  return KINGDOM_COLORS[keys[index]] || KINGDOM_COLORS.unowned;
}

export function getTileTypeEmoji(type: TileType): string {
  switch (type) {
    case 'CAPITAL': return '📡'; // HQ Base
    case 'FARM': return '🚚';    // Supply Depot
    case 'GOLD_MINE': return '⛏️'; // Mining Extractor
    case 'FOREST': return '⚡';   // Energy Plant
    case 'PLAIN': return '◽';    // Combat Zone
    case 'MOUNTAIN': return '🛡️'; // Defense Outpost
    default: return '❓';
  }
}

export function getTileTypeLabel(type: TileType): string {
  switch (type) {
    case 'CAPITAL': return 'Căn Cứ Chỉ Huy (HQ)';
    case 'FARM': return 'Trạm Tiếp Vận';
    case 'GOLD_MINE': return 'Khai Thác Mỏ';
    case 'FOREST': return 'Trạm Năng Lượng';
    case 'PLAIN': return 'Vùng Tranh Chấp';
    case 'MOUNTAIN': return 'Chốt Phòng Thủ';
    default: return 'Chưa rõ';
  }
}

export function getActionTypeEmoji(action: ActionType): string {
  switch (action) {
    case 'EXPAND': return '🚩';
    case 'RECRUIT': return '🛡️';
    case 'ATTACK': return '⚔️';
    case 'DEFEND': return '🧱';
    case 'RESEARCH': return '🔬';
    case 'DIPLOMACY': return '🤝';
    default: return '⚡';
  }
}

export function getActionTypeColor(action: ActionType): string {
  switch (action) {
    case 'EXPAND': return 'text-cyan-400';
    case 'RECRUIT': return 'text-blue-400';
    case 'ATTACK': return 'text-red-400 font-bold';
    case 'DEFEND': return 'text-yellow-400';
    case 'RESEARCH': return 'text-purple-400';
    case 'DIPLOMACY': return 'text-green-400';
    default: return 'text-gray-400';
  }
}

export function getActionTypeLabel(action: ActionType): string {
  switch (action) {
    case 'EXPAND': return 'Khai Hoang';
    case 'RECRUIT': return 'Chiêu Binh';
    case 'ATTACK': return 'Chinh Phạt';
    case 'DEFEND': return 'Phòng Thủ';
    case 'RESEARCH': return 'Nghiên Cứu';
    case 'DIPLOMACY': return 'Ngoại Giao';
    default: return 'Hành Động';
  }
}
