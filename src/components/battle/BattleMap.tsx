import React from 'react';
import { Tile, Kingdom, AttackLine, VisualEffect } from '@/types/battle';
import { TileCell } from './TileCell';
import { getKingdomColorStyles, getTileTypeLabel, getTileTypeEmoji } from '@/utils/tileUtils';

interface BattleMapProps {
  tiles: Tile[];
  kingdoms: Kingdom[];
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
  activeAttackLines: AttackLine[];
  visualEffects?: VisualEffect[];
}

export function BattleMap({
  tiles,
  kingdoms,
  selectedTile,
  setSelectedTile,
  activeAttackLines,
  visualEffects = []
}: BattleMapProps) {
  
  const cellSize = 60;
  const mapWidth = cellSize * 10;
  const mapHeight = cellSize * 10;

  // Selected tile details
  const selectedOwner = selectedTile?.ownerKingdomId
    ? kingdoms.find((k) => k.id === selectedTile.ownerKingdomId)
    : null;
  const selectedOwnerStyles = getKingdomColorStyles(selectedOwner ? selectedOwner.name : 'unowned');

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* SVG Map Container */}
      <div className="relative bg-[#02050c] border border-white/5 p-4 rounded-none flex items-center justify-center overflow-x-auto">
        {/* Animated grid ambient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,transparent_80%)] pointer-events-none" />
        
        {/* High-tech corner bracket accents for map frame */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/20 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/20 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/20 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/20 pointer-events-none" />

        <svg
          viewBox={`-180 0 960 ${mapHeight}`}
          className="w-full max-w-full max-h-[calc(100vh-150px)] h-auto"
        >
          <defs>
            {/* Arrowhead marker */}
            <marker
              id="laser-arrow"
              viewBox="0 0 10 10"
              refX="14"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ffffff" />
            </marker>

            {/* Glowing filter */}
            <filter id="neon-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* High-tech Scanlines Pattern */}
            <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="4" y2="0" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Topographical satellite background image */}
          <image
            href="/images/map-bg.png"
            x="-180"
            y="0"
            width="960"
            height={mapHeight}
            opacity={0.88}
            preserveAspectRatio="none"
            pointerEvents="none"
          />

          {/* Grid lines removed for cleaner tactical satellite layout */}

          {/* Render 100 Grid Cells */}
          <g>
            {tiles.map((tile) => (
              <TileCell
                key={tile.id}
                tile={tile}
                tiles={tiles}
                kingdoms={kingdoms}
                isSelected={selectedTile?.id === tile.id}
                onClick={() => setSelectedTile(tile)}
              />
            ))}
          </g>

          {/* Render Combat Laser and Explosion Shockwaves */}
          {activeAttackLines.map((line) => {
            const startX = line.fromX * cellSize + cellSize / 2;
            const startY = line.fromY * cellSize + cellSize / 2;
            const endX = line.toX * cellSize + cellSize / 2;
            const endY = line.toY * cellSize + cellSize / 2;
            const pathId = `path-${line.id.replace(/[^a-zA-Z0-9]/g, '-')}`;

            return (
              <g key={line.id}>
                {/* Neon Laser Beam */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={line.color}
                  strokeWidth={3}
                  strokeOpacity={0.4}
                  filter="url(#neon-glow)"
                  pointerEvents="none"
                />

                {/* Core White Pulse Line */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#ffffff"
                  strokeWidth={1.2}
                  strokeDasharray="4, 4"
                  strokeOpacity={0.7}
                  pointerEvents="none"
                />

                {/* Unit Trajectory Path */}
                <path
                  id={pathId}
                  d={`M ${startX} ${startY} L ${endX} ${endY}`}
                  fill="none"
                  stroke="none"
                />

                {/* Animated unit sprite traveling along the path */}
                <g>
                  <text
                    fontSize="18"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.85))' }}
                  >
                    {line.unitType === 'TANK' ? '🚜' : line.unitType === 'AIRCRAFT' ? '✈️' : '🚁'}
                    <animateMotion
                      dur="1.2s"
                      repeatCount="1"
                      rotate="auto"
                      fill="freeze"
                    >
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                    <animate
                      attributeName="opacity"
                      from="1"
                      to="0"
                      begin="1.1s"
                      dur="0.1s"
                      fill="freeze"
                    />
                  </text>
                </g>

                {/* Explosion shockwave circle at target endpoint */}
                <circle
                  cx={endX}
                  cy={endY}
                  r={8}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2}
                  className="animate-combat-explosion"
                  pointerEvents="none"
                />

                {/* Explosion emoji overlay appearing at 1.2s */}
                <g transform={`translate(${endX}, ${endY})`}>
                  <text
                    fontSize="22"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="animate-explosion-emoji"
                  >
                    💥
                  </text>
                </g>
              </g>
            );
          })}

          {/* Render Floating Action Badges */}
          {visualEffects.map((effect) => {
            const effX = effect.x * cellSize + cellSize / 2;
            const effY = effect.y * cellSize + cellSize / 2;

            const isMorale = effect.icon === '🤝' || effect.text.includes('MORALE');
            const isRecruit = effect.icon === '🛡️' || effect.text.includes('SOLDIERS');
            const isResearch = effect.icon === '🔬' || effect.text.includes('TECH');
            const isDefend = effect.icon === '🧱' || effect.text.includes('DEFENSE');
            const isExpand = effect.icon === '🚩' || effect.text.includes('EXPAND');

            return (
              <g
                key={effect.id}
                transform={`translate(${effX}, ${effY})`}
                pointerEvents="none"
              >
                <g className="animate-float-event-badge">
                  {isMorale && (
                    <g>
                      {/* Speech Bubble */}
                      <path d="M-32,-28 L32,-28 Q37,-28 37,-23 L37,-13 Q37,-8 32,-8 L6,-8 L0,-2 L-6,-8 L-32,-8 Q-37,-8 -37,-13 L-37,-23 Q-37,-28 -32,-28 Z" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
                      <text x="0" y="-18" fill="#ffffff" fontSize="6.5px" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                        SĨ KHÍ +15! ⚔️
                      </text>
                      {/* Soldiers Cheering */}
                      <g className="animate-soldiers-cheer" transform="translate(0, 2)">
                        {/* Left Soldier */}
                        <g transform="translate(-10, 4)">
                          <rect x="-2.5" y="0" width="5" height="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.4" />
                          <circle cx="0" cy="-3.5" r="2.5" fill="#fcd34d" />
                          <line x1="-2.5" y1="3" x2="-6" y2="-2" stroke="#ffffff" strokeWidth="0.8" />
                        </g>
                        {/* Right Soldier */}
                        <g transform="translate(10, 4)">
                          <rect x="-2.5" y="0" width="5" height="8" fill="#ef4444" stroke="#ffffff" strokeWidth="0.4" />
                          <circle cx="0" cy="-3.5" r="2.5" fill="#fcd34d" />
                          <line x1="2.5" y1="3" x2="6" y2="-2" stroke="#ffffff" strokeWidth="0.8" />
                        </g>
                        {/* Leader */}
                        <g transform="translate(0, 0)">
                          <rect x="-3" y="0" width="6" height="10" fill="#10b981" stroke="#ffffff" strokeWidth="0.4" />
                          <circle cx="0" cy="-4.5" r="3" fill="#fcd34d" />
                          <line x1="0" y1="2" x2="0" y2="-7" stroke="#ffffff" strokeWidth="0.8" />
                          <rect x="0" y="-7" width="6" height="4" fill="#fbbf24" />
                        </g>
                      </g>
                    </g>
                  )}

                  {isRecruit && (
                    <g>
                      {/* Speech Bubble */}
                      <path d="M-32,-28 L32,-28 Q37,-28 37,-23 L37,-13 Q37,-8 32,-8 L6,-8 L0,-2 L-6,-8 L-32,-8 Q-37,-8 -37,-13 L-37,-23 Q-37,-28 -32,-28 Z" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.8" />
                      <text x="0" y="-18" fill="#ffffff" fontSize="6.5px" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                        TĂNG BINH! 🪖
                      </text>
                      {/* Barracks Tent */}
                      <polygon points="-10,12 0,2 10,12" fill="#4b5563" stroke="#1f2937" strokeWidth="0.8" />
                      <polygon points="-5,12 0,6 5,12" fill="#111827" />
                      {/* Soldier training */}
                      <g className="animate-recruit-march" transform="translate(0, 8)">
                        <circle cx="0" cy="-4.5" r="2" fill="#fbbf24" />
                        <rect x="-1.5" y="-2.5" width="3" height="5" fill="#3b82f6" />
                      </g>
                    </g>
                  )}

                  {isResearch && (
                    <g>
                      {/* Speech Bubble */}
                      <path d="M-32,-28 L32,-28 Q37,-28 37,-23 L37,-13 Q37,-8 32,-8 L6,-8 L0,-2 L-6,-8 L-32,-8 Q-37,-8 -37,-13 L-37,-23 Q-37,-28 -32,-28 Z" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
                      <text x="0" y="-18" fill="#ffffff" fontSize="6.5px" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                        ĐỘT PHÁ 🔬!
                      </text>
                      {/* Bulb */}
                      <circle cx="0" cy="1" r="5" fill="#eab308" className="animate-bulb-glow" />
                      <path d="M-2.5,5 L2.5,5 L1.5,8 L-1.5,8 Z" fill="#9ca3af" />
                      {/* Gear */}
                      <g className="animate-gear-spin" transform="translate(9, 6)">
                        <circle cx="0" cy="0" r="3" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="2,1" />
                      </g>
                      <g className="animate-gear-spin-rev" transform="translate(-9, 6)">
                        <circle cx="0" cy="0" r="2.5" fill="none" stroke="#9ca3af" strokeWidth="1.2" strokeDasharray="1.5,1" />
                      </g>
                    </g>
                  )}

                  {isDefend && (
                    <g>
                      {/* Speech Bubble */}
                      <path d="M-32,-28 L32,-28 Q37,-28 37,-23 L37,-13 Q37,-8 32,-8 L6,-8 L0,-2 L-6,-8 L-32,-8 Q-37,-8 -37,-13 L-37,-23 Q-37,-28 -32,-28 Z" fill="#d97706" stroke="#ffffff" strokeWidth="0.8" />
                      <text x="0" y="-18" fill="#ffffff" fontSize="6.5px" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                        XÂY CÔNG SỰ 🧱
                      </text>
                      {/* Wall */}
                      <g className="animate-wall-rise" transform="translate(0, 4)">
                        <rect x="-9" y="4" width="6" height="3" fill="#d97706" stroke="#78350f" strokeWidth="0.4" />
                        <rect x="-3" y="4" width="6" height="3" fill="#b45309" stroke="#78350f" strokeWidth="0.4" />
                        <rect x="3" y="4" width="6" height="3" fill="#d97706" stroke="#78350f" strokeWidth="0.4" />
                        <rect x="-6" y="1" width="6" height="3" fill="#b45309" stroke="#78350f" strokeWidth="0.4" />
                        <rect x="0" y="1" width="6" height="3" fill="#d97706" stroke="#78350f" strokeWidth="0.4" />
                      </g>
                    </g>
                  )}

                  {isExpand && (
                    <g>
                      {/* Speech Bubble */}
                      <path d="M-32,-28 L32,-28 Q37,-28 37,-23 L37,-13 Q37,-8 32,-8 L6,-8 L0,-2 L-6,-8 L-32,-8 Q-37,-8 -37,-13 L-37,-23 Q-37,-28 -32,-28 Z" fill="#ec4899" stroke="#ffffff" strokeWidth="0.8" />
                      <text x="0" y="-18" fill="#ffffff" fontSize="6.5px" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                        KHAI HOANG 🚩
                      </text>
                      {/* Flag plant */}
                      <g className="animate-flag-plant" transform="translate(0, 11)">
                        <line x1="-1.5" y1="0" x2="-1.5" y2="-13" stroke="#ffffff" strokeWidth="1.2" />
                        <rect x="-1.5" y="-13" width="8" height="5" fill="#ec4899" />
                      </g>
                    </g>
                  )}

                  {/* Fallback to custom icon badge if action doesn't match */}
                  {!isMorale && !isRecruit && !isResearch && !isDefend && !isExpand && (
                    <g>
                      <rect
                        x={-48}
                        y={-27}
                        width={96}
                        height={18}
                        fill="#030712"
                        stroke={effect.color}
                        strokeWidth={1.5}
                        fillOpacity={0.9}
                      />
                      <text
                        x={0}
                        y={-18}
                        fill="#f3f4f6"
                        fontSize="9px"
                        fontWeight="black"
                        fontFamily="monospace"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        <tspan fontSize="11">{effect.icon}</tspan> {effect.text}
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </svg>

        <style jsx global>{`
          @keyframes combat-explosion {
            0% {
              r: 2px;
              opacity: 0;
              stroke-width: 3px;
              fill: rgba(255, 255, 255, 0.8);
            }
            70% {
              r: 20px;
              opacity: 1;
              stroke-width: 2px;
              fill: rgba(239, 68, 68, 0.2);
            }
            100% {
              r: 32px;
              opacity: 0;
              stroke-width: 0.5px;
              fill: rgba(255, 255, 255, 0);
            }
          }
          .animate-combat-explosion {
            transform-origin: center;
            opacity: 0;
            animation: combat-explosion 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) 1.2s 1 forwards;
          }

          @keyframes explosion-emoji {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            30% {
              transform: scale(1.4);
              opacity: 1;
            }
            80% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(0.6);
              opacity: 0;
            }
          }
          .animate-explosion-emoji {
            opacity: 0;
            transform-origin: center;
            animation: explosion-emoji 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.2s 1 forwards;
          }

          @keyframes float-event-badge {
            0% {
              transform: translateY(15px) scale(0.6);
              opacity: 0;
            }
            15% {
              transform: translateY(-5px) scale(1.1);
              opacity: 1;
            }
            30% {
              transform: translateY(-8px) scale(1);
              opacity: 1;
            }
            85% {
              transform: translateY(-12px) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-20px) scale(0.7);
              opacity: 0;
            }
          }
          .animate-float-event-badge {
            transform-origin: center;
            animation: float-event-badge 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          }

          @keyframes soldiers-cheer {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px) scaleY(1.05); }
          }
          .animate-soldiers-cheer {
            transform-origin: bottom;
            animation: soldiers-cheer 0.6s ease-in-out infinite;
          }

          @keyframes recruit-march {
            0% { transform: translateY(6px) scale(0.6); opacity: 0; }
            50% { transform: translateY(0px) scale(1); opacity: 1; }
            100% { transform: translateY(-6px) scale(0.7); opacity: 0; }
          }
          .animate-recruit-march {
            animation: recruit-march 1.5s ease-in-out infinite;
          }

          @keyframes bulb-glow {
            0%, 100% { fill: #f59e0b; filter: drop-shadow(0 0 1px #fbbf24); }
            50% { fill: #fef08a; filter: drop-shadow(0 0 6px #fbbf24); }
          }
          .animate-bulb-glow {
            animation: bulb-glow 0.8s ease-in-out infinite;
          }

          @keyframes gear-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-gear-spin {
            transform-origin: 9px 6px;
            animation: gear-spin 4s linear infinite;
          }

          @keyframes gear-spin-rev {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .animate-gear-spin-rev {
            transform-origin: -9px 6px;
            animation: gear-spin-rev 3s linear infinite;
          }

          @keyframes wall-rise {
            0% { transform: scaleY(0); opacity: 0; }
            45%, 100% { transform: scaleY(1); opacity: 1; }
          }
          .animate-wall-rise {
            transform-origin: bottom;
            animation: wall-rise 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }

          @keyframes flag-plant {
            0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
            35% { transform: translateY(0) scale(1); opacity: 1; }
            55% { transform: rotate(-6deg); }
            75% { transform: rotate(6deg); }
            95%, 100% { transform: rotate(0deg); }
          }
          .animate-flag-plant {
            transform-origin: bottom;
            animation: flag-plant 1.6s ease-out forwards;
          }
        `}</style>
      </div>

      {/* Selected Tile Inspector Tooltip */}
      {selectedTile && (
        <div className="bg-gray-950/70 border border-white/5 rounded-none p-4.5 min-h-[96px] relative overflow-hidden transition-all flex flex-col justify-center animate-fade-in">
          {/* Glow accent indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: selectedOwnerStyles.main }} />

          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 text-left">
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">{getTileTypeEmoji(selectedTile.type)}</span>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  {getTileTypeLabel(selectedTile.type)} ({selectedTile.code})
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-white/5 text-theme-text-muted font-mono font-normal">
                    X: {selectedTile.x}, Y: {selectedTile.y}
                  </span>
                </h3>
                <p className="text-xs text-theme-text-secondary mt-1">
                  Đại bản doanh: {selectedOwner ? (
                    <span className="font-bold" style={{ color: selectedOwnerStyles.main }}>{selectedOwner.name}</span>
                  ) : (
                    <span className="text-theme-text-muted italic">Vùng Trung Lập (Unowned)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/60 p-2.5 rounded-none border border-white/5 text-xs">
              <div>
                <span className="text-[9px] text-theme-text-secondary uppercase block font-bold">Cấp Outpost</span>
                <span className="font-mono font-bold text-white">LVL {selectedTile.level}</span>
              </div>
              <div>
                <span className="text-[9px] text-theme-text-secondary uppercase block font-bold">Thủ Thành</span>
                <span className="font-mono font-bold text-white">+{selectedTile.defenseBonus}</span>
              </div>
              <div>
                <span className="text-[9px] text-theme-text-secondary uppercase block font-bold">Đồn Trú</span>
                <span className="font-mono font-bold text-white">
                  {selectedOwner ? (selectedTile.type === 'CAPITAL' ? selectedOwner.soldiers : Math.floor(selectedTile.level * 1.5)) : 0} units
                </span>
              </div>
              <div>
                <span className="text-[9px] text-theme-text-secondary uppercase block font-bold">Hiệu suất Lợi tức</span>
                <span className="font-mono font-bold text-green-400">
                  {selectedTile.type === 'CAPITAL' ? '+20 All' : (selectedTile.type === 'PLAIN' ? '+0' : `+${15 + selectedTile.level * 2}`)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
