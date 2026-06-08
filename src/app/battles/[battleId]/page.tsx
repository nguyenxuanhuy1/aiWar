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
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

const MODEL_OPTIONS = [
  { value: 'Gemini 3.5 Flash', label: 'Gemini 3.5 Flash (Thấp/Nhanh)' },
  { value: 'Gemini 3.5 Pro', label: 'Gemini 3.5 Pro (Đỉnh cao)' },
  { value: 'GPT-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'GPT-4o-mini', label: 'GPT-4o Mini' },
  { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet (Anthropic)' },
  { value: 'Llama 3 70B', label: 'Llama 3 70B (Meta Open-source)' }
];

let runtimeTabId: string | null = null;
const getRuntimeTabId = () => {
  if (typeof window === 'undefined') return '';
  if (!runtimeTabId) {
    runtimeTabId = Math.random().toString(36).substring(2, 9);
  }
  return runtimeTabId;
};

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

  const [hasJoined, setHasJoined] = useState(false);
  const [myKingdomId, setMyKingdomId] = useState<string | null>(null);

  // Detect and resolve sessionStorage cloning
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentTabId = getRuntimeTabId();
    const storedTabId = sessionStorage.getItem(`activeTabId-${battleId}`);

    if (storedTabId && storedTabId !== currentTabId) {
      console.log('Cloned tab session detected! Clearing storage keys...');
      sessionStorage.removeItem(`joined-${battleId}`);
      sessionStorage.removeItem(`kingdomId-${battleId}`);
      sessionStorage.removeItem(`activeTabId-${battleId}`);
      setHasJoined(false);
      setMyKingdomId(null);
    } else {
      setHasJoined(sessionStorage.getItem(`joined-${battleId}`) === 'true');
      setMyKingdomId(sessionStorage.getItem(`kingdomId-${battleId}`));
      if (!storedTabId) {
        sessionStorage.setItem(`activeTabId-${battleId}`, currentTabId);
      }
    }
  }, [battleId]);

  // Hook up WebSockets
  useBattleSocket(battleId);

  // Load Battle room data
  useEffect(() => {
    if (!battleId) return;

    let active = true;

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
          if (!active) return;
          setBattleState(state);
          if (battleId.startsWith('mock-')) {
            if (state.status === 'RUNNING') {
              resumeLocalSimulation();
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      fetchInitialState();
    }

    return () => {
      active = false;
      stopLocalSimulation();
    };
  }, [battleId, startLocalSimulation, stopLocalSimulation, setBattleState, resumeLocalSimulation]);

  // Open Winner modal automatically when state status transitions to FINISHED
  useEffect(() => {
    if (battleState?.status === 'FINISHED' && battleState?.winner) {
      setWinnerModalOpen(true);
    } else {
      setWinnerModalOpen(false);
    }
  }, [battleState?.status, battleState?.winner]);

  const handleManualNextStep = () => {
    if (battleId === 'simulation-arena' || battleId.startsWith('mock-')) {
      triggerNextSimulationRound(true);
    } else {
      battleApi.startBattle(battleId).catch(err => {
        if (err.message === 'PLAYERS_NOT_READY' || err.errorCode === 'PLAYERS_NOT_READY') {
          alert('Tất cả người chơi khác phải sẵn sàng mới có thể bắt đầu trận đấu ⚠️');
        } else {
          alert(err.message || 'Không thể bắt đầu trận đấu');
        }
      });
    }
  };

  const handleTogglePlay = () => {
    if (battleId === 'simulation-arena' || battleId.startsWith('mock-')) {
      if (isSimulating) {
        stopLocalSimulation();
      } else {
        resumeLocalSimulation();
      }
    } else {
      battleApi.startBattle(battleId).catch(err => {
        if (err.message === 'PLAYERS_NOT_READY' || err.errorCode === 'PLAYERS_NOT_READY') {
          alert('Tất cả người chơi khác phải sẵn sàng mới có thể bắt đầu trận đấu ⚠️');
        } else {
          alert(err.message || 'Không thể bắt đầu trận đấu');
        }
      });
    }
  };

  const handleBackToLobby = () => {
    stopLocalSimulation();
    router.push('/');
  };

  const handleJoinLobby = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const model = formData.get('model') as string;
    const apiKey = (formData.get('apiKey') as string) || '';

    if (!name || !model) return;

    try {
      const updatedState = await battleApi.joinBattle(battleId, { name, model, apiKey });
      
      const joinedK = updatedState.kingdoms.find((k) => k.name === name);
      if (joinedK) {
        setMyKingdomId(joinedK.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`kingdomId-${battleId}`, joinedK.id);
          sessionStorage.setItem(`activeTabId-${battleId}`, getRuntimeTabId());
        }
      }

      setBattleState(updatedState);
      setHasJoined(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`joined-${battleId}`, 'true');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tham gia phòng đấu');
    }
  };

  const handleToggleReady = async () => {
    if (!myKingdomId) return;
    try {
      const updatedState = await battleApi.toggleReady(battleId, myKingdomId);
      setBattleState(updatedState);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thay đổi trạng thái sẵn sàng');
    }
  };

  const handleKickPlayer = async (targetKingdomId: string) => {
    if (confirm('Bạn có chắc muốn đuổi người chơi này khỏi phòng đấu?')) {
      try {
        const res = await battleApi.kickPlayer(battleId, targetKingdomId);
        if (res.success) {
          if (battleId.startsWith('mock-')) {
            const state = await battleApi.getBattleState(battleId);
            setBattleState(state);
          }
        } else {
          alert(res.message || 'Lỗi khi đuổi người chơi');
        }
      } catch (err: any) {
        alert(err.message || 'Lỗi khi đuổi người chơi');
      }
    }
  };

  const handleStartBattle = async () => {
    try {
      const res = await battleApi.startBattle(battleId);
      if (res.success) {
        if (battleId.startsWith('mock-')) {
          const state = await battleApi.getBattleState(battleId);
          setBattleState(state);
        }
      } else {
        alert(res.message || 'Khởi chạy đấu trường thất bại');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'PLAYERS_NOT_READY' || err.errorCode === 'PLAYERS_NOT_READY') {
        alert('Tất cả người chơi khác phải sẵn sàng mới có thể bắt đầu trận đấu ⚠️');
      } else {
        alert(err.message || 'Không thể khởi chạy trận đấu');
      }
    }
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
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-primary-hover transition-all"
          >
            Về Trang Chủ 🏠
          </button>
        </div>
      </div>
    );
  }

  // Render Waiting Lobby state
  if (battleState.status === 'WAITING') {
    const isHost = myKingdomId === 'k-1';
    const myKingdom = battleState.kingdoms.find(k => k.id === myKingdomId);
    const inviteLink = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/battles/${battleId}` : '';

    return (
      <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text-primary transition-colors duration-300 relative pb-12">
        {/* Background glow */}
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.04)_0%,transparent_100%)] pointer-events-none" />

        <div className="max-w-[1200px] w-full mx-auto px-6 pt-12 flex flex-col gap-8 flex-1 z-10">
          {/* Lobby Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-theme-border pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono font-bold text-indigo-400 mb-2 uppercase">
                📡 Đấu trường LOBBY
              </div>
              <h1 className="font-display text-3xl font-black tracking-tight flex items-center gap-3">
                Phòng Chờ Đấu Trường <span className="text-sm font-mono font-normal px-2.5 py-0.5 bg-white/5 border border-white/5 text-theme-text-muted">{battleId}</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3.5 bg-black/40 px-4 py-2.5 border border-white/5 rounded-none text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-theme-text-secondary">Trạng thái: </span>
              <span className="text-indigo-400 font-bold uppercase">Lobby Waiting</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left: Player Seats Grid */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <h2 className="font-display text-base font-black flex items-center gap-2 select-none">
                👥 Quân Đội Khởi Thiết ({battleState.kingdoms.length}/4)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const kingdom = battleState.kingdoms[idx];
                  if (kingdom) {
                    const isSelf = kingdom.id === myKingdomId;
                    return (
                      <Card 
                        key={kingdom.id}
                        className="relative p-6 bg-slate-900/20 flex flex-col justify-between min-h-[160px] group transition-all"
                        style={{ borderLeft: `3px solid ${kingdom.color}` }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-white/5 text-theme-text-muted border border-white/5">
                                Vương Quốc #{idx + 1}
                              </span>
                              
                              {/* Ready Check Indicators */}
                              {kingdom.id === 'k-1' ? (
                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold font-mono">
                                  CHỦ PHÒNG
                                </span>
                              ) : kingdom.ready ? (
                                <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/25 text-green-400 font-bold font-mono animate-pulse">
                                  SẴN SÀNG ✔️
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 bg-gray-500/10 border border-white/5 text-theme-text-muted font-bold font-mono">
                                  CHƯA SẴN SÀNG
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-bold text-white mt-3 flex items-center gap-2">
                              {kingdom.name}
                              {isSelf && <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 font-bold">BẠN</span>}
                            </h3>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <div 
                              className="w-9.5 h-9.5 rounded-full flex items-center justify-center text-base font-bold"
                              style={{ backgroundColor: `${kingdom.color}15`, border: `1px solid ${kingdom.color}40`, color: kingdom.color }}
                            >
                              👑
                            </div>

                            {/* Host Kick action buttons */}
                            {isHost && kingdom.id !== 'k-1' && (
                              <button
                                onClick={() => handleKickPlayer(kingdom.id)}
                                className="text-[9px] text-red-400 hover:text-red-300 font-bold border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 transition-all cursor-pointer shadow-sm"
                              >
                                Đuổi 🚫
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 border-t border-white/5 pt-3 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[9px] text-theme-text-secondary block font-bold uppercase">Mô Hình AI</span>
                            <span className="font-mono font-bold text-indigo-400">{kingdom.model}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-theme-text-secondary block font-bold uppercase">Binh sĩ ban đầu</span>
                            <span className="font-mono font-bold text-white">{kingdom.soldiers} units</span>
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  return (
                    <div 
                      key={idx}
                      className="border border-dashed border-white/10 p-6 flex flex-col items-center justify-center min-h-[160px] text-center bg-transparent group hover:border-white/20 transition-all select-none"
                    >
                      <div className="w-8 h-8 rounded-full border border-dashed border-white/15 flex items-center justify-center mb-3 animate-pulse">
                        👤
                      </div>
                      <span className="text-xs font-bold text-theme-text-secondary animate-pulse">
                        Đang chờ người chơi...
                      </span>
                      <span className="text-[10px] text-theme-text-muted mt-1 leading-relaxed">
                        Slot #{idx + 1} trống
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Join Form for non-joined guests */}
              {!hasJoined && battleState.kingdoms.length < 4 && (
                <Card className="mt-2 border-indigo-500/20 bg-slate-900/30">
                  <h3 className="font-display text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                    ⚡ Tham Gia Vào Trận Đấu Này
                  </h3>
                  <p className="text-[11px] text-theme-text-secondary mb-5 leading-relaxed">
                    Bạn đang xem phòng đấu của một người chơi khác. Điền thông tin vương quốc của bạn để tham gia vào lobby chuẩn bị.
                  </p>

                  <form onSubmit={handleJoinLobby} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-theme-text-secondary font-bold block mb-1.5 uppercase">Tên Vương Quốc:</label>
                        <input 
                          type="text" 
                          name="name" 
                          defaultValue={`Kingdom Guest #${battleState.kingdoms.length + 1}`}
                          className="w-full bg-theme-input-bg border border-theme-input-border text-xs px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-theme-text-secondary font-bold block mb-1.5 uppercase">Chọn LLM Model:</label>
                        <select 
                          name="model"
                          className="w-full bg-theme-input-bg border border-theme-input-border text-xs px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                          required
                        >
                          {MODEL_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-theme-text-secondary font-bold block mb-1.5 uppercase">API Key (Tùy chọn):</label>
                      <input 
                        type="password" 
                        name="apiKey"
                        placeholder="Để trống nếu server đã cấu hình sẵn"
                        className="w-full bg-theme-input-bg border border-theme-input-border text-xs px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <Button type="submit" className="w-full font-bold cursor-pointer py-2.5 mt-2">
                      🔌 Kết Nối Lobby
                    </Button>
                  </form>
                </Card>
              )}
            </div>

            {/* Right: Controls & Invite Link */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Room Info card */}
              <Card className="flex flex-col gap-5">
                <h3 className="font-display text-sm font-bold text-white border-b border-theme-divider pb-2 select-none">
                  🛡️ Bảng Điều Khiển
                </h3>

                <div className="flex flex-col gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-theme-text-secondary block font-bold uppercase">Cài đặt vòng tối đa</span>
                    <span className="font-bold text-white">{battleState.maxRound} lượt mô phỏng</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-theme-text-secondary block font-bold uppercase">Mời bạn bè tham gia (Link)</span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={inviteLink} 
                        readOnly 
                        className="flex-1 bg-black/40 border border-white/5 text-[10px] px-2.5 py-1.5 text-indigo-300 font-mono focus:outline-none"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(inviteLink);
                          alert('Đã sao chép link mời phòng!');
                        }}
                        className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-[10px] text-indigo-400 font-bold font-mono transition-colors cursor-pointer"
                      >
                        COPY
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  {isHost ? (
                    <Button 
                      onClick={handleStartBattle}
                      className="w-full font-bold py-3 cursor-pointer text-sm shadow-xl"
                    >
                      🚀 Khởi Chạy Trận Đấu
                    </Button>
                  ) : hasJoined ? (
                    /* Guest Ready Toggle Button */
                    <Button
                      onClick={handleToggleReady}
                      className={`w-full font-bold py-3 cursor-pointer text-sm shadow-xl ${
                        myKingdom?.ready
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {myKingdom?.ready ? '❌ Hủy Sẵn Sàng' : '✔️ Sẵn Sàng Tham Chiến'}
                    </Button>
                  ) : (
                    <div className="w-full py-3 bg-white/5 border border-white/5 text-center text-xs text-theme-text-secondary font-medium animate-pulse select-none">
                      ⏳ Đợi chủ phòng bắt đầu...
                    </div>
                  )}

                  <Button 
                    variant="secondary" 
                    onClick={handleBackToLobby}
                    className="w-full font-bold py-2.5 cursor-pointer text-xs"
                  >
                    🏠 Thoát Phòng Chờ
                  </Button>
                </div>
              </Card>

              {/* Lobby History Logs */}
              <Card className="flex-1 flex flex-col min-h-[240px] max-h-[350px]">
                <h3 className="font-display text-sm font-bold text-white border-b border-theme-divider pb-2 mb-3 select-none">
                  📋 Nhật Ký Phòng Chờ
                </h3>
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 text-[11px] font-mono text-theme-text-secondary text-left">
                  {battleState.logs.length === 0 ? (
                    <div className="text-theme-text-muted italic text-center mt-8">Chưa có hoạt động nào</div>
                  ) : (
                    battleState.logs.map((log) => (
                      <div key={log.id} className="leading-relaxed border-b border-white/5 pb-1.5 last:border-0">
                        <span className="text-theme-text-muted">[{log.createdAt}] </span>
                        <span>{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active / Finished Battle state
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
              alliances={battleState.alliances || []}
              activeDialogue={battleState.activeDialogue}
              activeGlobalEffect={battleState.activeGlobalEffect}
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
              isSimulating={battleId === 'simulation-arena' || battleId.startsWith('mock-') ? isSimulating : false}
              onToggleSimulate={handleTogglePlay}
              onShowWinnerModal={() => setWinnerModalOpen(true)}
              onLeave={handleBackToLobby}
            />
          </div>
        )}

      </div>

      {/* Victory Celebration Modal */}
      <WinnerModal
        isOpen={winnerModalOpen}
        winner={battleState.winner}
        onClose={() => setWinnerModalOpen(false)}
        onLeave={handleBackToLobby}
        logs={battleState.logs}
        kingdoms={battleState.kingdoms}
      />
    </div>
  );
}
