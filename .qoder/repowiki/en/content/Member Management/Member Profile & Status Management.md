# Member Profile & Status Management

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [members route.ts](file://app/api/members/route.ts)
- [member by id route.ts](file://app/api/members/[id]/route.ts)
- [member status route.ts](file://app/api/members/[id]/status/route.ts)
- [apply route.ts](file://app/api/members/apply/route.ts)
- [paystack webhook route.ts](file://app/api/payments/paystack-webhook/route.ts)
- [payments initialize route.ts](file://app/api/payments/initialize/route.ts)
- [member profile page.tsx](file://app/dashboard/member/profile/page.tsx)
- [image upload component.tsx](file://components/profile/image-upload.tsx)
- [approval actions component.tsx](file://components/admin/approval-actions.tsx)
- [db schema.ts](file://lib/db/schema.ts)
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
This document explains how the TMC Portal manages member profiles and membership status throughout their lifecycle. It covers:
- The member data model, including personal information, contact details, organizational affiliations, and membership type classifications (REGULAR, ASSOCIATE, HONORARY, LIFETIME).
- The comprehensive status management system with states: PENDING, RECOMMENDED, ACTIVE, SUSPENDED, EXPIRED, INACTIVE, REJECTED.
- Automated and administrative status transitions tied to payments, renewal dates, and admin actions.
- Member profile editing capabilities, document management, photo uploads, and preference settings.
- Workflows for status changes, bulk updates, and integrations with payments and programs.

## Project Structure
The member module spans database schemas, API routes, dashboards, and components:
- Data model and enums are defined centrally in the Prisma schema.
- Public application submission is handled via a dedicated API route.
- Administrative operations (list, update, delete, approve/recommend/reject) are exposed through REST endpoints.
- Dashboards render member profiles and administrative controls.
- File uploads support profile photos and documents.

```mermaid
graph TB
subgraph "Frontend"
MP["Member Profile Page"]
AA["Approval Actions UI"]
IU["Image Upload Component"]
end
subgraph "API Routes"
MGET["Members GET /api/members"]
MPOST["Members POST /api/members"]
MID["Member GET/PATCH/DELETE /api/members/:id"]
MST["Status PATCH /api/members/:id/status"]
APPLY["Apply POST /api/members/apply"]
PAYINIT["Payments Initialize /api/payments/initialize"]
WEBHOOK["Paystack Webhook /api/payments/paystack-webhook"]
end
subgraph "Data Layer"
DB["Database (Prisma/Drizzle)"]
SCHEMA["Schema Enums & Models"]
end
MP --> MGET
MP --> MID
AA --> MST
IU --> PAYINIT
APPLY --> DB
MGET --> DB
MPOST --> DB
MID --> DB
MST --> DB
PAYINIT --> DB
WEBHOOK --> DB
SCHEMA --> DB
```

**Diagram sources**
- [schema.prisma:207-275](file://prisma/schema.prisma#L207-L275)
- [members route.ts:11-76](file://app/api/members/route.ts#L11-L76)
- [member by id route.ts:9-49](file://app/api/members/[id]/route.ts#L9-L49)
- [member status route.ts:11-183](file://app/api/members/[id]/status/route.ts#L11-L183)
- [apply route.ts:48-203](file://app/api/members/apply/route.ts#L48-L203)
- [paystack webhook route.ts:7-41](file://app/api/payments/paystack-webhook/route.ts#L7-L41)
- [payments initialize route.ts:45-89](file://app/api/payments/initialize/route.ts#L45-L89)
- [member profile page.tsx:15-176](file://app/dashboard/member/profile/page.tsx#L15-L176)
- [image upload component.tsx:16-116](file://components/profile/image-upload.tsx#L16-L116)

**Section sources**
- [schema.prisma:207-275](file://prisma/schema.prisma#L207-L275)
- [members route.ts:11-76](file://app/api/members/route.ts#L11-L76)
- [member by id route.ts:9-49](file://app/api/members/[id]/route.ts#L9-L49)
- [member status route.ts:11-183](file://app/api/members/[id]/status/route.ts#L11-L183)
- [apply route.ts:48-203](file://app/api/members/apply/route.ts#L48-L203)
- [paystack webhook route.ts:7-41](file://app/api/payments/paystack-webhook/route.ts#L7-L41)
- [payments initialize route.ts:45-89](file://app/api/payments/initialize/route.ts#L45-L89)
- [member profile page.tsx:15-176](file://app/dashboard/member/profile/page.tsx#L15-L176)
- [image upload component.tsx:16-116](file://components/profile/image-upload.tsx#L16-L116)

## Core Components
- Member Model and Enums: Defines membership lifecycle, types, and related fields.
- Application Submission: Validates and stores new applications as PENDING.
- Administrative Operations: List, read, update, and delete members; manage IDs.
- Status Transitions: Recommend, Approve, Reject with notifications and emails.
- Payments Integration: Initialize payments and process webhooks for program registrations.
- Profile UI: Displays membership details, organization affiliation, and membership card preview.
- Photo Uploads: Securely upload and update profile images.

**Section sources**
- [schema.prisma:207-275](file://prisma/schema.prisma#L207-L275)
- [apply route.ts:48-203](file://app/api/members/apply/route.ts#L48-L203)
- [members route.ts:11-203](file://app/api/members/route.ts#L11-L203)
- [member by id route.ts:9-134](file://app/api/members/[id]/route.ts#L9-L134)
- [member status route.ts:11-183](file://app/api/members/[id]/status/route.ts#L11-L183)
- [paystack webhook route.ts:7-41](file://app/api/payments/paystack-webhook/route.ts#L7-L41)
- [payments initialize route.ts:45-89](file://app/api/payments/initialize/route.ts#L45-L89)
- [member profile page.tsx:15-176](file://app/dashboard/member/profile/page.tsx#L15-L176)
- [image upload component.tsx:16-116](file://components/profile/image-upload.tsx#L16-L116)

## Architecture Overview
The member lifecycle flows from application submission to approval or rejection, with optional recommendation steps and subsequent payment-driven renewals.

```mermaid
sequenceDiagram
participant App as "Applicant"
participant API as "/api/members/apply"
participant DB as "Database"
participant AdminUI as "Admin Approval UI"
participant StatusAPI as "/api/members/ : id/status"
participant Email as "Email Service"
participant Notify as "Notifications"
App->>API : Submit application (validated form)
API->>DB : Insert member (status=PENDING)
DB-->>API : Success
API-->>App : Application submitted
AdminUI->>StatusAPI : Recommend (action=RECOMMEND)
StatusAPI->>DB : Update status=RECOMMENDED
StatusAPI->>Notify : Create notification
StatusAPI-->>AdminUI : Success
AdminUI->>StatusAPI : Approve (action=APPROVE)
StatusAPI->>DB : Update status=ACTIVE, set memberId, dateJoined
StatusAPI->>Email : Send approval email
StatusAPI->>Notify : Create success notification
StatusAPI-->>AdminUI : Approved with ID
```

**Diagram sources**
- [apply route.ts:48-203](file://app/api/members/apply/route.ts#L48-L203)
- [member status route.ts:49-135](file://app/api/members/[id]/status/route.ts#L49-L135)

## Detailed Component Analysis

### Member Data Model and Classifications
- Membership Types: REGULAR, ASSOCIATE, HONORARY, LIFETIME.
- Status Enum: PENDING, RECOMMENDED, ACTIVE, SUSPENDED, EXPIRED, INACTIVE, REJECTED.
- Personal Information: Date of birth, gender, occupation, address, emergency contact and phone.
- Organizational Affiliation: Linked to an Organization via organizationId; metadata can store state/LGA/branch context.
- Approval Workflow Fields: recommendationStatus, recommendedBy/recommendedAt, approvedBy/approvedAt, rejectionReason.
- Relations: Payments, Documents, Programme Registrations.

```mermaid
classDiagram
class Member {
+string id
+string userId
+string organizationId
+string? memberId
+MemberStatus status
+MembershipType membershipType
+DateTime dateJoined
+DateTime? dateExpired
+boolean isActive
+DateTime? dateOfBirth
+Gender? gender
+string? occupation
+string? address
+string? emergencyContact
+string? emergencyPhone
+Json? metadata
+RecommendationStatus recommendationStatus
+string? recommendedBy
+DateTime? recommendedAt
+string? approvedBy
+DateTime? approvedAt
+string? rejectionReason
}
class User {
+string id
+string email
+string name
+string? phone
+string? image
}
class Organization {
+string id
+string name
+OrgLevel level
}
Member --> User : "belongsTo"
Member --> Organization : "belongs to"
```

**Diagram sources**
- [schema.prisma:207-275](file://prisma/schema.prisma#L207-L275)

**Section sources**
- [schema.prisma:207-275](file://prisma/schema.prisma#L207-L275)

### Application Submission Flow
- Validates application data using a strict schema.
- Checks if public registration is enabled via settings.
- Resolves the target organization based on branch/LGA/state selection with fallbacks.
- Inserts a new member record with status PENDING and stores extensive metadata.

```mermaid
flowchart TD
Start(["Submit Application"]) --> Validate["Validate Form Data"]
Validate --> CheckSettings{"Registration Enabled?"}
CheckSettings --> |No| Block["Return Error: Registration Closed"]
CheckSettings --> |Yes| ResolveOrg["Resolve Organization (Branch/LGA/State/National)"]
ResolveOrg --> InsertMember["Insert Member (status=PENDING)"]
InsertMember --> Success(["Application Submitted"])
```

**Diagram sources**
- [apply route.ts:48-203](file://app/api/members/apply/route.ts#L48-L203)

**Section sources**
- [apply route.ts:48-203](file://app/api/members/apply/route.ts#L48-L203)

### Administrative Member Management
- List members with filtering by organization and status, pagination, and includes user and organization details.
- Read, update, and delete individual members with audit logging.
- Manage membership IDs via a dedicated endpoint and UI component.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant MembersAPI as "/api/members"
participant DB as "Database"
Admin->>MembersAPI : GET (filters : org, status, page, limit)
MembersAPI->>DB : Query members with joins
DB-->>MembersAPI : Paginated results
MembersAPI-->>Admin : Members list
Admin->>MembersAPI : PATCH / : id (update fields)
MembersAPI->>DB : Update member
DB-->>MembersAPI : Updated member
MembersAPI-->>Admin : Success with updated data
```

**Diagram sources**
- [members route.ts:11-76](file://app/api/members/route.ts#L11-L76)
- [member by id route.ts:52-98](file://app/api/members/[id]/route.ts#L52-L98)

**Section sources**
- [members route.ts:11-203](file://app/api/members/route.ts#L11-L203)
- [member by id route.ts:9-134](file://app/api/members/[id]/route.ts#L9-L134)

### Status Transition Logic
Supported actions:
- Recommend: Moves PENDING to RECOMMENDED, records recommender and timestamp, creates notification.
- Approve: Validates recommendation requirement (configurable), generates official membership ID, sets status to ACTIVE, records approver and join date, sends email and notification.
- Reject: Requires reason, sets status to REJECTED, records rejection reason, sends email and notification.

```mermaid
flowchart TD
S(["Start Action"]) --> A{"Action"}
A --> |RECOMMEND| Rec["Set status=RECOMMENDED<br/>Record recommender & time"]
A --> |APPROVE| CheckRec{"Recommendation Required?"}
CheckRec --> |Yes & Not Recommended| Err["Error: Must be recommended first"]
CheckRec --> |No or Already Recommended| GenID["Generate Official Member ID"]
GenID --> SetActive["Set status=ACTIVE<br/>Set dateJoined, approver"]
SetActive --> Notify["Create Notification + Send Email"]
A --> |REJECT| Reason{"Reason Provided?"}
Reason --> |No| Err2["Error: Reason required"]
Reason --> |Yes| SetRejected["Set status=REJECTED<br/>Record reason"]
SetRejected --> Notify2["Create Notification + Send Email"]
```

**Diagram sources**
- [member status route.ts:49-174](file://app/api/members/[id]/status/route.ts#L49-L174)

**Section sources**
- [member status route.ts:11-183](file://app/api/members/[id]/status/route.ts#L11-L183)
- [approval actions component.tsx:33-101](file://components/admin/approval-actions.tsx#L33-L101)

### Payment Integration and Renewal Considerations
- Payment initialization creates a payment record and returns authorization URL for Paystack.
- Webhook handler verifies signatures and processes successful charges for programme registrations.
- While membership fee payments are modeled, explicit automatic transition from payment success to membership status is not implemented in the referenced files; current automation focuses on programme registrations.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Init as "/api/payments/initialize"
participant Paystack as "Paystack"
participant Webhook as "/api/payments/paystack-webhook"
participant Verify as "verifyProgrammeRegistrationPayment"
participant DB as "Database"
Client->>Init : Initialize payment (amount, type, metadata)
Init->>Paystack : Create checkout session
Paystack-->>Init : Authorization URL
Init-->>Client : Redirect to Paystack
Paystack-->>Webhook : charge.success event
Webhook->>Verify : Verify payment reference
Verify->>DB : Update registration status (PAID/ATTENDED)
Webhook-->>Client : Success response
```

**Diagram sources**
- [payments initialize route.ts:45-89](file://app/api/payments/initialize/route.ts#L45-L89)
- [paystack webhook route.ts:7-41](file://app/api/payments/paystack-webhook/route.ts#L7-L41)

**Section sources**
- [payments initialize route.ts:45-89](file://app/api/payments/initialize/route.ts#L45-L89)
- [paystack webhook route.ts:7-41](file://app/api/payments/paystack-webhook/route.ts#L7-L41)

### Member Profile Editing, Documents, Photos, Preferences
- Profile Page: Displays member ID, membership type, join/expiry dates, organization affiliation, and a membership card preview.
- Photo Upload: Validates image type and size, uploads to storage, updates user profile image, and refreshes UI.
- Documents: Schema supports storing documents linked to users or members with types like ID_CARD, CERTIFICATE, PHOTO, CONTRACT, REPORT, MINUTES, OTHER.

```mermaid
flowchart TD
U(["User selects image"]) --> V["Validate file type & size"]
V --> Upload["Upload to storage (/api/upload)"]
Upload --> Update["Update user profile image"]
Update --> Refresh["Refresh UI"]
```

**Diagram sources**
- [image upload component.tsx:22-68](file://components/profile/image-upload.tsx#L22-L68)
- [db schema.ts:398-409](file://lib/db/schema.ts#L398-L409)

**Section sources**
- [member profile page.tsx:15-176](file://app/dashboard/member/profile/page.tsx#L15-L176)
- [image upload component.tsx:16-116](file://components/profile/image-upload.tsx#L16-L116)
- [db schema.ts:398-409](file://lib/db/schema.ts#L398-L409)

### Bulk Status Updates
- The codebase provides per-member status actions via the status endpoint and UI.
- No dedicated bulk status update endpoint was found in the referenced files. Administrators can perform repeated single-member actions programmatically or via UI interactions.

[No sources needed since this section summarizes capability gaps without analyzing specific files]

## Dependency Analysis
Key dependencies and relationships:
- Member model depends on User and Organization relations.
- Status transitions depend on RBAC checks, membership settings, and email/notification services.
- Payments integration depends on Paystack and verification routines.
- Profile UI depends on storage and user profile update actions.

```mermaid
graph LR
M["Member"] --> U["User"]
M --> O["Organization"]
MST["Status API"] --> RBAC["RBAC"]
MST --> Settings["Membership Settings"]
MST --> Email["Email Service"]
MST --> Notify["Notifications"]
PAY["Payments API"] --> Paystack["Paystack"]
WEBHOOK["Webhook"] --> Verify["Verification Logic"]
```

**Diagram sources**
- [schema.prisma:207-275](file://prisma/schema.prisma#L207-L275)
- [member status route.ts:11-183](file://app/api/members/[id]/status/route.ts#L11-L183)
- [payments initialize route.ts:45-89](file://app/api/payments/initialize/route.ts#L45-L89)
- [paystack webhook route.ts:7-41](file://app/api/payments/paystack-webhook/route.ts#L7-L41)

**Section sources**
- [schema.prisma:207-275](file://prisma/schema.prisma#L207-L275)
- [member status route.ts:11-183](file://app/api/members/[id]/status/route.ts#L11-L183)
- [payments initialize route.ts:45-89](file://app/api/payments/initialize/route.ts#L45-L89)
- [paystack webhook route.ts:7-41](file://app/api/payments/paystack-webhook/route.ts#L7-L41)

## Performance Considerations
- Pagination and filtering on member lists reduce payload sizes and improve dashboard responsiveness.
- Selective column projection in queries avoids unnecessary data transfer.
- Image validation on the client reduces server load from invalid uploads.
- Webhook handlers verify signatures before processing to prevent unnecessary computations.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Unauthorized access: Ensure valid session and permissions when calling status or member endpoints.
- Missing recommendation: If recommendation is required by settings, ensure member status is RECOMMENDED before approving unless bypassed by admin privileges.
- Rejection errors: Provide a reason when rejecting applications.
- Payment webhook failures: Verify signature and event handling; check environment variables for secret keys.
- Upload failures: Confirm file type and size constraints; ensure storage endpoint responds successfully.

**Section sources**
- [member status route.ts:11-183](file://app/api/members/[id]/status/route.ts#L11-L183)
- [paystack webhook route.ts:7-41](file://app/api/payments/paystack-webhook/route.ts#L7-L41)
- [image upload component.tsx:22-68](file://components/profile/image-upload.tsx#L22-L68)

## Conclusion
The TMC Portal implements a robust member lifecycle with clear data models, controlled status transitions, and integrations for payments and communications. Applications start as PENDING, move through recommendation and approval workflows, and result in ACTIVE status with official IDs. Profile management supports photo uploads and document storage. While payment-driven automatic renewals are present for programmes, membership-specific automated transitions would require additional implementation beyond the referenced files.

[No sources needed since this section summarizes without analyzing specific files]