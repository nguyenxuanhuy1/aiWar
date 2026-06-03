import { useEffect } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { Dialogue } from '@/types/battle';

export function useBattleSocket(battleId: string) {
  const setBattleState = useBattleStore((state) => state.setBattleState);
  const appendLog = useBattleStore((state) => state.appendLog);
  const setConnected = useBattleStore((state) => state.setConnected);
  const isSimulating = useBattleStore((state) => state.isSimulating);

  useEffect(() => {
    // If no battleId or if simulating locally or mock mode, do not connect to real websocket
    if (!battleId || battleId.startsWith('sim-') || battleId.startsWith('mock-') || isSimulating) {
      return;
    }

    let ws: WebSocket | null = null;
    let isActive = true;

    const initSocket = () => {
      try {
        if (!isActive) return;

        // Resolve WS URL based on current host (local development proxies or connects to port 8080)
        const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        
        const socketUrl = host.includes('localhost')
          ? `ws://localhost:8080/ws-battle/${battleId}`
          : `${protocol}//${host}/ws-battle/${battleId}`;

        console.log('[WebSocket] Connecting to:', socketUrl);
        ws = new WebSocket(socketUrl);

        ws.onopen = () => {
          if (!isActive) return;
          setConnected(true);
          console.log('[WebSocket] Connection Established');
        };

        ws.onclose = () => {
          if (!isActive) return;
          setConnected(false);
          console.log('[WebSocket] Connection Closed');
        };

        ws.onerror = (err) => {
          console.error('[WebSocket] Error:', err);
        };

        ws.onmessage = (event) => {
          if (!isActive) return;
          try {
            const message = JSON.parse(event.data);
            const { type, payload } = message;
            console.log('[WebSocket] Event Received:', type, payload);

            // Fetch current state from the Zustand store
            const currentBattleState = useBattleStore.getState().battleState;
            if (!currentBattleState) return;

            if (type === 'ROUND_START') {
              // Update round and kingdoms resources
              const updatedKingdoms = currentBattleState.kingdoms.map(k => {
                const nextK = payload.kingdoms?.find((pk: any) => pk.id === k.id);
                return nextK ? { ...k, ...nextK } : k;
              });

              setBattleState({
                ...currentBattleState,
                round: payload.round,
                kingdoms: updatedKingdoms
              });
            } 
            else if (type === 'DISASTER_TRIGGERED') {
              // Update kingdoms if any
              const updatedKingdoms = currentBattleState.kingdoms.map(k => {
                if (k.id === payload.targetKingdomId) {
                  const newSoldiers = Math.max(2, k.soldiers - payload.soldiersLost);
                  const newMorale = Math.max(10, k.morale - payload.moraleLost);
                  const newGold = Math.max(0, k.gold - payload.goldLost);
                  const newSupplies = Math.max(0, k.supplies - payload.suppliesLost);
                  return { 
                    ...k, 
                    soldiers: newSoldiers, 
                    morale: newMorale, 
                    gold: newGold, 
                    supplies: newSupplies,
                    infantry: newSoldiers * 60,
                    tanks: newSoldiers * 12,
                    aircraft: newSoldiers * 3,
                    artillery: newSoldiers * 9,
                    navy: newSoldiers * 1,
                    drones: newSoldiers * 5
                  };
                }
                return k;
              });

              // Add a floating visual effect at the kingdom's Capital/Outpost
              const targetKingdomTiles = currentBattleState.tiles.filter(t => t.ownerKingdomId === payload.targetKingdomId);
              const targetTile = targetKingdomTiles.find(t => t.type === 'CAPITAL') || targetKingdomTiles[0];

              const newVisualEffects = [...(currentBattleState.visualEffects || [])];
              if (targetTile) {
                newVisualEffects.push({
                  id: `effect-disaster-${Date.now()}-${Math.random()}`,
                  x: targetTile.x,
                  y: targetTile.y,
                  text: payload.effectType === 'PLAGUE' ? 'DỊCH BỆNH' : 'THIÊN TAI',
                  color: payload.effectType === 'PLAGUE' ? '#22c55e' : '#ef4444',
                  icon: payload.effectType === 'PLAGUE' ? '🦠' : '🌪️',
                  createdAt: Date.now()
                });
              }

              // Update state with dialog & full-map weather overlay
              setBattleState({
                ...currentBattleState,
                kingdoms: updatedKingdoms,
                activeDialogue: payload.dialogue,
                activeGlobalEffect: payload.effectType,
                visualEffects: newVisualEffects
              });

              // Append log message
              const eventIcon = payload.effectType === 'PLAGUE' ? '☣️' : '🌪️';
              appendLog({
                id: `log-disaster-${Date.now()}`,
                roundNumber: currentBattleState.round,
                kingdomId: 'system',
                message: `${eventIcon} [${payload.dialogue.senderName}]: ${payload.dialogue.message} -> ${payload.dialogue.replyMessage}`,
                createdAt: new Date().toLocaleTimeString()
              });

              // Clear dialog and full-screen weather tint after 5.5 seconds
              setTimeout(() => {
                if (!isActive) return;
                const stateNow = useBattleStore.getState().battleState;
                if (stateNow) {
                  setBattleState({
                    ...stateNow,
                    activeDialogue: null,
                    activeGlobalEffect: null
                  });
                }
              }, 5500);
            }
            else if (type === 'ACTION_SELECTED') {
              // Display visual novel dialogue bubble
              setBattleState({
                ...currentBattleState,
                activeDialogue: payload.dialogue
              });
            }
            else if (type === 'ACTION_EXECUTED') {
              // Update tiles
              const updatedTiles = currentBattleState.tiles.map(t => {
                const ut = payload.updatedTiles?.find((upt: any) => upt.id === t.id || upt.code === t.code);
                return ut ? { ...t, ...ut } : t;
              });

              // Update kingdoms resources
              const updatedKingdoms = currentBattleState.kingdoms.map(k => {
                const uk = payload.updatedKingdoms?.find((upk: any) => upk.id === k.id);
                return uk ? { ...k, ...uk } : k;
              });

              const newVisualEffects = [...(currentBattleState.visualEffects || [])];

              // Push floating visual badge for loot if applicable
              if (payload.lootedResources && (payload.lootedResources.gold > 0 || payload.lootedResources.supplies > 0)) {
                const targetTile = updatedTiles.find(t => t.code === payload.dialogue?.targetTileCode) || payload.updatedTiles?.[0];
                if (targetTile) {
                  newVisualEffects.push({
                    id: `effect-loot-${Date.now()}-${Math.random()}`,
                    x: targetTile.x,
                    y: targetTile.y,
                    text: `Cướp +${payload.lootedResources.gold}💰 +${payload.lootedResources.supplies}🌾`,
                    color: '#f59e0b',
                    icon: '💰',
                    createdAt: Date.now()
                  });
                }
              }

              // Build log details
              const sender = currentBattleState.kingdoms.find(k => k.id === payload.kingdomId);
              let logMsg = '';

              if (payload.action === 'ATTACK') {
                const defender = currentBattleState.kingdoms.find(k => k.id === payload.lootedResources?.targetKingdomId);
                const tileCode = payload.dialogue?.targetTileCode || payload.updatedTiles?.[0]?.code || '';
                if (payload.success) {
                  logMsg = `⚔️ [${sender?.name}] điều quân tấn công chiếm đóng thành công ô [${tileCode}] từ tay [${defender?.name || 'địch'}], cướp được ${payload.lootedResources?.gold || 0} vàng và ${payload.lootedResources?.supplies || 0} lương thảo!`;
                } else {
                  logMsg = `🛡️ [${sender?.name}] điều quân vây hãm [${tileCode}] của [${defender?.name || 'địch'}] nhưng thất bại!`;
                }
              } else if (payload.action === 'EXPAND') {
                const tileCode = payload.dialogue?.targetTileCode || payload.updatedTiles?.[0]?.code || '';
                logMsg = `🚩 [${sender?.name}] tiến hành Khai Hoang và cắm cờ tại vùng đất mới [${tileCode}].`;
              } else if (payload.action === 'RECRUIT') {
                logMsg = `🛡️ [${sender?.name}] chiêu mộ thêm quân sĩ chuẩn bị cho hành quân.`;
              } else if (payload.action === 'DEFEND') {
                const tileCode = payload.dialogue?.targetTileCode || payload.updatedTiles?.[0]?.code || '';
                logMsg = `🧱 [${sender?.name}] gia cố công sự bảo vệ vùng đất [${tileCode}].`;
              } else if (payload.action === 'RESEARCH') {
                logMsg = `🔬 [${sender?.name}] đột phá công nghệ để gia tăng sức tấn công.`;
              } else if (payload.action === 'DIPLOMACY') {
                logMsg = `🤝 [${sender?.name}] chủ động bang giao thiết lập bang giao hữu nghị.`;
              }

              setBattleState({
                ...currentBattleState,
                tiles: updatedTiles,
                kingdoms: updatedKingdoms,
                visualEffects: newVisualEffects
              });

              // Trigger vector lines and explosion animations
              if (payload.attackLine) {
                useBattleStore.setState({
                  activeAttackLines: [{
                    id: `line-${Date.now()}-${Math.random()}`,
                    fromX: payload.attackLine.fromX,
                    fromY: payload.attackLine.fromY,
                    toX: payload.attackLine.toX,
                    toY: payload.attackLine.toY,
                    color: payload.attackLine.color,
                    attackerName: sender?.name || '',
                    targetName: '',
                    round: currentBattleState.round,
                    unitType: payload.attackLine.unitType || 'TANK'
                  }]
                });

                // Clear attack lines after 1.8s
                setTimeout(() => {
                  if (!isActive) return;
                  useBattleStore.setState({ activeAttackLines: [] });
                }, 1800);
              }

              if (logMsg) {
                appendLog({
                  id: `log-act-${Date.now()}`,
                  roundNumber: currentBattleState.round,
                  kingdomId: payload.kingdomId,
                  message: logMsg,
                  createdAt: new Date().toLocaleTimeString()
                });
              }

              // Auto-clear visual novel text after 5.5s
              setTimeout(() => {
                if (!isActive) return;
                const stateNow = useBattleStore.getState().battleState;
                if (stateNow) {
                  setBattleState({
                    ...stateNow,
                    activeDialogue: null
                  });
                }
              }, 5500);
            }
            else if (type === 'BATTLE_FINISHED') {
              setBattleState({
                ...currentBattleState,
                status: 'FINISHED',
                winner: currentBattleState.kingdoms.find(k => k.id === payload.winnerId)
              });
            }
          } catch (err) {
            console.error('[WebSocket] Failed to parse message body:', err);
          }
        };
      } catch (err) {
        console.error('[WebSocket] Initialisation failed:', err);
      }
    };

    initSocket();

    return () => {
      isActive = false;
      if (ws) {
        ws.close();
      }
      setConnected(false);
    };
  }, [battleId, isSimulating, setBattleState, appendLog, setConnected]);
}

