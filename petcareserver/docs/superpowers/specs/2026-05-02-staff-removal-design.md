# Staff Removal Feature Design

## Overview

Add two endpoints to remove staff from a store by setting `store_id = null` and `role_id = null` on the user record. Uses the existing `STAFF_DELETE` permission (defined but unused) for removing others, and a separate self-removal endpoint requiring only authentication.

## Endpoints

### 1. Remove Another Staff Member

- **Route:** `DELETE /v1/stores/:storeId/staff/:userId`
- **Auth:** JWT + `STAFF_DELETE` permission
- **Behavior:**
  - Validate caller belongs to `storeId`
  - Validate target user belongs to `storeId`
  - Prevent self-removal (caller userId != target userId)
  - Prevent removing the last admin in the store
  - Set target's `store_id = null`, `role_id = null`
- **Response:** 200 with removed user details

### 2. Self-Removal (Leave Store)

- **Route:** `DELETE /v1/stores/:storeId/staff/me`
- **Auth:** JWT only (no `STAFF_DELETE` permission required)
- **Behavior:**
  - Validate caller belongs to `storeId`
  - Prevent leaving if caller is the last admin in the store
  - Set caller's `store_id = null`, `role_id = null`
- **Response:** 200 with updated user details

## Shared Logic

- **Last admin check:** Query count of users in the store with `ADMIN` role. If count <= 1 and target/caller is admin, reject.
- **Store membership validation:** Reuse existing `validateStoreMembership()` pattern from `StoresService`.

## Files to Modify

- `src/stores/stores.controller.ts` — add two DELETE endpoints
- `src/stores/stores.service.ts` — add `removeStaff()` and `leaveStore()` methods
- `src/stores/stores.module.ts` — no changes needed (User entity already imported)
- `src/stores/dto/` — optionally add a response DTO

## Edge Cases

- User already has `store_id = null` (not in any store) — return 404 or 400
- Target user is not in the same store — return 403
- Store has no admins — should not happen if last-admin guard works, but service should handle gracefully
- SUPER_ADMIN bypasses permission checks (existing guard behavior)
