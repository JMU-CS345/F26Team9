`# Sprint Planning Report: Sprint 2`  
`---`  
`## 1. Meeting Details`  
`**Date:** 11/11/2026`  
`**Scrum Master:** Luke`  
`**Attendees:** Matthew, Luke, Jason, and Kevin`  
`**Absent:** N/A`  
`---`  
`## 2. Sprint Goal`  
`A player can explore a generated dungeon floor, fight basic enemies with their starting element's magic, and see their stats change as they take and deal damage.`  
`At the review we will demo this in the deployed build: choose an element, walk around a generated room, and defeat enemies with spells while HP updates on the screen.`  
`---`  
`## 3. Capacity and Velocity`  
`**Sprint dates:** 11/10 to 11/19 (1 week)`  
`**Velocity last sprint:** 15`  
`**Average velocity so far:** 15 (one sprint completed)`  
`**Known absences or reduced availability this sprint:** None known.`  
`**Points committed this sprint:** 15 (~7 hours per member)`  
`**Why this commitment is realistic:**`  
`In Sprint 1 we committed 28 points and completed 15. Most of the gap came from world generation, which was larger and harder than we expected. For Sprint 2 we are committing 15 points, equal to our actual velocity, instead of repeating the over-commitment. We also split world generation into smaller bits so that no single story can slow the sprint the way it did last time. Our task breakdown adds up to roughly 7 hours per person for the week (29 hours overall). That is achievable and still delivers what's asked.`

`---`  
`## 4. Committed Backlog Items`  
`| Issue # | User story | Estimate | Owner | Ready? |`  
`|---------|------------|----------|-------|--------|`  
`| #21 | As a player, I choose a starting element and begin with base stats (HP, attack, defense) so that my choice affects how I play. | 3 pts (6h) | Jason Waddell | [x] |`  
`| #60 | As a player, I encounter basic enemies that move toward me and deal damage on contact so that the dungeon has danger in it. | 3 pts (5h)| Matthew Creighton | [x] |`  
`| #6 | As a player, I cast Fire, Ice, or other magic at enemies so that I can defeat them. | 3 pts (5h) | Luke Bonnell | [x] |`  
`| #2 | As a player, I walk through a room built from a tile map with walls I cannot pass through so that the world feels solid. | 3 pts (6h) | Kevin Scafe | [x] |`  
`| #3a | As a player, each new run generates a dungeon floor of connected rooms so that every run feels different. (First slice of #3) | 3 pts (7h) | Luke Bonnell & Kevin Scafe | [x] |`  
`**Total points:** 15 (29 hours of tasks)`  
`**Notes:** The enemy story is the one new backlog item. We created it because the stakeholder specifically asked for enemies/combat and our retrospective assigned "More Enemies" to Matthew, but no existing backlog item covered basic enemies. #2 and #3a are carry-overs. We kept them because the retro made world generation an action item and later stories depend on them.`

`---`  
`## 5. Task Breakdown`  
`### Issue #21: Starting element and stats (1h)`  
`- [ ] Write the stats/points value table for each element and add it to the issue. (Jason, 1h)`

`### Issue #61: Starting stats (5h)`  
`- [ ] Create a Player stats object with HP, attack, defense, loaded from the table. (Jason, 1h)`  
`- [ ] Build a keyboard friendly element selection process. (Jason, 1.5h)`  
`- [ ] Add a takeDamage() method that uses defense and updates the HUD. (Jason, 1.5h)`  
`- [ ] Review code and test in the deployed build. (Matthew, 1h)`

`### Issue #60: Enemy generation (5h)`  
`- [ ] Draw more 8-bit sprites for two enemy types. (Matthew, 1.5h)`  
`- [ ] Create an Enemy class with HP, speed, damage, and sprite. (Matthew, 1.5h)`  
`- [ ] Design additional physical elements including props and hand-held objects. (Matthew, 1h)`  
`- [ ] Review code and test in the deployed build. (Jason, 1h)`

`### Issue #27: Casting spells (5h)`  
`- [ ] Pressing the cast key fires a spell in the direction the player is facing. (Luke, 1h)`  
`- [ ] Connect the main sprite's animation to the element chosen in #21. (Luke, 1h)`  
`- [ ] Add hit detection that lowers that enemy's HP. (Luke, 1.5h)`  
`- [ ] Add the cast key binding and list it in the in-game controls. (Luke, 0.5h)`  
`- [ ] Review code and test in the deployed build. (Jason, 1h)`

`### Issue #2: Tile map (6h)`  
`- [ ] Define the tile map data format. (Kevin, 0.5h)`  
`- [ ] Draw 8-bit floor, wall, and door tile sprites for the tile map and generated rooms. (Matthew, 1.5h)`  
`- [ ] Render a room from a tile map array. (Kevin, 1h)`  
`- [ ] Add wall collision to the existing player movement. (Kevin, 1.5h)`  
`- [ ] Write specs for wall collision. (Kevin, 0.5h)`  
`- [ ] Review code and test in the deployed build. (Luke, 1h)`

`### Issue #3a: Generate a dungeon floor (7h)`  
`- [ ] Generate non-overlapping room positions on the tile map. (Luke, 2.5h)`  
`- [ ] Place the player in the starting room. (Kevin, 1h)`  
`- [ ] Connect rooms with an exit/starting point. (Kevin, 2.5h)`  
`- [ ] Review code and test in the deployed build. (Matthew, 1h)`  
`---`  
`## 6. Work Distribution`  
`| Member | Stories owned | Points |`  
`|--------|---------------|--------|`  
`| Jason Waddell | #21 Starting element + #61 Starting stats| 3 |`  
`| Matthew Creighton | #60 Enemy generation | 3 |`  
`| Luke Bonnell | #6 Cast magic; #3a World gen (shared) | 3 + 1.5 |`  
`| Kevin Scafe | 	#2 Tile map; #3a World gen (shared) | 3 + 1.5 |`  
`*If the work is not balanced, explain why:*`  
`Points are slightly uneven because Luke and Kevin share #3a, but hours are balanced: everyone has between 7 and 7.5 hours. Jason and Matthew each own one story and balance it with code reviews (Jason reviews #60 and #6, Matthew reviews #21 and #3a), and Matthew draws the tiles for #2 since he did the Sprint 1 art. Luke and Kevin share world generation because they are the retro owners for it.`  
`---`  
`## 7. Stories Split or Deferred`  
`*Split:*`  
`#3 World generation was the main reason Sprint 1 fell short. This sprint we commit only #3a, generating connected rooms. Random seeds (#15), room variety, and travel between areas (#16) stay in the backlog.`

`*Deferred:*`  
`#12 XP and leveling waits until #21 is done. The remaining items (#8, #9, #16, #17, #18, #20, #25) stay in the backlog in priority order.`  
`---`  
`## 8. Retrospective Follow-Through`  
`| Action item | How it shows up in this sprint |`  
`|-------------|--------------------------------|`  
`| World Generation (Luke, Kevin) | 	#2 Tile map and #3a are committed and owned by Luke and Kevin. World gen is split into a smaller first slice so it can actually finish. |`  
`| More Enemies (Matthew) | A new enemy story is committed and owned by Matthew. |`  
`| Stats system (Jason) | #21 is committed and owned by Jason. The first task is the points/value table named in the retro. |`  
`| Retro observation: a PR waited more than a day for review | Every story has a named reviewer with an hour estimate, and we agreed to review PRs within 24 hours. |`  
`| Retro observation: divide work into smaller pieces | Every story is broken into tasks of roughly 2.5 hours or less, each with one owner. |`  
`| Root cause: unfamiliarity with p5.js | Luke and Kevin pair on #3a so they can work through p5.js together. |`  
`---`  
`## 9. Risks and Dependencies`  
`*Dependencies:*`  
`- The enemy story and #6 both need #21's stats object and takeDamage(). Jason does these tasks first, early in the sprint.`  
`- #6 hit detection needs the Enemy class to exist.`  
`- #3a depends on #2's tile map format, so Kevin defines the format early on.`

`*Risks:*`  
`- World generation caused last sprint's shortfall. If #3a slips, the demo still works in a single tile-map room from #2.`  
`- Our p5.js experience is limited. Working together on #3a is meant to reduce this.`  
`- Several stories touch the same player code, so merge conflicts are likely. Small PRs and consistently doing 24-hour reviews reduce this.`

`---`  
`## 10. Checklist`  
`- [x] Sprint goal written`  
`- [x] Every committed story meets the Definition of Ready`  
`- [x] Every story has an owner`  
`- [x] Board updated: committed stories in the sprint, tasks created`  
`- [x] Commitment compared to velocity`  
``- [x] Report committed to `scrum/planning/` via pull request``  
