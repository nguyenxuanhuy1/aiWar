# Đặc tả chi tiết logic & tích hợp API Đấu trường AI Kingdom Arena ⚔️⚙️

Tài liệu này chứa **toàn bộ công thức toán học**, **thông số khởi tạo**, **hành động game**, và **schema JSON đầy đủ** từ mã nguồn giả lập Frontend. Bạn có thể sao chép tài liệu này gửi cho bất kỳ Chat AI nào (ChatGPT/Claude) để yêu cầu nó viết toàn bộ code Backend (Java Spring Boot, Node.js, Python, v.v.) khớp 100% với giao diện Frontend.

---

## 1. Thông số khởi tạo (Initialization Values)

Khi trận đấu bắt đầu ở Lượt 0 (`Round = 0`):

### 1.1. Các Vương quốc (Kingdoms)
* **Số lượng:** Hỗ trợ từ 2 đến 5 vương quốc.
* **Tài nguyên bắt đầu:**
  - Lính (`soldiers`): `15`
  - Vàng (`gold`): `100`
  - Lương thảo (`supplies`): `120`
  - Năng lượng (`energy`): `80`
  - Dầu khí (`oil`): `50`
  - Dân số (`population`): `1000`
  - Sĩ khí (`morale`): `85`
  - Công nghệ (`tech`): `1`
  - Điểm số (`score`): `100` (được lưu vết qua từng lượt `scoreHistory: [100]`)
  - Trạng thái sống: `alive: true`
* **Lực lượng quân sự cụ thể (Dưới quyền lính `soldiers`):**
  - Bộ binh (`infantry`): `soldiers * 60`
  - Xe tăng (`tanks`): `soldiers * 12`
  - Máy bay (`aircraft`): `soldiers * 3`
  - Pháo binh (`artillery`): `soldiers * 9`
  - Hải quân (`navy`): `soldiers * 1`
  - Flycam chiến đấu (`drones`): `soldiers * 5`

### 1.2. Bản đồ lưới 10x10 (Tiles Grid)
* **Tổng số ô:** 100 ô (Tọa độ X từ 0->9, Y từ 0->9).
* **Định dạng Mã ô (`code`):** Kết hợp Chữ cái hàng dọc (A-J tương ứng Y 0-9) và Số hàng ngang (1-10 tương ứng X 0-9). Ví dụ: Ô ở X=0, Y=0 là `A1`, X=9, Y=9 là `J10`.
* **Vị trí đại bản doanh (Capital Spots):**
  - 4 nước: `A2` (1,1), `I9` (8,8), `I2` (8,1), `A9` (1,8).
  - 3 nước: `A2` (1,1), `I9` (8,8), `I2` (8,1).
  - 2 nước: `A2` (1,1), `I9` (8,8).
* **Các loại tài nguyên phân bổ ngẫu nhiên trên ô đất trống (Unowned):**
  - Tỷ lệ 12%: Mỏ Vàng (`GOLD_MINE`, điểm thủ thành `defenseBonus = 2`).
  - Tỷ lệ 13%: Rừng Lâm nghiệp (`FOREST`, `defenseBonus = 3`).
  - Tỷ lệ 13%: Trang trại (`FARM`, `defenseBonus = 1`).
  - Tỷ lệ 7%: Núi cao Dầu khí (`MOUNTAIN`, `defenseBonus = 6`).
  - Còn lại: Đồng bằng (`PLAIN`, `defenseBonus = 1`).
  - Đại bản doanh (`CAPITAL`): Level xuất phát = 3, `defenseBonus = 5`.

---

## 2. Chu kỳ đầu mỗi lượt đấu (Resource & Upkeep Phase)

Ở đầu mỗi lượt (trước khi các AI hành động), thực hiện tính toán tài nguyên cho mỗi vương quốc đang còn sống (`alive: true`):

### 2.1. Lợi tức thu hoạch từ các ô đất sở hữu
* **Mặc định cơ bản:** `suppliesGain = 10`, `goldGain = 10`, `energyGain = 10`, `oilGain = 5`.
* **Lợi tức cộng thêm theo từng ô đất sở hữu:**
  - Ô `FARM`: `suppliesGain += 15 + level * 2`
  - Ô `GOLD_MINE`: `goldGain += 15 + level * 2`
  - Ô `FOREST`: `energyGain += 15 + level * 2`
  - Ô `MOUNTAIN`: `oilGain += 15 + level * 2`
  - Ô `CAPITAL`: `suppliesGain += 20`, `goldGain += 20`, `energyGain += 20`, `oilGain += 10`.
* **Cộng điểm lượt:** `scoreGain = số_lượng_ô_sở_hữu * 2`

### 2.2. Chi phí bảo trì quân đội (Upkeep Cost)
* **Lượng tiêu thụ:** `upkeep = floor(soldiers * 1.5)`
* **Khấu trừ tài nguyên:**
  - Lương thảo tiêu hao: `supplies = max(0, supplies + suppliesGain - upkeep)`
  - Vàng chi trả lương lính: `gold = max(0, gold + goldGain - floor(upkeep / 2))`
  - Năng lượng và dầu khí: Cộng thẳng không tốn phí bảo dưỡng: `energy += energyGain`, `oil += oilGain`.
  - Điểm số: `score += scoreGain`.
  - Dân số: `population = floor(population + (supplies > 20 ? 15 : -10))`

### 2.3. Hậu quả của việc đói kém (Starvation)
* Nếu Lương thảo (`supplies`) giảm về **0**:
  - Sĩ khí giảm: `morale = max(20, morale - 8)`
  - Binh lính đào ngũ / chết đói: `soldiers = max(2, soldiers - 1)`

---

## 3. Hệ thống sự kiện ngẫu nhiên (Random Events - 15% Tỷ lệ)

Ở mỗi lượt (bắt đầu từ Lượt 2), có **15% cơ hội** nổ ra sự kiện ngẫu nhiên tác động lên **1 quốc gia ngẫu nhiên** đang còn sống:

### 3.1. Dịch bệnh (Plague - 🦠)
* **Ảnh hưởng:**
  - Giảm binh lính: `soldiersLost = floor(soldiers * 0.3)`
  - Cập nhật quân số: `soldiers = max(2, soldiers - soldiersLost)`
  - Giảm sĩ khí: `morale = max(10, morale - 20)`
* **Gói tin gửi FE:** `DISASTER_TRIGGERED` kèm `effectType: "PLAGUE"`.

### 3.2. Thiên tai (Disaster - 🌪️)
* **Ảnh hưởng:**
  - Hao hụt lương thảo: `suppliesLost = floor(supplies * 0.5)`
  - Cập nhật lương: `supplies = max(0, supplies - suppliesLost)`
  - Tiêu hao vàng khắc phục: `goldLost = floor(gold * 0.3)`
  - Cập nhật vàng: `gold = max(0, gold - goldLost)`
* **Gói tin gửi FE:** `DISASTER_TRIGGERED` kèm `effectType: "DISASTER"`.

---

## 4. Chi tiết logic tính toán các Hành động (AI Actions)

Các nước AI chọn hành động dựa trên kết quả phân tích LLM. Backend phải khấu trừ tài nguyên và cập nhật trạng thái theo các công thức sau:

### 4.1. Khai hoang (EXPAND)
* **Điều kiện:** Có ít nhất một ô trống chưa có chủ (`ownerKingdomId == null`) nằm kề cạnh ô đất của vương quốc (khoảng cách Manhattan = 1).
* **Chi phí:** Tiêu hao `15 energy`.
* **Hiệu quả:**
  - Đổi chủ sở hữu ô đất thành vương quốc đó.
  - Ô đất mới khởi tạo có `level = 1`.
  - Cộng điểm vương quốc: `score += 15`.

### 4.2. Chiêu binh (RECRUIT)
* **Chi phí:** Tiêu hao `12 gold` và `12 supplies`.
* **Hiệu quả:**
  - Số lượng lính tuyển thêm: `recruited = 4 + floor(tech * 1.5)`
  - Cập nhật quân số: `soldiers += recruited`
  - Tăng sĩ khí: `morale = min(100, morale + 3)`

### 4.3. Tấn công (ATTACK)
* **Điều kiện:** Tấn công một ô kề cạnh thuộc sở hữu của quốc gia đối phương (không phải đồng minh đang trong hiệp ước).
* **Công thức sức mạnh tấn công (Attack Power):**
  $$AttackPower = (soldiers_{attacker} \times 0.7) \times (0.5 + Random[0..1]) \times (1 + tech_{attacker} \times 0.15)$$
* **Công thức sức mạnh phòng thủ (Defense Power):**
  $$DefensePower = (soldiers_{defender} \times 0.4 + defenseBonus_{tile} \times 3) \times (0.5 + Random[0..1]) \times (1 + tech_{defender} \times 0.1)$$

#### Trường hợp 1: Tấn công Thành công ($AttackPower > DefensePower$)
1. **Đổi chủ ô đất** sang vương quốc tấn công.
2. **Thương vong:**
   - Bên tấn công tổn thất: `lostSoldiers = floor(soldiers_attacker * 0.3)`
   - Cập nhật quân tấn công: `soldiers_attacker = max(5, soldiers_attacker - lostSoldiers)`
   - Bên phòng thủ tổn thất: `defLoss = floor(soldiers_defender * 0.4)`
   - Cập nhật quân phòng thủ: `soldiers_defender = max(2, soldiers_defender - defLoss)`
3. **Thay đổi điểm số:**
   - Attacker: `score += 40`
   - Defender: `score = max(0, score - 20)`
4. **Cơ chế cướp bóc (Looting):**
   - Vàng cướp được: `lootedGold = floor(gold_defender * 0.3)`
   - Lương thảo cướp được: `lootedSupplies = floor(supplies_defender * 0.3)`
   - Cập nhật:
     - `gold_defender = max(0, gold_defender - lootedGold)`
     - `supplies_defender = max(0, supplies_defender - lootedSupplies)`
     - `gold_attacker += lootedGold`
     - `supplies_attacker += lootedSupplies`
5. **Chiếm đoạt Đại bản doanh (Nếu ô chiếm được là `CAPITAL`):**
   - Giảm sĩ khí bên thủ nặng nề: `morale_defender = max(10, morale_defender - 40)`
   - Tăng sĩ khí bên công: `morale_attacker = min(100, morale_attacker + 15)`

#### Trường hợp 2: Tấn công Thất bại ($AttackPower \le DefensePower$)
1. **Thương vong:**
   - Bên tấn công tổn thất nặng nề: `lostSoldiers = floor(soldiers_attacker * 0.5)`
   - Cập nhật quân tấn công: `soldiers_attacker = max(2, soldiers_attacker - lostSoldiers)`
2. **Sĩ khí bên tấn công giảm sút:** `morale_attacker = max(30, morale_attacker - 10)`

### 4.4. Gia cố công sự (DEFEND)
* **Chi phí:** Tiêu hao `15 energy`.
* **Hiệu quả:**
  - Tăng cấp độ ô đất chọn gia cố lên 1 cấp: `level += 1`.
  - Tăng chỉ số phòng thủ của ô đó: `defenseBonus += 2`.
  - Cộng điểm vương quốc: `score += 10`.

### 4.5. Nghiên cứu Kỹ nghệ (RESEARCH)
* **Chi phí:** Tiêu hao `30 gold` và `20 energy`.
* **Hiệu quả:**
  - Tăng cấp độ công nghệ vương quốc: `tech += 1`.
  - Cộng điểm vương quốc: `score += 25`.

### 4.6. Bang giao liên minh (DIPLOMACY)
* **Điều kiện:** Có quốc gia khác còn sống trên bản đồ chưa liên minh.
* **Chi phí:** Tiêu hao `20 gold`.
* **Hiệu quả:**
  - Thiết lập liên minh có thời hạn **3 lượt** (`expireRound = round_hien_tai + 3`).
  - Two bên liên minh sẽ không được phép tấn công ô đất của nhau.
  - Tăng sĩ khí cả hai nước: `morale_sender = min(100, morale_sender + 10)`, `morale_partner = min(100, morale_partner + 10)`.
  - Tăng điểm: Bên khởi xướng `score += 15`, bên đồng ý `score += 10`.
  - *Nếu không còn nước nào tự do (đã liên minh hết hoặc chết):* Tự động tổ chức lễ hội nội bộ tiêu tốn 20 vàng: sĩ khí tăng 15, điểm tăng 5.

---

## 5. Xóa sổ quốc gia (Death Checking)

Cuối mỗi lượt đấu, Backend quét toàn bộ bản đồ:
* Nếu một vương quốc **không còn sở hữu bất kỳ ô đất nào** (kể cả đại bản doanh đã bị chiếm đóng hết):
  - Đánh dấu vương quốc bị tiêu diệt: `alive = false`.
  - Gửi log hệ thống thông báo bị xóa sổ.
* **Điều kiện kết thúc trận đấu:**
  - Số vương quốc còn sống (`alive: true`) $\le 1$.
  - Hoặc số lượt đấu đạt giới hạn tối đa (`round >= maxRound`).
  - Vương quốc thắng cuộc là vương quốc duy nhất còn sống, hoặc có **điểm số cao nhất** (`score`) tại lượt kết thúc.

---

## 6. Giao thức Real-time JSON Payloads (Real-world Schema)

Backend cần gửi chính xác các cấu trúc dữ liệu sau qua WebSocket.

### 6.1. Event `ROUND_START` (Đầu mỗi lượt)
```json
{
  "type": "ROUND_START",
  "payload": {
    "round": 6,
    "kingdoms": [
      { "id": "k-1", "gold": 140, "supplies": 95, "energy": 110, "oil": 55, "soldiers": 18, "morale": 90, "score": 150, "alive": true }
      // Các nước khác...
    ]
  }
}
```

### 6.2. Event `DISASTER_TRIGGERED` (Thiên tai / Dịch bệnh bùng phát)
```json
{
  "type": "DISASTER_TRIGGERED",
  "payload": {
    "effectType": "PLAGUE", // Hoặc "DISASTER"
    "targetKingdomId": "k-1",
    "soldiersLost": 5,
    "moraleLost": 20,
    "goldLost": 0,
    "suppliesLost": 0,
    "dialogue": {
      "type": "DISASTER",
      "senderId": "k-1",
      "senderName": "Alpha Empire",
      "senderColor": "#3b82f6",
      "senderModel": "gemini-1.5-flash",
      "message": "Nguy to! Đại dịch vương quốc 🦠 đang bùng phát dữ dội! Quân sĩ kiệt quệ!",
      "replyMessage": "Báo cáo bệ hạ, quân ta đã mất đi 30% lực lượng (trừ 5 binh sĩ)!"
    }
  }
}
```

### 6.3. Event `ACTION_SELECTED` (Visual Novel Dialog)
```json
{
  "type": "ACTION_SELECTED",
  "payload": {
    "action": "ATTACK",
    "dialogue": {
      "type": "ATTACK",
      "senderId": "k-1",
      "senderName": "Alpha Empire",
      "senderColor": "#3b82f6",
      "senderModel": "gemini-1.5-flash",
      "receiverId": "k-2",
      "receiverName": "Beta Dynasty",
      "receiverColor": "#ef4444",
      "receiverModel": "gpt-4o-mini",
      "message": "Toàn quân tiến công! Đánh sập cứ điểm ô [C3] của Beta Dynasty, cướp bóc 24 vàng và 30 lương thảo!",
      "replyMessage": "Nguy to! Đại bản doanh ô [C3] thất thủ! Kho tàng bị cướp mất 24 vàng và 30 lương thảo!",
      "targetTileCode": "C3"
    }
  }
}
```

### 6.4. Event `ACTION_EXECUTED` (Thực thi và cập nhật giao diện)
```json
{
  "type": "ACTION_EXECUTED",
  "payload": {
    "action": "ATTACK",
    "kingdomId": "k-1",
    "success": true,
    "updatedTiles": [
      {
        "id": "tile-2-3",
        "code": "C3",
        "ownerKingdomId": "k-1",
        "level": 1,
        "defenseBonus": 1
      }
    ],
    "lootedResources": {
      "gold": 24,
      "supplies": 30,
      "targetKingdomId": "k-2"
    },
    "updatedKingdoms": [
      { "id": "k-1", "gold": 164, "supplies": 125, "soldiers": 13, "morale": 90, "score": 190, "alive": true },
      { "id": "k-2", "gold": 56, "supplies": 70, "soldiers": 11, "morale": 50, "score": 100, "alive": true }
    ],
    "attackLine": {
      "fromX": 1,
      "fromY": 2,
      "toX": 2,
      "toY": 2,
      "unitType": "TANK", // TANK, AIRCRAFT, DRONE
      "color": "#3b82f6"
    }
  }
}
```
*(Nếu là hành động DIPLOMACY, `attackLine` và `lootedResources` sẽ không có, thay vào đó Frontend sẽ vẽ đường liên minh nhờ danh sách `alliances` cập nhật).*
