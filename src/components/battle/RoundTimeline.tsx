import React from 'react';
import { BattleState, Kingdom } from '@/types/battle';
import { Button } from '@/components/common/Button';
import { getKingdomColorStyles } from '@/utils/tileUtils';

interface RoundTimelineProps {
  state: BattleState | null;
  onNextStep?: () => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
}

export function RoundTimeline({ state, onNextStep, isSimulating, onToggleSimulate }: RoundTimelineProps) {
  if (!state) return null;

  const progress = state.maxRound > 0 ? (state.round / state.maxRound) * 100 : 0;

  // 1. TACTICAL MAP (Minimap calculation)
  const minimapSize = 80;
  const tileSize = minimapSize / 10;

  // 2. UNIT OVERVIEW (Sum forces from all alive kingdoms)
  const totalForces = {
    infantry: 0,
    tanks: 0,
    aircraft: 0,
    artillery: 0,
    navy: 0,
    drones: 0
  };

  state.kingdoms.forEach(k => {
    if (k.alive) {
      totalForces.infantry += k.infantry;
      totalForces.tanks += k.tanks;
      totalForces.aircraft += k.aircraft;
      totalForces.artillery += k.artillery;
      totalForces.navy += k.navy;
      totalForces.drones += k.drones;
    }
  });

  // Calculate percentages relative to a reasonable maximum for progress bars
  const maxBarValues = {
    infantry: 3000,
    tanks: 1000,
    aircraft: 300,
    artillery: 500,
    navy: 100,
    drones: 500
  };

  // 3. BATTLE STATISTICS (SVG Line Chart)
  const chartWidth = 240;
  const chartHeight = 80;

  const renderChartLines = () => {
    // Find top 2 kingdoms
    const team1 = state.kingdoms[0];
    const team2 = state.kingdoms[1];

    if (!team1 || !team2) return null;

    const hist1 = team1.scoreHistory || [100];
    const hist2 = team2.scoreHistory || [100];

    const allScores = [...hist1, ...hist2];
    const maxVal = Math.max(...allScores, 200);
    const minVal = 0;
    const valueRange = maxVal - minVal;

    const pointsCount = Math.max(hist1.length, hist2.length, 2);
    const getX = (index: number) => (index / (pointsCount - 1)) * chartWidth;
    const getY = (val: number) => chartHeight - ((val - minVal) / valueRange) * (chartHeight - 15) - 8;

    const points1 = hist1.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');
    const points2 = hist2.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');

    const color1 = getKingdomColorStyles(team1.name).main;
    const color2 = getKingdomColorStyles(team2.name).main;

    return (
      <>
        {/* Grid Background Lines for Chart */}
        <g stroke="rgba(255,255,255,0.03)" strokeWidth="0.5">
          <line x1={0} y1={chartHeight / 3} x2={chartWidth} y2={chartHeight / 3} />
          <line x1={0} y1={(chartHeight * 2) / 3} x2={chartWidth} y2={(chartHeight * 2) / 3} />
          <line x1={chartWidth / 3} y1={0} x2={chartWidth / 3} y2={chartHeight} />
          <line x1={(chartWidth * 2) / 3} y1={0} x2={(chartWidth * 2) / 3} y2={chartHeight} />
        </g>

        {/* Polylines */}
        {points1 && (
          <polyline
            fill="none"
            stroke={color1}
            strokeWidth="2"
            points={points1}
            style={{ filter: 'drop-shadow(0 0 3px ' + color1 + ')' }}
          />
        )}
        {points2 && (
          <polyline
            fill="none"
            stroke={color2}
            strokeWidth="2"
            points={points2}
            style={{ filter: 'drop-shadow(0 0 3px ' + color2 + ')' }}
          />
        )}
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 w-full select-none text-left">
      {/* 1. TACTICAL MAP WIDGET */}
      <div className="bg-[#030712]/70 border border-white/5 p-4 rounded-none flex flex-col justify-between">
        <h4 className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2">
          TACTICAL MAP
        </h4>
        <div className="flex items-center gap-3">
          {/* Render Minimap SVG */}
          <div className="bg-black/80 p-1 border border-white/5 rounded-none flex items-center justify-center shrink-0">
            <svg width={minimapSize} height={minimapSize} viewBox={`0 0 ${minimapSize} ${minimapSize}`}>
              {state.tiles.map((tile) => {
                const owner = tile.ownerKingdomId ? state.kingdoms.find(k => k.id === tile.ownerKingdomId) : null;
                const styles = getKingdomColorStyles(owner ? owner.name : 'unowned');
                return (
                  <rect
                    key={tile.id}
                    x={tile.x * tileSize}
                    y={tile.y * tileSize}
                    width={tileSize - 0.5}
                    height={tileSize - 0.5}
                    fill={styles.main}
                    fillOpacity={owner ? 0.8 : 0.15}
                  />
                );
              })}
            </svg>
          </div>
          <div className="flex-1 text-[11px] leading-tight text-theme-text-secondary flex flex-col justify-center gap-1.5">
            <div>
              <span className="font-bold text-white block">Sự Kiện Lượt Đấu</span>
              <span className="text-[10px] text-theme-text-muted">Đang quét vị trí quân lực...</span>
            </div>
            {/* Play/Pause Control Buttons inside minimap card */}
            <div className="flex gap-2.5 mt-1">
              <button
                onClick={onToggleSimulate}
                className={`
                  px-3 py-1.5 text-[9px] font-black uppercase rounded cursor-pointer tracking-wider outline-none transition-colors border
                  ${isSimulating 
                    ? 'bg-red-500/15 border-red-500/20 text-red-400 hover:bg-red-500/35' 
                    : 'bg-primary/15 border-primary/20 text-primary hover:bg-primary/35'
                  }
                `}
              >
                {isSimulating ? 'Pause II' : 'Resume ▶'}
              </button>
              {onNextStep && !isSimulating && state.status === 'RUNNING' && (
                <button
                  onClick={onNextStep}
                  className="px-2.5 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 text-[9px] font-black uppercase text-theme-text-primary rounded cursor-pointer transition-colors"
                >
                  Step ⏭️
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. UNIT OVERVIEW WIDGET (Span 2 columns on desktop) */}
      <div className="md:col-span-2 bg-[#030712]/70 border border-white/5 p-4 rounded-none flex flex-col justify-between">
        <h4 className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2 flex justify-between items-center">
          <span>UNIT OVERVIEW</span>
          <span className="text-[9px] font-mono text-cyan-glow">BATTLEFIELD TOTALS</span>
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {/* Infantry */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono leading-none">
              <span className="text-theme-text-secondary select-none">Infantry</span>
              <span className="text-white font-bold">{totalForces.infantry}</span>
            </div>
            <div className="h-1.5 bg-gray-900 border border-white/5 rounded-none overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-none transition-all duration-300"
                style={{ width: `${Math.min((totalForces.infantry / maxBarValues.infantry) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Tanks */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono leading-none">
              <span className="text-theme-text-secondary select-none">Tanks</span>
              <span className="text-white font-bold">{totalForces.tanks}</span>
            </div>
            <div className="h-1.5 bg-gray-900 border border-white/5 rounded-none overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-none transition-all duration-300"
                style={{ width: `${Math.min((totalForces.tanks / maxBarValues.tanks) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Aircraft */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono leading-none">
              <span className="text-theme-text-secondary select-none">Aircraft</span>
              <span className="text-white font-bold">{totalForces.aircraft}</span>
            </div>
            <div className="h-1.5 bg-gray-900 border border-white/5 rounded-none overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-none transition-all duration-300"
                style={{ width: `${Math.min((totalForces.aircraft / maxBarValues.aircraft) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Artillery */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono leading-none">
              <span className="text-theme-text-secondary select-none">Artillery</span>
              <span className="text-white font-bold">{totalForces.artillery}</span>
            </div>
            <div className="h-1.5 bg-gray-900 border border-white/5 rounded-none overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-none transition-all duration-300"
                style={{ width: `${Math.min((totalForces.artillery / maxBarValues.artillery) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Navy */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono leading-none">
              <span className="text-theme-text-secondary select-none">Navy</span>
              <span className="text-white font-bold">{totalForces.navy}</span>
            </div>
            <div className="h-1.5 bg-gray-900 border border-white/5 rounded-none overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-none transition-all duration-300"
                style={{ width: `${Math.min((totalForces.navy / maxBarValues.navy) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Drones */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono leading-none">
              <span className="text-theme-text-secondary select-none">Drones</span>
              <span className="text-white font-bold">{totalForces.drones}</span>
            </div>
            <div className="h-1.5 bg-gray-900 border border-white/5 rounded-none overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-none transition-all duration-300"
                style={{ width: `${Math.min((totalForces.drones / maxBarValues.drones) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. BATTLE STATISTICS CHART */}
      <div className="bg-[#030712]/70 border border-white/5 p-4 rounded-none flex flex-col justify-between overflow-hidden">
        <h4 className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2 flex justify-between items-center">
          <span>BATTLE STATISTICS</span>
          <span className="text-[9px] font-mono text-theme-text-secondary">SCORE PROGRESS</span>
        </h4>
        <div className="relative h-[80px] bg-black/60 border border-white/5 rounded-none overflow-hidden flex items-center justify-center">
          <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {renderChartLines()}
          </svg>
        </div>
      </div>
    </div>
  );
}
