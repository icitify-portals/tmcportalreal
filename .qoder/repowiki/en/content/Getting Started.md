# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [SETUP.md](file://SETUP.md)
- [MYSQL_SETUP.md](file://MYSQL_SETUP.md)
- [package.json](file://package.json)
- [drizzle.config.ts](file://drizzle.config.ts)
- [lib/db/index.ts](file://lib/db/index.ts)
- [lib/email.ts](file://lib/email.ts)
- [lib/payments.ts](file://lib/payments.ts)
- [app/api/payments/paystack-webhook/route.ts](file://app/api/payments/paystack-webhook/route.ts)
- [next.config.ts](file://next.config.ts)
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
10. Appendices

## Introduction
This guide helps you set up and run the TMC Portal locally so you can start developing quickly. You will:
- Install Node.js 18+ and a MySQL database
- Create a Paystack account for payments and a Resend account for email
- Clone the repository, install dependencies, configure environment variables, and run migrations
- Start the development server and verify that everything works

The portal is a full-stack Next.js application with MySQL (via Drizzle ORM), NextAuth authentication, Paystack payments, and Resend email delivery.

**Section sources**
- [README.md:16-36](file://README.md#L16-L36)
- [README.md:29-80](file://README.md#L29-L80)

## Project Structure
At a high level:
- Frontend and API routes live under app/
- Business logic and integrations are in lib/
- Database schema and migrations are managed by Drizzle under drizzle/
- Configuration files include next.config.ts and drizzle.config.ts
- Scripts and utilities are in scripts/

```mermaid
graph TB
A["Next.js App<br/>app/"] --> B["API Routes<br/>app/api/*"]
A --> C["Pages & Layouts<br/>app/*.tsx"]
B --> D["Database Client<br/>lib/db/index.ts"]
B --> E["Email Service<br/>lib/email.ts"]
B --> F["Payments Integration<br/>lib/payments.ts"]
D --> G["MySQL via Drizzle<br/>drizzle/*"]
H["Config<br/>next.config.ts"] --> A
I["Drizzle Config<br/>drizzle.config.ts"] --> G
```

**Diagram sources**
- [next.config.ts:11-39](file://next.config.ts#L11-L39)
- [drizzle.config.ts:6-13](file://drizzle.config.ts#L6-L13)
- [lib/db/index.ts:1-17](file://lib/db/index.ts#L1-L17)

**Section sources**
- [next.config.ts:11-39](file://next.config.ts#L11-L39)
- [drizzle.config.ts:6-13](file://drizzle.config.ts#L6-L13)

## Core Components
- Database client: Uses Drizzle with MySQL; reads DATABASE_URL from environment
- Email service: Sends emails via Resend when configured; logs to DB otherwise
- Payments: Initializes and verifies transactions via Paystack using secret/public keys
- Webhooks: Validates Paystack webhooks and updates payment state
- Next.js config: Controls build output, external packages, and image domains

Key responsibilities:
- lib/db/index.ts: Creates a connection pool and exports a typed Drizzle instance
- lib/email.ts: Provides sendEmail and templates; uses RESEND_API_KEY
- lib/payments.ts: Calls Paystack APIs with PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY
- app/api/payments/paystack-webhook/route.ts: Verifies signatures and processes events
- next.config.ts: Sets standalone output and allowed remote images

**Section sources**
- [lib/db/index.ts:1-17](file://lib/db/index.ts#L1-L17)
- [lib/email.ts:1-92](file://lib/email.ts#L1-L92)
- [lib/payments.ts:1-96](file://lib/payments.ts#L1-L96)
- [app/api/payments/paystack-webhook/route.ts:1-41](file://app/api/payments/paystack-webhook/route.ts#L1-L41)
- [next.config.ts:11-39](file://next.config.ts#L11-L39)

## Architecture Overview
High-level flow during setup and runtime:
- Environment variables drive configuration for DB, auth, payments, and email
- Drizzle applies SQL migrations to create tables in MySQL
- Next.js serves pages and API routes
- API routes call external services (Paystack, Resend) and persist data to MySQL

```mermaid
sequenceDiagram
participant Dev as "Developer"
participant Next as "Next.js Server"
participant DB as "MySQL (Drizzle)"
participant Pay as "Paystack API"
participant Mail as "Resend API"
Dev->>Next : npm run dev
Next->>DB : Connect using DATABASE_URL
Next->>DB : Apply Drizzle migrations
Note over Next,DB : Tables created for users, organizations, payments, etc.
Dev->>Next : Trigger payment flow
Next->>Pay : Initialize transaction (PAYSTACK_SECRET_KEY)
Pay-->>Next : Authorization URL
Next->>Mail : Send confirmation (RESEND_API_KEY)
Pay-->>Next : Webhook event (signature verified)
Next->>DB : Update payment status and records
```

**Diagram sources**
- [lib/db/index.ts:1-17](file://lib/db/index.ts#L1-L17)
- [drizzle.config.ts:6-13](file://drizzle.config.ts#L6-L13)
- [lib/payments.ts:18-58](file://lib/payments.ts#L18-L58)
- [lib/email.ts:21-92](file://lib/email.ts#L21-L92)
- [app/api/payments/paystack-webhook/route.ts:1-41](file://app/api/payments/paystack-webhook/route.ts#L1-L41)

## Detailed Component Analysis

### Prerequisites
- Node.js 18+ and npm
- MySQL server running and accessible
- Paystack account (for payments)
- Resend account (for email notifications)

Notes:
- The project uses MySQL via Drizzle; ensure your MySQL instance is reachable and credentials are correct.
- For local development, you can use a local MySQL instance or a managed service.

**Section sources**
- [README.md:31-36](file://README.md#L31-L36)
- [MYSQL_SETUP.md:7-17](file://MYSQL_SETUP.md#L7-L17)

### Installation Steps
1. Clone the repository and navigate into it.
2. Install dependencies using npm.
3. Configure environment variables (see next section).
4. Run Drizzle migrations to create database tables.
5. Start the development server.

Commands:
- npm install
- npx drizzle-kit migrate
- npm run dev

Verification:
- Open http://localhost:3000 in your browser after starting the dev server.

**Section sources**
- [README.md:39-80](file://README.md#L39-L80)
- [package.json:5-12](file://package.json#L5-L12)
- [drizzle.config.ts:6-13](file://drizzle.config.ts#L6-L13)

### Environment Variables
Set these in your .env file at the project root:

- DATABASE_URL
  - Purpose: MySQL connection string used by Drizzle
  - Example format: mysql://user:password@host:port/database
  - Notes: Ensure the database exists and user has permissions

- NEXTAUTH_SECRET or AUTH_SECRET
  - Purpose: Secret for session signing and token encryption
  - Notes: Generate a secure random value; used by NextAuth

- NEXTAUTH_URL or NEXT_PUBLIC_APP_URL
  - Purpose: Base URL of your application
  - Notes: Used in email templates and callbacks

- RESEND_API_KEY
  - Purpose: API key for sending emails via Resend
  - Notes: Without this, emails are logged but not sent

- PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY
  - Purpose: Authenticate with Paystack for payments and display public keys on the frontend
  - Notes: Required for initializing and verifying transactions

- Optional: NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
  - Purpose: Public key exposed to the client for payment widgets

Where they are used:
- Database: lib/db/index.ts reads DATABASE_URL
- Email: lib/email.ts reads RESEND_API_KEY
- Payments: lib/payments.ts reads PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY
- Webhooks: app/api/payments/paystack-webhook/route.ts reads PAYSTACK_SECRET_KEY for signature verification
- Auth: lib/auth.config.ts references AUTH_SECRET

**Section sources**
- [lib/db/index.ts:10-12](file://lib/db/index.ts#L10-L12)
- [lib/email.ts:1-6](file://lib/email.ts#L1-L6)
- [lib/payments.ts:6-7](file://lib/payments.ts#L6-L7)
- [app/api/payments/paystack-webhook/route.ts:5-6](file://app/api/payments/paystack-webhook/route.ts#L5-L6)
- [lib/auth.config.ts:3-6](file://lib/auth.config.ts#L3-L6)

### Database Setup with Drizzle Migrations
Steps:
1. Ensure MySQL is running and DATABASE_URL points to your database.
2. Run Drizzle migrations to create all required tables.
3. Verify tables exist using a database tool or Prisma Studio if configured.

Migrations location:
- drizzle/ contains SQL migration files applied by Drizzle

After migrations:
- Confirm core tables like users, organizations, payments, audit_logs, and email_logs exist

**Section sources**
- [drizzle.config.ts:6-13](file://drizzle.config.ts#L6-L13)
- [drizzle/0000_giant_demogoblin.sql:1-77](file://drizzle/0000_giant_demogoblin.sql#L1-L77)
- [MYSQL_SETUP.md:35-58](file://MYSQL_SETUP.md#L35-L58)

### Running the Development Server
- Use npm run dev to start the Next.js development server
- The server reads environment variables and connects to MySQL
- API routes are available under /api/*

Build and production notes:
- Build command: npm run build
- Start command: npm start
- Output mode: standalone (configured in next.config.ts)

**Section sources**
- [package.json:5-12](file://package.json#L5-L12)
- [next.config.ts:11-19](file://next.config.ts#L11-L19)

### Payment Flow Overview
When a user initiates a payment:
- The backend initializes a transaction with Paystack using your secret key
- The frontend redirects the user to Paystack’s authorization URL
- After payment, Paystack sends a webhook to your endpoint
- Your webhook verifies the signature and updates the payment status in the database

```mermaid
sequenceDiagram
participant User as "User"
participant Frontend as "Frontend"
participant Backend as "Backend API"
participant Paystack as "Paystack"
participant DB as "MySQL"
User->>Frontend : Click "Pay"
Frontend->>Backend : POST initialize payment
Backend->>Paystack : Initialize transaction (secret key)
Paystack-->>Backend : Return authorization URL
Backend-->>Frontend : Redirect to Paystack
User->>Paystack : Complete payment
Paystack-->>Backend : Webhook event (charge.success)
Backend->>DB : Update payment status and records
Backend-->>User : Confirmation (email via Resend)
```

**Diagram sources**
- [lib/payments.ts:18-58](file://lib/payments.ts#L18-L58)
- [app/api/payments/paystack-webhook/route.ts:7-36](file://app/api/payments/paystack-webhook/route.ts#L7-L36)
- [lib/email.ts:21-92](file://lib/email.ts#L21-L92)

**Section sources**
- [lib/payments.ts:18-96](file://lib/payments.ts#L18-L96)
- [app/api/payments/paystack-webhook/route.ts:1-41](file://app/api/payments/paystack-webhook/route.ts#L1-L41)

### Email Service Setup
- Provide RESEND_API_KEY to enable real email delivery
- Without the key, emails are logged and recorded in the database for development
- Templates are included for welcome, verification, receipts, and more

Verification:
- Check email logs in the database after sending test emails
- Ensure NEXTAUTH_URL or NEXT_PUBLIC_APP_URL is set correctly for links in emails

**Section sources**
- [lib/email.ts:21-92](file://lib/email.ts#L21-L92)

## Dependency Analysis
Key runtime dependencies and their roles:
- Drizzle ORM and MySQL driver connect to the database
- NextAuth handles authentication sessions and tokens
- Axios calls Paystack APIs for payments
- Resend SDK sends emails
- Next.js config controls build behavior and external packages

```mermaid
graph LR
Next["Next.js App"] --> Drizzle["Drizzle ORM"]
Next --> Auth["NextAuth"]
Next --> Pay["Paystack (axios)"]
Next --> Mail["Resend"]
Drizzle --> MySQL["MySQL"]
```

**Diagram sources**
- [package.json:17-102](file://package.json#L17-L102)
- [lib/db/index.ts:1-17](file://lib/db/index.ts#L1-L17)
- [lib/payments.ts:1-4](file://lib/payments.ts#L1-L4)
- [lib/email.ts:1-2](file://lib/email.ts#L1-L2)

**Section sources**
- [package.json:17-102](file://package.json#L17-L102)

## Performance Considerations
- Use a production-grade MySQL instance for reliability and performance
- Keep DATABASE_URL secure and restrict network access to your database
- Enable caching where appropriate (e.g., Redis if added later)
- Monitor webhook latency and database query performance
- Avoid unnecessary re-renders in React components

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Database connection fails
  - Verify DATABASE_URL format and that MySQL is running
  - Ensure the database exists and credentials are correct
  - Check firewall rules and network access

- Authentication errors
  - Ensure NEXTAUTH_SECRET or AUTH_SECRET is set
  - Confirm NEXTAUTH_URL matches your domain

- Payment issues
  - Verify PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY
  - Ensure webhook endpoints are publicly accessible and signed correctly
  - Check Paystack dashboard for failed transactions

- Email not sending
  - Set RESEND_API_KEY
  - Check email logs in the database
  - Validate NEXTAUTH_URL or NEXT_PUBLIC_APP_URL in templates

- Migration problems
  - Re-run Drizzle migrations
  - Inspect migration files under drizzle/
  - Reset database only if necessary (backup first)

**Section sources**
- [SETUP.md:165-185](file://SETUP.md#L165-L185)
- [MYSQL_SETUP.md:98-120](file://MYSQL_SETUP.md#L98-L120)
- [app/api/payments/paystack-webhook/route.ts:7-36](file://app/api/payments/paystack-webhook/route.ts#L7-L36)
- [lib/email.ts:21-92](file://lib/email.ts#L21-L92)

## Conclusion
You now have the essentials to set up and run the TMC Portal locally. Focus on configuring environment variables correctly, applying Drizzle migrations, and verifying integrations for payments and email. Once stable, proceed to seed initial data and begin building features.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Quick Commands Reference
- Install dependencies: npm install
- Run migrations: npx drizzle-kit migrate
- Start dev server: npm run dev
- Build: npm run build
- Start production: npm start

**Section sources**
- [package.json:5-12](file://package.json#L5-L12)

### Environment Variables Checklist
- DATABASE_URL
- NEXTAUTH_SECRET or AUTH_SECRET
- NEXTAUTH_URL or NEXT_PUBLIC_APP_URL
- RESEND_API_KEY
- PAYSTACK_SECRET_KEY
- PAYSTACK_PUBLIC_KEY
- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (optional)

**Section sources**
- [lib/db/index.ts:10-12](file://lib/db/index.ts#L10-L12)
- [lib/email.ts:1-6](file://lib/email.ts#L1-L6)
- [lib/payments.ts:6-7](file://lib/payments.ts#L6-L7)
- [app/api/payments/paystack-webhook/route.ts:5-6](file://app/api/payments/paystack-webhook/route.ts#L5-L6)
- [lib/auth.config.ts:3-6](file://lib/auth.config.ts#L3-L6)