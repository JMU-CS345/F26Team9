# Team Constitution

*This document records how our team works together on Mage Quest. Fill in every field. Replace the italic guidance with your team's decisions. Changes to this document go through a pull request like any other change.*

---

## 1. Team and Roles

### Team Number - 9

### Team Name - PassioGoers and ThonnyFans

_

### Members

| Name | GitHub username | Usual availability |
|------|----------------|-------------------|
| Matthew Creighton | mcrouton | Weekday nights |
| Kevin Scafe |  | Weekdays |
| Luke Bonnell | lukem570 | Weekday nights |
| Jason Waddell | adefender3 | Weekdays except for tuesday|

<br>

### Scrum Master

**Sprint 1 Scrum Master:** Kevin Scafe

**Does the role rotate?** *(e.g., rotates each sprint in the order listed above; or one person for the whole project)*

_

### Product Owner

*Choose one team member who will interact with the instructor (stakeholder) to clarify and prioritize stories, and to collect new ones.*

_

### Other Responsibilities

Who is responsible for maintaining the project board / backlog in good order? *(Scrum Master?)*

Who is responsible for deploying the main branch to production to update GitHub pages?

### Decision Making

*(How do we decide things: consensus, majority vote, Scrum Master decides? What happens if we are deadlocked?)*

_

---

## 2. Scrum Process

### Sprint Length and Dates

| Sprint | Start | End | Review / Retro date |
|--------|-------|-----|---------------------|
| 1 | 11/2 | 11/8 | 11/9 |
| 2 | 11/9 | 11/15 | 11/16 |
| 3 | 11/16 | 11/29 | 11/30 |
| 4 | 11/30 | 12/6 | 12/7 |
| 5 | 12/7 | presentation day | presentation day | 

### Meetings

| Meeting | When |
|---------|------|
| Daily standup | Wed/Fri |
| Sprint planning | Mon |
| Sprint review | Mon |
| Sprint retrospective | Mon |


_

### Definition of Ready

*A backlog item may be pulled into a sprint only when:*

- [ ] it is written as a user story
- [ ] it has acceptance criteria
- [ ] it has an estimate

### Definition of Done

*An item is done only when:*

- [ ] code is reviewed and approved by at least one teammate
- [ ] all tests pass in CI
- [ ] merged to `main`
- [ ] works in the deployed build
- [ ] the issue is closed
- [ ]

### Estimation

**Method:** *(story points, t-shirt sizes, hours)*

**Scale:** *(e.g., 1, 2, 3, 5, 8, 13)*

_

### Backlog and Board

**Where the backlog lives:** *(e.g., GitHub Projects board, link here)*

**Board columns:** *(e.g., To Do → In Progress → In Review → Done)*

_

---

## 3. Communication

### Primary Channel

**Channel:** Text

**Expected response time:** Within 6 hours

### What Goes Where

Schedule changes + notices go in text, work division goes in github comments.

_

### Reporting Blockers or Falling Behind

*(How and how early does a member tell the team they are stuck or behind?)*
As soon as possible
_

### Absences

*(How much notice is required? How is the absent member's work covered?)*
As soon as possible, absent work members should be assigned by the absent member.
_

---

## 4. Git and GitHub Workflow

### Branch Naming

**Format:** `type/issue-short-description`

**Allowed types:** `feature`, `fix`, `docs`, `refactor`, `test`, `chore`

**Examples:**

- `feature/15-implement-game-engine`
- `fix/22-resolve-merge-conflicts`

### Branch Protection on `main`

- [ ] No direct pushes to `main`
- [ ] Required approvals before merge: _
- [ ] CI must pass before merge
- [ ] Same protection on `production`

### Commit Messages

*(Format and style, e.g., imperative mood: "Add rune puzzle validation". Do we follow Conventional Commits?)*

_

### Pull Requests

**Maximum size:** 150 lines

**Description template:** *(e.g., What / Why / How to test / Screenshot)*

**Linking issues:** *(e.g., every PR includes `Closes #N`)*

_

### Code Review

**Review turnaround:** *(e.g., within 24 hours of being requested)*

**Who reviews what:** *(e.g., any teammate; or a rotating assignment)*

_

### Merging

**Merge style:** *(merge commit, squash and merge, or rebase and merge)*

**Who merges:** *(the author after approval, or the reviewer)*

**After merge:** *(e.g., delete the branch)*

_

---

## 5. Code Conventions

### Naming

| Kind | Convention | Example |
|------|------------|---------|
| Variables and functions | camelCase | `userName` |
| Classes | PascalCase | `GameControls` |
| Constants | UPPER_CASE | `MAX_HEALTH` |
| Files | Match class name | `GameControls.java` |
| Test files | Class name + Test | `GameControlsTest.java` |

### Formatting

**Indentation:** 4 spaces

**Semicolons:** always

**Quotes:** double

**Maximum line length: 100 characters

**Tools:** checkstyle

_

### Project Structure

*(Where does each kind of file live?)*

```
src/
  model/        (e.g., game logic, no p5 drawing calls)
  view/         (e.g., drawing code)
  controller/   (e.g., input handling)
assets/
spec/
```

### Architecture Rules

*(e.g., game logic never calls p5 drawing functions directly, so it can be unit tested)*

-
-

### Comments and Documentation

*(When are comments or JSDoc required?)*

_

### Assets

**File naming:** *(e.g., all lowercase, hyphens, no spaces)*

**Licensing and attribution:** *(Where do we record the source and license of art, sound, and fonts we did not make?)*

_

---

## 6. Testing and Quality

**Test framework:** Jasmine

**Where tests live:** _

**What must have tests:** *(e.g., all model code; every bug fix gets a test that reproduces it; combat and puzzle rules)*

_

**Coverage expectations:** 90+%

**Continuous integration:** *(What does GitHub Actions run on each PR?)*

_

**Rule for failing CI:** *(e.g., nothing merges while CI is red)*

_

**Manual playtesting:** *(Who plays the build before each sprint review, and how are bugs reported?)*

_

---

## 7. Deployment

**Where the game is deployed:** GitHub Pages, URL here

**What triggers a deploy:** *(e.g., a release PR from `main` into `production`, opened by the Scrum Master after each sprint review)*

**Who checks the deployed build, and when:** _

---

## 8. AI Tool Usage

**Allowed tools:** ChatGPT, CoPiliot under honor code restrictions.

**Allowed uses:** Review, Tests

_

**Not allowed:** Code Generation

**Disclosure:** GitHub Comments.

_

**Responsibility:** *(e.g., whoever submits AI-generated code must understand it and is accountable for it)*

_

---

## 9. Working Agreements and Conflict

### Expected Effort

*(Hours per person per week.)*
6 hrs per week.
_

### Fair Contribution

*(What counts as contributing, and how is it tracked? e.g., PRs merged, reviews done, story points completed.)*
Contributors should let other group members know when their task is completed.
_

### Conflict Resolution

*(What steps do we follow when there is a disagreement or a problem with a teammate?)*

1. *(e.g., talk to the person directly)*
2. *(e.g., raise it at the retrospective)*
3. *(e.g., Scrum Master mediates)*
4. *(e.g., escalate to the instructor)*

### Missed Commitments

*(What happens when a member repeatedly misses commitments?)*
Report to stakeholder.
_

### Amending This Constitution

*(How can this document be changed? e.g., proposed by PR, approved by team vote at a retrospective.)*
Changed when everyone agrees on change.
_

---

## 10. Sign-Off

*By signing, each member agrees to follow this constitution.*

| GitHub name | Signature (type your name) | Date |
|------|----------------------------|------|
|      |                            |      |
|      |                            |      |
|      |                            |      |
|      |                            |      |
