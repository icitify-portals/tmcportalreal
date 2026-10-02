# Organization & User APIs

<cite>
**Referenced Files in This Document**
- [route.ts](file://app/api/organizations/tree/route.ts)
- [route.ts](file://app/api/organizations/authorized/route.ts)
- [route.ts](file://app/api/users/route.ts)
- [route.ts](file://app/api/users/[id]/roles/route.ts)
- [route.ts](file://app/api/roles/route.ts)
- [route.ts](file://app/api/permissions/route.ts)
- [route.ts](file://app/api/officials/route.ts)
- [route.ts](file://app/api/officials/public/route.ts)
- [rbac-v2.ts](file://lib/rbac-v2.ts)
- [org-helper.ts](file://lib/org-helper.ts)
- [schema.ts](file://lib/db/schema.ts)
- [audit.ts](file://lib/audit.ts)
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
This document provides comprehensive API documentation for organization and user management endpoints with a focus on:
- Hierarchical organization structures and jurisdiction-aware access control
- User administration, role assignment, and permission management
- Official appointment APIs to assign officials to positions within organizations
- RBAC system APIs for roles, permissions, and enforcement
- Multi-tenancy considerations, data isolation across organizations, and cross-jurisdiction operations
- Security implications and audit logging requirements

The APIs are implemented as Next.js Route Handlers backed by Drizzle ORM and a centralized RBAC module that enforces permissions and jurisdictional boundaries.

## Project Structure
The relevant endpoints are organized under app/api and use server-side session handling and RBAC checks. Supporting libraries include RBAC logic, organization tree utilities, and audit logging.

```mermaid
graph TB
subgraph "API Routes"
A["GET /api/organizations/tree"]
B["GET /api/organizations/authorized"]
C["GET /api/users"]
D["GET/POST/DELETE /api/users/:id/roles"]
E["GET/POST /api/roles"]
F["GET /api/permissions"]
G["POST /api/officials"]
H["GET /api/officials/public"]
end
subgraph "Libraries"
R["RBAC (requirePermission, hasPermission, canAccessOrganization)"]
O["Org Helper (getOrganizationTree, getOrganizationAncestry)"]
S["DB Schema (organizations, users, roles, permissions, user_roles, officials)"]
U["Audit Logging"]
end
A --> O
B --> R
C --> R
D --> R
E --> R
F --> R
G --> R
H --> S
A --> S
B --> S
C --> S
D --> S
E --> S
F --> S
G --> S
H --> S
D --> U
E --> U
```

**Diagram sources**
- [route.ts:1-19](file://app/api/organizations/tree/route.ts#L1-L19)
- [route.ts:1-67](file://app/api/organizations/authorized/route.ts#L1-L67)
- [route.ts:1-57](file://app/api/users/route.ts#L1-L57)
- [route.ts:1-208](file://app/api/users/[id]/roles/route.ts#L1-L208)
- [route.ts:1-120](file://app/api/roles/route.ts#L1-L120)
- [route.ts:1-42](file://app/api/permissions/route.ts#L1-L42)
- [route.ts:1-122](file://app/api/officials/route.ts#L1-L122)
- [route.ts:1-47](file://app/api/officials/public/route.ts#L1-L47)
- [rbac-v2.ts:1-361](file://lib/rbac-v2.ts#L1-L361)
- [org-helper.ts:1-118](file://lib/org-helper.ts#L1-L118)
- [schema.ts:148-350](file://lib/db/schema.ts#L148-L350)
- [audit.ts:1-74](file://lib/audit.ts#L1-L74)

**Section sources**
- [route.ts:1-19](file://app/api/organizations/tree/route.ts#L1-L19)
- [route.ts:1-67](file://app/api/organizations/authorized/route.ts#L1-L67)
- [route.ts:1-57](file://app/api/users/route.ts#L1-L57)
- [route.ts:1-208](file://app/api/users/[id]/roles/route.ts#L1-L208)
- [route.ts:1-120](file://app/api/roles/route.ts#L1-L120)
- [route.ts:1-42](file://app/api/permissions/route.ts#L1-L42)
- [route.ts:1-122](file://app/api/officials/route.ts#L1-L122)
- [route.ts:1-47](file://app/api/officials/public/route.ts#L1-L47)
- [rbac-v2.ts:1-361](file://lib/rbac-v2.ts#L1-L361)
- [org-helper.ts:1-118](file://lib/org-helper.ts#L1-L118)
- [schema.ts:148-350](file://lib/db/schema.ts#L148-L350)
- [audit.ts:1-74](file://lib/audit.ts#L1-L74)

## Core Components
- Organization Tree API: Returns the full hierarchical structure of organizations (National → State → Local Government → Branch).
- Authorized Organizations API: Returns organizations visible to the current user based on roles and jurisdiction.
- Users API: Lists users with pagination and search; requires read permission.
- User Roles API: Assigns, retrieves, and deactivates roles for users with audit logging.
- Roles API: Creates roles with jurisdiction level and attaches permissions.
- Permissions API: Lists all permissions grouped by category.
- Officials API: Appoints officials to positions and auto-assigns roles based on position mapping.
- Public Officials API: Reads active officials optionally filtered by organization and level.

Key security and multi-tenancy behaviors:
- All mutating endpoints enforce authentication and RBAC via requirePermission or explicit checks.
- Jurisdiction-aware access control ensures users can only operate within their authorized scope.
- Audit logs record critical administrative actions such as role assignments and role creation.

**Section sources**
- [route.ts:1-19](file://app/api/organizations/tree/route.ts#L1-L19)
- [route.ts:1-67](file://app/api/organizations/authorized/route.ts#L1-L67)
- [route.ts:1-57](file://app/api/users/route.ts#L1-L57)
- [route.ts:1-208](file://app/api/users/[id]/roles/route.ts#L1-L208)
- [route.ts:1-120](file://app/api/roles/route.ts#L1-L120)
- [route.ts:1-42](file://app/api/permissions/route.ts#L1-L42)
- [route.ts:1-122](file://app/api/officials/route.ts#L1-L122)
- [route.ts:1-47](file://app/api/officials/public/route.ts#L1-L47)
- [rbac-v2.ts:1-361](file://lib/rbac-v2.ts#L1-L361)
- [audit.ts:1-74](file://lib/audit.ts#L1-L74)

## Architecture Overview
The system uses a layered architecture:
- API Layer: Next.js route handlers handle HTTP requests, validate sessions, enforce RBAC, and orchestrate business logic.
- Business Logic Layer: RBAC module computes effective permissions and jurisdictional access; org helper builds trees and ancestry paths.
- Data Layer: Drizzle ORM queries against MySQL schema entities (users, organizations, roles, permissions, user_roles, officials).
- Audit Layer: Centralized audit logging records administrative actions.

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Route Handler"
participant RBAC as "RBAC Module"
participant DB as "Database"
participant Audit as "Audit Logger"
Client->>API : "POST /api/users/ : id/roles"
API->>RBAC : "requirePermission('roles : assign')"
RBAC-->>API : "Session OK"
API->>DB : "Validate user, role, existing assignment"
DB-->>API : "Results"
API->>DB : "Insert/Update user_role"
DB-->>API : "Success"
API->>Audit : "createAuditLog(ASSIGN_ROLE)"
Audit-->>API : "Logged"
API-->>Client : "201 Created"
```

**Diagram sources**
- [route.ts:1-208](file://app/api/users/[id]/roles/route.ts#L1-L208)
- [rbac-v2.ts:313-337](file://lib/rbac-v2.ts#L313-L337)
- [audit.ts:17-34](file://lib/audit.ts#L17-L34)

## Detailed Component Analysis

### Organization Management APIs
- GET /api/organizations/tree
  - Purpose: Retrieve the full hierarchical organization tree.
  - Authentication: Requires session.
  - Response: Nested structure of National → State → Local Government → Branch.
  - Notes: Uses org helper to build tree from flat organization list.

- GET /api/organizations/authorized
  - Purpose: Return organizations accessible to the current user based on roles and jurisdiction.
  - Authentication: Requires session.
  - Behavior:
    - Super admin sees all organizations.
    - Other users see managed organizations plus immediate children and grandchildren (current implementation).
  - Notes: For deeper hierarchies, consider recursive traversal.

```mermaid
flowchart TD
Start(["GET /api/organizations/authorized"]) --> Auth["Check Session"]
Auth --> IsSuper{"Is Super Admin?"}
IsSuper --> |Yes| FetchAll["Fetch all organizations"]
IsSuper --> |No| GetUserRoles["Extract managed org IDs from roles"]
GetUserRoles --> HasAny{"Any managed orgs?"}
HasAny --> |No| Empty["Return []"]
HasAny --> |Yes| FetchManaged["Fetch managed orgs"]
FetchManaged --> FetchChildren["Fetch children"]
FetchChildren --> FetchGrandchildren["Fetch grandchildren"]
FetchGrandchildren --> Merge["Merge and deduplicate"]
Merge --> End(["Return result"])
FetchAll --> End
```

**Diagram sources**
- [route.ts:1-67](file://app/api/organizations/authorized/route.ts#L1-L67)

**Section sources**
- [route.ts:1-19](file://app/api/organizations/tree/route.ts#L1-L19)
- [route.ts:1-67](file://app/api/organizations/authorized/route.ts#L1-L67)
- [org-helper.ts:38-98](file://lib/org-helper.ts#L38-L98)

### User Administration APIs
- GET /api/users
  - Purpose: List users with optional search and pagination.
  - Authentication: Requires session and "users:read" permission.
  - Query params: q (search), page, limit.
  - Response: Paginated list of users with active roles included.

- GET /api/users/:id/roles
  - Purpose: Retrieve active roles assigned to a specific user, including permissions per role.
  - Authentication: Requires session and "users:read".
  - Response: Array of user roles with associated role and permission details.

- POST /api/users/:id/roles
  - Purpose: Assign a role to a user, optionally scoped to an organization with expiration.
  - Authentication: Requires session and "roles:assign".
  - Validation: Ensures user and role exist; prevents duplicate active assignments; reactivates inactive assignments if requested.
  - Side effects: Creates audit log entry for assignment or reactivation.

- DELETE /api/users/:id/roles?userRoleId=...
  - Purpose: Deactivate a user role (soft delete).
  - Authentication: Requires session and "roles:assign".
  - Validation: Verifies ownership of the user role; returns forbidden if mismatched.
  - Side effects: Creates audit log entry for removal.

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Users Roles API"
participant RBAC as "RBAC"
participant DB as "Database"
participant Audit as "Audit"
Client->>API : "POST /api/users/ : id/roles {roleId, organizationId?, expiresAt?}"
API->>RBAC : "requirePermission('roles : assign')"
RBAC-->>API : "OK"
API->>DB : "Find user, role, check existing assignment"
DB-->>API : "Result"
alt Existing inactive assignment
API->>DB : "Reactivate and set expiresAt"
API->>Audit : "REACTIVATE_USER_ROLE"
else New assignment
API->>DB : "Insert user_role"
API->>Audit : "ASSIGN_ROLE"
end
API-->>Client : "201 Created or 200 Reactivated"
```

**Diagram sources**
- [route.ts:1-208](file://app/api/users/[id]/roles/route.ts#L1-L208)
- [rbac-v2.ts:313-337](file://lib/rbac-v2.ts#L313-L337)
- [audit.ts:17-34](file://lib/audit.ts#L17-L34)

**Section sources**
- [route.ts:1-57](file://app/api/users/route.ts#L1-L57)
- [route.ts:1-208](file://app/api/users/[id]/roles/route.ts#L1-L208)

### Role-Based Access Control (RBAC) APIs
- GET /api/roles
  - Purpose: List active roles with attached permissions and counts.
  - Authentication: Requires session and "roles:read".
  - Response: Roles with rolePermissions and _count.userRoles.

- POST /api/roles
  - Purpose: Create a new role with jurisdiction level and optional permissions.
  - Authentication: Requires session and "roles:create".
  - Validation: Enforces unique code and required fields.
  - Side effects: Inserts role and role_permissions within a transaction; creates audit log.

- GET /api/permissions
  - Purpose: List all permissions grouped by category.
  - Authentication: Requires session and "roles:read".
  - Query params: category (optional filter).

```mermaid
classDiagram
class Role {
+string id
+string name
+string code
+string description
+JurisdictionLevel jurisdictionLevel
+boolean isActive
}
class Permission {
+string id
+string code
+string name
+string description
+string category
+boolean isActive
}
class RolePermission {
+string roleId
+string permissionId
+boolean granted
+string grantedBy
}
Role "1" -- "many" RolePermission : "has"
Permission "1" -- "many" RolePermission : "belongs to"
```

**Diagram sources**
- [schema.ts:304-350](file://lib/db/schema.ts#L304-L350)

**Section sources**
- [route.ts:1-120](file://app/api/roles/route.ts#L1-L120)
- [route.ts:1-42](file://app/api/permissions/route.ts#L1-L42)
- [schema.ts:304-350](file://lib/db/schema.ts#L304-L350)

### Official Appointment APIs
- POST /api/officials
  - Purpose: Appoint an official to a position within an organization.
  - Authentication: Requires session; enforces admin/ICT officer authorization.
  - Validation: Required fields include userId, organizationId, position, positionLevel, termStart.
  - Behavior:
    - Prevents duplicate official profiles per user.
    - Creates official record.
    - Auto-assigns roles based on position mapping (e.g., Secretary → ORG_ADMIN, SECRETARY).
  - Side effects: Inserts user_roles where applicable.

- GET /api/officials/public
  - Purpose: Read active officials, optionally filtered by organization and level.
  - Response: Includes user name, organization name and level, position details.

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Officials API"
participant DB as "Database"
Client->>API : "POST /api/officials {userId, organizationId, position, positionLevel, termStart, ...}"
API->>API : "Authorization check (admin/ICT)"
API->>DB : "Check existing official for userId"
DB-->>API : "None found"
API->>DB : "Insert officials"
API->>DB : "Lookup roles by position mapping"
loop For each mapped role
API->>DB : "Check existing user_role"
alt Not exists
API->>DB : "Insert user_role"
end
end
API-->>Client : "200 Created"
```

**Diagram sources**
- [route.ts:1-122](file://app/api/officials/route.ts#L1-L122)

**Section sources**
- [route.ts:1-122](file://app/api/officials/route.ts#L1-L122)
- [route.ts:1-47](file://app/api/officials/public/route.ts#L1-L47)
- [schema.ts:273-302](file://lib/db/schema.ts#L273-L302)

### RBAC Enforcement Patterns
- Session-based checks: requirePermission(session, permission, organizationId?) throws unauthorized/forbidden when missing.
- Permission resolution: getUserPermissions aggregates active roles, permissions, and jurisdictions for a user.
- Jurisdiction checks: canAccessOrganization validates whether a user’s roles allow access to a target organization based on hierarchy and role jurisdiction levels.
- Role checks: hasRole verifies presence of a specific role code for a user, optionally scoped to an organization.

```mermaid
flowchart TD
Start(["hasPermission(userId, permission, orgId?)"]) --> LoadPerms["Load user permissions and jurisdictions"]
LoadPerms --> SuperAdmin{"Has SYSTEM role?"}
SuperAdmin --> |Yes| Allow["Allow"]
SuperAdmin --> |No| HasPerm{"Has permission?"}
HasPerm --> |No| Deny["Deny"]
HasPerm --> |Yes| OrgSpecified{"organizationId provided?"}
OrgSpecified --> |No| Allow
OrgSpecified --> |Yes| CheckJur["canAccessOrganization(userId, orgId)"]
CheckJur --> |True| Allow
CheckJur --> |False| Deny
```

**Diagram sources**
- [rbac-v2.ts:141-165](file://lib/rbac-v2.ts#L141-L165)
- [rbac-v2.ts:170-213](file://lib/rbac-v2.ts#L170-L213)

**Section sources**
- [rbac-v2.ts:47-136](file://lib/rbac-v2.ts#L47-L136)
- [rbac-v2.ts:141-213](file://lib/rbac-v2.ts#L141-L213)
- [rbac-v2.ts:264-308](file://lib/rbac-v2.ts#L264-L308)
- [rbac-v2.ts:313-358](file://lib/rbac-v2.ts#L313-L358)

## Dependency Analysis
- API routes depend on:
  - Session handling for authentication
  - RBAC module for authorization and jurisdiction checks
  - Database schema for entities and relationships
  - Audit logger for compliance and traceability
- Organization tree depends on org helper to assemble hierarchical nodes
- Officials endpoint depends on roles mapping and user_roles insertion

```mermaid
graph LR
API_Users["/api/users/*"] --> RBAC["RBAC Module"]
API_Roles["/api/roles/*"] --> RBAC
API_Officials["/api/officials/*"] --> RBAC
API_Orgs["/api/organizations/*"] --> RBAC
API_Perms["/api/permissions"] --> RBAC
RBAC --> DB_Schema["DB Schema"]
API_Orgs --> OrgHelper["Org Helper"]
API_Roles --> Audit["Audit Logger"]
API_Users_Roles["/api/users/:id/roles"] --> Audit
```

**Diagram sources**
- [route.ts:1-57](file://app/api/users/route.ts#L1-L57)
- [route.ts:1-120](file://app/api/roles/route.ts#L1-L120)
- [route.ts:1-122](file://app/api/officials/route.ts#L1-L122)
- [route.ts:1-67](file://app/api/organizations/authorized/route.ts#L1-L67)
- [route.ts:1-42](file://app/api/permissions/route.ts#L1-L42)
- [rbac-v2.ts:1-361](file://lib/rbac-v2.ts#L1-L361)
- [org-helper.ts:1-118](file://lib/org-helper.ts#L1-L118)
- [audit.ts:1-74](file://lib/audit.ts#L1-L74)

**Section sources**
- [route.ts:1-57](file://app/api/users/route.ts#L1-L57)
- [route.ts:1-120](file://app/api/roles/route.ts#L1-L120)
- [route.ts:1-122](file://app/api/officials/route.ts#L1-L122)
- [route.ts:1-67](file://app/api/organizations/authorized/route.ts#L1-L67)
- [route.ts:1-42](file://app/api/permissions/route.ts#L1-L42)
- [rbac-v2.ts:1-361](file://lib/rbac-v2.ts#L1-L361)
- [org-helper.ts:1-118](file://lib/org-helper.ts#L1-L118)
- [audit.ts:1-74](file://lib/audit.ts#L1-L74)

## Performance Considerations
- Organization tree retrieval loads all organizations into memory and constructs the tree client-side; consider caching or paginating large datasets.
- Authorized organizations endpoint currently fetches up to three levels (managed, children, grandchildren); for deeper hierarchies, implement recursive traversal or use database-level aggregation.
- User listing supports pagination and search; ensure indexes on frequently queried columns (name, email).
- RBAC permission checks perform joins and aggregations; cache user permissions in session or short-lived store to reduce repeated queries.
- Officials public endpoint performs left joins; add appropriate indexes on organizationId and positionLevel for faster filtering.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Unauthorized responses:
  - Ensure valid session is present before calling protected endpoints.
  - Verify required permissions are granted to the user’s roles.
- Forbidden errors:
  - Confirm the user has the necessary role codes and jurisdictional access for the target organization.
- Duplicate role assignment:
  - If attempting to assign an already active role, the API returns a conflict; reactivate an inactive assignment instead.
- Official appointment failures:
  - Validate required fields and ensure the user does not already have an official profile.
  - Check role mapping for the position to ensure roles exist and are active.
- Audit logging:
  - Non-critical failures in audit logging do not block operations; check logs for discrepancies.

**Section sources**
- [route.ts:1-208](file://app/api/users/[id]/roles/route.ts#L1-L208)
- [route.ts:1-122](file://app/api/officials/route.ts#L1-L122)
- [audit.ts:17-34](file://lib/audit.ts#L17-L34)

## Conclusion
The Organization & User APIs provide robust capabilities for managing hierarchical organizations, administering users, assigning roles and permissions, and appointing officials with jurisdiction-aware access control. The RBAC module centralizes permission evaluation and enforces multi-tenancy boundaries, while audit logging ensures accountability for administrative actions. For production deployments, consider enhancing recursive organization traversal, optimizing RBAC caching, and expanding query indexes to support scale and performance.

[No sources needed since this section summarizes without analyzing specific files]