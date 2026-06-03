import { Tile, Kingdom, AttackLine, VisualEffect, Alliance, Dialogue } from '@/types/battle';
import { TileCell } from './TileCell';
import { getKingdomColorStyles, getTileTypeLabel, getTileTypeEmoji } from '@/utils/tileUtils';

interface BattleMapProps {
  tiles: Tile[];
  kingdoms: Kingdom[];
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
  activeAttackLines: AttackLine[];
  visualEffects?: VisualEffect[];
  alliances?: Alliance[];
  activeDialogue?: Dialogue | null;
  activeGlobalEffect?: 'PLAGUE' | 'DISASTER' | null;
}

export function BattleMap({
  tiles,
  kingdoms,
  selectedTile,
  setSelectedTile,
  activeAttackLines,
  visualEffects = [],
  alliances = [],
  activeDialogue = null,
  activeGlobalEffect = null
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

          {/* Global Weather/Plague Overlays */}
          {activeGlobalEffect === 'DISASTER' && (
            <g pointerEvents="none">
              <rect
                x="-180"
                y="0"
                width="960"
                height={mapHeight}
                fill="rgba(15, 23, 42, 0.45)"
                className="animate-fade-in"
              />
              <g className="animate-storm-clouds" opacity="0.75">
                <text x="-120" y="45" fontSize="42" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>☁️</text>
                <text x="80" y="30" fontSize="56" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>🌧️</text>
                <text x="280" y="55" fontSize="48" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>☁️</text>
                <text x="480" y="35" fontSize="52" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>🌧️</text>
                <text x="680" y="50" fontSize="46" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>☁️</text>
              </g>
              {Array.from({ length: 24 }).map((_, i) => {
                const rx = -180 + (i * 45) + (i % 3) * 10;
                const ryStart = -80 - (i % 4) * 40;
                const dur = 0.55 + (i % 5) * 0.08;
                return (
                  <line
                    key={`rain-${i}`}
                    x1={rx}
                    y1={ryStart}
                    x2={rx - 15}
                    y2={ryStart + 50}
                    stroke="#a5f3fc"
                    strokeWidth="1.2"
                    strokeOpacity="0.65"
                  >
                    <animate
                      attributeName="y1"
                      from={ryStart}
                      to={mapHeight + 80}
                      dur={`${dur}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y2"
                      from={ryStart + 50}
                      to={mapHeight + 130}
                      dur={`${dur}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="x1"
                      from={rx}
                      to={rx - 150}
                      dur={`${dur}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="x2"
                      from={rx - 15}
                      to={rx - 165}
                      dur={`${dur}s`}
                      repeatCount="indefinite"
                    />
                  </line>
                );
              })}
            </g>
          )}

          {activeGlobalEffect === 'PLAGUE' && (
            <g pointerEvents="none">
              <rect
                x="-180"
                y="0"
                width="960"
                height={mapHeight}
                fill="rgba(34, 197, 94, 0.18)"
                className="animate-plague-pulse"
              />
              <g className="animate-plague-spores">
                <text x="-120" y="200" fontSize="26" opacity="0.5" className="animate-float-slow-1">🦠</text>
                <text x="40" y="100" fontSize="20" opacity="0.6" className="animate-float-slow-2">🦠</text>
                <text x="200" y="380" fontSize="24" opacity="0.5" className="animate-float-slow-3">🦠</text>
                <text x="420" y="160" fontSize="28" opacity="0.6" className="animate-float-slow-1">🦠</text>
                <text x="640" y="320" fontSize="22" opacity="0.5" className="animate-float-slow-2">🦠</text>
                <text x="780" y="120" fontSize="24" opacity="0.6" className="animate-float-slow-3">🦠</text>
              </g>
            </g>
          )}

          {/* Render Active Alliances (Persistent paths connecting allied capitals) */}
          {alliances && alliances.map((all, idx) => {
            const k1 = kingdoms.find((k) => k.id === all.k1);
            const k2 = kingdoms.find((k) => k.id === all.k2);
            if (!k1 || !k2 || !k1.alive || !k2.alive) return null;

            const cap1 = tiles.find((t) => t.ownerKingdomId === k1.id && t.type === 'CAPITAL') || tiles.find((t) => t.ownerKingdomId === k1.id);
            const cap2 = tiles.find((t) => t.ownerKingdomId === k2.id && t.type === 'CAPITAL') || tiles.find((t) => t.ownerKingdomId === k2.id);
            if (!cap1 || !cap2) return null;

            const x1 = cap1.x * cellSize + cellSize / 2;
            const y1 = cap1.y * cellSize + cellSize / 2;
            const x2 = cap2.x * cellSize + cellSize / 2;
            const y2 = cap2.y * cellSize + cellSize / 2;

            return (
              <g key={`alliance-line-${all.k1}-${all.k2}-${idx}`}>
                {/* Outer glowing neon line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#10b981"
                  strokeWidth={4.5}
                  strokeOpacity={0.2}
                  filter="url(#neon-glow)"
                  pointerEvents="none"
                />
                {/* Inner cyan-green dotted tactical line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  strokeDasharray="4, 4"
                  strokeOpacity={0.7}
                  pointerEvents="none"
                />
                {/* Handshake indicator at the center */}
                <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`} pointerEvents="none">
                  <circle r={7.5} fill="#02050c" stroke="#10b981" strokeWidth="0.8" />
                  <text fontSize="8" textAnchor="middle" dominantBaseline="central">🤝</text>
                </g>
              </g>
            );
          })}

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

            const isDiplomacy = effect.type === 'DIPLOMACY';
            const isMorale = !isDiplomacy && (effect.icon === '🤝' || effect.text.includes('MORALE'));
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
                  {isDiplomacy && (
                    <g>
                      {(() => {
                        const dx = effect.partnerX !== undefined ? (effect.partnerX - effect.x) * cellSize : 0;
                        const dy = effect.partnerY !== undefined ? (effect.partnerY - effect.y) * cellSize : 0;
                        return (
                          <g>
                            {/* Glowing Double Connection line between the two diplomacy capitals/tiles */}
                            {effect.partnerX !== undefined && (
                              <g>
                                <line
                                  x1={0}
                                  y1={0}
                                  x2={dx}
                                  y2={dy}
                                  stroke="#10b981"
                                  strokeWidth={5}
                                  strokeOpacity={0.3}
                                  filter="url(#neon-glow)"
                                />
                                <line
                                  x1={0}
                                  y1={0}
                                  x2={dx}
                                  y2={dy}
                                  stroke="#ffffff"
                                  strokeWidth={1.5}
                                  strokeDasharray="4, 4"
                                  strokeOpacity={0.8}
                                />
                              </g>
                            )}

                            {/* Initiator Speech Bubble */}
                            <g transform="translate(0, -10)">
                              <path d="M-40,-28 L40,-28 Q45,-28 45,-23 L45,-13 Q45,-8 45,-8 L6,-8 L0,-2 L-6,-8 L-40,-8 Q-45,-8 -45,-13 L-45,-23 Q-45,-28 -40,-28 Z" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
                              <text x="0" y="-18" fill="#ffffff" fontSize="5.5px" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                                HÃY LIÊN MINH NHÉ! 🤝
                              </text>
                            </g>

                            {/* Receiver Speech Bubble */}
                            {effect.partnerX !== undefined && (
                              <g transform={`translate(${dx}, ${dy - 10})`}>
                                <path d="M-35,-28 L35,-28 Q40,-28 40,-23 L40,-13 Q40,-8 35,-8 L6,-8 L0,-2 L-6,-8 L-35,-8 Q-40,-8 -40,-13 L-40,-23 Q-40,-28 -35,-28 Z" fill="#06b6d4" stroke="#ffffff" strokeWidth="0.8" />
                                <text x="0" y="-18" fill="#ffffff" fontSize="5.5px" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                                  ĐỒNG Ý HỢP TÁC! ⚡
                                </text>
                              </g>
                            )}

                            {/* Dynamic Handshake badge at the center of the line */}
                            {effect.partnerX !== undefined && (
                              <g transform={`translate(${dx / 2}, ${dy / 2})`} className="animate-alliance-handshake">
                                <circle r={13} fill="#030712" stroke="#10b981" strokeWidth="1.8" filter="url(#neon-glow)" />
                                <text x="0" y="0.5" fontSize="15" textAnchor="middle" dominantBaseline="central">🤝</text>
                              </g>
                            )}
                          </g>
                        );
                      })()}
                    </g>
                  )}

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
                      {(() => {
                        const dx = effect.partnerX !== undefined ? (effect.partnerX - effect.x) * cellSize : 0;
                        const dy = effect.partnerY !== undefined ? (effect.partnerY - effect.y) * cellSize : 0;
                        
                        return (
                          <g>
                            {/* King at source position */}
                            {effect.partnerX !== undefined && (
                              <g transform={`translate(${dx}, ${dy - 10})`}>
                                <path d="M-38,-28 L38,-28 Q43,-28 43,-23 L43,-13 Q43,-8 38,-8 L6,-8 L0,-2 L-6,-8 L-38,-8 Q-43,-8 -43,-13 L-43,-23 Q-43,-28 -38,-28 Z" fill="#ec4899" stroke="#ffffff" strokeWidth="0.8" />
                                <text x="0" y="-18" fill="#ffffff" fontSize="6px" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                                  HÃY MỞ RỘNG BỜ CÕI! 👑
                                </text>
                                <circle cx="0" cy="5" r="7" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.5" />
                                <text x="0" y="6.5" fontSize="9" textAnchor="middle" dominantBaseline="central">🤴</text>
                              </g>
                            )}

                            {/* Dotted troop dispatch path */}
                            {effect.partnerX !== undefined && (
                              <line
                                x1={dx}
                                y1={dy}
                                x2={0}
                                y2={0}
                                stroke="#ec4899"
                                strokeWidth={1.5}
                                strokeDasharray="3, 3"
                                strokeOpacity={0.6}
                              />
                            )}

                            {/* Destination Soldiers and Flag */}
                            <g transform="translate(0, -10)">
                              <path d="M-28,-28 L28,-28 Q33,-28 33,-23 L33,-13 Q33,-8 28,-8 L6,-8 L0,-2 L-6,-8 L-28,-8 Q-33,-8 -33,-13 L-33,-23 Q-33,-28 -28,-28 Z" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.8" />
                              <text x="0" y="-18" fill="#ffffff" fontSize="6px" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">
                                TUÂN LỆNH VUA! ⚔️
                              </text>
                              
                              <g className="animate-flag-plant" transform="translate(0, 11)">
                                <line x1="-1.5" y1="0" x2="-1.5" y2="-13" stroke="#ffffff" strokeWidth="1.2" />
                                <rect x="-1.5" y="-13" width="8" height="5" fill="#ec4899" />
                              </g>

                              <g className="animate-soldiers-cheer" transform="translate(-8, 5)">
                                <circle cx="0" cy="0" r="5" fill="#fcd34d" />
                                <text x="0" y="0.5" fontSize="6.5" textAnchor="middle" dominantBaseline="central">💂</text>
                              </g>
                            </g>
                          </g>
                        );
                      })()}
                    </g>
                  )}

                  {/* Fallback to custom icon badge if action doesn't match */}
                  {!isMorale && !isRecruit && !isResearch && !isDefend && !isExpand && !isDiplomacy && (
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

        {activeDialogue && (() => {
          // Dynamic border and shadow styles for Visual Novel Dialog based on type
          const getDialogStyles = (type: 'EXPAND' | 'ATTACK' | 'DIPLOMACY' | 'DISASTER') => {
            switch (type) {
              case 'ATTACK':
                return {
                  borderColor: 'rgba(239, 68, 68, 0.45)', // neon red
                  boxShadow: '0 0 35px rgba(239, 68, 68, 0.35)',
                  titleColor: 'text-red-400'
                };
              case 'DIPLOMACY':
                return {
                  borderColor: 'rgba(16, 185, 129, 0.45)', // neon green
                  boxShadow: '0 0 35px rgba(16, 185, 129, 0.35)',
                  titleColor: 'text-emerald-400'
                };
              case 'DISASTER':
                return {
                  borderColor: 'rgba(245, 158, 11, 0.45)', // neon amber/orange
                  boxShadow: '0 0 35px rgba(245, 158, 11, 0.35)',
                  titleColor: 'text-amber-400'
                };
              default:
                return {
                  borderColor: 'rgba(6, 182, 212, 0.3)', // default cyan
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.25)',
                  titleColor: 'text-cyan-400'
                };
            }
          };

          const dialogStyles = getDialogStyles(activeDialogue.type);

          return (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[620px] bg-slate-950/45 backdrop-blur-[2px] border-2 rounded-none p-4 z-40 animate-novel-slide-up flex flex-col md:flex-row items-center gap-4 select-none"
              style={{
                borderColor: dialogStyles.borderColor,
                boxShadow: dialogStyles.boxShadow
              }}
            >
              
              {/* Hologram Scanner Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_94%,rgba(6,182,212,0.12)_95%,rgba(6,182,212,0.12)_98%,rgba(18,24,38,0)_99%)] bg-[length:100%_40px] animate-hologram-scan pointer-events-none" />

              {/* Left Avatar: Sender */}
              <div className="flex flex-col items-center text-center shrink-0">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-[0_0_12px_var(--sender-color)] relative"
                  style={{
                    borderColor: activeDialogue.senderColor,
                    '--sender-color': activeDialogue.senderColor,
                    background: `${activeDialogue.senderColor}15`
                  } as any}
                >
                  <span className="text-3xl select-none animate-pulse">
                    {activeDialogue.type === 'ATTACK' ? '⚔️' : 
                     activeDialogue.type === 'DIPLOMACY' ? '🤝' : 
                     activeDialogue.type === 'DISASTER' ? (activeDialogue.message.includes('dịch') ? '🦠' : '🌪️') : '👑'}
                  </span>
                  <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-white/20 text-[8px] font-bold px-1 py-0.2 uppercase text-cyan-400">
                    SENDER
                  </div>
                </div>
                <span className="text-xs font-black mt-2 tracking-wide" style={{ color: activeDialogue.senderColor }}>
                  {activeDialogue.senderName}
                </span>
                <span className="text-[9px] text-gray-400 font-mono">
                  {activeDialogue.senderModel}
                </span>
              </div>

              {/* Center dialogue block */}
              <div className="flex-1 flex flex-col gap-2 min-w-0 z-10">
                {/* Sender Dialogue Bubble */}
                <div className="bg-slate-900/30 border border-white/5 p-2 rounded-none relative animate-dialog-line-1">
                  <div className={`text-[9px] uppercase tracking-wider font-extrabold mb-0.5 ${dialogStyles.titleColor}`}>
                    {activeDialogue.senderName}
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed font-sans font-medium">
                    "{activeDialogue.message}"
                  </p>
                </div>

                {/* Receiver Dialogue Bubble */}
                {activeDialogue.replyMessage && (
                  <div className="bg-slate-900/30 border border-white/5 p-2 rounded-none relative animate-dialog-line-2 self-end w-[95%]">
                    <div className="text-[9px] uppercase tracking-wider font-extrabold text-pink-400 mb-0.5 text-right">
                      {activeDialogue.receiverName || 'Binh sĩ'}
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans font-medium text-right italic">
                      "{activeDialogue.replyMessage}"
                    </p>
                  </div>
                )}
              </div>

              {/* Right Avatar: Receiver (if any) */}
              {activeDialogue.receiverName && (
                <div className="flex flex-col items-center text-center shrink-0">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-[0_0_12px_var(--receiver-color)] relative"
                    style={{
                      borderColor: activeDialogue.receiverColor || '#ec4899',
                      '--receiver-color': activeDialogue.receiverColor || '#ec4899',
                      background: `${activeDialogue.receiverColor || '#ec4899'}15`
                    } as any}
                  >
                    <span className="text-3xl select-none animate-pulse">
                      {activeDialogue.type === 'ATTACK' ? '🛡️' : '🤝'}
                    </span>
                    <div className="absolute -bottom-1 -left-1 bg-slate-900 border border-white/20 text-[8px] font-bold px-1 py-0.2 uppercase text-pink-400">
                      {activeDialogue.type === 'ATTACK' ? 'DEFENDER' : 'PARTNER'}
                    </div>
                  </div>
                  <span className="text-xs font-black mt-2 tracking-wide" style={{ color: activeDialogue.receiverColor }}>
                    {activeDialogue.receiverName}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {activeDialogue.receiverModel}
                  </span>
                </div>
              )}

              {/* Troops Avatar fallback if Expand (Right side) */}
              {activeDialogue.type === 'EXPAND' && (
                <div className="flex flex-col items-center text-center shrink-0">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-slate-600 bg-slate-800/30 shadow-[0_0_12px_rgba(255,255,255,0.1)] relative">
                    <span className="text-3xl select-none animate-bounce">💂</span>
                    <div className="absolute -bottom-1 -left-1 bg-slate-900 border border-white/20 text-[8px] font-bold px-1 py-0.2 uppercase text-gray-400">
                      ARMY
                    </div>
                  </div>
                  <span className="text-xs font-black mt-2 tracking-wide text-gray-300">
                    Binh Lính
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                    Quân đội vương quốc
                  </span>
                </div>
              )}
            </div>
          );
        })()}

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

          @keyframes alliance-handshake {
            0% { transform: scale(0); opacity: 0; }
            20% { transform: scale(1.4); opacity: 1; }
            80% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.6); opacity: 0; }
          }
          .animate-alliance-handshake {
            transform-origin: center;
            opacity: 0;
            animation: alliance-handshake 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }

          @keyframes novel-slide-up {
            0% { transform: translate(-50%, calc(-50% + 40px)); opacity: 0; }
            100% { transform: translate(-50%, -50%); opacity: 1; }
          }
          .animate-novel-slide-up {
            animation: novel-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes hologram-scan {
            0% { background-position: 0 0; }
            100% { background-position: 0 480px; }
          }
          .animate-hologram-scan {
            animation: hologram-scan 8s linear infinite;
          }

          @keyframes dialog-line-1 {
            0% { transform: translateX(-10px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          .animate-dialog-line-1 {
            animation: dialog-line-1 0.4s ease-out 0.2s forwards;
            opacity: 0;
          }

          @keyframes dialog-line-2 {
            0% { transform: translateX(10px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          .animate-dialog-line-2 {
            animation: dialog-line-2 0.4s ease-out 1.2s forwards;
            opacity: 0;
          }

          @keyframes plague-pulse {
            0%, 100% { fill: rgba(34, 197, 94, 0.12); }
            50% { fill: rgba(34, 197, 94, 0.22); }
          }
          .animate-plague-pulse {
            animation: plague-pulse 3s ease-in-out infinite;
          }

          @keyframes float-slow-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(15px, -20px) scale(1.15); }
          }
          @keyframes float-slow-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-25px, -15px) scale(0.9); }
          }
          @keyframes float-slow-3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, 20px) scale(1.1); }
          }
          .animate-float-slow-1 {
            transform-origin: center;
            animation: float-slow-1 6s ease-in-out infinite;
          }
          .animate-float-slow-2 {
            transform-origin: center;
            animation: float-slow-2 8s ease-in-out infinite;
          }
          .animate-float-slow-3 {
            transform-origin: center;
            animation: float-slow-3 7s ease-in-out infinite;
          }

          @keyframes storm-clouds {
            0% { transform: translateX(0); }
            50% { transform: translateX(30px); }
            100% { transform: translateX(0); }
          }
          .animate-storm-clouds {
            animation: storm-clouds 12s ease-in-out infinite;
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
