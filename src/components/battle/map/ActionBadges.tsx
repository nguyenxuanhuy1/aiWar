import React from 'react';
import { VisualEffect } from '@/types/battle';

interface ActionBadgesProps {
  visualEffects: VisualEffect[];
  cellSize: number;
}

export function ActionBadges({ visualEffects, cellSize }: ActionBadgesProps) {
  if (!visualEffects || visualEffects.length === 0) return null;

  return (
    <>
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
    </>
  );
}
