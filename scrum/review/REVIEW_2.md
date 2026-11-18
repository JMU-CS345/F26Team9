# Sprint Review Report: Sprint 2

---

## 1. Meeting Details

**Date:** __/__/2026

**Scrum Master:** Luke B

**Attendees:** Luke, Jason, Matthew, Kevin

**Absent:** N/A

**Presenter:** ______

**Deployed build reviewed:** jmu-cs345.github.io/F26Team9/

**Release PR into `production`:** PR #__ (merged before the review began)

---

## 2. Sprint Goal

**The goal we set:** A player can explore a generated dungeon floor, fight basic enemies with their starting element's magic, and see their stats change as they take and deal damage.

**Did we meet it?** Partly. A player can pick an element, explore a generated floor, and defeat enemies with spells. But enemies don't attack the player yet, so during play the player never takes damage and their HP doesn't drop.

---

## 3. Committed Items: Done or Not Done

| Issue # | User story | Estimate | Owner | Done? | Built by |
|---------|------------|----------|-------|-------|----------|
| #21 (+ #61) | Choose a starting element and begin with base stats (HP, attack, defense) | 3 pts | Jason | Yes | Jason |
| #60 | Basic enemies that move toward the player and deal damage on contact | 3 pts | Matthew | No: enemies don't deal damage yet | Matthew |
| #4 (+ #27) | Cast Fire, Ice, or other magic at enemies to defeat them | 3 pts | Luke | Yes | Luke |
| #2 | Walk through a room built from a tile map with solid walls | 3 pts | Kevin | Yes | Kevin (tile art by Matthew) |
| #3a | Each new run generates a dungeon floor of connected rooms | 3 pts | Luke & Kevin | Yes | Luke & Kevin |

---

## 4. Metrics

| | Points |
|---|---|
| Committed | 15 |
| Completed | 12 |
| Completion rate | 80% |

**Velocity history:**

| Sprint | Committed | Completed |
|--------|-----------|-----------|
| 1      | 28        | 15        |
| 2      | 15        | 12        |
| 3      |           |           |
| 4      |           |           |

**Burndown or board snapshot:** See the attached screenshot of the Sprint 2 board.

**What explains the difference between committed and completed?**
The only unfinished story is #60. Enemies appear and chase the player, but they don't deal damage on contact yet. Everything else we committed is done, including world generation (#2 and #3a), which is what held up Sprint 1.

---

## 5. Demo

### Issue #21 (+ #61): Starting element and stats

- [x] The player can choose a starting element using only the keyboard.
- [x] The player starts with HP, attack, and defense based on the element's value table.
- [x] takeDamage() lowers the player's HP (reduced by defense), and the HP bar updates.

### Issue #4 (+ #27): Casting spells

- [x] Pressing the cast key fires a spell in the direction the player is facing.
- [x] The player's animation matches the element they chose.
- [x] A spell that hits an enemy lowers its HP, and the enemy is defeated when its HP reaches 0.
- [x] The cast key is listed in the in-game controls.

### Issue #2: Tile map room

- [x] The room is drawn from a tile map with floor, wall, and door tiles.
- [x] The player can't walk through walls.
- [x] Specs for wall collision pass.

### Issue #3a: Generated dungeon floor

- [x] Each new run creates a floor of rooms that don't overlap.
- [x] The player starts in the starting room.
- [x] The rooms are connected, so the player can get from one to the next.

---

## 6. Incomplete Work

| Issue # | What remains | New estimate | Back in backlog? |
|---------|--------------|--------------|------------------|
| #60 | Enemies deal damage to the player on contact | 1 pt (~1.5h) | Yes |

---

## 7. Stakeholder Feedback

*Record what the instructor said: what they liked, what should change, and any new priorities. (Sprint 4: write "n/a")*
 - Stakeholder liked the lamp/lighting, especially complimented the visual aspect of the game.
 - Made sure to reinforce getting player/enemy damage implemented based on the set stats of the mage.
 - No new priorities stick out, just getting down what was missed in the last sprints.

---

## 8. Backlog Changes

**New stories added:** - Basic enemy that can be defeated

**Priorities changed:** n/a

**Stories removed:** n/a

**If no change was needed, why not?**
The priority of defeating enemies remained the same at the end of the sprint.
---

## 9. Quality

**CI status on `production`:** Passing (19 of 19 runs passed this sprint)

**Number of specs:** 5

**Known bugs in the deployed build:** Enemies don't damage the player yet (#60), so the HP bar doesn't change during normal play.

---

## 10. Checklist

- [x] Demo given from the deployed GitHub Pages build
- [x] Demo given by one presenter, crediting the members who built each story
- [x] Release PR merged before the review begins
- [x] Every committed item marked Done or Not Done
- [x] Every item marked Done has all its acceptance criteria checked in section 5
- [x] Metrics filled in, with the committed/completed difference explained
- [x] Stakeholder feedback recorded
- [x] Backlog updated, or the reason no change was needed explained
- [x] Report committed to `scrum/review/` via pull request by 11:59 p.m. on the day of the review
