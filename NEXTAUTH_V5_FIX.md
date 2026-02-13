# NextAuth v5 Migration Fix

## Issue
`getServerSession` doesn't exist in NextAuth v5 beta. The API has changed.

## Solution
In NextAuth v5, use `auth()` directly instead of `getServerSession(authOptions)`.

## Changes Made

### 1. Updated `lib/session.ts`
**Before:**
```typescript
import { getServerSession as nextAuthGetServerSession } from "next-auth"
import { authOptions } from "./auth"

export async function getServerSession() {
  return nextAuthGetServerSession(authOptions)
}
```

**After:**
```typescript
import { auth } from "next-auth"

export async function getServerSession() {
  return await auth()
}
```

### 2. Updated All API Routes
Changed from:
```typescript
import { getServerSession } from "@/lib/session"
const session = await getServerSession(authOptions)
```

To:
```typescript
import { auth } from "next-auth"
const session = await auth()
```

### 3. Updated Dashboard Pages
Same change - using `auth()` directly instead of `getServerSession(authOptions)`.

## Files Updated

- ✅ `lib/session.ts`
- ✅ `app/api/members/route.ts`
- ✅ `app/api/members/[id]/route.ts`
- ✅ `app/api/payments/initialize/route.ts`
- ✅ `app/api/users/[id]/roles/route.ts`
- ✅ `app/api/permissions/route.ts`
- ✅ `app/api/roles/route.ts`
- ✅ `app/api/roles/[id]/route.ts`
- ✅ `app/api/roles/[id]/permissions/route.ts`
- ✅ `app/dashboard/admin/page.tsx`
- ✅ `app/dashboard/admin/members/page.tsx`
- ✅ `app/dashboard/official/page.tsx`
- ✅ `app/page.tsx`

## How It Works

In NextAuth v5:
- `auth()` automatically uses the `authOptions` from your auth route handler
- No need to pass `authOptions` explicitly
- Works in both API routes and Server Components
- The function is automatically configured when you have `/api/auth/[...nextauth]/route.ts`

## Testing

After these changes:
1. Restart your dev server
2. All authentication should work correctly
3. Sessions will be retrieved properly in all routes

## Note

The `auth()` function in NextAuth v5 is async and returns a Promise, so always use `await`:
```typescript
const session = await auth()
```


