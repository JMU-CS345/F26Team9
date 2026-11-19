# Sprint Planning Report: Sprint 3

---

## 1. Meeting Details

**Date:** 11/20/2026

**Scrum Master:** Matthew

**Attendees:** Matthew, Luke, Jason, and Kevin

**Absent:** N/A

---

## 2. Sprint Goal

A player can fight enemies that fight back, open chests for rewards, clear a floor of enemies to reach the next level, and travel to a safe base area between runs.

At the review we will demo this in the deployed build: take damage from an enemy and watch the on-screen HP match the player's real HP, open a chest, defeat every enemy to unlock the exit, take it to a new level, and arrive at the base/safe area.

---

## 3. Capacity and Velocity

**Sprint dates:** 11/19 to 12/2. We are working remotely the week of Thanksgiving (11/23 to 11/27), and will still have a few days working in-person.

**Velocity last sprint:** 12

**Average velocity so far:** 13.5 (Sprint 1: 15, Sprint 2: 12)

**Known absences or reduced availability this sprint:** Thanksgiving break (11/23 to 11/27) will have team members less available, otherwise none planned.

**Points committed this sprint:** 13 (about 7 hours per member)

**Why this commitment is realistic:**
We are committing 13 points, just under our average velocity of 13.5. That's 1 point more than last sprint's 12. The extra point is #5, a small story that connects work we already finished (the stats object from #61) to the UI. We didn't go higher because Thanksgiving week falls in the middle of the sprint and a break that long could have us lose lose momentum. The tasks add up to about 27.5 hours, or roughly 7 hours per person, the same load we handled in Sprint 2. We also split the base area (#16) so we only build the area itself and travel to and from it this sprint, not trading or upgrades.

---

## 4. Committed Backlog Items

| Issue # | User story | Estimate | Owner | Ready? |
|---------|------------|----------|-------|--------|
| #26 | As a player, I take damage when an enemy touches me so that fights are dangerous. | 2 pts (4h) | TBD | [x] |
| #8 | As a player, I find chests in the dungeon that give me rewards so that exploring is worth it. | 3 pts (6h) | Matthew | [x] |
| #101 (new) | As a player, I defeat every enemy on a floor to unlock its exit so that I can move on to the next floor. | 3 pts (7h) | TBD | [x] |
| #5 | As a player, I see my real HP, attack, and defense on screen so that I always know my current stats. | 1 pt (3.5h) | Jason + Matthew | [x] |
| #16 | As a player, I travel between the dungeon and a safe base area so that I have a place to trade and upgrade between runs. (First slice: the base area and travel to and from it) | 4 pts (7h) | TBD | [x] |

**Total points:** 13 (about 27.5 hours of tasks)

**Acceptance criteria:**

**#26 Enemy attacks**
- When an enemy touches the player, the player's HP drops through takeDamage().
- Damage has a short cooldown, so touching an enemy doesn't drain HP every frame.
- The HP bar updates on screen when the player takes damage.

**#8 Chests with rewards**
- Chests appear in rooms of the generated floor.
- When the player stands next to a chest and presses the space key, the chest opens.
- Opening a chest gives a reward (gold for trading or a tool).
- An opened chest looks open and can't be opened again.

**#101 Level exit**
- Every generated floor has one exit, placed in a different room from the starting room.
- The exit stays locked until every enemy wave on the floor is defeated, and it looks different once it unlocks.
- Stepping on the unlocked exit generates a new floor and puts the player in its starting room.
- The current level number is shown on screen.
- The player keeps their HP and stats when moving to the next floor.

**#5 Stats on screen match the real stats**
- The on-screen HP, attack, and defense come straight from the Player stats object, with no separate values in the UI code.
- The numbers on screen always match the player's real stats, including after taking damage, opening a chest, and moving to a new floor.
- The UI code and the stats code are merged, so stats are stored in one place.

**#16 Travel to the base area**
- User has option to send the player to the base area.
- The base area has no enemies and is peaceful.
- A door or portal in the base area starts a new dungeon run.
- The base area has its own 8-bit floor and wall tiles that look different from the dungeon.
- The base area has props marking where the shop and upgrade stations will go.

**Notes:** #26 finishes the part of #60 that wasn't done at the Sprint 2 review (enemies dealing damage). The level exit is a new story. We created it because no existing backlog item covers ending a level, and #16 depends on it.

---

## 5. Task Breakdown

### Issue #26: Enemy attacks (4h)
- [ ] Detect contact between an enemy and the player. (TBD, 1h)
- [ ] Call takeDamage() on contact, with a damage cooldown. (TBD, 1h)
- [ ] Write Jasmine specs for contact damage and the cooldown. (TBD, 1h)
- [ ] Review code and test in the deployed build. (TBD, 1h)

### Issue #8: Chests with rewards (6h)
- [ ] Draw 8-bit sprites for a closed and an open chest. (TBD, 1h)
- [ ] Create a Chest class and place chests in generated rooms. (TBD, 1.5h)
- [ ] Add the interact key to open a chest, and list it in the in-game controls. (TBD, 1h)
- [ ] Apply the chest's reward to the player's stats. (TBD, 1h)
- [ ] Write Jasmine specs for opening a chest and getting the reward. (TBD, 0.5h)
- [ ] Review code and test in the deployed build. (Jason, 1h)

### Issue #101: Level exit (7h)
- [ ] Draw 8-bit tiles for a locked and an unlocked exit. (Matthew, 0.5h)
- [ ] Place the exit in a room other than the starting room. (TBD, 1.5h)
- [ ] Track how many enemies are left on the floor, and unlock the exit when it reaches 0. (TBD, 1h)
- [ ] When the player steps on the unlocked exit, generate the next floor and move the player to its starting room. (TBD, 1.5h)
- [ ] Show the floor number on screen and keep the player's stats between floors. (TBD, 1h)
- [ ] Review code and test in the deployed build. (Matthew, 1h)

### Issue #5: Stats on screen match the real stats (3.5h)
- [ ] Merge the UI code with the stats code so stats are stored in one place. (TBD, 1h)
- [ ] Make the on-screen HP, attack, and defense read from the Player stats object. (TBD, 1h)
- [ ] Write Jasmine specs checking that the on-screen values match the stats object. (TBD, 0.5h)
- [ ] Review code and test in the deployed build. (Luke, 1h)

### Issue #16: Base area and travel (7h)
- [ ] Draw 8-bit floor and wall tiles and shop/upgrade props for the base area. (TBD, 1.5h)
- [ ] Build the base area as its own tile map with no enemies. (TBD, 1h)
- [ ] Send the player to the base area after the last floor of a run. (TBD, 1.5h)
- [ ] Add a door or portal in the base area that starts a new run. (TBD, 1h)
- [ ] Write Jasmine specs for moving between the dungeon and the base area. (TBD, 1h)
- [ ] Review code and test in the deployed build. (Kevin, 1h)

---

## 6. Work Distribution

| Member | Stories owned | Points |
|--------|---------------|--------|
| Jason Waddell | TBD | TBD |
| Matthew Creighton | TBD | TBD |
| Luke Bonnell | TBD | TBD |
| Kevin Scafe | TBD | TBD |

*If the work is not balanced, explain why:*
TBD once owners are assigned. Our goal is to keep everyone at about 7 hours.

---

## 7. Stories Split or Deferred

*Split:*
#16 Travel between dungeons and safe areas is too big for one sprint if it includes trading and upgrading. This sprint we only build travel to and from the base area and the area itself. Trading (#9 Shop in safe areas) and upgrading (#20 Permanent upgrades between runs) stay in the backlog for a later sprint.

*Skipped (higher in the backlog than some committed stories):*
- **#10 Save progress in safe areas, #20 Permanent upgrades, #9 Shop:** these all happen in the base area, which doesn't exist until this sprint.
- **#15 Level generation:** generation already works. Seeds are nice to have but don't add to the sprint goal.
- **#12 XP and leveling:** we're starting with chests as the reward system because they're simpler. XP comes next.
- **#6 Cast Fire, Ice, and Mind magic:** basic spellcasting was done in Sprint 2 (#4, #27). More elements come later.
---

## 8. Retrospective Follow-Through

| Action item | How it shows up in this sprint |
|-------------|--------------------------------|
| 24-hour PR reviews as a constitution rule (Matthew) | The rule is proposed in PR #53. Every story ends with a review task. Whoever opens a PR requests a reviewer on GitHub and posts the link in the team chat. |
| Day-3 walkthrough of the latest build (Jason) | Scheduled for Mon 11/30, our third working day after the Thanksgiving break. Everyone pulls main, plays the deployed build, and shows what they merged. |
| Unfinished work from the Sprint 2 review: enemies don't deal damage (#60) | Committed as #26 Enemy attacks. |

---

## 9. Risks and Dependencies

*Dependencies:*
- #26 uses the takeDamage() method and HP bar from #61 (done in Sprint 2).
- #5 builds on the stats object from #61. #26 and #8 both change the player's stats, so #5 should be merged early to make sure their changes show up correctly on screen.
- #8 places chests in rooms from the floor generator (#3a, done in Sprint 2).
- #16 needs the level exit, because the exit on the last floor is what sends the player to the base area. The level exit should be done first.

*Risks:*
- Thanksgiving week falls in the middle of the sprint. Work could stall, and PRs opened before the break could sit for a week. We'll try to merge open PRs before 11/23 and hold the walkthrough on our first day back.
- #16 depends on the level exit. If the level exit slips, #16 slips too. If that happens, the demo can still show #26 and #8 in the dungeon.

---

## 10. Checklist

- [x] Sprint goal written
- [x] Every committed story meets the Definition of Ready
- [ ] Every story has an owner
- [ ] Board updated: committed stories in the sprint, tasks created
- [x] Commitment compared to velocity
- [ ] Report committed to `scrum/planning/` via pull request