# Sprint Retrospective Report: Sprint 2

---

## 1. Meeting Details
**Date:** 11/18/2026
**Facilitator:** Matthew Creighton
**Attendees:** Jason Waddell, Luke Bonnell, Kevin Scafe
**Absent:** N/A

---

## 2. Last Sprint's Action Items

| Action item | Owner | Done? | Did it help? |
|-------------|-------|-------|--------------|
| World Generation (measure: successful world creation) | Luke Bonnell, Kevin Scafe | Yes. #2 "Render a dungeon room as tiles" and #3a "Generate a dungeon floor" are both done. | Yes. In Sprint 1, world generation was the main reason we fell short. This sprint, splitting #3 into a smaller first slice and pairing on it got it finished, and the measure (a generated world) was met. |
| More Enemies (measure: more enemies are present) | Matthew Creighton | Partially. #60 "Basic Enemy Generation" is done but #4 "Basic enemy that can be defeated" is not and will be moved to Sprint 3. | Yes. No backlog item covered enemies before. The new story delivered the combat the stakeholder asked for. |
| Stats system (measure: a points/value table) | Jason Waddell | Yes. The value table was the first task of #21. #21 and #61 "Player Stats" are done. | Yes. Building the stats object and takeDamage() first let the stories that depended on them (#60 enemies and the spells in #4/#27) finish on time. |
| Review PRs within 24 hours (from the Sprint 1 observation) | Whole team | No. A PR again waited more than a day for approval (PR #77). | No. It was only a verbal agreement made in planning, so nothing enforced it. See sections 5 and 7. |
| Break work into tasks of 2.5 hours or less | Whole team | Yes. Every story was split into owned tasks of 2.5 hours or less. | We completed 12 of 15 committed points, compared with 15 of 28 in Sprint 1. |

---

## 3. The Sprint in Numbers

**Points committed / completed:** 12 / 15
**PRs merged:** 21
**CI runs failed / total:** 0 / 19
**Stories carried over:** 0

---

## 4. Observations

### What went well
- **(Jason)** We finished comparably more points in this sprint than in last sprint.
- **(Kevin)** World generation is finally done after not getting finished in Sprint 1. Breaking it into two smaller pieces, the tile map (#2) and the generated floor (#3a), and having Luke and me work on it together is what got it done.
- **(Matthew)** Almost everything we promised for the sprint goal works. A player can pick an element, walk around a generated dungeon floor, (almost) fight enemies with spells and see their HP change on screen.
- **(Jason)** Building the player stats first (#21 and #61) was a good call. Enemies and spells both needed stats to work, so having them done early meant nobody got stuck waiting.
- **(Luke)** Once GitHub was back up, our automatic tests on GitHub didn't fail once. All 19 runs passed this sprint.

### What did not go well
- **(Kevin)** GitHub went down for a day or two, so Jasmine (the automatic tests that run on every pull request) couldn't run. Because of that, the Sprint 2 planning report and other pull requests couldn't be merged on time. This was outside our control.
- **(Matthew)** A PR waited more than a day for approval (PR #77), even though we agreed in Sprint 2 planning to review within 24 hours. This is the second sprint in a row we've had this problem.

### What puzzled us or what we want to try
- **(Luke)** It's hard to keep up with how everything comes together. Five stories touched the same player code (stats, enemies, spells, tile map, generation), and each of us mostly sees our own part until the demo.

---

## 5. Root Cause

**Problem:** PRs wait more than a day for approval. It happened in Sprint 1 and again in Sprint 2.
**Why?** The reviewer didn't get to the PR within a day of it being opened.
**Why?** Nothing tells a reviewer that a PR is waiting on them. No reviewer is requested on GitHub, and there's no message in the team chat, so we only see PRs when we happen to check.
**Why didn't the 24-hour agreement fix it?** It was a verbal agreement in the Sprint 2 planning notes, not a team rule, and nobody tracked whether we kept it.
**Root cause:** Our review expectation depends on memory. It isn't written into the constitution or built into how we open PRs. We can change that by adding the rule to the constitution and requesting a reviewer whenever a PR is opened.

---

## 6. Action Items for Next Sprint

| Action item | Owner | How we will know it worked |
|-------------|-------|----------------------------|
| Make the 24-hour review a constitution rule (section 7). Whoever opens a PR requests a reviewer on GitHub and posts the link in the team chat. | Matthew Creighton | Zero PRs wait more than 24 hours for their first review in Sprint 3, checked from the PR timestamps on GitHub at the next retro. |
| On day 3 of Sprint 3, hold a 10-minute integration walkthrough: everyone pulls main and plays the deployed build, and each person shows what they merged. | Jason Waddell | The walkthrough happens (notes posted in the team chat), and at the Sprint 3 retro no one reports being surprised by how the pieces fit together. |

These two items will be added to the Sprint 3 board and the Sprint 3 planning report.

---

## 7. Constitution Changes

**Proposed change:** Add a review rule to CONSTITUTION.md: *"Whoever opens a pull request requests a reviewer on GitHub and posts the link in the team chat. The reviewer gives a first review within 24 hours. If they can't, they say so in the chat so another member can take it."*
**Pull request:** PR #53
**If no change is needed, why not?** N/A. We agreed on 24-hour reviews in Sprint 2 planning, but only verbally, and a PR still waited more than a day. Making it a constitution rule gives us something written we can hold each other to.

---

## 8. Checklist
- [x] Every member contributed observations
- [x] Last sprint's action items reviewed
- [x] A root cause identified
- [x] Action items have owners and success measures
- [x] Action items added to the board or next planning report
- [x] Constitution change proposed through a pull request, or the reason none is needed explained
- [x] Report committed to `scrum/retrospective/` via pull request by 11:59 p.m. on the day of the retrospective
