# Supabase Auth Settings Hardening Checklist

> **Generated:** 2025-11-28  
> **Project:** Agenter dashboard (yroeeqykhwlviuganwti)  
> **Status:** Phase 2.3 of Pre-Launch Hardening

---

## Current Security Advisor Warnings

From Supabase MCP security advisors:

| Warning | Level | Description | Action Required |
|---------|-------|-------------|-----------------|
| Leaked Password Protection Disabled | WARN | Supabase Auth can check passwords against HaveIBeenPwned.org | Enable in dashboard |
| Postgres Version Outdated | WARN | Version 17.4.1.074 has security patches available | Upgrade database |

---

## Hardening Checklist

### 1. Enable Leaked Password Protection ⚠️ REQUIRED

**Location:** Supabase Dashboard → Authentication → Providers → Email

**Steps:**
1. Go to https://supabase.com/dashboard/project/yroeeqykhwlviuganwti/auth/providers
2. Click on "Email" provider settings
3. Enable "Leaked password protection"
4. Save changes

**Documentation:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

### 2. Set Password Policy ⚠️ RECOMMENDED

**Location:** Supabase Dashboard → Authentication → Providers → Email

**Recommended settings:**
- Minimum password length: **8 characters** (balance security vs UX)
- Require at least one uppercase letter: Optional (depends on user base)
- Require at least one number: Optional
- Require at least one special character: Optional

**Note:** For a B2B SaaS targeting Swedish tradespeople, keep it simple but secure. 8+ characters with leaked password protection is a good baseline.

---

### 3. Review Session Settings ⚠️ RECOMMENDED

**Location:** Supabase Dashboard → Authentication → URL Configuration / Settings

**Recommended settings:**
- **JWT expiry:** 3600 seconds (1 hour) - default is fine
- **Refresh token rotation:** Enabled (default)
- **Refresh token reuse interval:** 10 seconds (default)

**Note:** These defaults are generally secure. Only change if you have specific requirements.

---

### 4. Upgrade Postgres Version ⚠️ REQUIRED (when convenient)

**Location:** Supabase Dashboard → Settings → Infrastructure

**Steps:**
1. Go to https://supabase.com/dashboard/project/yroeeqykhwlviuganwti/settings/infrastructure
2. Check for available Postgres upgrades
3. Schedule upgrade during low-traffic period
4. Test in staging first if possible

**Documentation:** https://supabase.com/docs/guides/platform/upgrading

**Note:** Database upgrades can cause brief downtime. Plan accordingly.

---

### 5. Review Auth Providers

**Location:** Supabase Dashboard → Authentication → Providers

**Current state to verify:**
- [ ] Email/Password: Enabled (primary auth method)
- [ ] Google OAuth: Enabled if using Google One Tap
- [ ] Other providers: Disable any not in use

---

### 6. Review Site URL and Redirect URLs

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Verify:**
- [ ] Site URL matches your production domain
- [ ] Redirect URLs include all valid callback URLs
- [ ] No localhost URLs in production (unless intentional for dev)

---

## Post-Hardening Verification

After making changes:

1. **Re-run security advisors:**
   - Use Supabase MCP: `mcp3_get_advisors` with type "security"
   - Verify "Leaked Password Protection Disabled" warning is gone

2. **Test auth flows:**
   - [ ] Sign up with a new account
   - [ ] Sign in with existing account
   - [ ] Password reset flow
   - [ ] Google OAuth (if enabled)

3. **Document decisions:**
   - Update this file with chosen settings
   - Note any trade-offs made

---

## Chosen Settings (Fill in after applying)

| Setting | Value | Notes |
|---------|-------|-------|
| Leaked password protection | ☐ Enabled / ☐ Disabled | |
| Minimum password length | __ characters | |
| JWT expiry | __ seconds | |
| Postgres version | __.__.__ | |

---

## Related Documentation

- [Supabase Auth Security](https://supabase.com/docs/guides/auth/password-security)
- [Supabase Platform Upgrading](https://supabase.com/docs/guides/platform/upgrading)
- [Project ENVIRONMENT.md](/ENVIRONMENT.md)
