# GO LIVE CHECKLIST

> **Purpose:** Run this before onboarding a new paying org or pushing a major change to production.
> **Project:** Agenter dashboard (Supabase project: `yroeeqykhwlviuganwti`)

---

## A. Auth & Organization

1. **Create org + owner (as super admin)**
   - [ ] Log in as **super admin**.
   - [ ] From admin UI, create a **new organization + owner user**.

2. **Login as org owner**
   - [ ] Log out, then log in as the **new owner**.
   - [ ] You land on the dashboard (`/`) without errors in the browser console.

3. **Onboarding wizard**
   - [ ] On first login, the onboarding wizard appears.
   - [ ] You can **complete** the wizard OR **skip** it.
   - [ ] After a page refresh, the wizard **does not** appear again.

---

## B. CRM & Calendar

While logged in as the new org owner:

1. **Contacts & CRM data**
   - [ ] Create at least **one contact**.
   - [ ] Contact appears in the contacts list.

2. **Deals / Jobs / Tasks / Events**
   - [ ] Create at least one **deal/job/task/event** (depending on what is exposed in the UI).
   - [ ] Dashboard metrics update (leads, jobs, customers, revenue) without errors.

3. **Calendar**
   - [ ] New event shows correctly in the calendar view (date & time look correct for your timezone).

4. **Persistence**
   - [ ] Refresh the dashboard.
   - [ ] All created items are still present.
   - [ ] No 401/403 errors in the browser network tab.

---

## C. Reports & PDF

1. **Template & report creation**
   - [ ] Create a **V3 report template**.
   - [ ] Create a **report** from that template.

2. **Preview / PDF**
   - [ ] Open the report preview/PDF.
   - [ ] Layout is readable; no runtime errors.

3. **Public link**
   - [ ] Generate a **public link** for the report.
   - [ ] Open it in an **incognito window** (not logged in).
   - [ ] You can view **only that report**, not any other org data.
   - [ ] If you use a public **approve** flow, approval through the link correctly updates report status in the app.

---

## D. AI & Vapi

Use an organization where **Vapi is configured**:

1. **Assistants list**
   - [ ] In the AI/assistants UI, assistants load successfully (or a clear empty state is shown).

2. **Chat / call flow**
   - [ ] Start at least one **chat** or **call** using an assistant.
   - [ ] The interaction completes without errors in the browser console.

3. **Analytics**
   - [ ] Open **chat** and **call** analytics pages.
   - [ ] The new session/call appears with the correct organization context.

---

## E. Widget (Chat Widget + Embed)

1. **Configure widget**
   - [ ] In the dashboard, configure a **chat widget** for the org.

2. **Embed test**
   - [ ] Copy the embed snippet into a simple static HTML page (e.g., on localhost or a test site).
   - [ ] The widget renders correctly.
   - [ ] Send at least one message via the widget; the conversation works end-to-end.

3. **Org-scoped data**
   - [ ] Back in the app, confirm the conversation/usage appears in analytics for **that org**, and not elsewhere.

---

## F. Admin & Safety

1. **Admin access restrictions**
   - [ ] As the **org owner (non-super-admin)**, try to access `/admin`.
   - [ ] You are redirected/blocked (no access to admin UI).

2. **Health check**
   - [ ] Hit `/api/health` in the browser or via `curl` in your production environment.
   - [ ] Response status is **200** with `"status": "healthy"` (or explicitly "degraded" if a non-critical dependency is down).

3. **Supabase dashboard checks**
   - [ ] In Supabase **Auth → Email** provider:
     - [ ] **Leaked password protection** is enabled.
   - [ ] In Supabase **Settings → Infrastructure**:
     - [ ] Check for available Postgres upgrades; plan upgrade if security patches are pending.

---

## Notes

- Run this checklist **per environment** (staging, then production) when:
  - You change RLS / database schema.
  - You change auth/organization logic.
  - You onboard a new type of customer.
- For early customers, it is acceptable to **provision accounts and orgs via the admin UI** instead of self-signup.
