# Hướng dẫn nâng cấp Bản đồ sang PixiJS (PixiJS Upgrade Guide)

Tài liệu này hướng dẫn cách nâng cấp từ bản đồ SVG hiện tại sang **PixiJS** để đạt hiệu năng dựng hình cao hơn, mượt mà hơn và thêm các hiệu ứng đồ họa chiến thuật chuyên nghiệp.

---

## 1. Cài đặt thư viện bổ sung
Cài đặt PixiJS và adapter React tương ứng:
```bash
npm install pixi.js @pixi/react
```

---

## 2. Thiết lập PixiJS Stage
Thay thế thẻ `<svg>` trong `BattleMap.tsx` bằng component `Stage` của `@pixi/react`:

```tsx
import { Stage, Container, Sprite, Graphics } from '@pixi/react';

export function PixiBattleMap({ tiles, kingdoms, activeAttackLines }) {
  return (
    <Stage 
      width={600} 
      height={600} 
      options={{ 
        backgroundColor: 0x030712, 
        antialias: true,
        resolution: window.devicePixelRatio || 1
      }}
    >
      <Container>
        {/* Render Grid & Sprites ở đây */}
      </Container>
    </Stage>
  );
}
```

---

## 3. Render Sprite Tiles (Lãnh thổ & Địa hình)
Thay vì vẽ `<rect>` và Emojis, ta dùng các file ảnh texture (spritesheet):
1. Chuẩn bị ảnh địa hình: `castle.png`, `farm.png`, `gold_mine.png`, `forest.png`, `plain.png`, `mountain.png`.
2. Tạo Sprite cho từng ô đất:

```tsx
import { Sprite, Container } from '@pixi/react';

function PixiTileCell({ tile, colorStyles }) {
  // Lấy texture tương ứng với loại tile
  const texture = getTextureForType(tile.type); 

  return (
    <Container x={tile.x * 60} y={tile.y * 60}>
      {/* Sprite Nền (Tô màu theo chủ sở hữu) */}
      <Sprite
        image="/images/tile-background.png"
        width={58}
        height={58}
        tint={colorStyles.mainHex} // Đổi màu tint theo màu Kingdom
        alpha={tile.ownerKingdomId ? 0.4 : 0.1}
      />
      {/* Sprite Địa hình ở giữa */}
      <Sprite
        image={texture}
        width={32}
        height={32}
        anchor={0.5}
        x={29}
        y={29}
      />
    </Container>
  );
}
```

---

## 4. Render Sprite Nhân vật / Quân lính (Kingdom Units)
Khi một ô có quân lính (soldiers > 0), ta có thể render một Sprite quân lính dạng hoạt họa (Sprite Sheet):

- Sử dụng `AnimatedSprite` để phát animation đứng thở (Idle) hoặc chạy (Running).
- Đính kèm một thanh máu hoặc thanh số lượng lính nhỏ ngay dưới chân Sprite bằng component `Graphics`.

```tsx
import { Graphics } from '@pixi/react';

const drawSoldierBar = React.useCallback((g) => {
  g.clear();
  g.beginFill(0x1f2937);
  g.drawRect(0, 0, 40, 6);
  g.beginFill(0xef4444);
  g.drawRect(0, 0, (soldiersCount / maxSoldiers) * 40, 6);
  g.endFill();
}, [soldiersCount]);

return (
  <Graphics draw={drawSoldierBar} x={10} y={45} />
);
```

---

## 5. Hiệu ứng Quân lính di chuyển & Đánh nhau
Thay vì vẽ đường thẳng `<line>` tĩnh, ta sử dụng hệ thống hạt (Particle System) hoặc Tween Animation:

### A. Di chuyển lính (Marching Animation):
Khi Agent thực hiện hành động `ATTACK`, thay vì hiện đường kẻ ngay lập tức:
1. Spawn ra một nhóm các Sprite lính tí hon tại ô xuất phát `(fromX, fromY)`.
2. Dịch chuyển tọa độ `(x, y)` của các Sprite này dần dần tới đích `(toX, toY)` thông qua thư viện `gsap` hoặc hàm tick của PixiJS.
3. Khi lính chạm đích, thực hiện tính toán sát thương.

### B. Hiệu ứng chiến đấu (Combat Effects):
Khi đòn đánh chạm tới đích:
1. Tạo hiệu ứng nổ hoặc chém `slash.png` tại tọa độ đích.
2. Dùng `AnimatedSprite` chạy một chuỗi ảnh vụ nổ rồi tự động hủy (`onDestroy`).
3. Làm nhấp nháy (flash) ô đất bị tấn công để biểu thị xung đột bằng cách tăng giảm `alpha` của ô đất đó.
