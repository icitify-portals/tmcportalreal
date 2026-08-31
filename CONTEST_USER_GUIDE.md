# Contest Module — Admin User Guide

> The **Contests Live** module runs real-time competitions across the whole organisation — **Quran recitation, Debate, Written exams** and more — with jurisdiction-by-jurisdiction participation, a live calling queue, judge grading, phased advancement all the way to a national final, and optional payment (with early-bird pricing).

This guide is written for **Admins / Coordinators**. It is separate from the **Forms/Applications** module (Spelling Bee etc.) — that one is untouched.

---

## 1. What the feature does (in plain English)

A contest is a staged competition. It works like this:

```
Create (Draft) → Open → Jurisdictions submit representatives (+ pay if required)
     → Generate Timetable (builds the calling queue)
     → Live Session (Umpire calls participants → each performs in a video room → Judges score)
     → Compute Results (rank + auto-promote top finishers to the next phase)
     → Next Phase (e.g. Branch → LGA → State → National) → ... → Final Winner
```

Written contests replace the video stage with a timed answer editor.

---

## 2. Getting started

### Where to find it
From the **left sidebar** (admin role), open **"Contests Live"** (trophy icon). You'll land on the **Contest Dashboard**.

### First things you'll see
- A **New Contest** button (top right).
- A grid of all contests with `Category`, `Level`, `Status`, `Year`, `Format`.
- Each card has **Manage** (admin controls) and **Public** (the public-facing page).

---

## 3. Creating a contest

1. Click **New Contest**.
2. Fill in:
   - **Title** — e.g. `National Quran Recitation Competition 2026`
   - **Description** — what it's about.
   - **Category** — Quran, Debate, Written, Other.
   - **Format** — Physical, Virtual, Hybrid.
   - **Year** and **Level** — which level hosts it (Branch, LGA, State, National).
   - **Payment Required?** — tick if entrants pay a fee.
     - **Amount** (e.g. `20000`)
     - **Early Bird Amount** (e.g. `15000`)
     - **Early Bird Deadline** (e.g. `2026-09-30`)
     - Anyone registering before the deadline pays the lower early-bird price, which is **locked** even if the fee later goes up.
3. Click **Create Contest**.

> The contest is saved as a **Draft** — it is *not* public yet. The system automatically creates the **phases** (rounds) from your schedule. If you didn't add a repeating schedule, it creates one **Preliminary** phase that you can edit later.

---

## 4. Opening the contest to jurisdictions

On the contest's **Manage** page, click the button to **Open** it.

Once open:
- It appears on the public page **Contests Live**.
- Participating jurisdictions receive a notification `Contest Open [LEVEL]`, prompting them to submit representatives.

---

## 5. Jurisdictions submit representatives

When open, a jurisdiction goes to the public contest page → **Submit Representatives** → types each participant name (one per line) → **Submit**.

- If a fee is required, they're sent to **Paystack** to pay. Early-bird price is applied & locked if before the deadline.
- Each representative is saved with `REGISTERED` status and a payment status.

> As the admin you can also submit on their behalf from the Manage page, but normally each jurisdiction does it themselves.

---

## 6. Managing phases & the timetable

On the contest **Manage** page, you'll see a list of **Phases** (e.g. `1. Preliminary`, `2. Semi Final`, `3. Final`). Each phase has **Manage** and **Live** buttons.

Click **Manage** on a phase → the **Phase Control** page opens. From here:

- **Generate Timetable** — places every registered representative into the **call queue** in order and gives each a 5-minute time slot. Press it once after representatives are in.
- **Open Live Session** — takes you to the live board.
- The page also shows the current queue and a short "flow" reminder.

> Regenerate the timetable if you add/remove representatives — it rebuilds the queue and slots cleanly.

---

## 7. Running the live session (the core)

Click **Open Live Session** (or **Live** on a phase). You land on the **Live Board**, which has three areas:

### 7.1 Call Queue (left)
- Lists every participant in order with status (`QUEUED`, `CALLED`, `GRADING`, `COMPLETED`).
- **Refresh** reloads the queue.
- **Call Next** brings the next `QUEUED` participant onto the stage.

### 7.2 Live Room (center)
- When a participant is **Call Next**-ed, the system creates a **virtual video room** (LiveKit).
- The participant joins it and performs (recitation / debate).
- The room has a **Data Saver Mode** toggle to reduce bandwidth.

### 7.3 Score Card (below the room)
- The judge scores the current participant using **sliders** — criteria depend on the category:
  - **Quran**: Tajweed, Hifz/Accuracy, Fluency & Makhraj, Presence & Adab.
  - **Debate**: Content & Argument, Delivery & Voice, Rebuttal, Etiquette.
  - **Written**: Content Depth, Structure, Language & Clarity.
- **Total** updates live. Add an optional **comment**, then **Submit Score**.
- Once graded, the call is marked `GRADING`; click **Complete** to finish that participant and move on.

> The participant's own view shows "You're on stage — join the room" and their own score card, so a contestant can also self-grade if you want that mode.

---

## 8. Written contests

If the contest category is **Written**, the live page becomes a **timed editor** instead of a video room:
- The prompt/description is shown.
- A **countdown timer** (default 30 minutes, adjustable).
- The participant types their answer in the rich-text editor.
- When time runs out it **auto-submits**; or they submit manually.
- The answer is stored with the text + HTML + time spent.

---

## 9. Computing results & promotion

On the **Results Panel** (bottom of the live or phase-manage page):

1. Click **Compute / Auto-Promote**.
2. The system:
   - Averages every judge's score per participant.
   - Ranks them (1st, 2nd, 3rd … with medals shown).
   - Marks the **top 3** as **PROMOTED**.
   - **Automatically adds** those promoted participants into the **next phase** (e.g. Branch winners → LGA phase).
3. Repeat for each phase until a final winner is decided.

### Announcing results
Click **Announce** — it copies a shareable results link (and uses the device share sheet on supported browsers). You can also post the link organisation-wide via the **Broadcasts** module for a wide announcement. Certificates (for winners) reuse the standard TMC certificate generator.

---

## 10. Payment configuration (if you charge a fee)

When you tick **Payment Required** on creation:
- The fee is charged per representative via **Paystack** when they register.
- The organisation's **Paystack subaccount** (set in Settings) routes the money.
- **Early Bird**: cheaper price before the deadline, then locked at the lower amount for those who registered early.
- Payments are recorded in the **Payments** module as `CONTEST_FEE` and appear in **Finance** as an inflow.

> You can also allow **installments** if ticked, with a minimum installment amount.

---

## 11. Common tasks cheat-sheet

| I want to… | Do this |
| :--- | :--- |
| Make a public contest live | Create → Open |
| Let a state submit its people | Contest open → they use **Submit Representatives** |
| Set up the order of performance | **Generate Timetable** on the phase |
| Call the next participant | Live Session → **Call Next** |
| Grade a performance | Score Card sliders → **Submit Score** |
| Decide winners | **Compute / Auto-Promote** |
| Tell everyone the result | **Announce** or send a **Broadcast** |
| Charge a fee with early-bird | Tick **Payment Required** + set amount & deadline |

---

## 12. Troubleshooting

- **"Contest not open" when submitting** — the contest is still `DRAFT`/`CLOSED`; **Open** it first.
- **Nobody in the queue** — you haven't added representatives or haven't run **Generate Timetable**.
- **Room shows "Participant has not been called"** — the participant must be `CALLED` (via **Call Next**) before the room opens.
- **No Payment option shown** — the contest wasn't created with **Payment Required**; edit the contest (or create a new one).
- **Results show empty** — grade all `CALLED` participants first, then **Compute**.

---

*TMC Portal • Contests Live module. Questions? Reach the national technical team.*
