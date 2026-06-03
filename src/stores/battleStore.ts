import { create } from 'zustand';
import { BattleState, Tile, Kingdom, RoundLog, AttackLine, BattleStatus, TileType, ActionType, VisualEffect, Alliance, Dialogue } from '@/types/battle';
import { getKingdomColorStyles } from '@/utils/tileUtils';

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

// Helpers to generate coordinates
const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
};

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

    // 1. Initialize Kingdoms
    const listNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'];
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f97316'];
    
    const kingdoms: Kingdom[] = kingdomsConfig.map((cfg, idx) => {
      const soldiers = 15;
      return {
        id: `k-${idx + 1}`,
        name: cfg.name || `${listNames[idx]} Empire`,
        model: cfg.model || 'Gemini 3.5 Flash',
        population: 1000,
        
        // Resources
        gold: 100,
        oil: 50,
        supplies: 120,
        energy: 80,
        
        // Forces
        infantry: soldiers * 60,
        tanks: soldiers * 12,
        aircraft: soldiers * 3,
        artillery: soldiers * 9,
        navy: soldiers * 1,
        drones: soldiers * 5,
        
        soldiers,
        tech: 1,
        morale: 85,
        score: 100,
        scoreHistory: [100],
        alive: true,
        color: colors[idx % colors.length]
      };
    });

    // 2. Initialize Grid 10x10
    const tiles: Tile[] = [];
    const tileTypes: TileType[] = ['PLAIN', 'FARM', 'GOLD_MINE', 'FOREST', 'MOUNTAIN'];
    
    // Capital spawn points optimized for 2, 3, or 4 kingdoms
    let capitalSpots = [
      { x: 1, y: 1 }, // corner 1
      { x: 8, y: 8 }, // corner 4
      { x: 8, y: 1 }, // corner 2
      { x: 1, y: 8 }, // corner 3
    ];

    if (kingdoms.length === 3) {
      capitalSpots = [
        { x: 1, y: 1 },
        { x: 8, y: 8 },
        { x: 8, y: 1 },
      ];
    } else if (kingdoms.length === 2) {
      capitalSpots = [
        { x: 1, y: 1 },
        { x: 8, y: 8 },
      ];
    }

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const id = `tile-${x}-${y}`;
        const code = `${String.fromCharCode(65 + y)}${x + 1}`; // A1, A2... J10
        
        // Find if this cell matches a Capital spot
        const capIdx = capitalSpots.findIndex(spot => spot.x === x && spot.y === y);
        let type: TileType = 'PLAIN';
        let ownerKingdomId: string | null = null;
        let defenseBonus = 1;
        let level = 1;

        if (capIdx !== -1 && capIdx < kingdoms.length) {
          type = 'CAPITAL';
          ownerKingdomId = kingdoms[capIdx].id;
          defenseBonus = 5;
          level = 3;
        } else {
          // Random tile distribution
          const rand = Math.random();
          if (rand < 0.12) {
            type = 'GOLD_MINE';
            defenseBonus = 2;
          } else if (rand < 0.25) {
            type = 'FOREST';
            defenseBonus = 3;
          } else if (rand < 0.38) {
            type = 'FARM';
            defenseBonus = 1;
          } else if (rand < 0.45) {
            type = 'MOUNTAIN';
            defenseBonus = 6;
          } else {
            type = 'PLAIN';
            defenseBonus = 1;
          }
        }

        tiles.push({
          id,
          code,
          x,
          y,
          type,
          ownerKingdomId,
          level,
          defenseBonus
        });
      }
    }

    const initialState: BattleState = {
      battleId: `sim-${Date.now()}`,
      name: 'Simulated Battle Arena',
      maxRound,
      round: 0,
      status: 'RUNNING',
      kingdoms,
      tiles,
      logs: [
        {
          id: `log-init`,
          roundNumber: 0,
          kingdomId: 'system',
          message: '⚔️ Trận đấu AI Kingdom Arena bắt đầu! Khởi tạo bản đồ vương quốc.',
          createdAt: new Date().toLocaleTimeString()
        }
      ],
      visualEffects: [],
      alliances: [],
      activeDialogue: null,
      activeGlobalEffect: null
    };

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

    const nextRound = battleState.round + 1;
    const nextKingdoms = battleState.kingdoms.map(k => ({ ...k }));
    const nextTiles = battleState.tiles.map(t => ({ ...t }));
    const newLogs: RoundLog[] = [];
    const attackLines: AttackLine[] = [];
    const newVisualEffects: VisualEffect[] = [];
    const roundEvents: Dialogue[] = [];

    // Filter expired alliances and register system logs for expiration
    const currentAlliances = battleState.alliances || [];
    const activeAlliances: Alliance[] = [];
    currentAlliances.forEach(all => {
      if (all.expireRound <= nextRound) {
        const k1Name = nextKingdoms.find(k => k.id === all.k1)?.name || all.k1;
        const k2Name = nextKingdoms.find(k => k.id === all.k2)?.name || all.k2;
        newLogs.push({
          id: `log-alliance-expire-${all.k1}-${all.k2}-${nextRound}`,
          roundNumber: nextRound,
          kingdomId: 'system',
          message: `🕊️ Hiệp ước liên minh giữa [${k1Name}] và [${k2Name}] đã hết hiệu lực.`,
          createdAt: new Date().toLocaleTimeString()
        });
      } else {
        activeAlliances.push(all);
      }
    });

    // Step 0: Check for random disaster/plague (15% chance starting from round 2)
    let disasterDialogue: Dialogue | null = null;
    let activeGlobalEffect: 'PLAGUE' | 'DISASTER' | null = null;
    if (nextRound >= 2 && Math.random() < 0.15) {
      const aliveKingdoms = nextKingdoms.filter(k => k.alive);
      if (aliveKingdoms.length > 0) {
        const targetKingdom = aliveKingdoms[Math.floor(Math.random() * aliveKingdoms.length)];
        const isPlague = Math.random() < 0.5;
        
        // Find a tile owned by the target kingdom to place the effect
        const targetKingdomTiles = nextTiles.filter(t => t.ownerKingdomId === targetKingdom.id);
        const targetTile = targetKingdomTiles.find(t => t.type === 'CAPITAL') || targetKingdomTiles[0];
        
        if (targetTile) {
          if (isPlague) {
            // Plague event
            const soldiersLost = Math.floor(targetKingdom.soldiers * 0.3);
            targetKingdom.soldiers = Math.max(2, targetKingdom.soldiers - soldiersLost);
            targetKingdom.morale = Math.max(10, targetKingdom.morale - 20);
            activeGlobalEffect = 'PLAGUE';
            
            newVisualEffects.push({
              id: `effect-plague-${targetKingdom.id}-${nextRound}-${Math.random()}`,
              x: targetTile.x,
              y: targetTile.y,
              text: 'DỊCH BỆNH',
              color: '#22c55e',
              icon: '🦠',
              createdAt: Date.now()
            });

            disasterDialogue = {
              type: 'DISASTER',
              senderId: targetKingdom.id,
              senderName: targetKingdom.name,
              senderModel: targetKingdom.model,
              senderColor: targetKingdom.color,
              message: `Nguy to! Đại dịch vương quốc 🦠 đang bùng phát dữ dội! Dân chúng lầm than, quân sĩ kiệt quệ!`,
              replyMessage: `Muôn tâu bệ hạ, chúng ta đã mất đi 30% lực lượng (${soldiersLost} binh sĩ) và sĩ khí giảm sút nghiêm trọng!`,
              targetTileCode: targetTile.code
            };

            newLogs.push({
              id: `log-disaster-${targetKingdom.id}-${nextRound}`,
              roundNumber: nextRound,
              kingdomId: 'system',
              message: `☣️ [Dịch bệnh] Đại dịch bùng phát tại [${targetKingdom.name}]! Tiêu hao 30% binh sĩ và giảm 20 sĩ khí.`,
              createdAt: new Date().toLocaleTimeString()
            });
          } else {
            // Natural disaster
            const suppliesLost = Math.floor(targetKingdom.supplies * 0.5);
            const goldLost = Math.floor(targetKingdom.gold * 0.3);
            targetKingdom.supplies = Math.max(0, targetKingdom.supplies - suppliesLost);
            targetKingdom.gold = Math.max(0, targetKingdom.gold - goldLost);
            activeGlobalEffect = 'DISASTER';
            
            const disasters = ['Siêu bão vũ trụ 🌪️', 'Lũ lụt tàn phá 🌊', 'Động đất sập lở 🌋', 'Hạn hán kéo dài ☀️'];
            const chosenDisaster = disasters[Math.floor(Math.random() * disasters.length)];

            newVisualEffects.push({
              id: `effect-disaster-${targetKingdom.id}-${nextRound}-${Math.random()}`,
              x: targetTile.x,
              y: targetTile.y,
              text: 'THIÊN TAI',
              color: '#ef4444',
              icon: '🌪️',
              createdAt: Date.now()
            });

            disasterDialogue = {
              type: 'DISASTER',
              senderId: targetKingdom.id,
              senderName: targetKingdom.name,
              senderModel: targetKingdom.model,
              senderColor: targetKingdom.color,
              message: `Hỡi ôi! Thiên tai hoành hành [${chosenDisaster}] càn quét vương quốc của ta!`,
              replyMessage: `Báo cáo bệ hạ! Lương thực dự trữ mất đi 50% (-${suppliesLost} 🌾) và ngân khố thiệt hại 30% (-${goldLost} 💰) để khắc phục thiên tai!`,
              targetTileCode: targetTile.code
            };

            newLogs.push({
              id: `log-disaster-${targetKingdom.id}-${nextRound}`,
              roundNumber: nextRound,
              kingdomId: 'system',
              message: `🌪️ [Thiên tai] ${chosenDisaster} tàn phá vương quốc [${targetKingdom.name}]! Thất thoát 50% lương thảo (-${suppliesLost}) và 30% vàng (-${goldLost}).`,
              createdAt: new Date().toLocaleTimeString()
            });
          }
        }
      }
    }

    // Step 1: Collect resources for each kingdom from their tiles
    nextKingdoms.forEach(kingdom => {
      if (!kingdom.alive) return;

      const ownedTiles = nextTiles.filter(t => t.ownerKingdomId === kingdom.id);
      
      // Calculate resource gains
      let suppliesGain = 10;
      let goldGain = 10;
      let energyGain = 10;
      let oilGain = 5;
      let scoreGain = ownedTiles.length * 2;

      ownedTiles.forEach(tile => {
        if (tile.type === 'FARM') suppliesGain += 15 + tile.level * 2;
        if (tile.type === 'GOLD_MINE') goldGain += 15 + tile.level * 2;
        if (tile.type === 'FOREST') energyGain += 15 + tile.level * 2;
        if (tile.type === 'MOUNTAIN') oilGain += 15 + tile.level * 2;
        if (tile.type === 'CAPITAL') {
          suppliesGain += 20;
          goldGain += 20;
          energyGain += 20;
          oilGain += 10;
        }
      });

      // Upkeep cost
      const upkeep = Math.floor(kingdom.soldiers * 1.5);
      kingdom.supplies = Math.max(0, kingdom.supplies + suppliesGain - upkeep);
      kingdom.gold = Math.max(0, kingdom.gold + goldGain - Math.floor(upkeep / 2));
      kingdom.energy = kingdom.energy + energyGain;
      kingdom.oil = kingdom.oil + oilGain;
      kingdom.score = kingdom.score + scoreGain;
      kingdom.population = Math.floor(kingdom.population + (kingdom.supplies > 20 ? 15 : -10));

      // Starvation drops morale
      if (kingdom.supplies <= 0) {
        kingdom.morale = Math.max(20, kingdom.morale - 8);
        kingdom.soldiers = Math.max(2, kingdom.soldiers - 1);
      }

      // Track score history for chart
      kingdom.scoreHistory = [...(kingdom.scoreHistory || []), kingdom.score];
      
      // Update forces based on soldiers count
      kingdom.infantry = kingdom.soldiers * 60;
      kingdom.tanks = kingdom.soldiers * 12;
      kingdom.aircraft = kingdom.soldiers * 3;
      kingdom.artillery = kingdom.soldiers * 9;
      kingdom.navy = kingdom.soldiers * 1;
      kingdom.drones = kingdom.soldiers * 5;
    });

    // Step 2: Random Agent Action for each Kingdom
    const actionTypes: ActionType[] = ['EXPAND', 'RECRUIT', 'ATTACK', 'DEFEND', 'RESEARCH', 'DIPLOMACY'];

    nextKingdoms.forEach(kingdom => {
      if (!kingdom.alive) return;

      // Filter possible target options
      const myTiles = nextTiles.filter(t => t.ownerKingdomId === kingdom.id);
      if (myTiles.length === 0) {
        kingdom.alive = false;
        newLogs.push({
          id: `log-die-${kingdom.id}-${nextRound}`,
          roundNumber: nextRound,
          kingdomId: 'system',
          message: `💀 Vương quốc [${kingdom.name}] đã bị xóa sổ hoàn toàn khỏi bản đồ!`,
          createdAt: new Date().toLocaleTimeString()
        });
        return;
      }

      // 1. Check if there are adjacent enemy tiles (ignoring allies)
      const adjacentEnemyTiles = nextTiles.filter(tile => {
        if (tile.ownerKingdomId === null || tile.ownerKingdomId === kingdom.id) return false;
        
        // Check if allied
        const isAllied = activeAlliances.some(all => 
          (all.k1 === kingdom.id && all.k2 === tile.ownerKingdomId) || 
          (all.k2 === kingdom.id && all.k1 === tile.ownerKingdomId)
        );
        if (isAllied) return false;

        return myTiles.some(myTile => getDistance(tile.x, tile.y, myTile.x, myTile.y) === 1);
      });

      // 2. Decide action based on adjacency and state
      let chosenAction: ActionType = 'EXPAND';
      const randVal = Math.random();

      if (adjacentEnemyTiles.length > 0) {
        // Bordering an enemy: focus on war and defense
        if (kingdom.soldiers >= 10) {
          if (randVal < 0.65) {
            chosenAction = 'ATTACK';
          } else if (randVal < 0.85) {
            chosenAction = 'RECRUIT';
          } else if (randVal < 0.95) {
            chosenAction = 'DEFEND';
          } else {
            chosenAction = 'DIPLOMACY';
          }
        } else {
          // Weak: recruit and defend
          if (randVal < 0.55) {
            chosenAction = 'RECRUIT';
          } else if (randVal < 0.85) {
            chosenAction = 'DEFEND';
          } else if (randVal < 0.95) {
            chosenAction = 'ATTACK';
          } else {
            chosenAction = 'DIPLOMACY';
          }
        }
      } else {
        // No bordering enemy: expand and tech up
        if (randVal < 0.55) {
          chosenAction = 'EXPAND';
        } else if (randVal < 0.80) {
          chosenAction = 'RESEARCH';
        } else if (randVal < 0.90) {
          chosenAction = 'RECRUIT';
        } else {
          chosenAction = 'DIPLOMACY';
        }
      }

      // Execute Action
      if (chosenAction === 'EXPAND') {
        // Find adjacent unowned tiles
        const adjacentUnowned = nextTiles.filter(tile => {
          if (tile.ownerKingdomId !== null) return false;
          // Check if adjacent to at least one of my tiles
          return myTiles.some(myTile => getDistance(tile.x, tile.y, myTile.x, myTile.y) === 1);
        });

        if (adjacentUnowned.length > 0) {
          const targetTile = adjacentUnowned[Math.floor(Math.random() * adjacentUnowned.length)];
          targetTile.ownerKingdomId = kingdom.id;
          targetTile.level = 1;
          
          kingdom.energy = Math.max(0, kingdom.energy - 15);
          kingdom.score += 15;

          const sourceTile = myTiles.find(myTile => getDistance(targetTile.x, targetTile.y, myTile.x, myTile.y) === 1) || myTiles[0];

          newVisualEffects.push({
            id: `effect-${kingdom.id}-${nextRound}-${Math.random()}`,
            x: targetTile.x,
            y: targetTile.y,
            text: 'EXPAND',
            color: '#ec4899',
            icon: '🚩',
            createdAt: Date.now(),
            type: 'EXPAND',
            senderId: kingdom.id,
            senderName: kingdom.name,
            partnerX: sourceTile.x,
            partnerY: sourceTile.y
          });

          roundEvents.push({
            type: 'EXPAND',
            senderId: kingdom.id,
            senderName: kingdom.name,
            senderModel: kingdom.model,
            senderColor: kingdom.color,
            message: `Hỡi quân sĩ! Hãy cắm cờ và mở rộng bờ cõi vương quốc tại ô [${targetTile.code}]!`,
            replyMessage: `Tuân lệnh hoàng thượng! Quân ta đã thiết lập cột mốc khai hoang ô [${targetTile.code}].`,
            targetTileCode: targetTile.code
          });

          newLogs.push({
            id: `log-act-${kingdom.id}-${nextRound}`,
            roundNumber: nextRound,
            kingdomId: kingdom.id,
            actionJson: { type: 'EXPAND', targetTileCode: targetTile.code },
            message: `🚩 [${kingdom.name}] tiến hành Khai Hoang và cắm cờ tại vùng đất mới [${targetTile.code}] (${targetTile.type}).`,
            createdAt: new Date().toLocaleTimeString()
          });
        } else {
          // Fallback to recruit
          chosenAction = 'RECRUIT';
        }
      }

      if (chosenAction === 'RECRUIT') {
        const cost = 12;
        if (kingdom.gold >= cost && kingdom.supplies >= cost) {
          kingdom.gold -= cost;
          kingdom.supplies -= cost;
          const recruited = 4 + Math.floor(kingdom.tech * 1.5);
          kingdom.soldiers += recruited;
          kingdom.morale = Math.min(100, kingdom.morale + 3);

          const capitalTile = nextTiles.find(t => t.ownerKingdomId === kingdom.id && t.type === 'CAPITAL') || myTiles[0];
          newVisualEffects.push({
            id: `effect-${kingdom.id}-${nextRound}-${Math.random()}`,
            x: capitalTile.x,
            y: capitalTile.y,
            text: `+${recruited} SOLDIERS`,
            color: '#3b82f6',
            icon: '🛡️',
            createdAt: Date.now()
          });

          newLogs.push({
            id: `log-act-${kingdom.id}-${nextRound}`,
            roundNumber: nextRound,
            kingdomId: kingdom.id,
            actionJson: { type: 'RECRUIT', amount: recruited },
            message: `🛡️ [${kingdom.name}] chiêu mộ thêm [${recruited}] binh sĩ chuẩn bị cho các đợt hành quân.`,
            createdAt: new Date().toLocaleTimeString()
          });
        } else {
          chosenAction = 'DIPLOMACY';
        }
      }

      if (chosenAction === 'ATTACK') {
        // Find adjacent enemy tiles, skipping allied kingdoms
        const adjacentEnemy = nextTiles.filter(tile => {
          if (tile.ownerKingdomId === null || tile.ownerKingdomId === kingdom.id) return false;
          
          // Check if allied
          const isAllied = activeAlliances.some(all => 
            (all.k1 === kingdom.id && all.k2 === tile.ownerKingdomId) || 
            (all.k2 === kingdom.id && all.k1 === tile.ownerKingdomId)
          );
          if (isAllied) return false;

          return myTiles.some(myTile => getDistance(tile.x, tile.y, myTile.x, myTile.y) === 1);
        });

        if (adjacentEnemy.length > 0) {
          const targetTile = adjacentEnemy[Math.floor(Math.random() * adjacentEnemy.length)];
          const defenderId = targetTile.ownerKingdomId!;
          const defender = nextKingdoms.find(k => k.id === defenderId)!;
          
          // Find which of my tiles attacks
          const myAttackerTile = myTiles.find(myTile => getDistance(myTile.x, myTile.y, targetTile.x, targetTile.y) === 1)!;

          // Draw animated vector line
          const colorsMap: Record<string, string> = {
            'k-1': '#3b82f6',
            'k-2': '#ef4444',
            'k-3': '#10b981',
            'k-4': '#8b5cf6',
            'k-5': '#f97316'
          };

          const unitTypes: Array<'TANK' | 'AIRCRAFT' | 'DRONE'> = ['TANK', 'AIRCRAFT', 'DRONE'];
          const unitType = unitTypes[Math.floor(Math.random() * unitTypes.length)];

          attackLines.push({
            id: `attack-${kingdom.id}-${nextRound}-${Math.random()}`,
            fromX: myAttackerTile.x,
            fromY: myAttackerTile.y,
            toX: targetTile.x,
            toY: targetTile.y,
            color: colorsMap[kingdom.id] || '#ffffff',
            attackerName: kingdom.name,
            targetName: defender.name,
            round: nextRound,
            unitType
          });

          // Combat strength calculations
          const attackPower = (kingdom.soldiers * 0.7) * (0.5 + Math.random()) * (1 + kingdom.tech * 0.15);
          const defensePower = (defender.soldiers * 0.4 + targetTile.defenseBonus * 3) * (0.5 + Math.random()) * (1 + defender.tech * 0.1);

          if (attackPower > defensePower) {
            // Conquer tile & Loot resources
            targetTile.ownerKingdomId = kingdom.id;
            const lostSoldiers = Math.floor(kingdom.soldiers * 0.3);
            kingdom.soldiers = Math.max(5, kingdom.soldiers - lostSoldiers);
            
            const defLoss = Math.floor(defender.soldiers * 0.4);
            defender.soldiers = Math.max(2, defender.soldiers - defLoss);
            
            kingdom.score += 40;
            defender.score = Math.max(0, defender.score - 20);

            // Looting Mechanic (Steal 30% of gold and 30% of supplies)
            const lootedGold = Math.floor(defender.gold * 0.3);
            const lootedSupplies = Math.floor(defender.supplies * 0.3);
            defender.gold = Math.max(0, defender.gold - lootedGold);
            defender.supplies = Math.max(0, defender.supplies - lootedSupplies);
            kingdom.gold += lootedGold;
            kingdom.supplies += lootedSupplies;

            // Add floating visual effect for loot
            newVisualEffects.push({
              id: `effect-loot-${kingdom.id}-${nextRound}-${Math.random()}`,
              x: targetTile.x,
              y: targetTile.y,
              text: `Cướp +${lootedGold}💰 +${lootedSupplies}🌾`,
              color: '#f59e0b', // Amber/orange gold loot color
              icon: '💰',
              createdAt: Date.now()
            });

            roundEvents.push({
              type: 'ATTACK',
              senderId: kingdom.id,
              senderName: kingdom.name,
              senderModel: kingdom.model,
              senderColor: kingdom.color,
              receiverId: defender.id,
              receiverName: defender.name,
              receiverModel: defender.model,
              receiverColor: defender.color,
              message: `Toàn quân tiến công! Đánh sập cứ điểm ô [${targetTile.code}] của [${defender.name}], cướp bóc được ${lootedGold} vàng và ${lootedSupplies} lương thảo!`,
              replyMessage: `Nguy to! Đại bản doanh ô [${targetTile.code}] thất thủ! Kho tàng bị cướp mất ${lootedGold} vàng và ${lootedSupplies} lương thảo!`,
              targetTileCode: targetTile.code
            });

            newLogs.push({
              id: `log-act-${kingdom.id}-${nextRound}`,
              roundNumber: nextRound,
              kingdomId: kingdom.id,
              actionJson: { type: 'ATTACK', targetTileCode: targetTile.code },
              resultJson: { success: true, lootedGold, lootedSupplies },
              message: `⚔️ [${kingdom.name}] điều quân tấn công chiếm đóng thành công ô [${targetTile.code}] từ tay [${defender.name}], cướp được ${lootedGold} vàng và ${lootedSupplies} lương thảo!`,
              createdAt: new Date().toLocaleTimeString()
            });

            // If we took their capital, reduce morale drastically
            if (targetTile.type === 'CAPITAL') {
              defender.morale = Math.max(10, defender.morale - 40);
              kingdom.morale = Math.min(100, kingdom.morale + 15);
              newLogs.push({
                id: `log-cap-${defender.id}-${nextRound}`,
                roundNumber: nextRound,
                kingdomId: 'system',
                message: `🏰 Hoàng thành của [${defender.name}] đã bị thất thủ! Sĩ khí quân sĩ suy giảm trầm trọng.`,
                createdAt: new Date().toLocaleTimeString()
              });
            }
          } else {
            // Fail
            const lostSoldiers = Math.floor(kingdom.soldiers * 0.5);
            kingdom.soldiers = Math.max(2, kingdom.soldiers - lostSoldiers);
            kingdom.morale = Math.max(30, kingdom.morale - 10);
            
            newLogs.push({
              id: `log-act-${kingdom.id}-${nextRound}`,
              roundNumber: nextRound,
              kingdomId: kingdom.id,
              actionJson: { type: 'ATTACK', targetTileCode: targetTile.code },
              resultJson: { success: false },
              message: `🛡️ [${kingdom.name}] điều quân vây hãm [${targetTile.code}] của [${defender.name}] nhưng thất bại và tổn hao [${lostSoldiers}] binh sĩ.`,
              createdAt: new Date().toLocaleTimeString()
            });

            roundEvents.push({
              type: 'ATTACK',
              senderId: kingdom.id,
              senderName: kingdom.name,
              senderModel: kingdom.model,
              senderColor: kingdom.color,
              receiverId: defender.id,
              receiverName: defender.name,
              receiverModel: defender.model,
              receiverColor: defender.color,
              message: `Vây hãm ô [${targetTile.code}] của [${defender.name}]! Các chiến binh, tiến lên!`,
              replyMessage: `Phản công! Hệ thống lá chắn của chúng ta kiên cố như bàn thạch! Rút lui đi hỡi quân [${kingdom.name}]!`,
              targetTileCode: targetTile.code
            });
          }
        }
      }

      if (chosenAction === 'DEFEND') {
        const woodCost = 15;
        const targetTile = myTiles[Math.floor(Math.random() * myTiles.length)];
        
        if (kingdom.energy >= woodCost && targetTile) {
          kingdom.energy -= woodCost;
          targetTile.level += 1;
          targetTile.defenseBonus += 2;
          kingdom.score += 10;

          newVisualEffects.push({
            id: `effect-${kingdom.id}-${nextRound}-${Math.random()}`,
            x: targetTile.x,
            y: targetTile.y,
            text: '+2 DEFENSE',
            color: '#eab308',
            icon: '🧱',
            createdAt: Date.now()
          });

          newLogs.push({
            id: `log-act-${kingdom.id}-${nextRound}`,
            roundNumber: nextRound,
            kingdomId: kingdom.id,
            actionJson: { type: 'DEFEND', targetTileCode: targetTile.code },
            message: `🧱 [${kingdom.name}] gia cố công sự, nâng cấp ô [${targetTile.code}] lên cấp [${targetTile.level}] để tăng thủ thành.`,
            createdAt: new Date().toLocaleTimeString()
          });
        }
      }

      if (chosenAction === 'RESEARCH') {
        const goldCost = 30;
        const woodCost = 20;
        if (kingdom.gold >= goldCost && kingdom.energy >= woodCost) {
          kingdom.gold -= goldCost;
          kingdom.energy -= woodCost;
          kingdom.tech += 1;
          kingdom.score += 25;

          const capitalTile = nextTiles.find(t => t.ownerKingdomId === kingdom.id && t.type === 'CAPITAL') || myTiles[0];
          newVisualEffects.push({
            id: `effect-${kingdom.id}-${nextRound}-${Math.random()}`,
            x: capitalTile.x,
            y: capitalTile.y,
            text: '+1 TECH',
            color: '#a855f7',
            icon: '🔬',
            createdAt: Date.now()
          });

          newLogs.push({
            id: `log-act-${kingdom.id}-${nextRound}`,
            roundNumber: nextRound,
            kingdomId: kingdom.id,
            actionJson: { type: 'RESEARCH' },
            message: `🔬 [${kingdom.name}] đột phá Kỹ Nghệ lên Cấp [${kingdom.tech}], nâng sức tấn công và tăng năng suất tài nguyên.`,
            createdAt: new Date().toLocaleTimeString()
          });
        }
      }

      if (chosenAction === 'DIPLOMACY') {
        const goldCost = 20;
        if (kingdom.gold >= goldCost) {
          // Find another alive kingdom that is NOT currently allied
          const otherKingdoms = nextKingdoms.filter(k => k.alive && k.id !== kingdom.id && !activeAlliances.some(all => 
            (all.k1 === kingdom.id && all.k2 === k.id) || (all.k2 === kingdom.id && all.k1 === k.id)
          ));

          if (otherKingdoms.length > 0) {
            const partner = otherKingdoms[Math.floor(Math.random() * otherKingdoms.length)];
            
            kingdom.gold -= goldCost;
            kingdom.morale = Math.min(100, kingdom.morale + 10);
            partner.morale = Math.min(100, partner.morale + 10);
            kingdom.score += 15;
            partner.score += 10;
            
            // Register alliance relationship
            activeAlliances.push({
              k1: kingdom.id,
              k2: partner.id,
              expireRound: nextRound + 3
            });

            // Find their capitals (or a tile they own) to draw connection lines
            const myCapital = nextTiles.find(t => t.ownerKingdomId === kingdom.id && t.type === 'CAPITAL') || myTiles[0];
            const partnerTiles = nextTiles.filter(t => t.ownerKingdomId === partner.id);
            const partnerCapital = partnerTiles.find(t => t.type === 'CAPITAL') || partnerTiles[0];

            if (myCapital && partnerCapital) {
              newVisualEffects.push({
                id: `effect-diplomacy-${kingdom.id}-${nextRound}-${Math.random()}`,
                x: myCapital.x,
                y: myCapital.y,
                text: 'ALLIANCE',
                color: '#10b981',
                icon: '🤝',
                createdAt: Date.now(),
                type: 'DIPLOMACY',
                senderId: kingdom.id,
                senderName: kingdom.name,
                receiverId: partner.id,
                receiverName: partner.name,
                partnerX: partnerCapital.x,
                partnerY: partnerCapital.y
              });
            }

            roundEvents.push({
              type: 'DIPLOMACY',
              senderId: kingdom.id,
              senderName: kingdom.name,
              senderModel: kingdom.model,
              senderColor: kingdom.color,
              receiverId: partner.id,
              receiverName: partner.name,
              receiverModel: partner.model,
              receiverColor: partner.color,
              message: `Hỡi Vua [${partner.name}]! Hãy cùng bắt tay thiết lập hiệp ước liên minh 5 lượt nhé?`,
              replyMessage: `Vương quốc [${partner.name}] rất vinh dự! Chúng ta hãy cùng kiến tạo tương lai!`,
            });

            newLogs.push({
              id: `log-act-${kingdom.id}-${nextRound}`,
              roundNumber: nextRound,
              kingdomId: kingdom.id,
              actionJson: { type: 'DIPLOMACY' },
              message: `🤝 [${kingdom.name}] chủ động bang giao, thiết lập liên minh 5 lượt với [${partner.name}]!`,
              createdAt: new Date().toLocaleTimeString()
            });
          } else {
            // Fallback to self festival if no partners available
            kingdom.gold -= goldCost;
            kingdom.morale = Math.min(100, kingdom.morale + 15);
            kingdom.score += 5;

            const capitalTile = nextTiles.find(t => t.ownerKingdomId === kingdom.id && t.type === 'CAPITAL') || myTiles[0];
            newVisualEffects.push({
              id: `effect-${kingdom.id}-${nextRound}-${Math.random()}`,
              x: capitalTile.x,
              y: capitalTile.y,
              text: '+15 MORALE',
              color: '#10b981',
              icon: '🤝',
              createdAt: Date.now()
            });

            newLogs.push({
              id: `log-act-${kingdom.id}-${nextRound}`,
              roundNumber: nextRound,
              kingdomId: kingdom.id,
              actionJson: { type: 'DIPLOMACY' },
              message: `🤝 [${kingdom.name}] tổ chức lễ hội tăng Sĩ Khí quân đội thêm [+15].`,
              createdAt: new Date().toLocaleTimeString()
            });
          }
        }
      }
    });

    // Check if any kingdom lost all tiles and died
    nextKingdoms.forEach(kingdom => {
      if (!kingdom.alive) return;
      const owned = nextTiles.some(t => t.ownerKingdomId === kingdom.id);
      if (!owned) {
        kingdom.alive = false;
        newLogs.push({
          id: `log-ext-${kingdom.id}-${nextRound}`,
          roundNumber: nextRound,
          kingdomId: 'system',
          message: `💀 Vương quốc [${kingdom.name}] đã chính thức bị xóa sổ khỏi bản đồ!`,
          createdAt: new Date().toLocaleTimeString()
        });
      }
    });

    // Check if only 1 kingdom remains alive or round limit is reached
    const aliveCount = nextKingdoms.filter(k => k.alive).length;
    let finalStatus: BattleStatus = 'RUNNING';
    let winner: Kingdom | undefined = undefined;

    if (aliveCount <= 1 || nextRound >= battleState.maxRound) {
      finalStatus = 'FINISHED';
      const aliveKingdoms = nextKingdoms.filter(k => k.alive);
      winner = aliveKingdoms.length === 1 
        ? aliveKingdoms[0] 
        : nextKingdoms.sort((a, b) => b.score - a.score)[0];
        
      newLogs.push({
        id: `log-end-${nextRound}`,
        roundNumber: nextRound,
        kingdomId: 'system',
        message: `🏆 Trận đấu kết thúc! Vương quốc [${winner?.name}] giành chiến thắng tối cao với ${winner?.score} điểm!`,
        createdAt: new Date().toLocaleTimeString()
      });
      
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
    }

    // Select the most dramatic dialogue of this round
    let selectedDialogue: Dialogue | null = null;
    const disasters = disasterDialogue ? [disasterDialogue] : [];
    const attacks = roundEvents.filter(e => e.type === 'ATTACK');
    const diplomas = roundEvents.filter(e => e.type === 'DIPLOMACY');
    const expands = roundEvents.filter(e => e.type === 'EXPAND');

    if (disasters.length > 0) {
      selectedDialogue = disasters[0];
    } else if (attacks.length > 0) {
      selectedDialogue = attacks[Math.floor(Math.random() * attacks.length)];
    } else if (diplomas.length > 0) {
      selectedDialogue = diplomas[Math.floor(Math.random() * diplomas.length)];
    } else if (expands.length > 0) {
      selectedDialogue = expands[Math.floor(Math.random() * expands.length)];
    }

    // Set updated state
    const now = Date.now();
    const existingEffects = battleState.visualEffects || [];
    const filteredExistingEffects = existingEffects.filter(e => now - e.createdAt < 1800);
    const updatedEffects = [...filteredExistingEffects, ...newVisualEffects];

    set({
      battleState: {
        ...battleState,
        round: nextRound,
        status: finalStatus,
        kingdoms: nextKingdoms,
        tiles: nextTiles,
        logs: [...battleState.logs, ...newLogs],
        winner: winner,
        visualEffects: updatedEffects,
        alliances: activeAlliances,
        activeDialogue: selectedDialogue,
        activeGlobalEffect: activeGlobalEffect
      },
      activeAttackLines: attackLines,
      isSimulating: finalStatus === 'RUNNING'
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
