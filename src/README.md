# MageQuest — E Inventory, H/J/K/L Hotkeys, and Developer Spell Counts

This is the complete working MageQuest project based on the prior smooth-movement and 8-direction animated wizard version. The original sprites and Q settings menu are preserved.

## Folder layout

```text
MageQuest_Inventory_Hotkeys/
├── index.html
├── entity.js                 # Shared movement, facing and sprite animation
├── player.js                 # WASD and smooth acceleration / friction
├── menu.js                   # Q: sound, brightness, text size
├── developerMenu.js          # P: movement tuning + item quantities
├── inventory.js              # Item catalog, owned counts, H/J/K/L bindings
├── inventoryMenu.js          # E: assignment layout, WASD and Space
├── sketch.js                 # Main game loop and global controls
├── sketch.css
├── assets/
│   └── player/
│       ├── mage-walk-8dir.png
│       └── original-reference.png
├── sprite-preview.png        # Optional preview, not loaded by the game
└── tests/
    ├── SpecRunner.html
    ├── DirectionalMovementSpec.js
    └── InventorySpec.js
```

## How to run

1. Unzip the complete project and open the folder in Visual Studio Code.
2. Right-click `index.html` and choose **Open with Live Server**.
3. Move around using WASD. Movement accelerates and slows under friction; the 8-direction wizard walking sprites continue to work.
4. Press **E** to open the new inventory screen shown in the reference sketch.
5. Press **P** to open the developer menu and adjust movement settings or test item counts.
6. Press **Q** for the original Sound / Brightness / Text Size settings.
7. To run the Jasmine suite, open `tests/SpecRunner.html` through Live Server. Jasmine and p5.js are loaded from CDN, so this requires internet access.

## Assign items to H/J/K/L

The E menu contains four **hotkey slots (H, J, K, L) across the top** and four **inventory slots across the bottom**. You start with a few example items so the feature can be tested immediately.

1. Press **E**. The bottom inventory row starts highlighted.
2. Move through inventory items with **A / D**. Press **Space** to pick up one for assignment. Press Space on the same item again to cancel the selection.
3. Press **W** to move to the top hotkey row.
4. Move between H/J/K/L with **A / D**.
5. Press **Space** to assign the selected item. If an item was already on that key, it is replaced. The old item stays in inventory.
6. Press **Space** on an already assigned top-row hotkey when nothing is selected to **remove its assignment**. This does not remove the item from your inventory.
7. Press **S** to return to the inventory row, or **E** to close the menu.

Inventory displays **four items per page**. If you own more than four distinct types, move right with D to enter the next page; A goes back. Only items with at least one copy appear in the inventory display. Assignments and quantities persist through browser refresh.

Outside menus, **H/J/K/L trigger a message identifying the assigned item**. Spell damage, healing, cooldowns, and consumable effects are not implemented yet, so using a hotkey does **not** consume an item or affect player stats. This is intentionally an **inventory/hotkey prototype**, not a combat system.

## Developer menu (P)

P uses the same controls as the original settings menu: **W/S** selects a row and **A/D** decreases/increases its value.

The first four entries remain unchanged:

| Movement property | Default | Range | Step |
|---|---:|---:|---:|
| Ground Friction | 25% | 5–90% | 5% |
| Base Speed | 3.00 | 1–8 | 0.25 |
| Acceleration | 0.75 | 0.10–2.00 | 0.05 |
| Walk Frame Delay | 8 | 3–16 | 1 |

Below them are eight item test counters, each adjustable from **0 to 9 copies** with A/D. The list scrolls so it remains readable on the 800 x 600 canvas.

### Available test items

| Item | Type | Starting quantity |
|---|---|---:|
| Healing Potion | Potion | 2 |
| Mana Potion | Potion | 2 |
| Speed Potion | Potion | 0 |
| Shield Potion | Potion | 0 |
| Fire Bolt | Spell | 1 |
| Ice Shard | Spell | 1 |
| Lightning | Spell | 0 |
| Heal Spell | Spell | 0 |

Decreasing a count to zero removes the item from E inventory. If it was equipped on H/J/K/L, the assignment is removed automatically. Increasing the quantity again makes the item available for assignment.

## Controls quick reference

| Context | Input | Effect |
|---|---|---|
| Game | WASD | Smooth 8-direction movement |
| Game or menu | Q | Toggle normal settings (closes other menus) |
| Game or menu | P | Toggle developer menu (closes other menus) |
| Game or menu | E | Toggle inventory menu (closes other menus) |
| Normal settings | W/S, A/D | Navigate / adjust |
| Developer settings | W/S, A/D | Navigate / adjust movement and item quantities |
| Inventory | W/S | Switch inventory and hotkey rows |
| Inventory | A/D | Move highlighted slot (across pages as necessary) |
| Inventory | Space | Pick up / cancel / assign / clear a hotkey |
| Game | H/J/K/L | Display the assigned item (effects not implemented) |

Only one menu opens at a time. The player's movement and velocity stop while any menu is open. Brightness covers the entire game (including the E/P overlays) and the main menu text size setting is used for menu headings. Regular settings, movement tuning, and inventory persist separately using these browser storage keys:

- `mageQuestSettings`
- `mageQuestDeveloperSettings`
- `mageQuestInventory`

## Architecture

`Entity` continues to own facing, movement physics, boundary collision, and frame animation. `Player` owns WASD movement input. `Inventory` is a small, p5-independent data class that owns item counts and hotkey assignments. `InventoryMenu` draws and navigates the E menu but does not manipulate movement. `DeveloperMenu` now also changes inventory quantities. `sketch.js` coordinates the menus and key events.

The player still uses the included `assets/player/mage-walk-8dir.png` sprite sheet (512 × 128; eight 64 × 64 direction columns and two walking rows). No sprite modifications are required.

## Testing

The test runner includes the 67 existing movement/settings cases and 29 additional item/menu/developer cases. These 96 Jasmine spec callbacks were run successfully in a Node test harness. A separate game-loop integration harness verified E/P/Q exclusivity, movement pause, H/J/K/L activation messages, assignment flow, sprite calls, main settings, and persisted quantities. Full rendering in your own browser should be checked with Live Server.
