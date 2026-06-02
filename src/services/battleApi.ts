import axios from 'axios';
import { BattleState, Kingdom, Tile } from '@/types/battle';

// Create AXIOS instance pointing to the API proxy
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set Authorization header dynamically from localStorage/memory if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface CreateBattleRequest {
  maxRound: number;
  kingdoms: Array<{
    name: string;
    model: string;
    apiKey: string;
  }>;
}

export const battleApi = {
  createBattle: async (data: CreateBattleRequest): Promise<BattleState> => {
    try {
      const response = await api.post('/battles', data);
      return response.data;
    } catch (error) {
      console.warn('Backend battles API unavailable. Generating mock battle state...');
      return generateMockBattleState(data);
    }
  },

  getBattleState: async (battleId: string): Promise<BattleState> => {
    try {
      const response = await api.get(`/battles/${battleId}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch state for battle ${battleId}. Returning mockup.`);
      return getMockBattleState(battleId);
    }
  },

  startBattle: async (battleId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post(`/battles/${battleId}/start`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to start battle ${battleId} on backend. Mimicking start...`);
      return { success: true, message: 'Local battle started' };
    }
  },
};

// --- Mock fallbacks for testing when backend is not run ---

function generateMockBattleState(req: CreateBattleRequest): BattleState {
  const battleId = `mock-${Date.now()}`;
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f97316'];

  const kingdoms: Kingdom[] = req.kingdoms.map((k, index) => {
    const soldiers = 10;
    return {
      id: `k-${index + 1}`,
      name: k.name || `Kingdom ${index + 1}`,
      model: k.model,
      population: 1000,
      gold: 100,
      oil: 50,
      supplies: 100,
      energy: 100,
      infantry: soldiers * 60,
      tanks: soldiers * 12,
      aircraft: soldiers * 3,
      artillery: soldiers * 9,
      navy: soldiers * 1,
      drones: soldiers * 5,
      soldiers,
      tech: 1,
      morale: 80,
      score: 0,
      scoreHistory: [0],
      alive: true,
      color: colors[index % colors.length],
    };
  });

  const tiles: Tile[] = [];
  const capitalSpots = [
    { x: 1, y: 1 },
    { x: 8, y: 1 },
    { x: 1, y: 8 },
    { x: 8, y: 8 },
    { x: 5, y: 5 },
  ];

  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const id = `tile-${x}-${y}`;
      const code = `${String.fromCharCode(65 + y)}${x + 1}`;
      
      const capIdx = capitalSpots.findIndex((spot) => spot.x === x && spot.y === y);
      let type: any = 'PLAIN';
      let owner: string | null = null;
      let defense = 1;
      let lvl = 1;

      if (capIdx !== -1 && capIdx < kingdoms.length) {
        type = 'CAPITAL';
        owner = kingdoms[capIdx].id;
        defense = 5;
        lvl = 3;
      } else {
        const rand = Math.random();
        if (rand < 0.1) type = 'GOLD_MINE';
        else if (rand < 0.2) type = 'FOREST';
        else if (rand < 0.3) type = 'FARM';
        else if (rand < 0.35) type = 'MOUNTAIN';
      }

      tiles.push({
        id,
        code,
        x,
        y,
        type,
        ownerKingdomId: owner,
        level: lvl,
        defenseBonus: defense,
      });
    }
  }

  return {
    battleId,
    maxRound: req.maxRound,
    round: 0,
    status: 'WAITING',
    kingdoms,
    tiles,
    logs: [
      {
        id: `log-0`,
        roundNumber: 0,
        kingdomId: 'system',
        message: 'Lobby phòng đấu đã được khởi tạo. Đang chờ bắt đầu...',
        createdAt: new Date().toLocaleTimeString(),
      },
    ],
  };
}

function getMockBattleState(battleId: string): BattleState {
  return generateMockBattleState({
    maxRound: 30,
    kingdoms: [
      { name: 'Alpha Kingdom', model: 'Gemini 3.5 Pro', apiKey: '' },
      { name: 'Beta Kingdom', model: 'GPT-4o', apiKey: '' },
      { name: 'Gamma Republic', model: 'Claude 3.5 Sonnet', apiKey: '' },
      { name: 'Delta Union', model: 'Llama 3 70B', apiKey: '' },
    ],
  });
}
