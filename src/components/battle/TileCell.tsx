import React from 'react';
import { Tile, Kingdom } from '@/types/battle';
import { getKingdomColorStyles } from '@/utils/tileUtils';

interface TileCellProps {
  tile: Tile;
  tiles: Tile[];
  kingdoms: Kingdom[];
  isSelected: boolean;
  onClick: () => void;
}

export function TileCell({ tile, tiles, kingdoms, isSelected, onClick }: TileCellProps) {
  const owner = tile.ownerKingdomId ? kingdoms.find((k) => k.id === tile.ownerKingdomId) : null;
  const colorStyles = getKingdomColorStyles(owner ? owner.name : 'unowned');

  const cellSize = 60;
  const padding = 2.5;
  
  const xPos = tile.x * cellSize + padding;
  const yPos = tile.y * cellSize + padding;
  const width = cellSize - padding * 2;
  const height = cellSize - padding * 2;

  const isCapital = tile.type === 'CAPITAL';
  const soldiersCount = isCapital && owner ? owner.soldiers : (owner ? Math.floor(tile.level * 1.5) : 0);

  // Dynamic boundary border check (AoE territory laser lines)
  const getOwnerIdAt = (nx: number, ny: number) => {
    if (nx < 0 || nx > 9 || ny < 0 || ny > 9) return null;
    const found = tiles.find(t => t.x === nx && t.y === ny);
    return found ? found.ownerKingdomId : null;
  };

  const currentOwner = tile.ownerKingdomId;
  const drawLeft = currentOwner && getOwnerIdAt(tile.x - 1, tile.y) !== currentOwner;
  const drawRight = currentOwner && getOwnerIdAt(tile.x + 1, tile.y) !== currentOwner;
  const drawTop = currentOwner && getOwnerIdAt(tile.x, tile.y - 1) !== currentOwner;
  const drawBottom = currentOwner && getOwnerIdAt(tile.x, tile.y + 1) !== currentOwner;

  // Custom SVG Graphic Renderers for AoE style nodes with villagers & soldiers
  const renderAsset = () => {
    switch (tile.type) {
      case 'CAPITAL':
        return (
          // Castle Keep with waving flag & castle guards
          <g transform={`translate(${xPos + 5}, ${yPos + 10})`}>
            {/* Castle walls and towers */}
            <rect x="6" y="20" width="28" height="12" fill="#4b5563" stroke="#111827" strokeWidth="1" />
            <rect x="17" y="24" width="6" height="8" rx="1" fill="#111827" />
            
            {/* Left Tower */}
            <rect x="2" y="12" width="8" height="20" fill="#374151" stroke="#111827" strokeWidth="1" />
            <polygon points="1,12 6,8 11,12" fill="#111827" />
            
            {/* Right Tower */}
            <rect x="30" y="12" width="8" height="20" fill="#374151" stroke="#111827" strokeWidth="1" />
            <polygon points="29,12 34,8 39,12" fill="#111827" />
            
            {/* Keep Central Roof */}
            <rect x="13" y="10" width="14" height="10" fill="#4b5563" stroke="#111827" strokeWidth="1" />
            <rect x="14" y="7" width="3" height="3" fill="#111827" />
            <rect x="23" y="7" width="3" height="3" fill="#111827" />

            {/* Flagpole */}
            <line x1="20" y1="10" x2="20" y2="2" stroke="#9ca3af" strokeWidth="1" />
            {/* Flag waving */}
            <path
              d="M 20 2 L 28 4.5 L 20 7 Z"
              fill={colorStyles.main}
              className="animate-flag-wave"
              style={{ transformOrigin: '20px 2px' }}
            />

            {/* Left Castle Guard */}
            {owner && (
              <g transform="translate(10, 24)">
                <rect x="-1" y="1.2" width="2" height="4.5" fill={colorStyles.main} stroke="#111827" strokeWidth="0.3" />
                <circle cx="0" cy="0.4" r="0.8" fill="#fcd34d" />
                <polygon points="-1.5,0 1.5,0 0,-1.8" fill="#9ca3af" stroke="#4b5563" strokeWidth="0.2" />
                <line x1="-1.5" y1="5.5" x2="-1.5" y2="-2.5" stroke="#d1d5db" strokeWidth="0.4" />
              </g>
            )}

            {/* Right Castle Guard */}
            {owner && (
              <g transform="translate(29, 24)">
                <rect x="-1" y="1.2" width="2" height="4.5" fill={colorStyles.main} stroke="#111827" strokeWidth="0.3" />
                <circle cx="0" cy="0.4" r="0.8" fill="#fcd34d" />
                <polygon points="-1.5,0 1.5,0 0,-1.8" fill="#9ca3af" stroke="#4b5563" strokeWidth="0.2" />
                <line x1="1.5" y1="5.5" x2="1.5" y2="-2.5" stroke="#d1d5db" strokeWidth="0.4" />
              </g>
            )}
          </g>
        );

      case 'GOLD_MINE':
        return (
          // Gold mining node with rocks, nuggets, and a mining villager
          <g transform={`translate(${xPos + 5}, ${yPos + 10})`}>
            {/* Rocky cavern entrance */}
            <path d="M 5 30 Q 20 10 35 30 Z" fill="#374151" stroke="#111827" strokeWidth="1" />
            <path d="M 12 30 Q 20 16 28 30 Z" fill="#111827" />
            
            {/* Gold veins */}
            <circle cx="10" cy="24" r="2.5" fill="#f59e0b" />
            <circle cx="20" cy="18" r="2" fill="#fbbf24" />
            <circle cx="30" cy="23" r="2.5" fill="#f59e0b" />
            
            {/* Mining Villager (Dân đào vàng) */}
            {owner && (
              <g transform="translate(11, 23)" className="animate-pickaxe-swing" style={{ transformOrigin: '0px 6px' }}>
                {/* Body (peasant clothes) */}
                <rect x="-1" y="1.5" width="2" height="4.5" fill="#78350f" stroke="#451a03" strokeWidth="0.3" />
                {/* Head */}
                <circle cx="0" cy="0.3" r="0.9" fill="#fcd34d" />
                {/* Straw Hat */}
                <polygon points="-2.2,0 2.2,0 0,-2" fill="#eab308" stroke="#78350f" strokeWidth="0.3" />
                {/* Pickaxe held by villager */}
                <line x1="-0.8" y1="4" x2="3.5" y2="-1.5" stroke="#78350f" strokeWidth="0.6" />
                <path d="M 1.8 -3.5 Q 4.5 -1.2 2.8 2.5" fill="none" stroke="#9ca3af" strokeWidth="1.1" />
              </g>
            )}
          </g>
        );

      case 'FOREST':
        return (
          // Lumberjack forest woodcutting nodes with lumberjack villager
          <g transform={`translate(${xPos + 5}, ${yPos + 10})`}>
            {/* Pine Trees */}
            <g>
              {/* Left Tree */}
              <polygon points="12,28 5,17 19,17" fill="#15803d" stroke="#14532d" strokeWidth="0.5" />
              <polygon points="12,18 8,10 16,10" fill="#166534" />
              <rect x="11" y="28" width="2" height="4" fill="#78350f" />

              {/* Right Tree */}
              <polygon points="28,28 21,15 35,15" fill="#16a34a" stroke="#15803d" strokeWidth="0.5" />
              <polygon points="28,16 24,8 32,8" fill="#15803d" />
              <rect x="27" y="28" width="2" height="4" fill="#78350f" />

              {/* Foreground main tree */}
              <polygon points="20,32 12,19 28,19" fill="#14532d" stroke="#14532d" strokeWidth="0.5" />
              <polygon points="20,20 15,11 25,11" fill="#15803d" />
              <rect x="19" y="32" width="2" height="3" fill="#78350f" />
            </g>

            {/* Tree Stump */}
            <ellipse cx="6" cy="31" rx="2.5" ry="1.2" fill="#b45309" stroke="#78350f" strokeWidth="0.5" />

            {/* Lumberjack Villager (Dân chặt củi) */}
            {owner && (
              <g transform="translate(31, 24)" className="animate-axe-chop" style={{ transformOrigin: '0px 6px' }}>
                {/* Body */}
                <rect x="-1" y="1.5" width="2" height="4.5" fill="#047857" stroke="#064e3b" strokeWidth="0.3" />
                {/* Head */}
                <circle cx="0" cy="0.3" r="0.9" fill="#fcd34d" />
                {/* Worker Cap */}
                <path d="M -1.8,0 L 1.8,0 L 1,-1.8 L -1,-1.8 Z" fill="#b91c1c" />
                {/* Axe held by lumberjack */}
                <line x1="-0.8" y1="3" x2="2.5" y2="-1" stroke="#78350f" strokeWidth="0.6" />
                <path d="M 1.5 -1.8 L 3.5 0.8 L 1.5 1.8 Z" fill="#9ca3af" stroke="#374151" strokeWidth="0.3" />
              </g>
            )}
          </g>
        );

      case 'FARM':
        return (
          // Farm field rows with spinning windmill & farming villager
          <g transform={`translate(${xPos + 5}, ${yPos + 10})`}>
            {/* Cultivated rows */}
            <path d="M 4 28 L 36 28 M 6 31 L 34 31 M 8 25 L 32 25" stroke="#eab308" strokeWidth="0.8" opacity="0.45" strokeDasharray="3, 2" />
            
            {/* Windmill structure */}
            <polygon points="22,32 24,15 28,15 30,32" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.5" />
            <rect x="25" y="26" width="2" height="6" fill="#1f2937" />
            <circle cx="26" cy="15" r="2.5" fill="#7f1d1d" />

            {/* Spinning blades */}
            <g className="animate-windmill-spin" style={{ transformOrigin: '26px 15px' }}>
              <line x1="26" y1="15" x2="26" y2="5" stroke="#f3f4f6" strokeWidth="0.8" />
              <line x1="26" y1="15" x2="26" y2="25" stroke="#f3f4f6" strokeWidth="0.8" />
              <line x1="26" y1="15" x2="16" y2="15" stroke="#f3f4f6" strokeWidth="0.8" />
              <line x1="26" y1="15" x2="36" y2="15" stroke="#f3f4f6" strokeWidth="0.8" />
              <polygon points="26,5 29,7 26,9" fill="#f3f4f6" />
              <polygon points="26,25 23,23 26,21" fill="#f3f4f6" />
              <polygon points="16,15 18,12 20,15" fill="#f3f4f6" />
              <polygon points="36,15 34,18 32,15" fill="#f3f4f6" />
            </g>

            {/* Farming Villager (Dân làm ruộng) */}
            {owner && (
              <g transform="translate(10, 24)">
                {/* Peasant Body */}
                <rect x="-1" y="1.5" width="2" height="4.5" fill="#b45309" stroke="#78350f" strokeWidth="0.3" />
                {/* Head */}
                <circle cx="0" cy="0.3" r="0.9" fill="#fcd34d" />
                {/* Peasant Straw Hat */}
                <polygon points="-2.2,0 2.2,0 0,-2" fill="#eab308" stroke="#78350f" strokeWidth="0.3" />
                {/* Sickle tool */}
                <path d="M 0.8,3 Q 2.2,0.5 3.5,3" fill="none" stroke="#9ca3af" strokeWidth="0.6" />
              </g>
            )}
          </g>
        );

      case 'MOUNTAIN':
        return (
          // Watchtower fortress peaks with patrol guard
          <g transform={`translate(${xPos + 5}, ${yPos + 10})`}>
            <polygon points="18,32 5,15 31,32" fill="#4b5563" stroke="#1f2937" strokeWidth="0.5" />
            <polygon points="18,32 18,15 31,32" fill="#1f2937" />
            <polygon points="26,32 16,18 36,32" fill="#6b7280" stroke="#374151" strokeWidth="0.5" />
            <polygon points="26,32 26,18 36,32" fill="#374151" />
            <polygon points="18,15 15,19 21,19" fill="#f3f4f6" />
            <polygon points="26,18 24,21 28,21" fill="#f3f4f6" />

            {/* Guard Soldier on Mountain (Binh lính canh gác) */}
            {owner && (
              <g transform="translate(10, 24)">
                <rect x="-1" y="1.2" width="2" height="4.5" fill={colorStyles.main} stroke="#111827" strokeWidth="0.3" />
                <circle cx="0" cy="0.4" r="0.8" fill="#fcd34d" />
                <polygon points="-1.5,0 1.5,0 0,-1.8" fill="#9ca3af" stroke="#4b5563" strokeWidth="0.2" />
                <line x1="1.5" y1="5.5" x2="1.5" y2="-2" stroke="#d1d5db" strokeWidth="0.4" />
              </g>
            )}
          </g>
        );

      default:
        return (
          // Plains: tiny grass blades with patrol guard if owned
          <g transform={`translate(${xPos + 5}, ${yPos + 10})`}>
            <path d="M 12 31 Q 9 22 6 24 Q 10 26 13 32" fill="#22c55e" opacity="0.3" />
            <path d="M 24 32 Q 26 23 29 21 Q 27 27 25 32" fill="#16a34a" opacity="0.3" />

            {/* Patrol Soldier (Lính đi tuần) */}
            {owner && (
              <g transform="translate(18, 22)">
                <rect x="-1" y="1.2" width="2" height="4.5" fill={colorStyles.main} stroke="#111827" strokeWidth="0.3" />
                <circle cx="0" cy="0.4" r="0.8" fill="#fcd34d" />
                <polygon points="-1.5,0 1.5,0 0,-1.8" fill="#9ca3af" stroke="#4b5563" strokeWidth="0.2" />
                <line x1="1.5" y1="5.5" x2="1.5" y2="-2.5" stroke="#d1d5db" strokeWidth="0.4" />
              </g>
            )}
          </g>
        );
    }
  };

  return (
    <g 
      onClick={onClick} 
      className="cursor-pointer group select-none"
    >
      {/* CSS Micro-Animations scoped inside SVG cells */}
      <style>{`
        @keyframes flag-wave {
          0%, 100% { transform: rotate(0deg) skewY(0deg); }
          50% { transform: rotate(8deg) skewY(3deg); }
        }
        .animate-flag-wave {
          animation: flag-wave 2s ease-in-out infinite;
        }

        @keyframes pickaxe-swing {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-35deg); }
        }
        .animate-pickaxe-swing {
          animation: pickaxe-swing 1.3s ease-in-out infinite;
        }

        @keyframes axe-chop {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-28deg); }
        }
        .animate-axe-chop {
          animation: axe-chop 1.5s ease-in-out infinite;
        }

        @keyframes windmill-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-windmill-spin {
          animation: windmill-spin 12s linear infinite;
        }
      `}</style>

      {/* Shading/Tint for owned tiles */}
      {owner && (
        <rect
          x={xPos}
          y={yPos}
          width={width}
          height={height}
          fill={colorStyles.main}
          fillOpacity={0.08}
          pointerEvents="none"
        />
      )}

      {/* Clickable Area & Selection Border */}
      <rect
        x={xPos}
        y={yPos}
        width={width}
        height={height}
        fill="transparent"
        stroke={isSelected ? '#ffffff' : 'transparent'}
        strokeWidth={isSelected ? 1.5 : 0}
        strokeOpacity={isSelected ? 0.95 : 0}
        className="transition-all duration-300"
      />

      {/* Territory Laser Borders (Glowing Faction boundaries) */}
      <g strokeWidth={2.5} strokeLinecap="square">
        {drawLeft && (
          <line
            x1={xPos}
            y1={yPos}
            x2={xPos}
            y2={yPos + height}
            stroke={colorStyles.main}
            strokeOpacity={0.85}
          />
        )}
        {drawRight && (
          <line
            x1={xPos + width}
            y1={yPos}
            x2={xPos + width}
            y2={yPos + height}
            stroke={colorStyles.main}
            strokeOpacity={0.85}
          />
        )}
        {drawTop && (
          <line
            x1={xPos}
            y1={yPos}
            x2={xPos + width}
            y2={yPos}
            stroke={colorStyles.main}
            strokeOpacity={0.85}
          />
        )}
        {drawBottom && (
          <line
            x1={xPos}
            y1={yPos + height}
            x2={xPos + width}
            y2={yPos + height}
            stroke={colorStyles.main}
            strokeOpacity={0.85}
          />
        )}
      </g>

      {/* HQ Base Circle Radar Ring */}
      {isCapital && (
        <circle
          cx={xPos + width / 2}
          cy={yPos + height / 2}
          r={width / 2.5}
          fill="none"
          stroke={colorStyles.main}
          strokeWidth="0.75"
          strokeDasharray="2, 2"
          className="animate-spin"
          style={{ transformOrigin: `${xPos + width / 2}px ${yPos + height / 2}px`, animationDuration: '8s' }}
        />
      )}

      {/* Render AOE-style Node Asset with citizens and guards */}
      {renderAsset()}

      {/* Coordinates Code text (Top-Left) */}
      <text
        x={xPos + 5}
        y={yPos + 11}
        fill="#9ca3af"
        fontSize="7px"
        fontFamily="monospace"
        fontWeight="bold"
        opacity={0.3}
        className="group-hover:opacity-75 transition-opacity"
      >
        {tile.code}
      </text>

      {/* Soldiers Badge Overlay */}
      {owner && soldiersCount > 0 && (
        <g>
          {/* Badge BG */}
          <rect
            x={xPos + width - 18}
            y={yPos + height - 13}
            width={14}
            height={9}
            fill="#030712"
            stroke={colorStyles.main}
            strokeWidth={0.5}
            strokeOpacity={0.6}
          />
          {/* Badge text */}
          <text
            x={xPos + width - 11}
            y={yPos + height - 6}
            textAnchor="middle"
            fill="#f3f4f6"
            fontSize="6.5px"
            fontWeight="black"
            fontFamily="monospace"
          >
            {soldiersCount}
          </text>
        </g>
      )}

      {/* Fortified Dots */}
      {owner && tile.level > 1 && (
        <g className="opacity-50 pointer-events-none">
          {Array.from({ length: Math.min(tile.level, 3) }).map((_, idx) => (
            <rect
              key={idx}
              x={xPos + 4 + idx * 4.5}
              y={yPos + height - 6}
              width={2}
              height={2}
              fill={colorStyles.main}
            />
          ))}
        </g>
      )}
    </g>
  );
}
