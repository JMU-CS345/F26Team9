# Sprint Review Report: Sprint _

*Copy this file into `scrum/review/` using your team's naming format. Fill in every field. Replace the italic guidance with your team's information. Due by 11:59 p.m. on the day of the review.*

---

## 1. Meeting Details

**Date:** 11/9/2026

**Scrum Master:** Luke B

**Attendees:** Luke, Jason, Matthew

**Absent:** Kevin

**Presenter:** Jason W

**Deployed build reviewed:** jmu-cs345.github.io/F26Team9/

**Release PR into `production`:** *(link; merge it before the review begins)*

---

## 2. Sprint Goal

*Tell the stakeholder whether the sprint delivered what it set out to.*

**The goal we set:** Create a good baseline for the game by creating good graphical design and player movement.

**Did we meet it?** *(Partly), and one sentence explaining why)*
The goal was mostly met, but we feel we failed in the world gen, which would've set a better baseline for the game.
_

---

## 3. Committed Items: Done or Not Done

*Done means the item meets every point of your Definition of Done, including "works in the deployed build." There is no "mostly done."*

*The presenter credits the members who built each story during the demo.*

| Issue # | User story | Estimate | Owner | Done? | Built by |
|---------|------------|----------|-------|-------|----------|
|    #1     |   Player Icon Movement         |   2 hours       |    Kevin   |    Yes   |      Kevin     |
|     #14    |     Keyboard Controls       |    2 hours      |   Kevin    |   Yes    |    Kevin       |
|     #22   |     8 bit art       |     2 hours     |   Matthew    |   Yes    |     Matthew      |
|         |            |          |     |      |           |

---

## 4. Metrics

| | Points |
|---|---|
| Committed | 28 |
| Completed | 15|
| Completion rate | 54% |

**Velocity history:**

| Sprint | Committed | Completed |
|--------|-----------|-----------|
| 1      |   28        |     15      |
| 2      |           |           |
| 3      |           |           |
| 4      |           |           |

**Burndown or board snapshot:** *(Attach a screenshot or link)*

**What explains the difference between committed and completed?** _

The lack of progress on world gen made up for the bulk of incomplete committed points.

## 5. Demo

*For each completed story, list the acceptance criteria and show that each one passed in the deployed build.*

*Presenter: be ready to explain and answer questions about every completed story, including work you didn't build.*

### Issue #1: *Player icon movement*

- [x] *Icon is visible on screen.*
- [x] *Icon moves up/down/left/right on key press.*
- [x] *Icon cannot leave the screen.*

### Issue #14: *Keyboard-only controls*

- [x] *All menus are navigable by keyboard.*
- [x] *All gameplay actions have key bindings.*
- [x] *Keys are listed somewhere in game.*

### Issue #18: *8-bit sprite art*

- [x] *Sprites replace placeholder shapes.*
- [x] *Art style is consistent across screens.*

---

## 6. Incomplete Work

*What happens to each item that is not done? Return it to the backlog and re-estimate it, even if the estimate stays the same. (Sprint 4: write "n/a")*

| Issue # | What remains | New estimate | Back in backlog? |
|---------|--------------|--------------|------------------|
|    #3     |    World gen          |     5 hours         | Yes |
|     #2   |         Tile map     |      3 hours        | Yes              |

---

## 7. Stakeholder Feedback

*Record what the instructor said: what they liked, what should change, and any new priorities. (Sprint 4: write "n/a")*

The stakeholder liked the lighting and thought the game was very pretty, but recommended prioritizing player statistics and enemies/combat.

---

## 8. Backlog Changes

*How did the backlog change in response to the feedback? (Sprint 4: write "n/a")*

**New stories added:** None

**Priorities changed:** World gen -> stats and combat

**Stories removed:** None

**If no change was needed, why not?** 

No stories changed/added because the priorities were the main thing changed.

## 9. Quality

*Give the stakeholder an honest picture of the build's quality.*

**CI status on `production`:** *Passing*

**Number of specs:** 3

**Known bugs in the deployed build:** N/A


## 10. Checklist

- [x] Demo given from the deployed GitHub Pages build
- [x] Demo given by one presenter, crediting the members who built each story
- [x] Release PR merged before the review begins
- [x] Every committed item marked Done or Not Done
- [x] Every item marked Done has all its acceptance criteria checked in section 5
- [x] Metrics filled in, with the committed/completed difference explained
- [x] Stakeholder feedback recorded (Sprint 4: n/a)
- [x] Backlog updated, or the reason no change was needed explained (Sprint 4: n/a)
- [x] Report committed to `scrum/review/` via pull request by 11:59 p.m. on the day of the review


