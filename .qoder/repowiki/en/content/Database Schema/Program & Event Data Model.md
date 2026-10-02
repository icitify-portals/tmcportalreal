# Program & Event Data Model

<cite>
**Referenced Files in This Document**
- [0008_contests.sql](file://drizzle/0008_contests.sql)
- [0010_contest_quiz.sql](file://drizzle/0010_contest_quiz.sql)
- [0012_programme_recurrence.sql](file://drizzle/0012_programme_recurrence.sql)
- [0011_bulk_registration.sql](file://drizzle/0011_bulk_registration.sql)
- [schema.prisma](file://prisma/schema.prisma)
- [programmes.ts](file://lib/actions/programmes.ts)
- [certificate route.ts](file://app/api/programmes/registrations/[id]/certificate/route.ts)
- [quiz page.tsx](file://app/dashboard/contests/[id]/phases/[phaseId]/quiz/page.tsx)
- [quiz leaderboard.tsx](file://components/contests-live/quiz/quiz-leaderboard.tsx)
- [programme materials download.tsx](file://components/programme/programme-materials-download.tsx)
- [programme analytics page.tsx](file://app/dashboard/admin/programmes/[id]/analytics/page.tsx)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion

## Introduction
This document explains the program and event data model with a focus on:
- Programme scheduling, formats, frequencies, and recurrence patterns
- Registration management including participant tracking, attendance recording, and certificate generation
- Contest and competition structures covering phases, scoring, and leaderboards
- Quiz functionality for question management, real-time scoring, and result aggregation
- Programme materials management, resource allocation, and capacity planning
- Programme analytics, participation metrics, and reporting capabilities

## Project Structure
The system is organized around database migrations that define core tables for programmes, registrations, contests, phases, quizzes, and related entities. Server actions implement business logic (registration, attendance, materials), while API routes generate certificates and pages orchestrate quiz flows and analytics.

```mermaid
graph TB
subgraph "Programmes"
P["programmes"]
PR["programme_registrations"]
PM["programme_materials"]
end
subgraph "Contests"
CE["contest_events"]
CP["contest_phases"]
CR["contest_representatives"]
CS["contest_scores"]
CJ["contest_results"]
CW["contest_written"]
end
subgraph "Quizzes"
CQ["contest_quizzes"]
CQQ["contest_quiz_questions"]
CQO["contest_quiz_options"]
CQA["contest_quiz_attempts"]
CQAn["contest_quiz_answers"]
end
P --> PR
P --> PM
CE --> CP
CP --> CR
CR --> CS
CR --> CJ
CP --> CW
CP --> CQ
CQ --> CQQ
CQQ --> CQO
CQ --> CQA
CQA --> CQAn
```

**Diagram sources**
- [0008_contests.sql:4-141](file://drizzle/0008_contests.sql#L4-L141)
- [0010_contest_quiz.sql:2-73](file://drizzle/0010_contest_quiz.sql#L2-L73)
- [0012_programme_recurrence.sql:1-5](file://drizzle/0012_programme_recurrence.sql#L1-L5)
- [0011_bulk_registration.sql:1-36](file://drizzle/0011_bulk_registration.sql#L1-L36)

**Section sources**
- [0008_contests.sql:4-141](file://drizzle/0008_contests.sql#L4-L141)
- [0010_contest_quiz.sql:2-73](file://drizzle/0010_contest_quiz.sql#L2-L73)
- [0012_programme_recurrence.sql:1-5](file://drizzle/0012_programme_recurrence.sql#L1-L5)
- [0011_bulk_registration.sql:1-36](file://drizzle/0011_bulk_registration.sql#L1-L36)

## Core Components
- Programme scheduling and recurrence: supports formats (PHYSICAL, VIRTUAL, HYBRID), frequencies (WEEKLY, MONTHLY, QUARTERLY, BI-ANNUALLY, ANNUALLY, ONCE, CUSTOM), and RRule-based recurrence with weekday-based monthly options.
- Registrations and attendance: tracks participants, payment status, check-in/out windows, bulk registration groups, and claim tokens.
- Certificates: generates PDFs for attended participants with configurable templates and partner branding.
- Contests and phases: organizes multi-level competitions with representative management, timetables, calls, scoring, results, and written submissions.
- Quizzes: supports LIVE_SYNC_RACE and ASYNC_STANDARD modes with questions, options, attempts, answers, and leaderboards.
- Materials and resources: associates downloadable materials with programmes; supports admin upload and attendee access.
- Analytics: aggregates participation metrics, attendance timing, and feedback sentiment for evaluation.

**Section sources**
- [programmes.ts:33-97](file://lib/actions/programmes.ts#L33-L97)
- [certificate route.ts:49-72](file://app/api/programmes/registrations/[id]/certificate/route.ts#L49-L72)
- [0008_contests.sql:32-141](file://drizzle/0008_contests.sql#L32-L141)
- [0010_contest_quiz.sql:2-73](file://drizzle/0010_contest_quiz.sql#L2-L73)
- [programme analytics page.tsx:11-25](file://app/dashboard/admin/programmes/[id]/analytics/page.tsx#L11-L25)

## Architecture Overview
High-level flow across modules:
- Programmes are created with scheduling and recurrence rules; attendees register and pay; attendance is recorded within configured windows; certificates are generated post-attendance.
- Contests are structured into phases; representatives are registered per phase; live or async quizzes run per phase with attempts and answers; scores feed leaderboards and results.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Prog as "Programmes"
participant Reg as "Registrations"
participant Att as "Attendance"
participant Cert as "Certificate API"
Admin->>Prog : Create programme (format, frequency, recurrence)
Admin->>Reg : Register participant(s)
Reg-->>Admin : Payment link / bulk claim links
Admin->>Att : Scan QR / self-checkin (time window)
Att-->>Reg : Update status ATTENDED
Admin->>Cert : Generate PDF for attended
Cert-->>Admin : Downloadable certificate
```

**Diagram sources**
- [programmes.ts:33-97](file://lib/actions/programmes.ts#L33-L97)
- [certificate route.ts:49-72](file://app/api/programmes/registrations/[id]/certificate/route.ts#L49-L72)

## Detailed Component Analysis

### Programme Scheduling and Recurrence
- Formats: PHYSICAL, VIRTUAL, HYBRID
- Frequencies: WEEKLY, MONTHLY, QUARTERLY, BI-ANNUALLY, ANNUALLY, ONCE, CUSTOM
- Recurrence: RRule-based generation with BY_DATE and BY_DAY_OF_WEEK; supports weekDay and weekOrdinal for weekday-based monthly recurrences.

```mermaid
flowchart TD
Start(["Create Programme"]) --> Fmt{"Format?"}
Fmt --> |PHYSICAL/VIRTUAL/HYBRID| SetDates["Set start/end dates"]
SetDates --> Freq{"Frequency?"}
Freq --> |ONCE| Save["Save instance"]
Freq --> |WEEKLY/MONTHLY/QUARTERLY/BI-ANNUALLY/ANNUALLY| GenRRule["Generate instances via RRule"]
Freq --> |CUSTOM| UseRRule["Use provided rruleString"]
GenRRule --> Save
UseRRule --> Save
Save --> End(["Instances Ready"])
```

**Diagram sources**
- [0012_programme_recurrence.sql:1-5](file://drizzle/0012_programme_recurrence.sql#L1-L5)
- [programmes.ts:589-641](file://lib/actions/programmes.ts#L589-L641)

**Section sources**
- [0012_programme_recurrence.sql:1-5](file://drizzle/0012_programme_recurrence.sql#L1-L5)
- [programmes.ts:589-641](file://lib/actions/programmes.ts#L589-L641)

### Registration Management and Attendance
- Participant tracking: stores name, email, phone, user/member IDs, payment reference, and status transitions (REGISTERED, PAID, ATTENDED, CANCELLED).
- Bulk registration: groups with paymaster details, per-attendee amounts, total amount, currency, and claim tokens to distribute individual registrations.
- Attendance: enforces time windows before start and after end; toggles check-in/check-out; requires paid status; supports static/dynamic tokens.

```mermaid
sequenceDiagram
participant User as "Participant"
participant Reg as "Registration"
participant Att as "Attendance"
participant DB as "Database"
User->>Reg : Submit registration (pay if required)
Reg->>DB : Insert record (status REGISTERED/PENDING_PAYMENT)
User->>Att : Scan QR / Self-checkin
Att->>DB : Validate time window and payment
Att->>DB : Set checkInTime, status=ATTENDED
Att-->>User : Success / Error
```

**Diagram sources**
- [programmes.ts:33-97](file://lib/actions/programmes.ts#L33-L97)
- [0011_bulk_registration.sql:1-36](file://drizzle/0011_bulk_registration.sql#L1-L36)

**Section sources**
- [programmes.ts:33-97](file://lib/actions/programmes.ts#L33-L97)
- [0011_bulk_registration.sql:1-36](file://drizzle/0011_bulk_registration.sql#L1-L36)

### Certificate Generation
- Only available for attended participants.
- Supports TMC_ONLY, PARTNER_ONLY, and BOTH templates with logos and signatures.
- Generates PDF with borders, watermark, and dynamic content (name, programme title, date).

```mermaid
sequenceDiagram
participant Admin as "Admin/User"
participant API as "Certificate API"
participant DB as "Database"
participant PDF as "PDF Generator"
Admin->>API : GET /api/programmes/registrations/{id}/certificate
API->>DB : Fetch registration + programme + organization
API->>API : Validate status == ATTENDED
API->>PDF : Build PDF with template, logos, signatures
PDF-->>API : Buffer
API-->>Admin : PDF download
```

**Diagram sources**
- [certificate route.ts:49-72](file://app/api/programmes/registrations/[id]/certificate/route.ts#L49-L72)
- [certificate route.ts:74-254](file://app/api/programmes/registrations/[id]/certificate/route.ts#L74-L254)

**Section sources**
- [certificate route.ts:49-72](file://app/api/programmes/registrations/[id]/certificate/route.ts#L49-L72)
- [certificate route.ts:74-254](file://app/api/programmes/registrations/[id]/certificate/route.ts#L74-L254)

### Contest and Competition Structures
- Events: category (QURAN, DEBATE, WRITTEN, OTHER), format (PHYSICAL, VIRTUAL, HYBRID), level (NATIONAL, STATE, LOCAL_GOVERNMENT, BRANCH), status lifecycle (DRAFT, OPEN, ONGOING, CLOSED, COMPLETED).
- Phases: PRELIM, SEMI, FINAL with scheduled times and venue.
- Representatives: per-phase participant records with status and payment fields.
- Timetable and Calls: slot scheduling and queue management for live sessions.
- Scoring and Results: judge criteria JSON, totals, averages, ranks, promotion flags.
- Written submissions: prompts, answers (JSON/HTML/plain text), timestamps, duration.

```mermaid
classDiagram
class ContestEvent {
+string id
+string title
+string category
+string format
+int year
+string level
+string status
}
class ContestPhase {
+string id
+string contestId
+int phaseNo
+string type
+string level
+datetime startAt
+datetime endAt
+string status
}
class ContestRepresentative {
+string id
+string contestId
+string phaseId
+string participantName
+string status
+decimal lockedAmount
+string paymentStatus
}
class ContestScores {
+string id
+string callId
+string judgeId
+json criteria
+int total
}
class ContestResults {
+string id
+string phaseId
+string participantId
+int totalScore
+decimal avgScore
+int rank
+boolean promoted
}
ContestEvent "1" --> "*" ContestPhase : "has"
ContestPhase "1" --> "*" ContestRepresentative : "has"
ContestRepresentative "1" --> "*" ContestScores : "receives"
ContestRepresentative "1" --> "1" ContestResults : "produces"
```

**Diagram sources**
- [0008_contests.sql:4-141](file://drizzle/0008_contests.sql#L4-L141)

**Section sources**
- [0008_contests.sql:4-141](file://drizzle/0008_contests.sql#L4-L141)

### Quiz Functionality
- Modes: LIVE_SYNC_RACE (speed-based correct-first) and ASYNC_STANDARD (score-based).
- Questions and options: multiple-choice with points and explanations.
- Attempts and answers: track per-participant attempts, correctness, points earned, and timing.
- Leaderboard: refreshes periodically to show rankings by mode rules.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Phase as "Phase Page"
participant Quiz as "Quiz Builder"
participant Player as "Participant"
participant LB as "Leaderboard"
Admin->>Quiz : Create quiz (mode, duration, window)
Quiz->>Phase : Publish quiz for phase
Player->>Phase : Take quiz (questions, lock-in)
Phase->>Quiz : Record attempt + answer
Quiz-->>LB : Update ranking (correct count, time)
LB-->>Player : Live standings
```

**Diagram sources**
- [0010_contest_quiz.sql:2-73](file://drizzle/0010_contest_quiz.sql#L2-L73)
- [quiz page.tsx:17-29](file://app/dashboard/contests/[id]/phases/[phaseId]/quiz/page.tsx#L17-L29)
- [quiz leaderboard.tsx:1-23](file://components/contests-live/quiz/quiz-leaderboard.tsx#L1-L23)

**Section sources**
- [0010_contest_quiz.sql:2-73](file://drizzle/0010_contest_quiz.sql#L2-L73)
- [quiz page.tsx:17-29](file://app/dashboard/contests/[id]/phases/[phaseId]/quiz/page.tsx#L17-L29)
- [quiz leaderboard.tsx:1-23](file://components/contests-live/quiz/quiz-leaderboard.tsx#L1-L23)

### Programme Materials Management
- Admins attach materials (title, URL, file type) to programmes.
- Attendees can download materials from their programme view.

```mermaid
flowchart TD
A["Admin uploads material"] --> B["Store in programme_materials"]
B --> C["Link to programmeId"]
C --> D["Attendee downloads via UI"]
```

**Diagram sources**
- [programme materials download.tsx:1-43](file://components/programme/programme-materials-download.tsx#L1-L43)
- [programmes.ts:2063-2098](file://lib/actions/programmes.ts#L2063-L2098)

**Section sources**
- [programme materials download.tsx:1-43](file://components/programme/programme-materials-download.tsx#L1-L43)
- [programmes.ts:2063-2098](file://lib/actions/programmes.ts#L2063-L2098)

### Resource Allocation and Capacity Planning
- Early bird pricing and deadlines support demand shaping.
- Installment options allow flexible payment plans.
- Attendance windows and end-date constraints help manage capacity and session boundaries.
- Bulk registration groups enable centralized payment and distribution of claim links for large cohorts.

**Section sources**
- [schema.prisma:1678-1700](file://prisma/schema.prisma#L1678-L1700)
- [0011_bulk_registration.sql:1-36](file://drizzle/0011_bulk_registration.sql#L1-L36)
- [programmes.ts:33-97](file://lib/actions/programmes.ts#L33-L97)

### Programme Analytics and Reporting
- Aggregates registrations, attendance timestamps, and member associations.
- Feedback sentiment analysis uses keyword scoring to classify responses.
- Provides dashboards for administrators to evaluate effectiveness and participation trends.

```mermaid
flowchart TD
A["Registrations + Members"] --> B["Compute attendance stats"]
C["Feedback text"] --> D["Sentiment classification"]
B --> E["Analytics dashboard"]
D --> E
```

**Diagram sources**
- [programme analytics page.tsx:11-25](file://app/dashboard/admin/programmes/[id]/analytics/page.tsx#L11-L25)

**Section sources**
- [programme analytics page.tsx:11-25](file://app/dashboard/admin/programmes/[id]/analytics/page.tsx#L11-L25)

## Dependency Analysis
Key relationships:
- Programmes depend on organisations and users; registrations link to programmes and optionally members/users.
- Contests depend on organisations and users; phases depend on events; representatives depend on phases; scores and results depend on representatives; quizzes depend on phases; attempts and answers depend on quizzes and representatives.
- Materials depend on programmes.

```mermaid
graph LR
Org["Organizations"] --> Prog["Programmes"]
Users["Users"] --> Prog
Prog --> Reg["Registrations"]
Reg --> Mat["Materials"]
Org --> CE["ContestEvents"]
CE --> CP["Phases"]
CP --> CR["Representatives"]
CR --> CS["Scores"]
CR --> CJ["Results"]
CP --> CQ["Quizzes"]
CQ --> CQA["Attempts"]
CQA --> CQAn["Answers"]
```

**Diagram sources**
- [0008_contests.sql:4-141](file://drizzle/0008_contests.sql#L4-L141)
- [0010_contest_quiz.sql:2-73](file://drizzle/0010_contest_quiz.sql#L2-L73)
- [0011_bulk_registration.sql:1-36](file://drizzle/0011_bulk_registration.sql#L1-L36)

**Section sources**
- [0008_contests.sql:4-141](file://drizzle/0008_contests.sql#L4-L141)
- [0010_contest_quiz.sql:2-73](file://drizzle/0010_contest_quiz.sql#L2-L73)
- [0011_bulk_registration.sql:1-36](file://drizzle/0011_bulk_registration.sql#L1-L36)

## Performance Considerations
- Recurrence generation: pre-generate instances using RRule to avoid runtime computation during peak usage.
- Attendance checks: enforce tight time windows and minimal DB writes (toggle check-in/out).
- Certificate generation: cache logo assets and minimize image processing overhead.
- Quiz leaderboards: poll at reasonable intervals (e.g., every 15 seconds) to balance freshness and load.
- Bulk registrations: batch operations and unique claim tokens reduce duplicate claims and improve throughput.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Attendance outside window: ensure current time is within allowed hours before start and before end date; verify programme settings.
- Payment required: confirm registration status is not PENDING_PAYMENT before allowing check-in.
- Invalid QR/token: validate dynamic token or static token against programme configuration.
- Certificate unavailable: only attended participants can download certificates; verify status transition to ATTENDED.
- Quiz leaderboard stale: refresh interval may delay updates; ensure client polling is active.

**Section sources**
- [programmes.ts:33-97](file://lib/actions/programmes.ts#L33-L97)
- [certificate route.ts:49-72](file://app/api/programmes/registrations/[id]/certificate/route.ts#L49-L72)
- [quiz leaderboard.tsx:1-23](file://components/contests-live/quiz/quiz-leaderboard.tsx#L1-L23)

## Conclusion
The data model integrates robust programme scheduling with flexible recurrence, comprehensive registration and attendance workflows, and powerful contest and quiz systems. It supports scalable resource allocation, clear reporting, and effective analytics to evaluate programme impact. The modular design enables independent evolution of each component while maintaining strong relational integrity.