import React from 'react';
import { AttackLine } from '@/types/battle';

interface AttackLinesProps {
  activeAttackLines: AttackLine[];
  cellSize: number;
}

export function AttackLines({ activeAttackLines, cellSize }: AttackLinesProps) {
  if (!activeAttackLines || activeAttackLines.length === 0) return null;

  return (
    <>
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
    </>
  );
}
