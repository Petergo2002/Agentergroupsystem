# RLS Documentation & Migration Plan

> **Generated:** 2025-11-28  
> **Status:** Phase 1.2 of Pre-Launch Hardening  
> **Action Required:** Review and approve before any migrations are executed

---

## Table of Contents

1. [Overview](#overview)
2. [RLS Intent by Table Group](#rls-intent-by-table-group)
3. [Current vs Intended Comparison](#current-vs-intended-comparison)
4. [Issues Found](#issues-found)
5. [Migration Plan](#migration-plan)

---

## Overview

This document defines the **intended RLS (Row Level Security) behavior** for all core tables and compares it against the **actual policies** in Supabase. The goal is to ensure multi-tenant isolation is correct and consistent.

### Key Principles

1. **Organization-scoped data**: Most business data (CRM, reports, AI) should be accessible to all members of the same organization.
2. **User-owned data**: Some data (like personal API keys) should only be accessible to the owning user.
3. **Super-admin override**: Super admins can access/manage data across organizations for admin purposes.
4. **Public/anonymous access**: Only specific data (like enabled chat widgets, public reports) should be accessible without authentication.

---

## RLS Intent by Table Group

### Auth & Organization Tables

| Table | Intended RLS Behavior |
|-------|----------------------|
| `users` | Users can read/update their own profile. Super admins can read all users. |
| `organizations` | Members can read their org. Admins/owners can update. Super admins can manage all. |
| `organization_members` | Members can read memberships in their org. Admins/owners can manage. Super admins can manage all. |
| `organization_settings` | Members can read settings for their org. Admins/owners can update. |
| `feature_flags` | Members can read flags for their org. Admins/owners can manage. Super admins can manage all. |
| `api_keys` | Users can only manage their own API keys. |
| `activity_log` | Members can read activity for their org. |

### CRM Tables

| Table | Intended RLS Behavior |
|-------|----------------------|
| `contacts` | **Org-level**: All members can read/write contacts for their organization. |
| `deals` | **Org-level**: All members can read/write deals for their organization. |
| `properties` | **Org-level**: All members can read/write properties for their organization. |
| `events` | **Org-level**: All members can read/write events for their organization. |
| `tasks` | **Org-level**: All members can read/write tasks for their organization. |

### Report System Tables

| Table | Intended RLS Behavior |
|-------|----------------------|
| `reports` | **Org-level**: All members can read/write reports for their organization. Public reports accessible via `public_id`. |
| `report_templates` | **Org-level**: All members can read/write templates for their organization. |
| `report_sections` | **Org-level**: All members can read/write sections for their organization. |
| `pdf_designs` | **Global read**: All authenticated users can read. Creators can update/delete their own. |

### AI & Widget Tables

| Table | Intended RLS Behavior |
|-------|----------------------|
| `chat_widget_configs` | Members can manage configs for their org. Anonymous users can read enabled configs (for embed). |
| `ai_chat_sessions` | **Org-level**: Members can read sessions for their organization. |
| `ai_chat_messages` | **Org-level**: Members can read messages for their organization. |
| `ai_call_sessions` | **Org-level**: Members can read call sessions for their organization. |
| `ai_usage_daily_metrics` | **Org-level**: Members can read metrics for their organization. |
| `vapi_calls` | **Org-level**: Members can read/write vapi_calls for their organization. |

---

## Current vs Intended Comparison

### ✅ Correctly Configured Tables

| Table | Status | Notes |
|-------|--------|-------|
| `users` | ✅ OK | User-level access (own profile only) |
| `api_keys` | ✅ OK | User-level access (own keys only) |
| `feature_flags` | ✅ OK | Org-level + super admin override |
| `activity_log` | ✅ OK | Org-level via membership check |
| `chat_widget_configs` | ✅ OK | Org-level + anon read for enabled configs |
| `ai_chat_sessions` | ✅ OK | Org-level via membership check |
| `ai_chat_messages` | ✅ OK | Org-level via membership check |
| `ai_call_sessions` | ✅ OK | Org-level via membership check |
| `ai_usage_daily_metrics` | ✅ OK | Org-level via membership check |
| `pdf_designs` | ✅ OK | Global read, creator-only write |

### ⚠️ Tables Needing Changes

| Table | Current | Intended | Issue |
|-------|---------|----------|-------|
| `contacts` | User-level (`user_id = auth.uid()`) | **Org-level** | Team members can't see each other's contacts |
| `deals` | User-level (`user_id = auth.uid()`) | **Org-level** | Team members can't see each other's deals |
| `properties` | User-level (`user_id = auth.uid()`) | **Org-level** | Team members can't see each other's properties |
| `events` | User-level (`user_id = auth.uid()`) | **Org-level** | Team members can't see each other's events |
| `tasks` | User-level (`user_id = auth.uid()`) | **Org-level** | Team members can't see each other's tasks |
| `reports` | User-level (`user_id = auth.uid()`) | **Org-level** | Team members can't collaborate on reports |
| `report_templates` | User-level (`user_id = auth.uid()`) | **Org-level** | Team members can't share templates |
| `report_sections` | User-level (`user_id = auth.uid()`) | **Org-level** | Team members can't share sections |
| `vapi_calls` | User-level (`user_id = auth.uid()`) | **Org-level** | Team members can't see org call history |
| `invoices` | Org-level (SELECT only) | **Org-level (full CRUD)** | Missing INSERT/UPDATE/DELETE policies |
| `organization_settings` | `true` (all authenticated) | **Org-level** | Too permissive - any user can modify any org's settings |
| `organization_members` | No policies found | **Org-level** | Missing RLS policies entirely |

### ❌ Critical Issues

1. **`organization_settings`**: Currently allows ANY authenticated user to read/write ANY org's settings. This is a security vulnerability.

2. **`organization_members`**: No RLS policies found. This table should have org-level access control.

3. **`organizations`**: Has multiple overlapping permissive policies which can be confusing. Should be simplified.

---

## Issues Found

### Issue 1: CRM Tables Use User-Level Instead of Org-Level

**Affected tables:** `contacts`, `deals`, `properties`, `events`, `tasks`

**Problem:** Current policies use `user_id = auth.uid()` which means:
- User A creates a contact → only User A can see it
- User B in the same org cannot see User A's contacts

**Impact:** Teams cannot collaborate on CRM data.

**Fix:** Change to org-level policies using `organization_members` check.

---

### Issue 2: Report Tables Use User-Level Instead of Org-Level

**Affected tables:** `reports`, `report_templates`, `report_sections`

**Problem:** Same as CRM - users can only see their own reports.

**Impact:** Teams cannot collaborate on reports or share templates.

**Fix:** Change to org-level policies. Add public access for reports with `public_id`.

---

### Issue 3: organization_settings Too Permissive

**Current policy:**
```sql
-- Allow authenticated users to manage organization_settings
USING (true) WITH CHECK (true)
```

**Problem:** Any logged-in user can read/modify any organization's settings.

**Fix:** Restrict to org members only.

---

### Issue 4: organization_members Missing RLS

**Problem:** No RLS policies found for this table.

**Fix:** Add org-level policies for membership management.

---

### Issue 5: organizations Has Redundant Policies

**Current policies:**
- `Super admins can manage organization Vapi config` (ALL)
- `orgs_delete` (DELETE - super admin only)
- `orgs_insert` (INSERT - super admin OR owner)
- `orgs_select` (SELECT - super admin OR member OR owner)
- `orgs_update` (UPDATE - super admin OR admin/owner OR owner)

**Problem:** The "Super admins can manage organization Vapi config" policy with `cmd=ALL` overlaps with the specific policies, making behavior confusing.

**Fix:** Remove the ALL policy, keep specific policies.

---

## Migration Plan

> ⚠️ **DO NOT EXECUTE** without explicit approval. Review each migration carefully.

### Migration 1: Fix organization_settings RLS

```sql
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated users to manage organization_settings" ON organization_settings;

-- Add org-level policies
-- Note: organization_settings.id should match organization.id
CREATE POLICY "org_settings_select" ON organization_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_settings.id
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "org_settings_update" ON organization_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_settings.id
      AND om.role IN ('admin', 'owner')
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "org_settings_insert" ON organization_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_settings.id
      AND om.role IN ('admin', 'owner')
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true
    )
  );
```

### Migration 2: Add organization_members RLS

> ⚠️ **IMPORTANT**: The original design below caused infinite recursion because it queried
> `organization_members` to check access to `organization_members`. The fix uses
> `users.organization_id` directly instead. See `FIX_RLS_INFINITE_RECURSION.sql`.

```sql
-- Enable RLS if not already enabled
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- FIXED: Use users.organization_id to avoid infinite recursion
CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

CREATE POLICY "org_members_update" ON organization_members
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );
```

### Migration 3: Fix CRM Tables (contacts, deals, properties, events, tasks)

```sql
-- CONTACTS: Change from user-level to org-level
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

CREATE POLICY "org_contacts_select" ON contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = contacts.organization_id
    )
  );

CREATE POLICY "org_contacts_insert" ON contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = contacts.organization_id
    )
  );

CREATE POLICY "org_contacts_update" ON contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = contacts.organization_id
    )
  );

CREATE POLICY "org_contacts_delete" ON contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = contacts.organization_id
    )
  );

-- Repeat same pattern for: deals, properties, events, tasks
-- (Same structure, just change table name)
```

### Migration 4: Fix Report Tables

```sql
-- REPORTS: Change from user-level to org-level + public access
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

CREATE POLICY "org_reports_select" ON reports
  FOR SELECT USING (
    -- Org members can see their org's reports
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = reports.organization_id
    )
    -- Public reports accessible by public_id (handled at API level)
  );

CREATE POLICY "org_reports_insert" ON reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = reports.organization_id
    )
  );

CREATE POLICY "org_reports_update" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = reports.organization_id
    )
  );

CREATE POLICY "org_reports_delete" ON reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = reports.organization_id
    )
  );

-- Repeat same pattern for: report_templates, report_sections
```

### Migration 5: Fix vapi_calls

```sql
DROP POLICY IF EXISTS "Users can view own vapi_calls" ON vapi_calls;
DROP POLICY IF EXISTS "Users can insert own vapi_calls" ON vapi_calls;
DROP POLICY IF EXISTS "Users can update own vapi_calls" ON vapi_calls;

CREATE POLICY "org_vapi_calls_select" ON vapi_calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = vapi_calls.organization_id
    )
  );

CREATE POLICY "org_vapi_calls_insert" ON vapi_calls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = vapi_calls.organization_id
    )
  );

CREATE POLICY "org_vapi_calls_update" ON vapi_calls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = vapi_calls.organization_id
    )
  );
```

### Migration 6: Simplify organizations Policies

```sql
-- Remove redundant ALL policy
DROP POLICY IF EXISTS "Super admins can manage organization Vapi config" ON organizations;

-- Keep existing specific policies (orgs_select, orgs_insert, orgs_update, orgs_delete)
-- They already handle super admin access correctly
```

---

## Next Steps

1. **Review this document** with the team
2. **Decide on org-level vs user-level** for CRM and reports (recommendation: org-level)
3. **Test migrations** in a development branch first
4. **Execute migrations** one at a time with verification
5. **Update application code** if needed to handle new RLS behavior

---

## Appendix: Current Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | own | own | own | - |
| organizations | member/owner/super | owner/super | admin/owner/super | super |
| organization_members | ❌ missing | ❌ missing | ❌ missing | ❌ missing |
| organization_settings | ⚠️ all auth | ⚠️ all auth | ⚠️ all auth | ⚠️ all auth |
| feature_flags | org/super | admin/owner/super | admin/owner/super | super |
| api_keys | own | own | own | - |
| activity_log | org | - | - | - |
| contacts | own | own | own | own |
| deals | own | own | own | own |
| properties | own | own | own | own |
| events | own | own | own | own |
| tasks | own | own | own | own |
| reports | own | own | own | own |
| report_templates | own | own | own | own |
| report_sections | own | own | own | own |
| pdf_designs | all | auth | creator | creator |
| chat_widget_configs | org/anon(enabled) | org | org | org |
| ai_chat_sessions | org | - | - | - |
| ai_chat_messages | org | - | - | - |
| ai_call_sessions | org | - | - | - |
| ai_usage_daily_metrics | org | - | - | - |
| vapi_calls | own | own | own | - |
| invoices | org | - | - | - |
