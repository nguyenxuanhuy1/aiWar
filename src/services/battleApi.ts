import axios from 'axios';
import { BattleState, Kingdom, Tile, TileType } from '@/types/battle';

// Create AXIOS instance pointing to the API proxy
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set Authorization header dynamically from sessionStorage/localStorage
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

export interface JoinBattleRequest {
  name: string;
  model: string;
  apiKey: string;
}

// Local mock battle state cache in memory
let mockBattleStateMemory: Record<string, BattleState> = {};

export const battleApi = {
  createBattle: async (data: CreateBattleRequest): Promise<BattleState> => {
    try {
      const response = await api.post('/battles', data);
      // Backend response is wrapped in ApiResponse: { success, message, data }
      return response.data.data;
    } catch {
      console.warn('Backend battles API unavailable. Generating mock battle state...');
      const mockState = generateMockBattleState(data);
      mockBattleStateMemory[mockState.battleId] = mockState;
      return mockState;
    }
  },

  getBattleState: async (battleId: string): Promise<BattleState> => {
    if (battleId.startsWith('mock-')) {
      if (!mockBattleStateMemory[battleId]) {
        mockBattleStateMemory[battleId] = getMockBattleState(battleId);
      }
      return mockBattleStateMemory[battleId];
    }
    try {
      const response = await api.get(`/battles/${battleId}`);
      return response.data.data;
    } catch {
      console.warn(`Failed to fetch state for battle ${battleId}. Returning mockup.`);
      if (!mockBattleStateMemory[battleId]) {
        mockBattleStateMemory[battleId] = getMockBattleState(battleId);
      }
      return mockBattleStateMemory[battleId];
    }
  },

  joinBattle: async (battleId: string, data: JoinBattleRequest): Promise<BattleState> => {
    if (battleId.startsWith('mock-')) {
      const state = mockBattleStateMemory[battleId];
      if (!state) throw new Error('Lobby not found');
      if (state.kingdoms.length >= 4) throw new Error('Lobby is full');

      const colors = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f97316'];
      const index = state.kingdoms.length;
      const soldiers = 10;
      
      const newKingdom: Kingdom = {
        id: `k-${index + 1}`,
        name: data.name,
        model: data.model,
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

      state.kingdoms.push(newKingdom);
      state.logs.push({
        id: `log-join-${Date.now()}`,
        roundNumber: 0,
        kingdomId: 'system',
        message: `👥 Vương quốc [${newKingdom.name}] (${newKingdom.model}) đã tham gia phòng chờ.`,
        createdAt: new Date().toLocaleTimeString()
      });

      return state;
    }
    const response = await api.post(`/battles/${battleId}/join`, data);
    return response.data.data;
  },

  quickJoinBattle: async (data: JoinBattleRequest): Promise<BattleState> => {
    try {
      const response = await api.post('/battles/quick-join', data);
      return response.data.data;
    } catch {
      console.warn('Backend battles API quick-join unavailable. Using local mock matchmaking...');
      
      // Look for a mock lobby that is WAITING and not full
      let foundRoom = Object.values(mockBattleStateMemory).find(
        (state) => state.battleId.startsWith('mock-') && state.status === 'WAITING' && state.kingdoms.length < 4
      );

      if (foundRoom) {
        return battleApi.joinBattle(foundRoom.battleId, data);
      } else {
        // Create new lobby with this player
        const payload: CreateBattleRequest = {
          maxRound: 30,
          kingdoms: [data],
        };
        return battleApi.createBattle(payload);
      }
    }
  },

  startBattle: async (battleId: string): Promise<{ success: boolean; message: string }> => {
    if (battleId.startsWith('mock-')) {
      const state = mockBattleStateMemory[battleId];
      if (state) {
        // Kiểm tra xem có người chơi thực tế nào chưa sẵn sàng không
        const guestPlayers = state.kingdoms.filter((k) => k.id !== 'k-1');
        const hasUnreadyGuest = guestPlayers.some((k) => !k.ready);
        if (state.kingdoms.length >= 2 && hasUnreadyGuest) {
          throw {
            success: false,
            message: 'PLAYERS_NOT_READY',
          };
        }

        // Lấp đầy phòng bằng Bot nếu có ít hơn 4 vương quốc
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f97316'];
        const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];
        
        while (state.kingdoms.length < 4) {
          const index = state.kingdoms.length;
          const soldiers = 10;
          state.kingdoms.push({
            id: `k-${index + 1}`,
            name: botNames[index],
            model: 'heuristic',
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
            score: 100,
            scoreHistory: [100],
            alive: true,
            color: colors[index % colors.length],
            ready: true, // Bots are always ready
          });
        }

        // Khởi tạo bản đồ 10x10 đối xứng ở 4 góc cho 4 vương quốc
        // k-1 tại B2 (1,1), k-2 tại I9 (8,8), k-3 tại B9 (8,1), k-4 tại I2 (1,8)
        const tiles: Tile[] = [];
        const capitalSpots = [
          { x: 1, y: 1 }, // k-1 B2
          { x: 8, y: 8 }, // k-2 I9
          { x: 8, y: 1 }, // k-3 B9
          { x: 1, y: 8 }, // k-4 I2
        ];

        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 10; x++) {
            const id = `tile-${x}-${y}`;
            const code = `${String.fromCharCode(65 + y)}${x + 1}`;
            
            const capIdx = capitalSpots.findIndex((spot) => spot.x === x && spot.y === y);
            let type: TileType = 'PLAIN';
            let owner: string | null = null;
            let defense = 1;
            let lvl = 1;

            if (capIdx !== -1 && capIdx < state.kingdoms.length) {
              type = 'CAPITAL';
              owner = state.kingdoms[capIdx].id;
              defense = 5;
              lvl = 3;
            } else {
              const rand = Math.random();
              if (rand < 0.12) {
                type = 'GOLD_MINE';
                defense = 2;
              } else if (rand < 0.25) {
                type = 'FOREST';
                defense = 3;
              } else if (rand < 0.38) {
                type = 'FARM';
                defense = 1;
              } else if (rand < 0.45) {
                type = 'MOUNTAIN';
                defense = 6;
              }
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

        state.tiles = tiles;
        state.status = 'RUNNING';
        state.logs.push({
          id: `log-start-${Date.now()}`,
          roundNumber: 0,
          kingdomId: 'system',
          message: '⚔️ Trận đấu chính thức bắt đầu! Bản đồ và các góc xuất quân đã được khởi tạo.',
          createdAt: new Date().toLocaleTimeString()
        });
      }
      return { success: true, message: 'Local battle started' };
    }
    try {
      const response = await api.post(`/battles/${battleId}/start`);
      return response.data;
    } catch (err: any) {
      if (err.response && err.response.data) {
        throw err.response.data; // Throw Backend ApiResponse with error code (e.g. PLAYERS_NOT_READY)
      }
      throw err;
    }
  },

  toggleReady: async (battleId: string, kingdomId: string): Promise<BattleState> => {
    if (battleId.startsWith('mock-')) {
      const state = mockBattleStateMemory[battleId];
      if (!state) throw new Error('Lobby not found');
      const kingdom = state.kingdoms.find((k) => k.id === kingdomId);
      if (kingdom) {
        kingdom.ready = !kingdom.ready;
        state.logs.push({
          id: `log-ready-${Date.now()}`,
          roundNumber: 0,
          kingdomId: 'system',
          message: `✔️ Vương quốc [${kingdom.name}] chuyển sang trạng thái: ${kingdom.ready ? 'SẴN SÀNG' : 'CHƯA SẴN SÀNG'}.`,
          createdAt: new Date().toLocaleTimeString()
        });
      }
      return state;
    }
    const response = await api.post(`/battles/${battleId}/ready?kingdomId=${kingdomId}`);
    return response.data.data;
  },

  kickPlayer: async (battleId: string, kingdomId: string): Promise<{ success: boolean; message: string }> => {
    if (battleId.startsWith('mock-')) {
      const state = mockBattleStateMemory[battleId];
      if (state) {
        const kickedK = state.kingdoms.find((k) => k.id === kingdomId);
        state.kingdoms = state.kingdoms.filter((k) => k.id !== kingdomId);
        state.logs.push({
          id: `log-kick-${Date.now()}`,
          roundNumber: 0,
          kingdomId: 'system',
          message: `🚫 Vương quốc [${kickedK?.name || kingdomId}] đã bị đuổi khỏi phòng chờ.`,
          createdAt: new Date().toLocaleTimeString()
        });
      }
      return { success: true, message: 'Kicked successfully' };
    }
    const response = await api.post(`/battles/${battleId}/kick/${kingdomId}`);
    return response.data;
  },
};

// --- Mock helpers for generating state ---

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
      score: 100,
      scoreHistory: [100],
      alive: true,
      color: colors[index % colors.length],
    };
  });

  return {
    battleId,
    name: 'Phòng đấu Mô phỏng',
    maxRound: req.maxRound,
    round: 0,
    status: 'WAITING',
    kingdoms,
    tiles: [], // Tiles are not initialized in WAITING lobby state
    logs: [
      {
        id: `log-0`,
        roundNumber: 0,
        kingdomId: 'system',
        message: 'Lobby phòng đấu đã được khởi tạo. Đang chờ các nước kết nối...',
        createdAt: new Date().toLocaleTimeString(),
      },
    ],
  };
}

function getMockBattleState(battleId: string): BattleState {
  const state = generateMockBattleState({
    maxRound: 30,
    kingdoms: [
      { name: 'Vương quốc Alpha', model: 'Gemini 3.5 Pro', apiKey: '' },
    ],
  });
  state.battleId = battleId;
  return state;
}
