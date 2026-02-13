
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables explicitly from root
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

console.log("Checking env paths:");
console.log(".env.local:", envLocalPath, fs.existsSync(envLocalPath));
console.log(".env:", envPath, fs.existsSync(envPath));

dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

// Manual parsing fallback
if (!process.env.DATABASE_URL) {
  console.log("env var missing, attempting manual parse...");
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
    if (match && match[1]) {
      process.env.DATABASE_URL = match[1];
      console.log("Manually loaded DATABASE_URL");
    }
  } catch (e) {
    console.error("Failed to manual read .env", e);
  }
}

console.log("Final check - Database URL present:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log("URL starts with:", process.env.DATABASE_URL.substring(0, 10));
}

// REMOVED static imports to prevent hoisting before env vars are set
// import { db } from "../lib/db";
// import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting DB Schema Fix...");
  console.log("Database URL present:", !!process.env.DATABASE_URL);

  // Dynamic import to ensure env vars are loaded first
  const { db } = await import("../lib/db");
  const { sql } = await import("drizzle-orm");

  if (process.env.DATABASE_URL) {
    console.log("Database URL starts with:", process.env.DATABASE_URL.substring(0, 10) + "...");
  } else {
    console.error("CRITICAL: DATABASE_URL is missing!");
  }

  // 1. Create adhkar_centres
  console.log("Creating adhkar_centres if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS adhkar_centres (
        id varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        venue varchar(255) NOT NULL,
        address text NOT NULL,
        time varchar(255) NOT NULL,
        contactNumber varchar(255),
        state varchar(255) NOT NULL,
        lga varchar(255) NOT NULL,
        organizationId varchar(255),
        isActive boolean DEFAULT true,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id)
    );
  `);
  console.log("adhkar_centres checked/created.");

  // 2. Create site_visits
  console.log("Checking users table exists...");
  // Check if users table uses utf8mb4_unicode_ci or similar
  try {
    const [usersStatus] = await db.execute(sql`SHOW TABLE STATUS LIKE 'users'`);
    console.log("Users table status:", usersStatus);
  } catch (e) {
    console.log("Could not check users table status, proceeding anyway...");
  }

  console.log("Creating site_visits if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_visits (
        id varchar(255) NOT NULL,
        visitorId varchar(255) NOT NULL,
        sessionId varchar(255) NOT NULL,
        path varchar(500) NOT NULL,
        userId varchar(255),
        userAgent text,
        ip varchar(255),
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY site_visits_userId_idx (userId),
        CONSTRAINT site_visits_userId_fk FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("site_visits checked/created.");

  // 3. Create teskiyah_centres
  console.log("Creating teskiyah_centres if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS teskiyah_centres (
        id varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        venue varchar(255) NOT NULL,
        address text NOT NULL,
        time varchar(255) NOT NULL,
        contactNumber varchar(255),
        state varchar(255) NOT NULL,
        lga varchar(255) NOT NULL,
        branch varchar(255),
        organizationId varchar(255),
        isActive boolean DEFAULT true,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("teskiyah_centres checked/created.");

  // 4. Create navigation_items
  console.log("Creating navigation_items if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS navigation_items (
        id varchar(255) NOT NULL,
        label varchar(255) NOT NULL,
        path varchar(255),
        parentId varchar(255),
        \`order\` int NOT NULL DEFAULT 0,
        type enum('link', 'dropdown', 'button') DEFAULT 'link',
        isActive boolean DEFAULT true,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("navigation_items checked/created.");


  // 4. Create navigation_items
  console.log("Creating navigation_items if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS navigation_items (
        id varchar(255) NOT NULL,
        label varchar(255) NOT NULL,
        path varchar(255),
        parentId varchar(255),
        \`order\` int NOT NULL DEFAULT 0,
        type enum('link', 'dropdown', 'button') DEFAULT 'link',
        isActive boolean DEFAULT true,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("navigation_items checked/created.");



  console.log("navigation_items checked/created.");

  // 5. Create pages table
  console.log("Creating pages table if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS pages (
        id varchar(255) NOT NULL,
        slug varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        content LONGTEXT,
        isPublished boolean DEFAULT false,
        metadata JSON,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY pages_slug_unique (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("pages table checked/created.");

  // 6. Create Finance Tables
  console.log("Creating finance tables...");

  // finance_budgets
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS finance_budgets (
        id varchar(255) NOT NULL,
        organizationId varchar(255) NOT NULL,
        year int NOT NULL,
        title varchar(255) NOT NULL,
        totalAmount decimal(15,2) NOT NULL DEFAULT '0.00',
        status enum('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
        createdBy varchar(255) NOT NULL,
        approvedBy varchar(255),
        approvedAt timestamp(3) NULL,
        comments text,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY finance_budgets_org_idx (organizationId),
        CONSTRAINT finance_budgets_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // finance_budget_items
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS finance_budget_items (
        id varchar(255) NOT NULL,
        budgetId varchar(255) NOT NULL,
        category varchar(255) NOT NULL,
        description varchar(500) NOT NULL,
        amount decimal(15,2) NOT NULL,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY finance_budget_items_budget_idx (budgetId),
        CONSTRAINT finance_budget_items_budget_fk FOREIGN KEY (budgetId) REFERENCES finance_budgets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // finance_fund_requests
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS finance_fund_requests (
        id varchar(255) NOT NULL,
        organizationId varchar(255) NOT NULL,
        requesterId varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        description text NOT NULL,
        amount decimal(15,2) NOT NULL,
        status enum('PENDING', 'RECOMMENDED', 'APPROVED', 'DISBURSED', 'REJECTED') DEFAULT 'PENDING',
        recommendedBy varchar(255),
        recommendedAt timestamp(3) NULL,
        approvedBy varchar(255),
        approvedAt timestamp(3) NULL,
        disbursedBy varchar(255),
        disbursedAt timestamp(3) NULL,
        rejectionReason text,
        evidenceUrl varchar(500),
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY finance_fund_requests_org_idx (organizationId),
        CONSTRAINT finance_fund_requests_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // finance_transactions
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS finance_transactions (
        id varchar(255) NOT NULL,
        organizationId varchar(255) NOT NULL,
        type enum('INFLOW', 'OUTFLOW') NOT NULL,
        amount decimal(15,2) NOT NULL,
        category varchar(255) NOT NULL,
        description varchar(500) NOT NULL,
        performedBy varchar(255) NOT NULL,
        date timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        relatedRequestId varchar(255),
        metadata JSON,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY finance_transactions_org_idx (organizationId),
        KEY finance_transactions_req_idx (relatedRequestId),
        CONSTRAINT finance_transactions_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT finance_transactions_req_fk FOREIGN KEY (relatedRequestId) REFERENCES finance_fund_requests(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Finance tables checked/created.");

  // 7. Create Programmes Tables
  console.log("Creating programmes tables...");

  // programmes
  await db.execute(sql`
        CREATE TABLE IF NOT EXISTS programmes (
            id varchar(255) NOT NULL,
            organizationId varchar(255) NOT NULL,
            title varchar(255) NOT NULL,
            description text NOT NULL,
            venue varchar(255) NOT NULL,
            startDate timestamp(3) NOT NULL,
            endDate timestamp(3) NULL,
            time varchar(255),
            level enum('NATIONAL', 'STATE', 'LOCAL', 'LOCAL_GOVERNMENT', 'BRANCH') NOT NULL,
            targetAudience enum('PUBLIC', 'MEMBERS', 'BROTHERS', 'SISTERS', 'CHILDREN', 'YOUTH', 'ELDERS') DEFAULT 'PUBLIC',
            status enum('DRAFT', 'PENDING_STATE', 'PENDING_NATIONAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED') DEFAULT 'DRAFT',
            
            approvedStateBy varchar(255),
            approvedStateAt timestamp(3) NULL,
            approvedNationalBy varchar(255),
            approvedNationalAt timestamp(3) NULL,

            paymentRequired boolean DEFAULT false,
            amount decimal(10,2) DEFAULT '0.00',

            createdBy varchar(255) NOT NULL,
            createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
            updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            
            PRIMARY KEY (id),
            KEY programmes_org_idx (organizationId),
            CONSTRAINT programmes_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

  // programme_registrations
  await db.execute(sql`
        CREATE TABLE IF NOT EXISTS programme_registrations (
            id varchar(255) NOT NULL,
            programmeId varchar(255) NOT NULL,
            userId varchar(255),
            memberId varchar(255),
            name varchar(255) NOT NULL,
            email varchar(255) NOT NULL,
            phone varchar(255),
            status enum('REGISTERED', 'PAID', 'ATTENDED', 'CANCELLED') DEFAULT 'REGISTERED',
            paymentReference varchar(255),
            registeredAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),

            PRIMARY KEY (id),
            KEY programme_regs_prog_idx (programmeId),
            CONSTRAINT programme_regs_prog_fk FOREIGN KEY (programmeId) REFERENCES programmes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

  // programme_reports
  await db.execute(sql`
        CREATE TABLE IF NOT EXISTS programme_reports (
            id varchar(255) NOT NULL,
            programmeId varchar(255) NOT NULL,
            summary text NOT NULL,
            challenges text,
            comments text,
            attendeesMale int DEFAULT 0,
            attendeesFemale int DEFAULT 0,
            amountSpent decimal(15,2) DEFAULT '0.00',
            images JSON,
            submittedBy varchar(255) NOT NULL,
            submittedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),

            PRIMARY KEY (id),
            UNIQUE KEY programme_reports_prog_idx (programmeId),
            CONSTRAINT programme_reports_prog_fk FOREIGN KEY (programmeId) REFERENCES programmes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

  console.log("Programmes tables checked/created.");

  // 8. Create Asset Maintenance Tables
  console.log("Creating asset maintenance tables...");

  // assets
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS assets (
        id varchar(255) NOT NULL,
        organizationId varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        description text,
        serialNumber varchar(255),
        category enum('FURNITURE', 'ELECTRONICS', 'VEHICLE', 'PROPERTY', 'EQUIPMENT', 'OTHER') NOT NULL,
        \`condition\` enum('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'LOST') DEFAULT 'GOOD',
        status enum('ACTIVE', 'IN_MAINTENANCE', 'DISPOSED', 'STOLEN', 'ARCHIVED') DEFAULT 'ACTIVE',
        purchaseDate timestamp(3) NULL,
        purchasePrice decimal(15,2) DEFAULT '0.00',
        currentValue decimal(15,2) DEFAULT '0.00',
        location text,
        custodianId varchar(255),
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY assets_org_idx (organizationId),
        CONSTRAINT assets_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // asset_maintenance_logs
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS asset_maintenance_logs (
        id varchar(255) NOT NULL,
        assetId varchar(255) NOT NULL,
        type enum('REPAIR', 'SERVICE', 'INSPECTION', 'UPGRADE') NOT NULL,
        description text NOT NULL,
        cost decimal(15,2) DEFAULT '0.00',
        date timestamp(3) NOT NULL,
        performedBy varchar(255),
        nextServiceDate timestamp(3) NULL,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY asset_maintenance_asset_idx (assetId),
        CONSTRAINT asset_maintenance_asset_fk FOREIGN KEY (assetId) REFERENCES assets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("Asset Maintenance tables checked/created.");

  // 9. Add Certificate Columns (ALTER TABLE)
  console.log("Checking/Adding Certificate columns...");
  try {
    await db.execute(sql`ALTER TABLE programmes ADD COLUMN hasCertificate boolean DEFAULT false`);
    console.log("Added hasCertificate to programmes");
  } catch (e: any) {
    if (!e.message.includes("Duplicate column")) console.log("hasCertificate col exists or error:", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE programmes ADD COLUMN isLateSubmission boolean DEFAULT false`);
    console.log("Added isLateSubmission to programmes");
  } catch (e: any) {
    if (!e.message.includes("Duplicate column")) console.log("isLateSubmission col exists or error:", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE programmes ADD COLUMN organizingOfficeId varchar(255)`);
    console.log("Added organizingOfficeId to programmes");
  } catch (e: any) {
    if (!e.message.includes("Duplicate column")) console.log("organizingOfficeId col exists or error:", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE programmes ADD CONSTRAINT programmes_office_fk FOREIGN KEY (organizingOfficeId) REFERENCES offices(id)`);
    console.log("Added organizingOfficeId FK");
  } catch (e: any) {
    // Ignore FK errors if already exists or if offices table issue
    console.log("FK error (expected if exists):", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE programme_registrations ADD COLUMN certificateUrl varchar(500)`);
    console.log("Added certificateUrl to programme_registrations");
  } catch (e: any) {
    if (!e.message.includes("Duplicate column")) console.log("certificateUrl col exists or error:", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE programme_registrations ADD COLUMN certificateIssuedAt timestamp(3)`);
    console.log("Added certificateIssuedAt to programme_registrations");
  } catch (e: any) {
    if (!e.message.includes("Duplicate column")) console.log("certificateIssuedAt col exists or error:", e.message);
  }


  // 10. Create Occasion Tables
  console.log("Creating occasion tables...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS occasion_types (
        id varchar(255) NOT NULL,
        name varchar(255) NOT NULL UNIQUE,
        certificateFee decimal(10,2) DEFAULT '0.00',
        isActive boolean DEFAULT true,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS occasion_requests (
        id varchar(255) NOT NULL,
        userId varchar(255) NOT NULL,
        typeId varchar(255) NOT NULL,
        organizationId varchar(255) NOT NULL,
        
        date timestamp(3) NOT NULL,
        time varchar(255) NOT NULL,
        venue varchar(255) NOT NULL,
        address text NOT NULL,
        
        role enum('COORDINATING', 'WITNESS') NOT NULL,
        certificateNeeded boolean DEFAULT false,
        
        status enum('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED') DEFAULT 'PENDING',
        paymentStatus enum('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',
        amount decimal(10,2) DEFAULT '0.00',
        
        details JSON,
        certificateNo varchar(255),
        
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        
        PRIMARY KEY (id),
        KEY occasion_requests_user_idx (userId),
        KEY occasion_requests_type_idx (typeId),
        KEY occasion_requests_org_idx (organizationId),
        
        CONSTRAINT occasion_requests_user_fk FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT occasion_requests_type_fk FOREIGN KEY (typeId) REFERENCES occasion_types(id),
        CONSTRAINT occasion_requests_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("Occasion tables checked/created.");

  // 11. Create Meeting Tables
  console.log("Creating meeting tables...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meetings (
        id varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        description text,
        organizationId varchar(255) NOT NULL,
        scheduledAt timestamp(3) NOT NULL,
        endAt timestamp(3),
        venue varchar(255),
        isOnline boolean DEFAULT false,
        meetingLink varchar(500),
        status enum('SCHEDULED', 'ONGOING', 'ENDED', 'CANCELLED') DEFAULT 'SCHEDULED',
        createdBy varchar(255) NOT NULL,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY meetings_org_idx (organizationId),
        CONSTRAINT meetings_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id),
        CONSTRAINT meetings_creator_fk FOREIGN KEY (createdBy) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_attendances (
        id varchar(255) NOT NULL,
        meetingId varchar(255) NOT NULL,
        userId varchar(255) NOT NULL,
        status enum('INVITED', 'ACCEPTED', 'DECLINED', 'PRESENT', 'ABSENT') DEFAULT 'INVITED',
        joinedAt timestamp(3),
        leftAt timestamp(3),
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY meeting_user_unique (meetingId, userId),
        KEY attendances_user_idx (userId),
        CONSTRAINT attendances_meeting_fk FOREIGN KEY (meetingId) REFERENCES meetings(id) ON DELETE CASCADE,
        CONSTRAINT attendances_user_fk FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_docs (
        id varchar(255) NOT NULL,
        meetingId varchar(255) NOT NULL,
        userId varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        url varchar(500) NOT NULL,
        type enum('AGENDA', 'MINUTES', 'MEMBER_REPORT', 'OTHER') DEFAULT 'OTHER',
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        CONSTRAINT meeting_docs_meeting_fk FOREIGN KEY (meetingId) REFERENCES meetings(id) ON DELETE CASCADE,
        CONSTRAINT meeting_docs_user_fk FOREIGN KEY (userId) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  try {
    await db.execute(sql`ALTER TABLE meeting_docs ADD COLUMN submissionStatus enum('ON_TIME', 'LATE') DEFAULT 'ON_TIME';`);
    console.log("Added submissionStatus to meeting_docs");
  } catch (e) {
    // Ignore if exists
  }

  console.log("Meeting tables checked/created.");

  // 12. Create Fee Tables
  console.log("Creating fee tables...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS fees (
        id varchar(255) NOT NULL,
        organizationId varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        description text,
        amount decimal(10,2) NOT NULL,
        targetType enum('ALL_MEMBERS', 'OFFICIALS') NOT NULL,
        dueDate timestamp(3) NULL,
        isActive boolean DEFAULT true,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY fees_org_idx (organizationId),
        CONSTRAINT fees_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS fee_assignments (
        id varchar(255) NOT NULL,
        feeId varchar(255) NOT NULL,
        userId varchar(255) NOT NULL,
        status enum('PENDING', 'PAID') DEFAULT 'PENDING',
        amountPaid decimal(10,2) DEFAULT '0.00',
        paidAt timestamp(3) NULL,
        paymentId varchar(255),
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY fee_assignments_fee_idx (feeId),
        KEY fee_assignments_user_idx (userId),
        KEY fee_assignments_payment_idx (paymentId),
        CONSTRAINT fee_assignments_fee_fk FOREIGN KEY (feeId) REFERENCES fees(id) ON DELETE CASCADE,
        CONSTRAINT fee_assignments_user_fk FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fee_assignments_payment_fk FOREIGN KEY (paymentId) REFERENCES payments(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 13. Create Reporting Tables
  console.log("Creating reporting tables...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS offices (
        id varchar(255) NOT NULL,
        organizationId varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        description text,
        isActive boolean DEFAULT true,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY offices_org_idx (organizationId),
        CONSTRAINT offices_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reports (
        id varchar(255) NOT NULL,
        organizationId varchar(255) NOT NULL,
        userId varchar(255) NOT NULL,
        officeId varchar(255),
        reportType enum('MONTHLY_ACTIVITY', 'QUARTERLY_STATE', 'ANNUAL_CONGRESS', 'FINANCIAL') NOT NULL,
        reportStatus enum('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
        title varchar(255) NOT NULL,
        period varchar(255) NOT NULL,
        content JSON NOT NULL,
        approvedBy varchar(255),
        approvedAt timestamp(3) NULL,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY reports_org_idx (organizationId),
        KEY reports_user_idx (userId),
        KEY reports_office_idx (officeId),
        CONSTRAINT reports_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT reports_user_fk FOREIGN KEY (userId) REFERENCES users(id),
        CONSTRAINT reports_office_fk FOREIGN KEY (officeId) REFERENCES offices(id),
        CONSTRAINT reports_approver_fk FOREIGN KEY (approvedBy) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Reporting tables checked/created.");

  // 11. Create Special Programmes Tables
  console.log("Creating special programmes tables...");

  // special_programmes
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS special_programmes (
        id varchar(255) NOT NULL,
        organizationId varchar(255) NOT NULL,
        category enum('TESKIYAH_WORKSHOP', 'FRIDAY_KHUTHBAH', 'PRESS_RELEASE', 'STATE_OF_THE_NATION', 'OTHER') NOT NULL,
        title varchar(255) NOT NULL,
        description text,
        summary text,
        year int NOT NULL,
        \`date\` timestamp(3) NULL,
        imageUrl varchar(500),
        isPublished boolean DEFAULT true,
        createdBy varchar(255) NOT NULL,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY special_programmes_org_idx (organizationId),
        KEY special_programmes_year_idx (year),
        CONSTRAINT special_programmes_org_fk FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT special_programmes_creator_fk FOREIGN KEY (createdBy) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // special_programme_files
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS special_programme_files (
        id varchar(255) NOT NULL,
        programmeId varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        url varchar(500) NOT NULL,
        \`type\` enum('AUDIO', 'VIDEO', 'DOCUMENT', 'OTHER') NOT NULL,
        \`order\` int DEFAULT 0,
        createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY special_programme_files_programme_idx (programmeId),
        CONSTRAINT special_programme_files_programme_fk FOREIGN KEY (programmeId) REFERENCES special_programmes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Special Programmes tables checked/created.");

  console.log("Schema fix completed successfully.");
  process.exit(0);
}


main().catch((e) => {
  console.error("Schema fix failed:", e);
  process.exit(1);
});
