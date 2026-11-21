# CivicLens Security Specification (Phase 0)

## 1. Data Invariants

1. **Identity Integrity**: Every user profile (`/users/{userId}`), private PII doc (`/users/{userId}/private/info`), complaint (`/complaints/{complaintId}`), upvote (`/complaints/{complaintId}/upvotes/{userId}`), and notification (`/notifications/{notificationId}`) must strictly bind its ownership field (`uid`, `reporterUid`, `userId`, `recipientUid`) to `request.auth.uid` on creation.
2. **No Self-Assigned Roles**: Non-admin users creating `/users/{userId}` may only register with `role == 'CITIZEN'`, and cannot mutate `role`, `departmentId`, or `departmentName` on update. Only verified Admins (`isAdmin()`) may promote users to `DEPARTMENT_OFFICER` or `ADMIN`.
3. **PII Isolation**: User email and phone numbers are stored exclusively in `/users/{userId}/private/info`, strictly readable and writable only by the owner (`isOwner(userId)`) or a verified Admin (`isAdmin()`).
4. **Master Gate & Atomic Upvotes**: Creating an upvote at `/complaints/{complaintId}/upvotes/{userId}` requires the parent complaint to exist and requires an atomic batch increment of `upvoteCount` by `+1` on `/complaints/{complaintId}` (`getAfter` / `existsAfter`).
5. **Terminal State Locking**: Once a complaint reaches `status == 'Resolved'`, non-admin users cannot modify its status or fields.
6. **Temporal Integrity & Strict Schema Keys**: All `createdAt` / `updatedAt` timestamps must equal `request.time`. Shadow/ghost fields are rejected via `hasOnly` and `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Target Path | Attack Vector | Expected Result |
|---|-------------|---------------|-----------------|
| 1 | `/users/victim_uid` | Unauthenticated read/write | `PERMISSION_DENIED` |
| 2 | `/users/attacker_uid` | Self-assigned `role: "ADMIN"` on user profile create | `PERMISSION_DENIED` |
| 3 | `/users/attacker_uid` | Update own profile to `role: "DEPARTMENT_OFFICER"` | `PERMISSION_DENIED` |
| 4 | `/users/victim_uid/private/info` | Cross-user PII read by non-admin user | `PERMISSION_DENIED` |
| 5 | `/complaints/bad..id!` | ID poisoning / oversized >128 char document ID | `PERMISSION_DENIED` |
| 6 | `/complaints/comp_1` | Identity spoofing (`reporterUid: "victim_uid"`) on create | `PERMISSION_DENIED` |
| 7 | `/complaints/comp_1` | Shadow field injection (`isVerified: true`) on create/update | `PERMISSION_DENIED` |
| 8 | `/complaints/comp_1` | Citizen directly changing complaint `status` to `"Resolved"` | `PERMISSION_DENIED` |
| 9 | `/complaints/comp_resolved` | Non-admin modifying a complaint already in `"Resolved"` terminal state | `PERMISSION_DENIED` |
| 10 | `/complaints/comp_1/upvotes/attacker_uid` | Creating an upvote without atomically incrementing `upvoteCount` | `PERMISSION_DENIED` |
| 11 | `/complaints` | Unscoped collection `list` query without `visibility == 'PUBLIC'` or `reporterUid == uid` | `PERMISSION_DENIED` |
| 12 | `/settings/global` | Non-admin attempting to alter `criticalSLAHours` | `PERMISSION_DENIED` |
