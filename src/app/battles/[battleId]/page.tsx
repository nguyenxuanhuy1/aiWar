'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBattleStore } from '@/stores/battleStore';
import { useBattleSocket } from '@/hooks/useBattleSocket';
import { battleApi } from '@/services/battleApi';

import { BattleMap } from '@/components/battle/BattleMap';
import { KingdomPanel } from '@/components/battle/KingdomPanel';
import { RoundTimeline } from '@/components/battle/RoundTimeline';
import { WinnerModal } from '@/components/battle/WinnerModal';

export default function BattleRoomPage() {
  const router = useRouter();
  const params = useParams();
  const battleId = (params?.battleId as string) || '';

  const {
    battleState,
    selectedTile,
    isConnected,
    isSimulating,
    activeAttackLines,
    setBattleState,
    setSelectedTile,
    startLocalSimulation,
    stopLocalSimulation,
    resumeLocalSimulation,
    triggerNextSimulationRound,
  } = useBattleStore();

  const [loading, setLoading] = useState(true);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);


  // Hook up WebSockets
  useBattleSocket(battleId);

  // Load Battle room data
  useEffect(() => {
    if (!battleId) return;

    console.log('BattleRoomPage: useEffect mounted. battleId:', battleId);

    if (battleId === 'simulation-arena') {
      console.log('BattleRoomPage: starting offline simulation');
      setLoading(false);
      
      const latestState = useBattleStore.getState().battleState;
      const currentKingdoms = latestState?.kingdoms.map(k => ({ name: k.name, model: k.model })) || [
        { name: 'Alpha Empire', model: 'Gemini 3.5 Pro' },
        { name: 'Beta Dynasty', model: 'GPT-4o' },
        { name: 'Gamma Republic', model: 'Claude 3.5 Sonnet' },
      ];
      const currentMaxRound = latestState?.maxRound || 30;

      startLocalSimulation(currentMaxRound, currentKingdoms);
    } else {
      const fetchInitialState = async () => {
        try {
          const state = await battleApi.getBattleState(battleId);
          setBattleState(state);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      fetchInitialState();
    }

    return () => {
      stopLocalSimulation();
    };
  }, [battleId, startLocalSimulation, stopLocalSimulation, setBattleState]);


  // Open Winner modal automatically when state status transitions to FINISHED
  useEffect(() => {
    if (battleState?.status === 'FINISHED' && battleState?.winner) {
      setWinnerModalOpen(true);
    } else {
      setWinnerModalOpen(false);
    }
  }, [battleState?.status, battleState?.winner]);

  const handleManualNextStep = () => {
    if (battleId === 'simulation-arena') {
      triggerNextSimulationRound();
    } else {
      battleApi.startBattle(battleId);
    }
  };

  const handleTogglePlay = () => {
    if (battleId === 'simulation-arena') {
      if (isSimulating) {
        stopLocalSimulation();
      } else {
        resumeLocalSimulation();
      }
    } else {
      battleApi.startBattle(battleId);
    }
  };

  const handleBackToLobby = () => {
    stopLocalSimulation();
    router.push('/battles/create');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-bg select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-bold text-theme-text-secondary animate-pulse">
            Đang tải dữ liệu Đấu trường...
          </span>
        </div>
      </div>
    );
  }

  if (!battleState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-bg px-6 select-none text-center">
        <div className="max-w-md p-6 bg-theme-card border border-theme-border rounded-2xl">
          <h2 className="text-xl font-bold text-red-500 mb-2">Không tìm thấy phòng đấu</h2>
          <p className="text-xs text-theme-text-secondary mb-6">
            Mã phòng đấu không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <button
            onClick={() => router.push('/battles/create')}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-primary-hover transition-all"
          >
            Tạo phòng đấu mới 🏠
          </button>
        </div>
      </div>
    );
  }


  // Divide kingdoms for tab selections: odd indices on left panel, even indices on right panel
  const leftCandidates = battleState.kingdoms.filter((_, idx) => idx % 2 === 0);
  const rightCandidates = battleState.kingdoms.filter((_, idx) => idx % 2 !== 0);

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text-primary transition-colors duration-300 relative pb-10">
      {/* Decorative top ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.03)_0%,transparent_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-[1920px] w-full mx-auto px-6 pt-2 pb-4 flex flex-col gap-4 flex-1 z-10">
        
        {/* Dashboard Panels Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 flex-1 items-stretch">
          
          {/* Left panel: Agent Alpha (Blue side) Console */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {leftCandidates.map(kingdom => {
              const logs = battleState.logs.filter(
                l => l.kingdomId === kingdom.id || (l.kingdomId === 'system' && l.message.includes(kingdom.name))
              );
              return (
                <div key={kingdom.id} className="h-[265px] w-full">
                  <KingdomPanel kingdom={kingdom} side="left" logs={logs} />
                </div>
              );
            })}
          </div>

          {/* Center panel: 10x10 Grid BattleMap */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <BattleMap
              tiles={battleState.tiles}
              kingdoms={battleState.kingdoms}
              selectedTile={selectedTile}
              setSelectedTile={setSelectedTile}
              activeAttackLines={activeAttackLines}
              visualEffects={battleState.visualEffects || []}
            />
          </div>

          {/* Right panel: Agent Beta (Red side) Console */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {rightCandidates.map(kingdom => {
              const logs = battleState.logs.filter(
                l => l.kingdomId === kingdom.id || (l.kingdomId === 'system' && l.message.includes(kingdom.name))
              );
              return (
                <div key={kingdom.id} className="h-[265px] w-full">
                  <KingdomPanel kingdom={kingdom} side="right" logs={logs} />
                </div>
              );
            })}
          </div>

        </div>

        {/* Bottom Panel containing Minimap, Unit Overview, and Real-time Chart */}
        {showTimeline && (
          <div className="w-full transition-all duration-300 animate-fade-in">
            <RoundTimeline
              state={battleState}
              onNextStep={handleManualNextStep}
              isSimulating={battleId === 'simulation-arena' ? isSimulating : false}
              onToggleSimulate={handleTogglePlay}
            />
          </div>
        )}

      </div>

      {/* Victory Celebration Modal */}
      <WinnerModal
        isOpen={winnerModalOpen}
        winner={battleState.winner}
        onClose={() => setWinnerModalOpen(false)}
      />
    </div>
  );
}
