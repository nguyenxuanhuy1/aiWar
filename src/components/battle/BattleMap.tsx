import { Tile, Kingdom, AttackLine, VisualEffect, Alliance, Dialogue } from '@/types/battle';
import { TileCell } from './TileCell';
import { AllianceLines } from './map/AllianceLines';
import { AttackLines } from './map/AttackLines';
import { ActionBadges } from './map/ActionBadges';
import { WeatherEffects } from './map/WeatherEffects';
import { DialogueOverlay } from './map/DialogueOverlay';
import { TileInspector } from './map/TileInspector';

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
  const mapHeight = cellSize * 10;

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* SVG Map Container (Non-scrollable outer frame) */}
      <div className="relative bg-[#02050c] border border-white/5 rounded-none overflow-hidden w-full">
        {/* Animated grid ambient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,transparent_80%)] pointer-events-none" />
        
        {/* High-tech corner bracket accents for map frame */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/20 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/20 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/20 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/20 pointer-events-none" />

        {/* Scrollable inner container for map only */}
        <div className="w-full overflow-x-auto p-4 flex items-center justify-center">
          <div 
            className="relative w-full max-w-full max-h-[calc(100vh-150px)] h-auto"
            style={{ aspectRatio: '960 / 600' }}
          >
            <svg
              viewBox={`-180 0 960 ${mapHeight}`}
              className="w-full h-full"
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
              <WeatherEffects activeGlobalEffect={activeGlobalEffect} mapHeight={mapHeight} />

              {/* Render Active Alliances (Persistent paths connecting allied capitals) */}
              <AllianceLines tiles={tiles} kingdoms={kingdoms} alliances={alliances} cellSize={cellSize} />

              {/* Render Combat Laser and Explosion Shockwaves */}
              <AttackLines activeAttackLines={activeAttackLines} cellSize={cellSize} />

              {/* Render Floating Action Badges */}
              <ActionBadges visualEffects={visualEffects} cellSize={cellSize} />
            </svg>

            {/* Conversation Dialogues overlay */}
            <DialogueOverlay activeDialogue={activeDialogue} kingdoms={kingdoms} />
          </div>
        </div>
      </div>

      {/* Selected Tile Inspector Tooltip */}
      <TileInspector selectedTile={selectedTile} kingdoms={kingdoms} />
    </div>
  );
}
