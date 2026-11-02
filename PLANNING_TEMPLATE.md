# Sprint Planning Report: Sprint 1

*Copy this file into `scrum/planning/` using your team's naming format. Fill in every field. Replace the italic guidance with your team's information.*

---

## 1. Meeting Details

**Date:** November 2nd 2026

**Scrum Master:** Luke

**Attendees:** Matthew, Jason, and Kevin

**Absent:** N/A

---

## 2. Sprint Goal

*One or two sentences describing a playable outcome, not a list of tickets. e.g., "A player can create a character and enter the first dungeon."*

Have a charicter that can move around in a produally generated world.

---

## 3. Capacity and Velocity

**Sprint dates:** Nov 2nd to Nov 10

**Velocity last sprint (points completed):** n/a

**Average velocity so far:** n/a

**Known absences or reduced availability this sprint:** n/a

**Points committed this sprint:** 5

**Why this commitment is realistic:** *(Compare it to your velocity and capacity. If you are committing more than last sprint's velocity, explain why.)*

All of these points can be done individually reducing conflicts and the reasonable amount of work.

---

## 4. Committed Backlog Items

*Every item listed here must meet the Definition of Ready in your constitution. Items should be taken from the top of the product backlog in priority order. If you skipped a higher-priority item, explain why under "Notes".*

| Issue # | User story | Estimate | Owner | Ready? |
|---------|------------|----------|-------|--------|
| 1       | As a player, I want to be represented by an icon that moves around the screen, so that I can see where I am. | 2 hours | Luke | [x]    |
| 2       | As a player, I want the dungeon room drawn as a grid of tiles, so that I can see where the floors and walls are. | 2 hours | Jason | [x]    |
| 3       | As a player, I want auto-generated levels, so that I have a different experience each time I play the game. | 2 hours | Jason | [x]    |
| 14      | As a player, I want to play the whole game with only the keyboard, so that I never need a mouse. | 2 hours | Kevin | [x]    |
| 22      | As a player, I want 8-bit style graphics, so that the game has a consistent retro look. | 2 hours | Matthew | [x]    |

**Total points:** 28

**Notes:** n/a

---

## 5. Task Breakdown

*Break each story into tasks. Include tasks for writing tests and reviewing PRs, not only coding.*

### Issue #1: Player icon that moves around the screen

- [ ] Create a `Player` class with grid position and a `draw()` method in `src/sketch.js`
- [ ] Render the player icon on the canvas at its current tile
- [ ] Add a `move(dx, dy)` method that updates the player's position
- [ ] Block movement into walls and off the edge of the map (depends on #2)
- [ ] Write Jasmine tests for player movement and wall collision
- [ ] Open PR and get it reviewed by a teammate

### Issue #2: Dungeon room drawn as a grid of tiles

- [ ] Define tile types (floor, wall) and tile size constants
- [ ] Create a `Map` structure that stores a 2D grid of tiles
- [ ] Draw the grid on the canvas, with floors and walls visually distinct
- [ ] Add a helper to check whether a tile is walkable (used by #1)
- [ ] Write Jasmine tests for grid creation and the walkable check
- [ ] Open PR and get it reviewed by a teammate

### Issue #3: Auto-generated levels

- [ ] Research and pick a generation approach (e.g. random rooms + corridors)
- [ ] Implement a generator that fills the `Map` grid from #2
- [ ] Make sure every floor tile is reachable and the player has a valid spawn point
- [ ] Generate a new level each time the game starts
- [ ] Write Jasmine tests (map size, borders are walls, spawn tile is a floor)
- [ ] Open PR and get it reviewed by a teammate

### Issue #14: Play the whole game with only the keyboard

- [ ] Handle arrow keys and WASD in p5's `keyPressed()`
- [ ] Map keys to player movement directions (connects to #1)
- [ ] Add a key to regenerate / restart the level (connects to #3)
- [ ] Confirm no part of the game requires the mouse
- [ ] Write Jasmine tests for the key-to-direction mapping
- [ ] Open PR and get it reviewed by a teammate

### Issue #22: 8-bit style graphics

- [ ] Choose a limited retro color palette and define it as constants
- [ ] Create or find pixel-art sprites for floor, wall, and player tiles
- [ ] Turn off smoothing (`noSmooth()`) so pixels scale crisply
- [ ] Apply the palette and sprites to the tile and player rendering
- [ ] Write Jasmine tests that the sprites/palette load correctly
- [ ] Open PR and get it reviewed by a teammate

---

## 6. Work Distribution

| Member | Stories owned | Points |
|--------|---------------|--------|
| Luke    | #1 Player icon that moves around the screen | 2 |
| Jason   | #2 Dungeon room drawn as a grid of tiles, #3 Auto-generated levels | 4 |
| Kevin   | #14 Play the whole game with only the keyboard | 2 |
| Matthew | #22 8-bit style graphics | 2 |

*If the work is not balanced, explain why:*

Jason owns two stories because #2 (tile grid) and #3 (level generation) are tightly coupled: the generator fills the grid that #2 defines. Having one person own both avoids merge conflicts and hand-off delays on the map code. Luke also has Scrum Master duties this sprint, so Luke has one story.

---

## 7. Stories Split or Deferred

*Did you split any stories that were too large for one sprint, or move stories back to the backlog? List them and say why.*

_

---

## 8. Retrospective Follow-Through

*Which action items from last sprint's retrospective are part of this sprint's plan, and how? (Sprint 1: write "n/a")*

| Action item | How it shows up in this sprint |
|-------------|--------------------------------|
|             |                                |
|             |                                |

---

## 9. Risks and Dependencies

*What might stop the team from meeting the sprint goal? Which stories depend on others being finished first?*

_

---

## 10. Checklist

- [ ] Sprint goal written
- [ ] Every committed story meets the Definition of Ready
- [ ] Every story has an owner
- [ ] Board updated: committed stories in the sprint, tasks created
- [ ] Commitment compared to velocity
- [ ] Report committed to `scrum/planning/` via pull request
