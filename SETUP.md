# Setup Guide - Calendar CRM

Complete setup instructions for Calendar CRM with multi-tenant support.

## Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- (Optional) VAPI account for voice assistant integration

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd calendar-crm
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp env.example .env.local
```

Update `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Webhook Signing (Optional)
WEBHOOK_SIGNING_SECRET=your_random_hex_secret
```

### 3. Database Setup

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the following migrations in order:
   - `supabase/schema.sql` - Base schema
   - `supabase/multi-tenant-schema.sql` - Multi-tenant support
   - `supabase/migrations/002_real_estate_tables.sql` - Real estate features
   - `supabase/migrations/003_vapi_integration.sql` - VAPI integration
   - `supabase/migrations/004_add_vapi_key_to_users.sql` - VAPI keys

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 4. Authentication Setup

In your Supabase dashboard:

1. Go to **Authentication** → **Settings**
2. Enable **Email** authentication
3. (Optional) Enable **Google OAuth**:
   - Go to **Authentication** → **Providers**
   - Enable Google provider
   - Add your OAuth credentials

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Multi-Tenant Setup

### Creating Organizations

1. Sign up as the first user (becomes super admin)
2. Navigate to `/admin` dashboard
3. Click **"Create Organization"**
4. Fill in organization details:
   - Name
   - Subscription plan (free/starter/professional/enterprise)
   - Features/limits

### User Management

#### Adding Users to Organizations

1. Go to **Admin** → **Organizations**
2. Select an organization
3. Click **"Add Member"**
4. Enter user email and role (admin/member)

#### Impersonation (Super Admin Only)

1. Go to **Admin** → **Organizations**
2. Click **"Impersonate"** on any user
3. View the system as that user
4. Click **"Exit Impersonation"** to return

### Row-Level Security (RLS)

All data is automatically isolated by organization:
- Users can only see their organization's data
- Super admins can view all organizations
- RLS policies enforce data isolation at database level

## VAPI Integration (Optional)

See [VAPI_INTEGRATION_GUIDE.md](./VAPI_INTEGRATION_GUIDE.md) for detailed instructions.

### Quick VAPI Setup

1. Navigate to **Settings** → **VAPI Integration**
2. Click **"Skapa nyckel"** (Create Key)
3. Copy the API key (shown only once!)
4. Configure your VAPI assistant:
   - Server URL: `https://your-domain.com/api/mcp`
   - Auth: Bearer Token with your API key

## Troubleshooting

### Database Connection Issues

**Problem:** "Failed to connect to Supabase"

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure Supabase project is active

### RLS Policy Errors

**Problem:** "Row level security policy violation"

**Solution:**
- Run all migrations in correct order
- Verify user has `organization_id` set
- Check RLS policies in Supabase dashboard

### Authentication Errors

**Problem:** "Invalid login credentials"

**Solution:**
- Verify email authentication is enabled
- Check user exists in `auth.users` table
- Ensure RLS policies allow user access

### Build Errors

**Problem:** TypeScript compilation errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Database Schema Overview

### Core Tables

- `users` - User profiles and settings
- `organizations` - Multi-tenant organizations
- `organization_members` - User-organization relationships
- `contacts` - CRM contacts/leads
- `events` - Calendar events
- `tasks` - Task management
- `properties` - Real estate listings
- `deals` - Sales pipeline
- `vapi_calls` - Voice assistant call logs
- `vapi_api_keys` - API key management

### Key Relationships

```
organizations
  ├── organization_members → users
  ├── contacts
  ├── events
  ├── tasks
  ├── properties
  └── deals
```

## Performance Optimization

### Database Indexes

All tables have proper indexes on:
- Foreign keys
- Frequently queried columns
- Composite indexes for common queries

### Caching

- Use Supabase's built-in caching
- Implement client-side caching with Zustand
- Consider Redis for high-traffic deployments

### Rate Limiting

API endpoints have rate limiting:
- MCP API: 60 requests/minute per API key
- Default: 100 requests/minute per IP

## Security Best Practices

1. **Never commit `.env.local`** - Keep credentials secret
2. **Rotate API keys regularly** - Every 90 days recommended
3. **Use HTTPS in production** - Required for OAuth and security
4. **Enable 2FA** - For admin accounts
5. **Monitor logs** - Check for suspicious activity
6. **Keep dependencies updated** - Run `npm audit` regularly

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy automatically

### Other Platforms

Works on any Node.js platform:
- Netlify
- Railway
- Render
- AWS/GCP/Azure

## Development Workflow

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit
```

### Database Migrations

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database (development only!)
supabase db reset
```

## Support

- **Documentation:** See README.md
- **VAPI Integration:** See VAPI_INTEGRATION_GUIDE.md
- **Issues:** Check GitHub issues
- **Community:** Join our Discord/Slack

---

**Last Updated:** 2024-01-21
