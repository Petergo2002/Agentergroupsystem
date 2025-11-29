# Performance Fix - Agenter Dashboard
> **Date:** 2025-11-29
> **Status:** ✅ Completed

---

## Summary

Fixed all WARN-level performance issues in the Agenter Dashboard Supabase project.

### Before Fix
| Issue Type | Count | Level |
|------------|-------|-------|
| Auth RLS InitPlan | 40+ policies | WARN |
| Multiple Permissive Policies | 5 policies | WARN |
| Unused Indexes | 15+ indexes | INFO |
| Unindexed Foreign Keys | 2 foreign keys | INFO |

### After Fix
| Issue Type | Count | Level |
|------------|-------|-------|
| Auth RLS InitPlan | 0 | - |
| Multiple Permissive Policies | 0 | - |
| Unused Indexes | ~30 indexes | INFO (low priority) |
| Unindexed Foreign Keys | 0 | - |

---

## Migrations Applied

### 1. `fix_rls_performance_auth_initplan`
Fixed RLS policies that used `auth.uid()` directly instead of `(SELECT auth.uid())`.

**Tables fixed:**
- `contacts` (4 policies)
- `deals` (4 policies)
- `events` (4 policies)
- `tasks` (4 policies)
- `properties` (4 policies)
- `organization_members` (4 policies)

**Change pattern:**
```sql
-- Before (slow - re-evaluates per row)
WHERE om.user_id = auth.uid()

-- After (fast - evaluates once per query)
WHERE om.user_id = (SELECT auth.uid())
```

### 2. `fix_multiple_permissive_policies`
Consolidated overlapping permissive policies.

**Tables fixed:**
- `chat_widget_configs` - Split anon/authenticated SELECT policies
- `organization_members` - Removed redundant `owner_manage_members`, `super_admin_all_*`, `view_own_org_members`

### 3. `remove_unused_indexes`
Removed indexes that were never used:
- `idx_ai_chat_sessions_started_at`
- `idx_ai_chat_messages_session_id`
- `idx_ai_chat_messages_org_id`
- `idx_ai_call_sessions_org_id`
- `idx_ai_call_sessions_assistant_id`
- `idx_ai_call_sessions_status`
- `idx_ai_call_sessions_started_at`
- `idx_ai_usage_metrics_channel`
- `idx_ai_usage_metrics_metric_date`
- `idx_reports_template_id`

### 4. `fix_remaining_rls_initplan`
Fixed remaining RLS policies:
- `organization_settings` (3 policies)
- `vapi_calls` (3 policies)
- `report_templates` (4 policies)
- `reports` (4 policies)
- `report_sections` (4 policies)

### 5. `add_missing_foreign_key_indexes`
Added indexes for unindexed foreign keys:
- `idx_ai_chat_messages_organization_id`
- `idx_ai_chat_messages_session_id`

---

## Remaining INFO-Level Issues

The following unused indexes remain but are low priority. They may become useful as the application grows:

- Various `organization_id` indexes on CRM tables
- Various `user_id` indexes
- Various filter indexes (status, type, etc.)

**Recommendation:** Monitor query performance and remove these indexes only if they cause measurable INSERT/UPDATE slowdowns.

---

## Verification

Run the following to verify no WARN-level issues remain:

```sql
-- Check current policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Or use Supabase MCP:
```
mcp3_get_advisors(project_id, type="performance")
```

All results should be INFO level (unused indexes) only.
