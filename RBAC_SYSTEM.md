# Role-Based Access Control (RBAC) System

## Overview

The Muslim Congress Portal implements a comprehensive, dynamic RBAC system that supports:
- **Multiple roles per user** - Users can have multiple roles simultaneously
- **Jurisdiction-based access** - Roles are scoped to specific organization levels
- **Dynamic permissions** - Permissions can be assigned/removed from roles dynamically
- **Extensible roles** - New roles can be created and managed through the API
- **Hierarchical access** - Higher-level roles can access lower-level organizations

## Architecture

### Database Models

#### Role
Represents a role in the system with jurisdiction level:
- `id`: Unique identifier
- `name`: Human-readable name (e.g., "National Admin")
- `code`: Unique code (e.g., "NATIONAL_ADMIN")
- `jurisdictionLevel`: SYSTEM | NATIONAL | STATE | LOCAL_GOVERNMENT | BRANCH
- `isSystem`: Whether this is a system role (cannot be deleted)
- `isActive`: Whether the role is active

#### Permission
Represents a permission in the system:
- `id`: Unique identifier
- `code`: Unique code (e.g., "members:create")
- `name`: Human-readable name
- `category`: Grouping (e.g., "members", "payments")
- `description`: What this permission allows

#### UserRole
Junction table linking users to roles with jurisdiction:
- `userId`: The user
- `roleId`: The role
- `organizationId`: The organization/jurisdiction (nullable for SYSTEM roles)
- `assignedBy`: Who assigned this role
- `expiresAt`: Optional expiration date
- `isActive`: Whether this assignment is active

#### RolePermission
Junction table linking roles to permissions:
- `roleId`: The role
- `permissionId`: The permission
- `granted`: Whether permission is granted (can be revoked)
- `grantedBy`: Who granted this permission

## Default Roles

### 1. Super Admin (SYSTEM)
- **Code**: `SUPER_ADMIN`
- **Jurisdiction**: SYSTEM (no limits)
- **Permissions**: All permissions
- **Use Case**: Full system access, can manage everything

### 2. National Admin (NATIONAL)
- **Code**: `NATIONAL_ADMIN`
- **Jurisdiction**: NATIONAL
- **Permissions**: Full access to national level operations
- **Use Case**: Manage national-level content and organizations

### 3. State Admin (STATE)
- **Code**: `STATE_ADMIN`
- **Jurisdiction**: STATE
- **Permissions**: Manage state-level content
- **Use Case**: Manage state-level organizations and members

### 4. Local Government Admin (LOCAL_GOVERNMENT)
- **Code**: `LOCAL_GOVERNMENT_ADMIN`
- **Jurisdiction**: LOCAL_GOVERNMENT
- **Permissions**: Manage local government level content
- **Use Case**: Manage local government organizations

### 5. Branch Admin (BRANCH)
- **Code**: `BRANCH_ADMIN`
- **Jurisdiction**: BRANCH
- **Permissions**: Manage branch level content
- **Use Case**: Manage branch organizations and members

### 6. Official (BRANCH)
- **Code**: `OFFICIAL`
- **Jurisdiction**: Based on organization
- **Permissions**: Read access to members, payments, documents
- **Use Case**: Organization officials with limited access

### 7. Member (BRANCH)
- **Code**: `MEMBER`
- **Jurisdiction**: Based on organization
- **Permissions**: Read own profile, payments, documents
- **Use Case**: Regular members with minimal access

## Permission Categories

### Members
- `members:create` - Create new members
- `members:read` - View member information
- `members:update` - Update member information
- `members:delete` - Delete members
- `members:approve` - Approve pending members

### Officials
- `officials:create` - Create official positions
- `officials:read` - View officials
- `officials:update` - Update officials
- `officials:delete` - Remove officials

### Roles & Permissions
- `roles:create` - Create new roles
- `roles:read` - View roles
- `roles:update` - Update roles
- `roles:delete` - Delete roles
- `roles:assign` - Assign roles to users
- `permissions:manage` - Manage role permissions

### Organizations
- `organizations:create` - Create organizations
- `organizations:read` - View organizations
- `organizations:update` - Update organizations
- `organizations:delete` - Delete organizations

### Payments
- `payments:create` - Create payment records
- `payments:read` - View payments
- `payments:update` - Update payments
- `payments:refund` - Process refunds

### Documents
- `documents:create` - Upload documents
- `documents:read` - View documents
- `documents:update` - Update documents
- `documents:delete` - Delete documents

### Audit & Reports
- `audit:read` - View audit logs
- `reports:read` - View reports
- `reports:generate` - Generate new reports

### Users
- `users:create` - Create user accounts
- `users:read` - View users
- `users:update` - Update users
- `users:delete` - Delete users

## Usage

### In API Routes

```typescript
import { getServerSession } from "@/lib/session"
import { requirePermission } from "@/lib/rbac-v2"

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  requirePermission(session, "members:read")
  
  // Your code here
}
```

### Check Multiple Permissions

```typescript
requirePermission(session, "members:create")
requirePermission(session, "members:approve")
```

### Check Role

```typescript
import { requireRole } from "@/lib/rbac-v2"

requireRole(session, "SUPER_ADMIN")
```

### Check Organization Access

```typescript
import { canAccessOrganization } from "@/lib/rbac-v2"

const canAccess = await canAccessOrganization(userId, organizationId)
```

## API Endpoints

### Roles
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create a new role
- `GET /api/roles/[id]` - Get role details
- `PATCH /api/roles/[id]` - Update role
- `DELETE /api/roles/[id]` - Delete role (non-system only)

### Role Permissions
- `GET /api/roles/[id]/permissions` - Get role permissions
- `PUT /api/roles/[id]/permissions` - Update role permissions

### User Roles
- `GET /api/users/[id]/roles` - Get user's roles
- `POST /api/users/[id]/roles` - Assign role to user
- `DELETE /api/users/[id]/roles?userRoleId=xxx` - Remove role from user

### Permissions
- `GET /api/permissions` - List all permissions
- `GET /api/permissions?category=members` - Filter by category

## Assigning Roles to Users

### Example: Assign National Admin Role

```typescript
POST /api/users/{userId}/roles
{
  "roleId": "role-id-here",
  "organizationId": "national-org-id", // Optional, required for jurisdiction-based roles
  "expiresAt": "2025-12-31T23:59:59Z" // Optional expiration
}
```

### Example: Assign Multiple Roles

A user can have multiple roles:
- Super Admin (no organization)
- State Admin for Lagos State
- Branch Admin for Lagos Central Branch

Each role grants its permissions within its jurisdiction.

## Creating Custom Roles

### Example: Create "Finance Manager" Role

```typescript
POST /api/roles
{
  "name": "Finance Manager",
  "code": "FINANCE_MANAGER",
  "description": "Manages financial operations",
  "jurisdictionLevel": "STATE",
  "permissionIds": [
    "permission-id-for-payments:read",
    "permission-id-for-payments:update",
    "permission-id-for-reports:read",
    "permission-id-for-reports:generate"
  ]
}
```

Then assign permissions:
```typescript
PUT /api/roles/{roleId}/permissions
{
  "permissionIds": ["perm1", "perm2", "perm3"]
}
```

## Security Features

1. **System Roles Protection**: System roles cannot be deleted or deactivated
2. **Audit Logging**: All role/permission changes are logged
3. **Expiration Support**: Roles can have expiration dates
4. **Soft Deletion**: User roles are deactivated, not deleted
5. **Jurisdiction Validation**: Access is validated against organization hierarchy
6. **Permission Inheritance**: SuperAdmin automatically has all permissions

## Best Practices

1. **Principle of Least Privilege**: Assign minimum required permissions
2. **Role Naming**: Use clear, descriptive role names and codes
3. **Documentation**: Document what each custom role is for
4. **Regular Audits**: Review role assignments periodically
5. **Expiration Dates**: Use expiration for temporary access
6. **Organization Scoping**: Always specify organizationId for jurisdiction-based roles

## Migration from Old System

The old `Admin` model has been replaced with the new `Role` system. To migrate:

1. Create roles for existing admin levels
2. Assign roles to users based on their old admin profiles
3. Remove old `Admin` model references (optional)

## Troubleshooting

### User doesn't have expected permissions
1. Check user's roles: `GET /api/users/{id}/roles`
2. Check role permissions: `GET /api/roles/{id}/permissions`
3. Verify role is active and not expired
4. Check organization jurisdiction matches

### Cannot delete role
- System roles cannot be deleted
- Roles assigned to users cannot be deleted (remove assignments first)

### Permission check fails
- Verify permission code is correct
- Check user has a role with that permission
- Verify role is active and not expired
- Check organization jurisdiction if applicable


