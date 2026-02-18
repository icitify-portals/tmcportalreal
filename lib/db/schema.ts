import {
    mysqlTable,
    varchar,
    timestamp,
    text,
    int,
    boolean,
    json,
    primaryKey,
    mysqlEnum,
    decimal,
    uniqueIndex
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

// Enums
export const orgLevelEnum = mysqlEnum('level', ['NATIONAL', 'STATE', 'LOCAL_GOVERNMENT', 'BRANCH']);
export const memberStatusEnum = mysqlEnum('status', ['PENDING', 'RECOMMENDED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'INACTIVE', 'REJECTED']);
export const membershipTypeEnum = mysqlEnum('membershipType', ['REGULAR', 'ASSOCIATE', 'HONORARY', 'LIFETIME']);
export const genderEnum = mysqlEnum('gender', ['MALE', 'FEMALE']);
export const officialLevelEnum = mysqlEnum('positionLevel', ['NATIONAL', 'STATE', 'LOCAL_GOVERNMENT', 'BRANCH']);
export const jurisdictionLevelEnum = mysqlEnum('jurisdictionLevel', ['SYSTEM', 'NATIONAL', 'STATE', 'LOCAL_GOVERNMENT', 'BRANCH']);
export const paymentStatusEnum = mysqlEnum('status', ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED']);
export const paymentTypeEnum = mysqlEnum('paymentType', ['MEMBERSHIP_FEE', 'RENEWAL', 'DONATION', 'EVENT_FEE', 'BURIAL_FEE', 'LEVY', 'OTHER']);
export const feeTargetEnum = mysqlEnum('feeTarget', ['ALL_MEMBERS', 'OFFICIALS']);

// Burial Enums
export const burialRequestStatusEnum = mysqlEnum('status', ['PENDING', 'APPROVED_UNPAID', 'PAID', 'BURIAL_DONE', 'REJECTED']);
export const documentTypeEnum = mysqlEnum('documentType', ['ID_CARD', 'CERTIFICATE', 'PHOTO', 'CONTRACT', 'REPORT', 'MINUTES', 'OTHER']);
export const emailStatusEnum = mysqlEnum('status', ['PENDING', 'SENT', 'FAILED', 'BOUNCED']);
export const notificationTypeEnum = mysqlEnum('type', ['INFO', 'SUCCESS', 'WARNING', 'ERROR']);
export const postTypeEnum = mysqlEnum('postType', ['NEWS', 'EVENT', 'ANNOUNCEMENT']);

// Finance Enums
export const budgetStatusEnum = mysqlEnum('status', ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']);
export const requestStatusEnum = mysqlEnum('status', ['PENDING', 'RECOMMENDED', 'APPROVED', 'DISBURSED', 'REJECTED']);
export const transactionTypeEnum = mysqlEnum('type', ['INFLOW', 'OUTFLOW']);

// Programme Enums
export const programmeStatusEnum = mysqlEnum('status', ['DRAFT', 'PENDING_STATE', 'PENDING_NATIONAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']);
export const targetAudienceEnum = mysqlEnum('targetAudience', ['PUBLIC', 'MEMBERS', 'BROTHERS', 'SISTERS', 'CHILDREN', 'YOUTH', 'ELDERS']);
export const registrationStatusEnum = mysqlEnum('status', ['REGISTERED', 'PAID', 'ATTENDED', 'CANCELLED']);
export const programmeFormatEnum = mysqlEnum('format', ['PHYSICAL', 'VIRTUAL', 'HYBRID']);
export const programmeFrequencyEnum = mysqlEnum('frequency', ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUALLY', 'ANNUALLY', 'ONCE']);

// Asset Enums
export const assetCategoryEnum = mysqlEnum('category', ['FURNITURE', 'ELECTRONICS', 'VEHICLE', 'PROPERTY', 'EQUIPMENT', 'OTHER']);
export const assetConditionEnum = mysqlEnum('condition', ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'LOST']);
export const assetStatusEnum = mysqlEnum('status', ['ACTIVE', 'IN_MAINTENANCE', 'DISPOSED', 'STOLEN', 'ARCHIVED']);
export const specialProgrammeCategoryEnum = mysqlEnum('specialProgrammeCategory', ['TESKIYAH_WORKSHOP', 'FRIDAY_KHUTHBAH', 'PRESS_RELEASE', 'STATE_OF_THE_NATION', 'OTHER']);
export const specialProgrammeFileTypeEnum = mysqlEnum('specialProgrammeFileType', ['AUDIO', 'VIDEO', 'DOCUMENT', 'OTHER']);
export const maintenanceTypeEnum = mysqlEnum('maintenanceType', ['REPAIR', 'SERVICE', 'INSPECTION', 'UPGRADE']);
export const campaignStatusEnum = mysqlEnum('status', ['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']);
export const reportTypeEnum = mysqlEnum('reportType', ['MONTHLY_ACTIVITY', 'QUARTERLY_STATE', 'ANNUAL_CONGRESS', 'FINANCIAL']);
export const reportStatusEnum = mysqlEnum('reportStatus', ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']);
export const settingsCategoryEnum = mysqlEnum('category', ['EMAIL', 'NOTIFICATION', 'GENERAL', 'AI']);
export const messageTypeEnum = mysqlEnum('type', ['TEXT', 'IMAGE', 'E2AE']); // Added E2AE for encrypted

// Meeting / Broadcast Enums
export const meetingStatusEnum = mysqlEnum('meetingStatus', ['SCHEDULED', 'ONGOING', 'ENDED', 'CANCELLED']);
export const meetingAttendanceStatusEnum = mysqlEnum('meetingAttendanceStatus', ['INVITED', 'PRESENT', 'ABSENT', 'EXCUSED']);
export const meetingDocTypeEnum = mysqlEnum('meetingDocType', ['AGENDA', 'MINUTES', 'MEMBER_REPORT', 'OTHER']);
export const meetingDocSubmissionStatusEnum = mysqlEnum('meetingDocSubmissionStatus', ['ON_TIME', 'LATE']);
export const broadcastTargetLevelEnum = mysqlEnum('broadcastTargetLevel', ['NATIONAL', 'STATE', 'LOCAL_GOVERNMENT', 'BRANCH']);


// Users
export const users = mysqlTable("users", {
    id: varchar("id", { length: 255 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: timestamp("emailVerified", { mode: "date", fsp: 3 }),
    image: varchar("image", { length: 255 }),
    password: varchar("password", { length: 255 }),
    phone: varchar("phone", { length: 255 }),
    country: varchar("country", { length: 255 }),
    address: varchar("address", { length: 255 }),
    // E2EE Fields
    publicKey: text("publicKey"),
    encryptedPrivateKey: text("encryptedPrivateKey"),
    salt: varchar("salt", { length: 255 }),
    encryptedPrivateKeyRecovery: text("encryptedPrivateKeyRecovery"),
    recoveryKeyHash: varchar("recoveryKeyHash", { length: 255 }),

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// NextAuth Accounts
export const accounts = mysqlTable("accounts", {
    userId: varchar("userId", { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).$type<AdapterAccountType>().notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
}, (account) => ({
    compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
    }),
}));

// NextAuth Sessions
export const sessions = mysqlTable("sessions", {
    sessionToken: varchar("sessionToken", { length: 255 }).primaryKey(),
    userId: varchar("userId", { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date", fsp: 3 }).notNull(),
});

// NextAuth Verification Tokens
export const verificationTokens = mysqlTable("verification_tokens", {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date", fsp: 3 }).notNull(),
}, (vt) => ({
    compoundKey: primaryKey({
        columns: [vt.identifier, vt.token],
    }),
}));

// Organizations
export const organizations = mysqlTable("organizations", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 255 }).notNull(),
    level: orgLevelEnum.notNull(),
    code: varchar("code", { length: 255 }).notNull().unique(), // Should be unique
    parentId: varchar("parentId", { length: 255 }), // Self relation needs explicit handling in query usually, references organizations.id
    description: text("description"),
    address: varchar("address", { length: 255 }),
    city: varchar("city", { length: 255 }),
    state: varchar("state", { length: 255 }),
    country: varchar("country", { length: 255 }).default("Nigeria"),
    phone: varchar("phone", { length: 255 }),
    email: varchar("email", { length: 255 }),
    // Planning Settings
    planningDeadlineMonth: int("planningDeadlineMonth").default(12), // 1-12
    planningDeadlineDay: int("planningDeadlineDay").default(12), // 1-31
    website: varchar("website", { length: 255 }),
    // CMS Fields
    welcomeMessage: text("welcomeMessage"),
    welcomeImageUrl: varchar("welcomeImageUrl", { length: 500 }),
    googleMapUrl: text("googleMapUrl"), // Can be long for iframes
    socialLinks: json("socialLinks"), // { facebook: string, twitter: string, etc. }

    // CMS Fields
    missionText: text("missionText"),
    visionText: text("visionText"),
    whatsapp: varchar("whatsapp", { length: 255 }),
    officeHours: varchar("officeHours", { length: 255 }),
    sliderImages: json("sliderImages"),

    // Paystack Subaccount Integration
    paystackSubaccountCode: varchar("paystackSubaccountCode", { length: 255 }),
    bankName: varchar("bankName", { length: 255 }),
    accountNumber: varchar("accountNumber", { length: 255 }),
    bankCode: varchar("bankCode", { length: 255 }),

    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Galleries
export const galleries = mysqlTable("galleries", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Gallery Images
export const galleryImages = mysqlTable("gallery_images", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    galleryId: varchar("galleryId", { length: 255 }).notNull().references(() => galleries.id, { onDelete: "cascade" }),
    imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
    caption: varchar("caption", { length: 255 }),
    order: int("order").default(0),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Posts
export const posts = mysqlTable("posts", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
    authorId: varchar("authorId", { length: 255 }).notNull().references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    coverImage: varchar("coverImage", { length: 500 }),
    postType: postTypeEnum.default('NEWS'),
    isPublished: boolean("isPublished").default(false),
    publishedAt: timestamp("publishedAt", { mode: "date", fsp: 3 }),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),

});

// ID Generation Tables
export const jurisdictionCodes = mysqlTable("jurisdiction_codes", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    type: mysqlEnum('type', ['COUNTRY', 'STATE']).notNull(),
    name: varchar("name", { length: 255 }).notNull(), // Nigeria, Lagos
    code: varchar("code", { length: 255 }).notNull(), // 01, 01
    parentId: varchar("parentId", { length: 255 }), // Link State to Country (optional for Country)
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

export const memberIdSequences = mysqlTable("member_id_sequences", {
    key: varchar("key", { length: 255 }).primaryKey(), // e.g. "01-01" (CountryCode-StateCode)
    lastSerial: int("lastSerial").notNull().default(0),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Members
export const members = mysqlTable("members", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id),
    memberId: varchar("memberId", { length: 255 }).unique(),
    status: memberStatusEnum.default('PENDING'),
    membershipType: membershipTypeEnum.default('REGULAR'),
    dateJoined: timestamp("dateJoined", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    dateExpired: timestamp("dateExpired", { mode: "date", fsp: 3 }),
    isActive: boolean("isActive").default(true),
    dateOfBirth: timestamp("dateOfBirth", { mode: "date", fsp: 3 }),
    gender: genderEnum,
    occupation: varchar("occupation", { length: 255 }),
    address: varchar("address", { length: 255 }),
    emergencyContact: varchar("emergencyContact", { length: 255 }),
    emergencyPhone: varchar("emergencyPhone", { length: 255 }),
    metadata: json("metadata"),
    recommendedBy: varchar("recommendedBy", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
    recommendedAt: timestamp("recommendedAt", { mode: "date", fsp: 3 }),
    approvedBy: varchar("approvedBy", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approvedAt", { mode: "date", fsp: 3 }),
    rejectionReason: text("rejectionReason"),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Officials
export const officials = mysqlTable("officials", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id),
    position: varchar("position", { length: 255 }).notNull(),
    positionLevel: officialLevelEnum.notNull(),
    dateElected: timestamp("dateElected", { mode: "date", fsp: 3 }),
    dateAppointed: timestamp("dateAppointed", { mode: "date", fsp: 3 }),
    termStart: timestamp("termStart", { mode: "date", fsp: 3 }).notNull(),
    termEnd: timestamp("termEnd", { mode: "date", fsp: 3 }),
    image: varchar("image", { length: 500 }),
    bio: text("bio"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Offices
export const offices = mysqlTable("offices", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(), // e.g. "Dawah", "Education", "Secretary"
    description: text("description"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Roles
export const roles = mysqlTable("roles", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 255 }).unique().notNull(),
    code: varchar("code", { length: 255 }).unique().notNull(),
    description: text("description"),
    jurisdictionLevel: jurisdictionLevelEnum.notNull(),
    isSystem: boolean("isSystem").default(false),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Permissions
export const permissions = mysqlTable("permissions", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    code: varchar("code", { length: 255 }).unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 255 }).notNull(),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// User Roles Junction
export const userRoles = mysqlTable("user_roles", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: varchar("roleId", { length: 255 }).notNull().references(() => roles.id, { onDelete: "cascade" }),
    organizationId: varchar("organizationId", { length: 255 }).references(() => organizations.id, { onDelete: "cascade" }),
    assignedBy: varchar("assignedBy", { length: 255 }),
    assignedAt: timestamp("assignedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    expiresAt: timestamp("expiresAt", { mode: "date", fsp: 3 }),
    isActive: boolean("isActive").default(true),
    metadata: json("metadata"),
}); // Index handling is implicit or can be added via 3rd arg

// Role Permissions Junction
export const rolePermissions = mysqlTable("role_permissions", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    roleId: varchar("roleId", { length: 255 }).notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: varchar("permissionId", { length: 255 }).notNull().references(() => permissions.id, { onDelete: "cascade" }),
    granted: boolean("granted").default(true),
    grantedAt: timestamp("grantedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    grantedBy: varchar("grantedBy", { length: 255 }),
});

// Payments
export const payments = mysqlTable("payments", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
    organizationId: varchar("organizationId", { length: 255 }).references(() => organizations.id, { onDelete: "set null" }),
    memberId: varchar("memberId", { length: 255 }).references(() => members.id, { onDelete: "set null" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 255 }).default("NGN"),
    status: paymentStatusEnum.default('PENDING'),
    paymentType: paymentTypeEnum.notNull(),
    paystackRef: varchar("paystackRef", { length: 255 }).unique(),
    paystackResponse: json("paystackResponse"),
    description: varchar("description", { length: 255 }),
    metadata: json("metadata"),
    paidAt: timestamp("paidAt", { mode: "date", fsp: 3 }),
    campaignId: varchar("campaignId", { length: 255 }).references(() => fundraisingCampaigns.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Fundraising Campaigns
export const fundraisingCampaigns = mysqlTable("fundraising_campaigns", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).default("0.00"),
    raisedAmount: decimal("raisedAmount", { precision: 15, scale: 2 }).default("0.00"),
    startDate: timestamp("startDate", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    endDate: timestamp("endDate", { mode: "date", fsp: 3 }),
    status: campaignStatusEnum.default('ACTIVE'),
    coverImage: varchar("coverImage", { length: 500 }),
    allowCustomAmount: boolean("allowCustomAmount").default(true),
    suggestedAmounts: json("suggestedAmounts"),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
}, (t) => ({
    orgSlugIdx: uniqueIndex("campaign_org_slug_idx").on(t.organizationId, t.slug),
}));

// Documents
export const documents = mysqlTable("documents", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
    organizationId: varchar("organizationId", { length: 255 }).references(() => organizations.id, { onDelete: "set null" }),
    memberId: varchar("memberId", { length: 255 }).references(() => members.id, { onDelete: "set null" }),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileType: varchar("fileType", { length: 255 }).notNull(),
    fileSize: int("fileSize").notNull(),
    fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
    documentType: documentTypeEnum.notNull(),
    description: varchar("description", { length: 255 }),
    isPublic: boolean("isPublic").default(false),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Audit Logs
export const auditLogs = mysqlTable("audit_logs", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entityType", { length: 255 }).notNull(),
    entityId: varchar("entityId", { length: 255 }),
    organizationId: varchar("organizationId", { length: 255 }),
    description: varchar("description", { length: 500 }),
    ipAddress: varchar("ipAddress", { length: 255 }),
    userAgent: varchar("userAgent", { length: 255 }),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Site Visitor Tracking
export const siteVisits = mysqlTable("site_visits", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    visitorId: varchar("visitorId", { length: 255 }).notNull(),
    sessionId: varchar("sessionId", { length: 255 }).notNull(),
    path: varchar("path", { length: 500 }).notNull(),
    userId: varchar("userId", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
    userAgent: text("userAgent"),
    ip: varchar("ip", { length: 255 }),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Email Logs
export const emailLogs = mysqlTable("email_logs", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    to: varchar("to", { length: 255 }).notNull(),
    from: varchar("from", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    template: varchar("template", { length: 255 }),
    status: emailStatusEnum.default('PENDING'),
    provider: varchar("provider", { length: 255 }),
    providerId: varchar("providerId", { length: 255 }),
    error: text("error"),
    metadata: json("metadata"),
    sentAt: timestamp("sentAt", { mode: "date", fsp: 3 }),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// System Settings
export const systemSettings = mysqlTable("system_settings", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
    settingValue: text("settingValue"),
    category: settingsCategoryEnum.notNull(),
    isEncrypted: boolean("isEncrypted").default(false),
    description: varchar("description", { length: 500 }),
    updatedBy: varchar("updatedBy", { length: 255 }),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Email Templates
export const emailTemplates = mysqlTable("email_templates", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    templateKey: varchar("templateKey", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    htmlBody: text("htmlBody").notNull(),
    textBody: text("textBody"),
    variables: json("variables"),
    description: varchar("description", { length: 500 }),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Notifications
export const notifications = mysqlTable("notifications", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: notificationTypeEnum.default('INFO'),
    isRead: boolean("isRead").default(false),
    actionUrl: varchar("actionUrl", { length: 500 }),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Chat System Tables
export const chats = mysqlTable("chats", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 255 }),
    isGroup: boolean("isGroup").default(false),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

export const chatParticipants = mysqlTable("chat_participants", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    chatId: varchar("chatId", { length: 255 }).notNull().references(() => chats.id, { onDelete: "cascade" }),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    isAdmin: boolean("isAdmin").default(false),
    joinedAt: timestamp("joinedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
}, (t) => ({
    uniqueParticipant: uniqueIndex("chat_participants_unique_idx").on(t.chatId, t.userId),
}));

export const messages = mysqlTable("messages", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    chatId: varchar("chatId", { length: 255 }).notNull().references(() => chats.id, { onDelete: "cascade" }),
    senderId: varchar("senderId", { length: 255 }).notNull().references(() => users.id),
    content: text("content"),
    mediaUrl: varchar("mediaUrl", { length: 500 }),
    readBy: json("readBy"),
    // E2EE
    type: messageTypeEnum.default('TEXT'),
    encryptedKeys: json("encryptedKeys"), // { userId: encryptedSymmetricKey }

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Broadcast Messages
export const broadcasts = mysqlTable("broadcasts", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    senderId: varchar("senderId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    media: json("media"), // Array of { type: 'image' | 'audio' | 'video', url: string }
    targetLevel: orgLevelEnum.notNull(),
    targetId: varchar("targetId", { length: 255 }), // Organization ID. If National && targetLevel=National, targetId might be the National Org ID.
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Broadcast Relations
export const broadcastsRelations = relations(broadcasts, ({ one }) => ({
    sender: one(users, {
        fields: [broadcasts.senderId],
        references: [users.id],
    }),
    targetOrganization: one(organizations, {
        fields: [broadcasts.targetId],
        references: [organizations.id],
    }),
}));





// Chat Relations
export const chatsRelations = relations(chats, ({ many }) => ({
    participants: many(chatParticipants),
    messages: many(messages),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
    chat: one(chats, {
        fields: [chatParticipants.chatId],
        references: [chats.id],
    }),
    user: one(users, {
        fields: [chatParticipants.userId],
        references: [users.id],
    }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    chat: one(chats, {
        fields: [messages.chatId],
        references: [chats.id],
    }),
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
    memberProfile: one(members, {
        fields: [users.id],
        references: [members.userId],
    }),
    officialProfile: one(officials, {
        fields: [users.id],
        references: [officials.userId],
    }),
    userRoles: many(userRoles),
    auditLogs: many(auditLogs),
    documents: many(documents),
    payments: many(payments),
    notifications: many(notifications),
    posts: many(posts),
    chats: many(chatParticipants),
    messagesSent: many(messages),
    assets: many(assets),
    burialRequests: many(burialRequests),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
    parent: one(organizations, {
        fields: [organizations.parentId],
        references: [organizations.id],
        relationName: "OrgHierarchy",
    }),
    children: many(organizations, {
        relationName: "OrgHierarchy",
    }),
    members: many(members),
    officials: many(officials),
    userRoles: many(userRoles),
    documents: many(documents),
    payments: many(payments),
    galleries: many(galleries),
    posts: many(posts),
    chats: many(chatParticipants),
    messagesSent: many(messages),
    assets: many(assets),
    budgets: many(financeBudgets),
    fundRequests: many(financeFundRequests),
    transactions: many(financeTransactions),
    pages: many(pages),
    navigationItems: many(navigationItems),
    campaigns: many(fundraisingCampaigns),
}));

export const galleriesRelations = relations(galleries, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [galleries.organizationId],
        references: [organizations.id],
    }),
    images: many(galleryImages),
}));

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
    gallery: one(galleries, {
        fields: [galleryImages.galleryId],
        references: [galleries.id],
    }),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
    user: one(users, {
        fields: [members.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [members.organizationId],
        references: [organizations.id],
    }),
    recommender: one(users, {
        fields: [members.recommendedBy],
        references: [users.id],
    }),
    approver: one(users, {
        fields: [members.approvedBy],
        references: [users.id],
    }),
    payments: many(payments),
    documents: many(documents),
}));

export const officialsRelations = relations(officials, ({ one }) => ({
    user: one(users, {
        fields: [officials.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [officials.organizationId],
        references: [organizations.id],
    }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
    rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
    rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, {
        fields: [userRoles.userId],
        references: [users.id],
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id],
    }),
    organization: one(organizations, {
        fields: [userRoles.organizationId],
        references: [organizations.id],
    }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, {
        fields: [rolePermissions.roleId],
        references: [roles.id],
    }),
    permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id],
    }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    member: one(members, {
        fields: [payments.memberId],
        references: [members.id],
    }),
    user: one(users, {
        fields: [payments.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [payments.organizationId],
        references: [organizations.id],
    }),
    burialRequest: one(burialRequests, {
        fields: [payments.id],
        references: [burialRequests.paymentId],
    }),
    campaign: one(fundraisingCampaigns, {
        fields: [payments.campaignId],
        references: [fundraisingCampaigns.id],
    }),
}));

export const fundraisingCampaignsRelations = relations(fundraisingCampaigns, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [fundraisingCampaigns.organizationId],
        references: [organizations.id],
    }),
    donations: many(payments),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
    organization: one(organizations, {
        fields: [posts.organizationId],
        references: [organizations.id],
    }),
    author: one(users, {
        fields: [posts.authorId],
        references: [users.id],
    }),
}));

export const siteVisitsRelations = relations(siteVisits, ({ one }) => ({
    user: one(users, {
        fields: [siteVisits.userId],
        references: [users.id],
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [auditLogs.organizationId],
        references: [organizations.id],
    }),
}));

// Adhkar Centres
export const adhkarCentres = mysqlTable("adhkar_centres", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 255 }).notNull(),
    venue: varchar("venue", { length: 255 }).notNull(),
    address: text("address").notNull(),
    time: varchar("time", { length: 255 }).notNull(), // e.g. "Sundays 4pm"
    contactNumber: varchar("contactNumber", { length: 255 }),
    state: varchar("state", { length: 255 }).notNull(),
    lga: varchar("lga", { length: 255 }).notNull(),
    organizationId: varchar("organizationId", { length: 255 }), // Optional link to specific org unit
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

export const teskiyahCentres = mysqlTable("teskiyah_centres", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 255 }).notNull(),
    venue: varchar("venue", { length: 255 }).notNull(),
    address: text("address").notNull(),
    time: varchar("time", { length: 255 }).notNull(), // Corresponds to dateTime in user snippet
    contactNumber: varchar("contactNumber", { length: 255 }),
    state: varchar("state", { length: 255 }).notNull(),
    lga: varchar("lga", { length: 255 }).notNull(),
    branch: varchar("branch", { length: 255 }), // Specific to Teskiyah
    organizationId: varchar("organizationId", { length: 255 }),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Navigation Items
export const navigationItems = mysqlTable("navigation_items", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).references(() => organizations.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 255 }).notNull(),
    path: varchar("path", { length: 255 }), // Nullable for dropdown parents
    parentId: varchar("parentId", { length: 255 }), // Self-reference manually handled
    order: int("order").notNull().default(0),
    type: mysqlEnum('type', ['link', 'dropdown', 'button']).default('link'),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});



// Occasions (Engagement Module)
export const occasionTypes = mysqlTable("occasion_types", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 255 }).notNull().unique(), // Nikkah, Naming, etc.
    certificateFee: decimal("certificateFee", { precision: 10, scale: 2 }).default("0.00"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

export const occasionRequests = mysqlTable("occasion_requests", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    typeId: varchar("typeId", { length: 255 }).notNull().references(() => occasionTypes.id),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id),

    date: timestamp("date", { mode: "date", fsp: 3 }).notNull(),
    time: varchar("time", { length: 255 }).notNull(), // e.g. "10:00 AM"
    venue: varchar("venue", { length: 255 }).notNull(),
    address: text("address").notNull(),

    role: mysqlEnum('role', ['COORDINATING', 'WITNESS']).notNull(),
    certificateNeeded: boolean("certificateNeeded").default(false),

    status: mysqlEnum('status', ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED']).default('PENDING'),
    paymentStatus: paymentStatusEnum.default('PENDING'),
    amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"), // Fee to pay

    details: json("details"), // { husbandName, wifeName, babyName, etc. }
    certificateNo: varchar("certificateNo", { length: 255 }), // Generated upon approval/completion

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});



// Meetings Module
export const meetings = mysqlTable("meetings", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id),
    scheduledAt: timestamp("scheduledAt", { mode: "date", fsp: 3 }).notNull(), // Start Time
    endAt: timestamp("endAt", { mode: "date", fsp: 3 }), // Expected End Time (optional)
    venue: varchar("venue", { length: 255 }), // Physical or Online Link
    isOnline: boolean("isOnline").default(false),
    meetingLink: varchar("meetingLink", { length: 500 }),

    status: mysqlEnum('status', ['SCHEDULED', 'ONGOING', 'ENDED', 'CANCELLED']).default('SCHEDULED'),
    createdBy: varchar("createdBy", { length: 255 }).notNull().references(() => users.id),

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

export const meetingAttendances = mysqlTable("meeting_attendances", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    meetingId: varchar("meetingId", { length: 255 }).notNull().references(() => meetings.id, { onDelete: "cascade" }),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),

    status: mysqlEnum('status', ['INVITED', 'ACCEPTED', 'DECLINED', 'PRESENT', 'ABSENT']).default('INVITED'),

    joinedAt: timestamp("joinedAt", { mode: "date", fsp: 3 }), // Digital check-in
    leftAt: timestamp("leftAt", { mode: "date", fsp: 3 }), // Digital check-out

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
}, (t) => ({
    unq: uniqueIndex("meeting_attendance_unique").on(t.meetingId, t.userId),
}));

export const meetingDocs = mysqlTable("meeting_docs", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    meetingId: varchar("meetingId", { length: 255 }).notNull().references(() => meetings.id, { onDelete: "cascade" }),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id), // Uploader

    title: varchar("title", { length: 255 }).notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    type: mysqlEnum('type', ['AGENDA', 'MINUTES', 'MEMBER_REPORT', 'OTHER']).default('OTHER'),
    submissionStatus: mysqlEnum('submissionStatus', ['ON_TIME', 'LATE']).default('ON_TIME'),

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Generic CMS Pages
export const pages = mysqlTable("pages", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 255 }).notNull(), // Unique per org
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"), // Long text for HTML content
    isPublished: boolean("isPublished").default(false),
    metadata: json("metadata"), // SEO Title, Description, OG Image etc.
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
}, (t) => ({
    orgSlugIdx: uniqueIndex("org_slug_idx").on(t.organizationId, t.slug),
}));

// Programmes
export const programmes = mysqlTable("programmes", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    venue: varchar("venue", { length: 255 }).notNull(),
    startDate: timestamp("startDate", { mode: "date", fsp: 3 }).notNull(),
    endDate: timestamp("endDate", { mode: "date", fsp: 3 }),
    time: varchar("time", { length: 255 }), // e.g. "10:00 AM"
    level: orgLevelEnum.notNull(), // Derived from org level at creation
    targetAudience: targetAudienceEnum.default('PUBLIC'),

    status: programmeStatusEnum.default('DRAFT'),

    // Approval Workflow
    approvedStateBy: varchar("approvedStateBy", { length: 255 }).references(() => users.id),
    approvedStateAt: timestamp("approvedStateAt", { mode: "date", fsp: 3 }),
    approvedNationalBy: varchar("approvedNationalBy", { length: 255 }).references(() => users.id),
    approvedNationalAt: timestamp("approvedNationalAt", { mode: "date", fsp: 3 }),

    organizingOfficeId: varchar("organizingOfficeId", { length: 255 }).references(() => offices.id),
    // Year Planner Fields
    format: programmeFormatEnum.default('PHYSICAL'),
    frequency: programmeFrequencyEnum.default('ONCE'),
    objectives: text("objectives"),
    budget: decimal("budget", { precision: 15, scale: 2 }).default("0.00"),
    committee: varchar("committee", { length: 255 }),
    additionalInfo: text("additionalInfo"),

    isLateSubmission: boolean("isLateSubmission").default(false),

    paymentRequired: boolean("paymentRequired").default(false),
    amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"),
    hasCertificate: boolean("hasCertificate").default(false),

    createdBy: varchar("createdBy", { length: 255 }).notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Programme Registrations
export const programmeRegistrations = mysqlTable("programme_registrations", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    programmeId: varchar("programmeId", { length: 255 }).notNull().references(() => programmes.id, { onDelete: "cascade" }),
    userId: varchar("userId", { length: 255 }).references(() => users.id, { onDelete: "set null" }), // Can be non-member user
    memberId: varchar("memberId", { length: 255 }).references(() => members.id, { onDelete: "set null" }), // Linked member profile if exists

    name: varchar("name", { length: 255 }).notNull(), // Snapshot in case user deleted
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 255 }),

    status: registrationStatusEnum.default('REGISTERED'),
    paymentReference: varchar("paymentReference", { length: 255 }), // Paystack Ref
    certificateUrl: varchar("certificateUrl", { length: 500 }),
    certificateIssuedAt: timestamp("certificateIssuedAt", { mode: "date", fsp: 3 }),

    registeredAt: timestamp("registeredAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Programme Reports
export const programmeReports = mysqlTable("programme_reports", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    programmeId: varchar("programmeId", { length: 255 }).notNull().unique().references(() => programmes.id, { onDelete: "cascade" }),

    summary: text("summary").notNull(),
    challenges: text("challenges"),
    comments: text("comments"),

    attendeesMale: int("attendeesMale").default(0),
    attendeesFemale: int("attendeesFemale").default(0),
    amountSpent: decimal("amountSpent", { precision: 15, scale: 2 }).default("0.00"), // Expenses for the event

    images: json("images"), // Array of image URLs

    submittedBy: varchar("submittedBy", { length: 255 }).notNull().references(() => users.id),
    submittedAt: timestamp("submittedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Finance Budgets
export const financeBudgets = mysqlTable("finance_budgets", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id),
    year: int("year").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull().default("0.00"),
    status: budgetStatusEnum.default('DRAFT'),
    createdBy: varchar("createdBy", { length: 255 }).notNull().references(() => users.id),
    approvedBy: varchar("approvedBy", { length: 255 }).references(() => users.id),
    approvedAt: timestamp("approvedAt", { mode: "date", fsp: 3 }),
    comments: text("comments"),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Finance Budget Items
export const financeBudgetItems = mysqlTable("finance_budget_items", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    budgetId: varchar("budgetId", { length: 255 }).notNull().references(() => financeBudgets.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 255 }).notNull(),
    description: varchar("description", { length: 500 }).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Finance Fund Requests
export const financeFundRequests = mysqlTable("finance_fund_requests", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id),
    requesterId: varchar("requesterId", { length: 255 }).notNull().references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    status: requestStatusEnum.default('PENDING'),

    // Approval Flow
    recommendedBy: varchar("recommendedBy", { length: 255 }).references(() => users.id), // Finance Officer
    recommendedAt: timestamp("recommendedAt", { mode: "date", fsp: 3 }),
    approvedBy: varchar("approvedBy", { length: 255 }).references(() => users.id), // Head
    approvedAt: timestamp("approvedAt", { mode: "date", fsp: 3 }),
    disbursedBy: varchar("disbursedBy", { length: 255 }).references(() => users.id), // Finance Officer releases funds
    disbursedAt: timestamp("disbursedAt", { mode: "date", fsp: 3 }),

    rejectionReason: text("rejectionReason"),
    evidenceUrl: varchar("evidenceUrl", { length: 500 }), // Receipt/Invoice
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Finance Transactions (Ledger)
export const financeTransactions = mysqlTable("finance_transactions", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id),
    type: transactionTypeEnum.notNull(), // INFLOW or OUTFLOW
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    category: varchar("category", { length: 255 }).notNull(),
    description: varchar("description", { length: 500 }).notNull(),

    // Audit
    performedBy: varchar("performedBy", { length: 255 }).notNull().references(() => users.id),
    date: timestamp("date", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),

    // Link to request if OUTFLOW
    relatedRequestId: varchar("relatedRequestId", { length: 255 }).references(() => financeFundRequests.id),

    metadata: json("metadata"), // Bank details, transaction ref etc.
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Relations for Finance
export const financeBudgetsRelations = relations(financeBudgets, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [financeBudgets.organizationId],
        references: [organizations.id],
    }),
    creator: one(users, {
        fields: [financeBudgets.createdBy],
        references: [users.id],
    }),
    approver: one(users, {
        fields: [financeBudgets.approvedBy],
        references: [users.id],
    }),
    items: many(financeBudgetItems),
}));

export const financeBudgetItemsRelations = relations(financeBudgetItems, ({ one }) => ({
    budget: one(financeBudgets, {
        fields: [financeBudgetItems.budgetId],
        references: [financeBudgets.id],
    }),
}));

export const financeFundRequestsRelations = relations(financeFundRequests, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [financeFundRequests.organizationId],
        references: [organizations.id],
    }),
    requester: one(users, {
        fields: [financeFundRequests.requesterId],
        references: [users.id],
    }),
    transaction: one(financeTransactions, {
        fields: [financeFundRequests.id],
        references: [financeTransactions.relatedRequestId],
    }),
    approverUser: one(users, {
        fields: [financeFundRequests.approvedBy],
        references: [users.id],
    }),
}));

export const financeTransactionsRelations = relations(financeTransactions, ({ one }) => ({
    organization: one(organizations, {
        fields: [financeTransactions.organizationId],
        references: [organizations.id],
    }),
    performer: one(users, {
        fields: [financeTransactions.performedBy],
        references: [users.id],
    }),
    request: one(financeFundRequests, {
        fields: [financeTransactions.relatedRequestId],
        references: [financeFundRequests.id],
    }),
}));

// Asset Tables
export const assets = mysqlTable("assets", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    serialNumber: varchar("serialNumber", { length: 255 }),
    category: assetCategoryEnum.notNull(),
    condition: assetConditionEnum.default('GOOD'),
    status: assetStatusEnum.default('ACTIVE'),

    purchaseDate: timestamp("purchaseDate", { mode: "date", fsp: 3 }),
    purchasePrice: decimal("purchasePrice", { precision: 15, scale: 2 }).default("0.00"),
    currentValue: decimal("currentValue", { precision: 15, scale: 2 }).default("0.00"),

    location: text("location"),
    custodianId: varchar("custodianId", { length: 255 }).references(() => users.id), // User responsible

    // Metadata
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

export const assetMaintenanceLogs = mysqlTable("asset_maintenance_logs", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    assetId: varchar("assetId", { length: 255 }).notNull().references(() => assets.id, { onDelete: "cascade" }),
    type: maintenanceTypeEnum.notNull(),
    description: text("description").notNull(),
    cost: decimal("cost", { precision: 15, scale: 2 }).default("0.00"),
    date: timestamp("date", { mode: "date", fsp: 3 }).notNull(),
    performedBy: varchar("performedBy", { length: 255 }), // Name of technician/company
    nextServiceDate: timestamp("nextServiceDate", { mode: "date", fsp: 3 }),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Asset Relations
export const assetsRelations = relations(assets, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [assets.organizationId],
        references: [organizations.id],
    }),
    custodian: one(users, {
        fields: [assets.custodianId],
        references: [users.id],
    }),
    maintenanceLogs: many(assetMaintenanceLogs),
}));

export const assetMaintenanceLogsRelations = relations(assetMaintenanceLogs, ({ one }) => ({
    asset: one(assets, {
        fields: [assetMaintenanceLogs.assetId],
        references: [assets.id],
    }),
}));

// Burial Management Tables
export const burialRequests = mysqlTable("burial_requests", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),

    deceasedName: varchar("deceasedName", { length: 255 }).notNull(),
    relationship: varchar("relationship", { length: 255 }).notNull(),
    causeOfDeath: varchar("causeOfDeath", { length: 255 }).notNull(),
    dateOfDeath: timestamp("dateOfDeath", { mode: "date", fsp: 3 }).notNull(),
    placeOfDeath: varchar("placeOfDeath", { length: 255 }).notNull(),

    contactPhone: varchar("contactPhone", { length: 255 }).notNull(),
    contactEmail: varchar("contactEmail", { length: 255 }).notNull(),

    status: burialRequestStatusEnum.default('PENDING'),
    rejectionReason: text("rejectionReason"),

    paymentId: varchar("paymentId", { length: 255 }).references(() => payments.id), // One-to-one

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
}, (request) => ({
    uniquePayment: uniqueIndex("burial_requests_payment_unique").on(request.paymentId)
}));

export const burialCertificates = mysqlTable("burial_certificates", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    burialRequestId: varchar("burialRequestId", { length: 255 }).notNull().references(() => burialRequests.id, { onDelete: "cascade" }),

    certificateNumber: varchar("certificateNumber", { length: 255 }).notNull(),
    issuedAt: timestamp("issuedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    issuedBy: varchar("issuedBy", { length: 255 }), // Admin ID

    pdfUrl: varchar("pdfUrl", { length: 500 }),

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
}, (cert) => ({
    uniqueBurialRequest: uniqueIndex("burial_certificates_request_unique").on(cert.burialRequestId),
    uniqueCertNumber: uniqueIndex("burial_certificates_number_unique").on(cert.certificateNumber)
}));

// Burial Relations
export const burialRequestsRelations = relations(burialRequests, ({ one, many }) => ({
    user: one(users, {
        fields: [burialRequests.userId],
        references: [users.id],
    }),
    payment: one(payments, {
        fields: [burialRequests.paymentId],
        references: [payments.id],
    }),
    certificate: one(burialCertificates, {
        fields: [burialRequests.id],
        references: [burialCertificates.burialRequestId],
    }),
}));

export const burialCertificatesRelations = relations(burialCertificates, ({ one }) => ({
    burialRequest: one(burialRequests, {
        fields: [burialCertificates.burialRequestId],
        references: [burialRequests.id],
    }),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
    organization: one(organizations, {
        fields: [pages.organizationId],
        references: [organizations.id],
    }),
}));

export const navigationItemsRelations = relations(navigationItems, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [navigationItems.organizationId],
        references: [organizations.id],
    }),
    parent: one(navigationItems, {
        fields: [navigationItems.parentId],
        references: [navigationItems.id],
        relationName: "NavHierarchy",
    }),
    children: many(navigationItems, {
        relationName: "NavHierarchy",
    }),
}));

// Promotion Plans
export const promotionPlans = mysqlTable("promotion_plans", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 255 }).notNull(), // e.g. "1 Week"
    durationDays: int("durationDays").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    description: text("description"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Promotions
export const promotions = mysqlTable("promotions", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    planId: varchar("planId", { length: 255 }).notNull().references(() => promotionPlans.id),

    title: varchar("title", { length: 255 }).notNull(),
    imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
    link: varchar("link", { length: 500 }), // Optional redirect link

    status: mysqlEnum('status', ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED']).default('PENDING'),
    paymentStatus: mysqlEnum('paymentStatus', ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED']).default('PENDING'),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(), // Recorded at time of request

    startDate: timestamp("startDate", { mode: "date", fsp: 3 }),
    endDate: timestamp("endDate", { mode: "date", fsp: 3 }),

    approvedBy: varchar("approvedBy", { length: 255 }).references(() => users.id),
    approvedAt: timestamp("approvedAt", { mode: "date", fsp: 3 }),
    rejectionReason: text("rejectionReason"),

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Promotion Relations
export const promotionPlansRelations = relations(promotionPlans, ({ many }) => ({
    promotions: many(promotions),
}));

export const promotionsRelations = relations(promotions, ({ one }) => ({
    user: one(users, {
        fields: [promotions.userId],
        references: [users.id],
    }),
    plan: one(promotionPlans, {
        fields: [promotions.planId],
        references: [promotionPlans.id],
    }),
    approver: one(users, {
        fields: [promotions.approvedBy],
        references: [users.id],
    }),
}));
// Fee Payment Module
export const fees = mysqlTable("fees", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    targetType: feeTargetEnum.notNull(),
    dueDate: timestamp("dueDate", { mode: "date", fsp: 3 }),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

export const feeAssignments = mysqlTable("fee_assignments", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    feeId: varchar("feeId", { length: 255 }).notNull().references(() => fees.id, { onDelete: "cascade" }),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    status: mysqlEnum('status', ['PENDING', 'PAID']).default('PENDING'),
    amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0.00"),
    paidAt: timestamp("paidAt", { mode: "date", fsp: 3 }),
    paymentId: varchar("paymentId", { length: 255 }).references(() => payments.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

export const feesRelations = relations(fees, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [fees.organizationId],
        references: [organizations.id],
    }),
    assignments: many(feeAssignments),
}));

export const feeAssignmentsRelations = relations(feeAssignments, ({ one }) => ({
    fee: one(fees, {
        fields: [feeAssignments.feeId],
        references: [fees.id],
    }),
    user: one(users, {
        fields: [feeAssignments.userId],
        references: [users.id],
    }),
    payment: one(payments, {
        fields: [feeAssignments.paymentId],
        references: [payments.id],
    }),
}));

// Special Programmes Module
export const specialProgrammes = mysqlTable("special_programmes", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
    category: specialProgrammeCategoryEnum.notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    summary: text("summary"),
    year: int("year").notNull(),
    date: timestamp("date", { mode: "date", fsp: 3 }),
    imageUrl: varchar("imageUrl", { length: 500 }),
    isPublished: boolean("isPublished").default(true),
    createdBy: varchar("createdBy", { length: 255 }).notNull().references(() => users.id),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

export const specialProgrammeFiles = mysqlTable("special_programme_files", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    programmeId: varchar("programmeId", { length: 255 }).notNull().references(() => specialProgrammes.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    type: specialProgrammeFileTypeEnum.notNull(),
    order: int("order").default(0),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

export const specialProgrammesRelations = relations(specialProgrammes, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [specialProgrammes.organizationId],
        references: [organizations.id],
    }),
    creator: one(users, {
        fields: [specialProgrammes.createdBy],
        references: [users.id],
    }),
    files: many(specialProgrammeFiles),
}));

export const specialProgrammeFilesRelations = relations(specialProgrammeFiles, ({ one }) => ({
    programme: one(specialProgrammes, {
        fields: [specialProgrammeFiles.programmeId],
        references: [specialProgrammes.id],
    }),
}));

// Reports
export const reports = mysqlTable("reports", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
    organizationId: varchar("organizationId", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id),
    officeId: varchar("officeId", { length: 255 }).references(() => offices.id),

    type: reportTypeEnum.notNull(),
    status: reportStatusEnum.default('DRAFT'),

    title: varchar("title", { length: 255 }).notNull(),
    period: varchar("period", { length: 255 }).notNull(), // e.g. "2024-01", "2024-Q1", "2024"
    content: json("content").notNull(),

    approvedBy: varchar("approvedBy", { length: 255 }).references(() => users.id),
    approvedAt: timestamp("approvedAt", { mode: "date", fsp: 3 }),

    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Relations for Offices and Reports
export const officesRelations = relations(offices, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [offices.organizationId],
        references: [organizations.id],
    }),
    programmes: many(programmes),
    reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
    organization: one(organizations, {
        fields: [reports.organizationId],
        references: [organizations.id],
    }),
    user: one(users, {
        fields: [reports.userId],
        references: [users.id],
    }),
    office: one(offices, {
        fields: [reports.officeId],
        references: [offices.id],
    }),
    approver: one(users, {
        fields: [reports.approvedBy],
        references: [users.id],
    }),
}));

export const programmesRelationsUpdate = relations(programmes, ({ one }) => ({
    organizingOffice: one(offices, {
        fields: [programmes.organizingOfficeId],
        references: [offices.id],
    }),
}));

// ============================================================
// MISSING TABLE DEFINITIONS - Added to fix navigation errors
// ============================================================

// Broadcasts
export const broadcasts = mysqlTable("broadcasts", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    senderId: varchar("senderId", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    targetLevel: broadcastTargetLevelEnum.notNull(),
    targetId: varchar("targetId", { length: 255 }),
    media: json("media").$type<{ type: string; url: string }[]>().default([]),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Assets
export const assets = mysqlTable("assets", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    organizationId: varchar("organizationId", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    serialNumber: varchar("serialNumber", { length: 255 }),
    category: assetCategoryEnum.notNull().default('OTHER'),
    condition: assetConditionEnum.notNull().default('GOOD'),
    status: assetStatusEnum.notNull().default('ACTIVE'),
    purchaseDate: timestamp("purchaseDate", { mode: "date" }),
    purchasePrice: decimal("purchasePrice", { precision: 15, scale: 2 }).default("0"),
    currentValue: decimal("currentValue", { precision: 15, scale: 2 }).default("0"),
    location: varchar("location", { length: 255 }),
    custodianId: varchar("custodianId", { length: 255 }),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Asset Maintenance Logs
export const assetMaintenanceLogs = mysqlTable("asset_maintenance_logs", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    assetId: varchar("assetId", { length: 255 }).notNull(),
    type: maintenanceTypeEnum.notNull(),
    description: text("description").notNull(),
    cost: decimal("cost", { precision: 15, scale: 2 }).default("0"),
    date: timestamp("date", { mode: "date" }).notNull(),
    performedBy: varchar("performedBy", { length: 255 }),
    nextServiceDate: timestamp("nextServiceDate", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Meetings
export const meetings = mysqlTable("meetings", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    organizationId: varchar("organizationId", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    scheduledAt: timestamp("scheduledAt", { mode: "date" }).notNull(),
    endAt: timestamp("endAt", { mode: "date" }),
    venue: varchar("venue", { length: 255 }),
    isOnline: boolean("isOnline").default(false),
    meetingLink: varchar("meetingLink", { length: 500 }),
    status: meetingStatusEnum.default('SCHEDULED'),
    createdBy: varchar("createdBy", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Meeting Attendances
export const meetingAttendances = mysqlTable("meeting_attendances", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    meetingId: varchar("meetingId", { length: 255 }).notNull(),
    userId: varchar("userId", { length: 255 }).notNull(),
    status: meetingAttendanceStatusEnum.default('INVITED'),
    joinedAt: timestamp("joinedAt", { mode: "date" }),
    leftAt: timestamp("leftAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Meeting Documents
export const meetingDocs = mysqlTable("meeting_docs", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    meetingId: varchar("meetingId", { length: 255 }).notNull(),
    userId: varchar("userId", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    url: text("url").notNull(),
    type: meetingDocTypeEnum.default('OTHER'),
    submissionStatus: meetingDocSubmissionStatusEnum.default('ON_TIME'),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Galleries
export const galleries = mysqlTable("galleries", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    organizationId: varchar("organizationId", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Gallery Images
export const galleryImages = mysqlTable("gallery_images", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    galleryId: varchar("galleryId", { length: 255 }).notNull(),
    imageUrl: text("imageUrl").notNull(),
    caption: varchar("caption", { length: 500 }),
    order: int("order").default(0),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

// Teskiyah Centres
export const teskiyahCentres = mysqlTable("teskiyah_centres", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    venue: varchar("venue", { length: 255 }).notNull(),
    address: text("address").notNull(),
    time: varchar("time", { length: 100 }).notNull(),
    contactNumber: varchar("contactNumber", { length: 50 }),
    state: varchar("state", { length: 100 }).notNull(),
    lga: varchar("lga", { length: 100 }).notNull(),
    branch: varchar("branch", { length: 100 }),
    organizationId: varchar("organizationId", { length: 255 }),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Adhkar Centres
export const adhkarCentres = mysqlTable("adhkar_centres", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    venue: varchar("venue", { length: 255 }),
    address: text("address"),
    time: varchar("time", { length: 100 }),
    contactNumber: varchar("contactNumber", { length: 50 }),
    state: varchar("state", { length: 100 }).notNull(),
    lga: varchar("lga", { length: 100 }),
    branch: varchar("branch", { length: 100 }),
    organizationId: varchar("organizationId", { length: 255 }),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updatedAt", { mode: "date", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).onUpdateNow(),
});

// Relations for new tables
export const broadcastsRelations = relations(broadcasts, ({ one }) => ({
    sender: one(users, { fields: [broadcasts.senderId], references: [users.id] }),
    targetOrganization: one(organizations, { fields: [broadcasts.targetId], references: [organizations.id] }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
    organization: one(organizations, { fields: [assets.organizationId], references: [organizations.id] }),
    maintenanceLogs: many(assetMaintenanceLogs),
}));

export const assetMaintenanceLogsRelations = relations(assetMaintenanceLogs, ({ one }) => ({
    asset: one(assets, { fields: [assetMaintenanceLogs.assetId], references: [assets.id] }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
    organization: one(organizations, { fields: [meetings.organizationId], references: [organizations.id] }),
    creator: one(users, { fields: [meetings.createdBy], references: [users.id] }),
    attendances: many(meetingAttendances),
    docs: many(meetingDocs),
}));

export const meetingAttendancesRelations = relations(meetingAttendances, ({ one }) => ({
    meeting: one(meetings, { fields: [meetingAttendances.meetingId], references: [meetings.id] }),
    user: one(users, { fields: [meetingAttendances.userId], references: [users.id] }),
}));

export const meetingDocsRelations = relations(meetingDocs, ({ one }) => ({
    meeting: one(meetings, { fields: [meetingDocs.meetingId], references: [meetings.id] }),
    user: one(users, { fields: [meetingDocs.userId], references: [users.id] }),
}));

export const galleriesRelationsNew = relations(galleries, ({ one, many }) => ({
    organization: one(organizations, { fields: [galleries.organizationId], references: [organizations.id] }),
    images: many(galleryImages),
}));

export const galleryImagesRelationsNew = relations(galleryImages, ({ one }) => ({
    gallery: one(galleries, { fields: [galleryImages.galleryId], references: [galleries.id] }),
}));
