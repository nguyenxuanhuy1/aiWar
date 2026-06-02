export type BattleStatus = 'WAITING' | 'RUNNING' | 'FINISHED';

export type TileType = 'CAPITAL' | 'FARM' | 'GOLD_MINE' | 'FOREST' | 'PLAIN' | 'MOUNTAIN';

export type ActionType = 'EXPAND' | 'RECRUIT' | 'ATTACK' | 'DEFEND' | 'RESEARCH' | 'DIPLOMACY';

export interface Kingdom {
  id: string;
  name: string;
  model: string;
  population: number;
  
  // Resources
  gold: number;
  oil: number;      // New sci-fi resource
  supplies: number; // Mapping from food
  energy: number;   // Mapping from wood
  
  // Forces
  infantry: number;
  tanks: number;
  aircraft: number;
  artillery: number;
  navy: number;
  drones: number;
  soldiers: number;
  
  tech: number;
  morale: number;
  score: number;
  scoreHistory: number[]; // Track score over rounds for line chart
  alive: boolean;
  color: string;
}

export interface Tile {
  id: string;
  code: string;
  x: number;
  y: number;
  type: TileType;
  ownerKingdomId: string | null;
  level: number;
  defenseBonus: number;
}

export interface RoundLog {
  id: string;
  roundNumber: number;
  kingdomId: string;
  actionJson?: {
    type: ActionType;
    targetTileCode?: string;
    amount?: number;
    description?: string;
  } | any;
  resultJson?: {
    success: boolean;
    loss?: number;
    gain?: number;
    description?: string;
  } | any;
  message: string;
  createdAt: string;
}

export interface VisualEffect {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  icon: string;
  createdAt: number;
}

export interface BattleState {
  battleId: string;
  name?: string;
  maxRound: number;
  round: number;
  status: BattleStatus;
  kingdoms: Kingdom[];
  tiles: Tile[];
  logs: RoundLog[];
  visualEffects?: VisualEffect[]; // Floating action indicator overlays
  winner?: Kingdom;
}

export interface AttackLine {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  attackerName: string;
  targetName: string;
  round: number;
  unitType: 'TANK' | 'AIRCRAFT' | 'DRONE'; // Animate different sprites based on unit types
}
