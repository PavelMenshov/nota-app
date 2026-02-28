# Migration: Add LMS (Learning Management System) integration

**Migration:** `20260228120000_add_lms_integration`

## Summary

Adds support for university / LMS data integration:

- **LmsIntegration**: User-owned connection to an LMS (Blackboard, Canvas, Moodle) with `baseUrl`, `accessToken` (stored as-is for demo; encrypt in production), optional `refreshToken`.
- **Course**: Synced course from an integration (`externalId`, `name`, `code`, `term`, `syncedAt`).
- **Assignment**: Optional assignment per course (`externalId`, `name`, `dueDate`, `points`).
- **Workspace**: Optional `lmsIntegrationId` to link a workspace to one LMS for syncing courses.

## Apply

From repo root:

```bash
cd packages/database && npx prisma migrate deploy
```

For development (create and apply in one step, if this migration was not yet applied):

```bash
cd packages/database && npx prisma migrate dev --name add_lms_integration
```

## Rollback

This migration does not ship a down script. To roll back, you would need to manually drop the new tables and remove the `lmsIntegrationId` column from `workspaces` (and drop the enum `LmsProvider`). Prefer creating a new forward migration if you need to revert schema changes.
