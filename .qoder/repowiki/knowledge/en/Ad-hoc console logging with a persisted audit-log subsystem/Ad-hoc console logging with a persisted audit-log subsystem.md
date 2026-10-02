---
kind: logging_system
name: Ad-hoc console logging with a persisted audit-log subsystem
category: logging_system
scope:
    - '**'
source_files:
    - lib/audit.ts
    - app/api/chat/route.ts
    - app/api/auth/signup/route.ts
    - app/api/admin/members/[id]/approve/route.ts
    - app/api/analytics/visit/route.ts
    - app/api/auth/forgot-password/route.ts
    - app/api/auth/resend-verification/route.ts
    - app/api/auth/reset-password/route.ts
    - app/api/auth/verify-email/route.ts
    - workers/email-worker.ts
    - workers/scheduler.ts
---

## What system/approach is used

The TMC Portal does **not** use a dedicated logging framework (no Winston, Pino, Bunyan, `@next/dev`, etc.). Runtime output is produced almost entirely via the built-in Node/Next.js `console` API (`console.log`, `console.error`) scattered across API route handlers and background workers. The only structured, persistent "logging" facility is an **audit-log subsystem** that writes user-action records to the database via Drizzle ORM.

There is no log-level configuration, no centralized logger module, no request-id correlation, and no log rotation or sink abstraction — each file emits its own `console.*` calls inline.

## Key files and packages

- `app/api/chat/route.ts` — heavy use of `console.log` / `console.error` for tracing AI chat request flow (session fetch, settings, model selection, tool creation, streaming).
- `app/api/auth/signup/route.ts` — prints verification URL to stdout during signup; also logs validation errors.
- `app/api/admin/members/[id]/approve/route.ts`, `app/api/analytics/visit/route.ts`, `app/api/auth/forgot-password/route.ts`, `app/api/auth/resend-verification/route.ts`, `app/api/auth/reset-password/route.ts`, `app/api/auth/verify-email/route.ts` — each uses `console.error` in catch blocks to surface failures.
- `workers/email-worker.ts` — `console.log` on job start/end and `console.error` on send failure; also logs worker startup/shutdown.
- `workers/scheduler.ts` — `console.log` at every cron tick (weekly programme reminders, daily continuous reminders, monthly office report reminders, automated backup) plus `console.error` on failures.
- `lib/audit.ts` — the only structured persistence layer: `createAuditLog(data)` inserts into the `auditLogs` table and swallows DB errors via `console.error` so audit failures cannot break callers.
- `lib/db/schema` (referenced by `lib/audit.ts`) — defines the `auditLogs` entity with fields `userId`, `action`, `entityType`, `entityId`, `organizationId`, `description`, `ipAddress`, `userAgent`, `metadata`, `createdAt`, `updatedAt`.

## Architecture and conventions

### Console-based operational logging
- Every API route handler and worker process logs directly with `console.log` / `console.error`. There is no shared logger utility, so messages are unstructured plain strings (sometimes with a trailing object argument, e.g. `{ temperature, maxTokens }`).
- Error paths consistently wrap the thrown value in a `console.error("...", error)` call rather than rethrowing immediately, allowing the caller to return a JSON response while still emitting a server-side trace.
- Background jobs (`email-worker.ts`, `scheduler.ts`) log lifecycle events (worker started, job id, target recipient) and per-step progress so operators can tail `stdout` to diagnose queue/backlog issues.

### Persisted audit logging
- User-facing mutations should record an entry through `createAuditLog({ userId, action, entityType, entityId, organizationId, description, ipAddress, userAgent, metadata })` from `lib/audit.ts`.
- The function is wrapped in a try/catch that logs via `console.error` and **does not throw**, enforcing the rule that audit recording must be best-effort and never disrupt the calling operation.
- Audit entries are queryable through `getAuditLogs(filters)` which supports filtering by `userId`, `organizationId`, `entityType`, `entityId`, date range, with pagination (`limit`, `offset`) and eager-loading of the associated `user`.

### No centralized log routing
- There is no middleware that intercepts requests to attach correlation IDs, timestamps, or environment context to every log line.
- Log sinks are implicit: Next.js server logs go to the platform's stdout/stderr (Vercel/Node runtime), and the audit log goes to the MySQL `auditLogs` table.

## Conventions and constraints

- **Operational logs**: Use `console.log` for normal progress and `console.error` for failures; no log levels are enforced programmatically.
- **Audit logs**: Always write via `createAuditLog` rather than direct DB inserts, so the fail-fast behavior is consistent. Callers should pass enough context (`action`, `entityType`, `entityId`, `organizationId`, optional `metadata`) to make the record searchable and attributable.
- **Non-blocking audit**: Because `createAuditLog` catches and suppresses DB errors, it is safe to call from hot paths without risking request failures.
- **Background processes**: Cron-driven tasks in `workers/scheduler.ts` log at each scheduled trigger and at the end of each processing loop, making it possible to verify execution via process logs.
- **No structured log format**: Unlike audit entries, console output has no fixed schema, no timestamp field, and no source-file/line annotation — it is free-form text intended for human reading during development or live debugging.