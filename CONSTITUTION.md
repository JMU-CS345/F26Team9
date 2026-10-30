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
| Kevin Scafe | KevinScafe  | Weekdays |
| Luke Bonnell | lukem570 | Weekday nights |
| Jason Waddell | adefender3 | Weekdays except for tuesday|

<br>

### Scrum Master

**Sprint 1 Scrum Master:** Kevin Scafe

**Does the role rotate?** Rotates whenever current Scrum Master is overwhelmed.

_

### Product Owner

Matthew Creighton

### Other Responsibilities

Who is responsible for maintaining the project board / backlog in good order? Jason Waddell

Who is responsible for deploying the main branch to production to update GitHub pages? Luke

### Decision Making

Consensus Vote

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

**Method:** Story Points

**Scale:** Fibonacci (1, 2, 3, 5, 8, 13)

_

### Backlog and Board

**Where the backlog lives:** Project Board on Github

**Board columns:** Backlog, To Do, In Progress, Review, Done


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
Use imperative mood and concise descriptions (e.g., Add rune puzzle validation, Fix player movement bug). Follow the Conventional Commits format:

_

### Pull Requests

**Maximum size:** 150 lines

**Description template:**
- What changed?
- Why was this change made?
- How was it tested?
- Screenshots (if UI changes are included)

**Linking issues:** Every pull request must link its related issue using Closes #N or Fixes #N.

_

### Code Review

**Review turnaround:** Within 24 hours of a review request whenever possible. Team members should respond within 48 hours at the latest.

**Who reviews what:** Any teammate may review a pull request, but a pull request must receive approval from at least one teammate other than the author before it can be merged.

_

### Merging

**Merge style:** Squash and merge

**Who merges:** The pull request author may merge after receiving at least one approval and passing all CI checks.

**After merge:** Delete the feature branch and close any associated issues.

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

**Maximum line length:** 100 characters

**Tools:** checkstyle

_

### Project Structure
```
src/
  model/        (e.g., game logic, no p5 drawing calls)
  view/         (e.g., drawing code)
  controller/   (e.g., input handling)
assets/
spec/
```

### Architecture Rules
- Model classes must not depend on UI or view classes.
- Controllers handle user input and coordinate communication between models and views.

### Comments and Documentation
Javadoc is required for all public classes and public methods. Comments are required for complex logic, algorithms, and non-obvious design decisions.

### Assets

**File naming:** All lowercase, use hyphens between words, no spaces

**Licensing and attribution:** Record the source URL, creator, and license information in ASSETS.md at the root of the repository.

---

## 6. Testing and Quality

**Test framework:** Jasmine

**Where tests live:** spec/

**What must have tests:**
- All model classes and game logic.
- New features must include corresponding tests.
- Every bug fix must include a test that reproduces the original bug.
- Core game rules, scoring logic, and data validation must be tested.

**Coverage expectations:** 90+%

**Continuous integration:** GitHub Actions runs all Jasmine tests, verifies that the project builds successfully, and checks code style on every pull request. Pull requests must pass all checks before being merged.

_

**Rule for failing CI:** No pull request may be merged while any CI check is failing. The developer who introduced the failure is responsible for fixing it.

_

**Manual playtesting:** Anyone

_

---

## 7. Deployment

**Where the game is deployed:** https://jmu-cs345.github.io/F26Team9/

**What triggers a deploy:** A release PR from `main` into `production`, opened by the Scrum Master after each sprint review

**Who checks the deployed build, and when:** Everyone whenever a new build is deployed (whenever they can).

---

## 8. AI Tool Usage

**Allowed tools:** ChatGPT, CoPiliot under honor code restrictions.

**Allowed uses:** Review, Tests

_

**Not allowed:** Code Generation

**Disclosure:** GitHub Comments.

_

**Responsibility:** Whoever submits AI-generated code must understand it and is accountable for it

_

---

## 9. Working Agreements and Conflict

### Expected Effort

*(Hours per person per week.)*
6 hrs per week.
_

### Fair Contribution
Contributors should let other group members know when their task is completed.
_

### Conflict Resolution
Steps to follow:
1. talk to the person directly
2. raise it at the retrospective
3. Scrum Master mediates
4. escalate to the instructor

### Missed Commitments
Repeatedly missed commitments may be reported to the stakeholder and instructor.
_

### Amending This Constitution
This constitution may be changed only with unanimous agreement from all team members.
_

---

## 10. Sign-Off
By signing, each member agrees to follow this constitution.
| GitHub name | Signature (type your name) | Date |
|------|----------------------------|------|
|adefender3|Jason Waddell|10/28/2026|
|mcrouton|Matthew Creighton|10/28/2026|
|KevinScafe|Kevin Scafe|10/28/2026|
|lukem570|Luke Bonnell|10/28/2026|
