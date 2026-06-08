import React from 'react';
import { Tile, Kingdom, Alliance } from '@/types/battle';

interface AllianceLinesProps {
  tiles: Tile[];
  kingdoms: Kingdom[];
  alliances: Alliance[];
  cellSize: number;
}

export function AllianceLines({ tiles, kingdoms, alliances, cellSize }: AllianceLinesProps) {
  if (!alliances || alliances.length === 0) return null;

  return (
    <>
      {alliances.map((all, idx) => {
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
    </>
  );
}
