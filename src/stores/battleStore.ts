import { create } from 'zustand';
import { BattleState, Tile, Kingdom, RoundLog, AttackLine, BattleStatus, TileType, ActionType, VisualEffect, Alliance, Dialogue } from '@/types/battle';
import { initializeLocalSimulation, processNextSimulationRound } from '@/services/simulationEngine';

interface BattleStore {
  battleState: BattleState | null;
  selectedTile: Tile | null;
  isConnected: boolean;
  isSimulating: boolean;
  activeAttackLines: AttackLine[];
  
  setBattleState: (state: BattleState | null) => void;
  appendLog: (log: RoundLog) => void;
  setSelectedTile: (tile: Tile | null) => void;
  setConnected: (connected: boolean) => void;
  
  // Local Simulation actions
  startLocalSimulation: (maxRound: number, kingdomsConfig: Array<{ name: string; model: string }>) => void;
  stopLocalSimulation: () => void;
  resumeLocalSimulation: () => void;
  triggerNextSimulationRound: (force?: boolean) => void;
}

let simulationInterval: NodeJS.Timeout | null = null;

export const useBattleStore = create<BattleStore>((set, get) => ({
  battleState: null,
  selectedTile: null,
  isConnected: false,
  isSimulating: false,
  activeAttackLines: [],

  setBattleState: (state) => set({ battleState: state }),
  
  appendLog: (log) => set((store) => {
    if (!store.battleState) return {};
    return {
      battleState: {
        ...store.battleState,
        logs: [...store.battleState.logs, log],
      }
    };
  }),

  setSelectedTile: (tile) => set({ selectedTile: tile }),
  setConnected: (connected) => set({ isConnected: connected }),

  stopLocalSimulation: () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    set({ isSimulating: false });
  },

  resumeLocalSimulation: () => {
    // Clear existing if any
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }
    set({ isSimulating: true });
    // Trigger right away
    get().triggerNextSimulationRound();
    // Re-establish timer (Slower pace: 6.5s per round to read dialogues)
    simulationInterval = setInterval(() => {
      get().triggerNextSimulationRound();
    }, 6500);
  },

  startLocalSimulation: (maxRound = 50, kingdomsConfig) => {
    console.log('Zustand: startLocalSimulation called with maxRound:', maxRound, 'kingdomsConfig:', kingdomsConfig);
    // Stop current if running
    get().stopLocalSimulation();

    const initialState = initializeLocalSimulation(maxRound, kingdomsConfig);

    set({ 
      battleState: initialState, 
      isSimulating: true,
      selectedTile: null,
      activeAttackLines: []
    });

    // Start interval (Slower pace: 6.5s per round to read dialogues)
    simulationInterval = setInterval(() => {
      get().triggerNextSimulationRound();
    }, 6500);
  },

  triggerNextSimulationRound: (force = false) => {
    const { battleState, isSimulating } = get();
    console.log('Zustand: triggerNextSimulationRound. isSimulating:', isSimulating, 'round:', battleState?.round, 'force:', force);
    if (!battleState || (!isSimulating && !force)) return;

    if (battleState.round >= battleState.maxRound) {
      // Find winner
      const activeKingdoms = battleState.kingdoms.filter(k => k.alive);
      let winner = activeKingdoms.sort((a, b) => b.score - a.score)[0];
      
      const finishedState: BattleState = {
        ...battleState,
        status: 'FINISHED',
        winner: winner,
        logs: [
          ...battleState.logs,
          {
            id: `log-end-${Date.now()}`,
            roundNumber: battleState.round,
            kingdomId: 'system',
            message: `🏆 Trận đấu kết thúc! Vương quốc ${winner?.name} giành chiến thắng tối cao với ${winner?.score} điểm!`,
            createdAt: new Date().toLocaleTimeString()
          }
        ]
      };

      set({ battleState: finishedState });
      get().stopLocalSimulation();
      return;
    }

    const { nextState, attackLines } = processNextSimulationRound(battleState);

    set({
      battleState: nextState,
      activeAttackLines: attackLines,
      isSimulating: nextState.status === 'RUNNING'
    });

    // Clear active dialogue after 5.5s to give UI time to display it cleanly
    setTimeout(() => {
      const currentBattleState = get().battleState;
      if (currentBattleState) {
        set({
          battleState: {
            ...currentBattleState,
            activeDialogue: null,
            activeGlobalEffect: null
          }
        });
      }
    }, 5500);

    // Clear attack vectors after 1.8 seconds to animate lines disappearing
    setTimeout(() => {
      set({ activeAttackLines: [] });
    }, 1800);

    // Clear visual effects after 1.8 seconds
    setTimeout(() => {
      const currentBattleState = get().battleState;
      if (currentBattleState && currentBattleState.visualEffects) {
        const checkNow = Date.now();
        const activeEffects = currentBattleState.visualEffects.filter(e => checkNow - e.createdAt < 1800);
        set({
          battleState: {
            ...currentBattleState,
            visualEffects: activeEffects
          }
        });
      }
    }, 1800);
  }
}));
