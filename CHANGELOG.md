# Changelog

All notable changes to Calendar CRM will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Multi-tenant organization support
- Admin dashboard with organization management
- User impersonation for super admins
- VAPI voice assistant integration
- MCP (Model Context Protocol) server
- Real estate CRM features (properties, deals)
- API key management for VAPI integration
- Webhook signing and verification
- Rate limiting for API endpoints
- Google One Tap authentication

### Changed
- Migrated from single-tenant to multi-tenant architecture
- Consolidated Supabase client implementations
- Improved RLS (Row Level Security) policies
- Enhanced TypeScript strict mode
- Optimized database queries with proper indexes

### Fixed
- RLS recursion issues
- Admin impersonation flow
- User management permissions
- Calendar availability checks
- Property search filters

### Security
- Added API key hashing
- Implemented rate limiting
- Enhanced RLS policies
- Added webhook signature verification

## [0.1.0] - 2024-01-14

### Added
- Initial release
- Calendar management (month/week/day views)
- Contact/CRM management
- Task management
- Dashboard with analytics
- Supabase authentication
- Row-level security
- Email/password and Google OAuth login

### Features
- Create, edit, delete calendar events
- Manage contacts with full CRUD operations
- Task tracking with status updates
- Real-time data synchronization
- Responsive design with Tailwind CSS
- Dark mode support

---

## Version History

- **0.1.0** - Initial MVP release
- **Unreleased** - Multi-tenant and VAPI integration

## Migration Notes

### Upgrading to Multi-Tenant

If upgrading from single-tenant version:

1. Backup your database
2. Run `supabase/multi-tenant-schema.sql`
3. Create default organization for existing users
4. Update RLS policies
5. Test thoroughly before production deployment

### VAPI Integration

To add VAPI integration to existing installation:

1. Run `supabase/migrations/003_vapi_integration.sql`
2. Run `supabase/migrations/004_add_vapi_key_to_users.sql`
3. Configure VAPI in settings
4. Generate API keys for users

---

**Maintained by:** Calendar CRM Team  
**Repository:** [GitHub](https://github.com/your-org/calendar-crm)
