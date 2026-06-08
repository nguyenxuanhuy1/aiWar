import React from 'react';
import { Tile, Kingdom } from '@/types/battle';
import { getKingdomColorStyles, getTileTypeLabel, getTileTypeEmoji } from '@/utils/tileUtils';

interface TileInspectorProps {
  selectedTile: Tile | null;
  kingdoms: Kingdom[];
}

export function TileInspector({ selectedTile, kingdoms }: TileInspectorProps) {
  if (!selectedTile) return null;

  const selectedOwner = selectedTile.ownerKingdomId
    ? kingdoms.find((k) => k.id === selectedTile.ownerKingdomId)
    : null;
  const selectedOwnerStyles = getKingdomColorStyles(selectedOwner ? selectedOwner.name : 'unowned');

  return (
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
  );
}
