# ENVIRONMENT – Miljö & API-nycklar

> **Syfte:** Detta dokument definierar hur miljövariabler och externa tjänster ska konfigureras för projektet (Calendar CRM + AI/Vapi).  
> Målet är att undvika felaktiga keys, saknade env-vars och förvirring när olika AI‑modeller implementerar kod.

---

## 1. Översikt

### 1.1 Miljöer

Systemet är designat för tre logiska miljöer:

- **Development** – lokal utveckling (`npm run dev`, `.env.local`).
- **Staging** – valfri mellanmiljö (separat Vercel‑projekt eller branch‑deploy).
- **Production** – skarp miljö (Vercel‑projektets Production deployment).

Alla miljöer använder **Supabase** som primär backend och kan dela eller ha egna projekt. Production bör ha ett eget Supabase‑projekt.

### 1.2 Externa tjänster

Systemet integrerar (direkt eller indirekt) med:

- **Supabase** – Postgres, Auth, RLS, lagring av Vapi-org‑konfiguration m.m.
- **Vercel** – rekommenderad hosting för Next.js‑appen.
- **VAPI** – AI‑assistenter (calls + chat), integreras via API routes och per‑org config i databasen.
- **OpenRouter** – LLM‑leverantör för AI‑funktioner (`OPENROUTER_API_KEY`).
- **OpenAI (valfritt)** – alternativ LLM‑provider (`OPENAI_API_KEY`).
- **Upstash Redis** – rate limiting (`UPSTASH_REDIS_*`).
- **Webhook‑konsumenter (t.ex. n8n)** – får signerade webhooks från systemet.

Direkt integration mot **Telnyx/Stripe** finns inte i app‑koden; Telnyx syns endast som en möjlig provider i Vapi:s SDK (via `@vapi-ai/web`). Alla Telnyx/Stripe‑relaterade inställningar hanteras inne i Vapi/dashboards, inte via projektets egna env‑variabler.

---

## 2. Samlad lista över miljövariabler

Denna lista kombinerar `env.example`, `lib/env.ts`, `README.md` och `DEPLOYMENT_GUIDE.md`.

### 2.1 Primära variabler

| Variabel | Typ | Beskrivning | Används av | Dev | Staging | Prod | Hemlig? |
|---------|-----|-------------|------------|-----|---------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | string (URL) | Supabase‑projektets URL. | Supabaseklient (client + server). | Ja | Ja | Ja | **Nej** (public, men unik för projektet). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | Supabase anon key (JWT‑baserad). | Klient + serverklienter. | Ja | Ja | Ja | **Ja** – känslig men designad för klient‑bruk. Exponeras medvetet men bör behandlas varsamt. |
| `SUPABASE_SERVICE_ROLE_KEY` | string | Supabase service role key med full access. | Server‑only helpers (`createServiceClient`, Vapi‑org‑config, admin‑API). | Kan vara tom lokalt, men rekommenderas. | Ja | Ja | **Ja** – **server-side only**, aldrig till klient. |
| `NEXT_PUBLIC_SITE_URL` | string (URL) | Publik bas‑URL till appen (används av webhooks, embeds, widgets). | Widget/embed, länkgenerering. | `http://localhost:3000` | t.ex. `https://staging.yourdomain.com` | `https://yourdomain.com` | Nej. |
| `WEBHOOK_SIGNING_SECRET` | string | Hemlig nyckel för att signera outbound webhooks (t.ex. till n8n). | Webhook‑API routes. | Valfri (för lokala tester). | Rekommenderad. | **Obligatorisk**. | **Ja** – server‑side only. |
| `ALLOWED_ORIGINS` | string (CSV) | Lista av tillåtna origins för CORS (MCP/API). | `app/api/mcp/route.ts` och ev. andra CORS‑skyddade routes. | `http://localhost:3000` | Lägg till staging‑domän. | Prod‑domäner (`https://yourdomain.com,...`). | Nej, men ska inte visa interna domäner publikt. |
| `UPSTASH_REDIS_REST_URL` | string | Upstash REST‑URL för Redis (rate limiting). | `lib/rate-limit.ts` och rate‑limited endpoints. | Kan lämnas tom (ingen rate limit). | Rekommenderad. | Stark rekommendation. | **Ja** – server‑side only. |
| `UPSTASH_REDIS_REST_TOKEN` | string | Upstash REST token. | Rate limit klienten. | Kan lämnas tom (ingen rate limit). | Rekommenderad. | Stark rekommendation. | **Ja** – server‑side only. |

### 2.2 Auth & AI

| Variabel | Typ | Beskrivning | Används av | Dev | Staging | Prod | Hemlig? |
|---------|-----|-------------|------------|-----|---------|------|---------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | string | Google OAuth client ID för inloggning + Google One Tap. | `lib/auth/google-one-tap.ts`, `components/auth/GoogleOneTap.tsx`. | Valfri (endast e‑post login om tom). | Rekommenderad om OAuth behövs. | Rekommenderad i prod. | **Nej** – Google client IDs är publika per design. |
| `OPENROUTER_API_KEY` | string | API‑nyckel till OpenRouter (LLM‑tjänst). | AI‑/MCP‑relaterat (se `DEPLOYMENT_GUIDE.md`). | Valfri lokalt. | Om staging ska testa AI. | **Obligatorisk** om AI i prod. | **Ja** – server‑side only. |
| `OPENAI_API_KEY` | string | API‑nyckel till OpenAI (alternativ provider). | Valfri AI‑integration via `lib/env.ts`. | Valfri. | Valfri. | Endast om OpenAI används. | **Ja** – server‑side only. |

### 2.3 Övrigt

| Variabel | Typ | Beskrivning | Används av | Dev | Staging | Prod | Hemlig? |
|---------|-----|-------------|------------|-----|---------|------|---------|
| `NODE_ENV` | `development` \| `production` \| `test` | Node/Next.js miljö. | Alla miljöberoende paths (`isDevelopment`, `isProduction`, `isTest`). | `development` | `production` | `production` | Nej (sätts av runtime/host). |

> **Notera:** Historiska Vapi‑envs som `VAPI_API_KEY`, `VAPI_BASE_URL`, `VAPI_ORG_ID` är **inte** längre i bruk och ska inte finnas i `.env.local` (se `ENV_VAPI_KEY_REMOVED.md`). Alla Vapi‑nycklar ligger nu i `organizations`‑tabellen i Supabase, inte i env.

---

## 3. Vad är publikt vs hemligt?

### 3.1 Client-side (säkert att exponera)

Endast variabler med prefix `NEXT_PUBLIC_` och som uttryckligen används i `clientEnvSchema` får läsas på klientsidan:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_SITE_URL`

Dessa får ligga i Vercel/Netlify som **Public** env-vars samt checkas i klientkod via `process.env.NEXT_PUBLIC_*`.

### 3.2 Server-side only (måste hållas hemliga)

Följande **måste** endast användas på servern och aldrig läsas i klientkod eller exponeras i responses:

- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_SIGNING_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`

Regler:

- Endast läsas i servermiljö (Next.js route handlers, RSC, `lib/supabase/service.ts`, `lib/server/*`).
- Aldrig logga fullständiga värden (logger saniterar redan t.ex. `vapi_api_key`, `supabase_service_role` etc., se `lib/logger.ts`).
- Aldrig skicka tillbaka i HTTP‑responses.

---

## 4. Externa tjänster & hur man får keys

### 4.1 Supabase

- **Dashboard:** https://app.supabase.com/
- **Nycklar:**
  - Under **Project Settings → API**:
    - `NEXT_PUBLIC_SUPABASE_URL` = `Project URL`.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon public` key.
    - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key (server‑only).
- **Miljöer:**
  - Dev: du kan använda samma projekt som prod eller skapa ett separat dev‑projekt.
  - Prod: rekommenderat eget projekt.

### 4.2 Vercel (deployment)

- **Dashboard:** https://vercel.com/
- **Env‑variabler:**
  - Project → Settings → Environment Variables.
  - Lägg in alla variabler enligt §2 för `Development`, `Preview` (staging) och `Production`.

### 4.3 VAPI (AI‑assistenter)

- **Dashboard:** https://dashboard.vapi.ai/  
- **API‑nycklar:** Hanteras **inte** längre globalt i `.env`. Istället:
  - Per‑org nycklar lagras i Supabase i `organizations.vapi_api_key`, `vapi_public_api_key` m.fl. (se `VAPI_WHITE_LABEL_IMPLEMENTATION.md`, `IMPLEMENTATION_SUMMARY.md`).
  - Admin‑UI (`/admin/organizations/[id]?tab=ai-integration`) används för att konfigurera dessa.
- **Integration:**
  - MCP‑server‑URL används i Vapi (t.ex. `https://yourdomain.com/api/mcp`).
  - Ingen `VAPI_API_KEY` i env – allt sker per organisation via service‑role client.

### 4.4 OpenRouter

- **Dashboard:** https://openrouter.ai/  
- **Nyckel:** 
  - Skapa API key under kontoinställningar.  
  - Sätt den som `OPENROUTER_API_KEY` (server‑side only).

### 4.5 OpenAI (valfritt)

- **Dashboard:** https://platform.openai.com/  
- **Nyckel:** Skapa en "API key" och sätt som `OPENAI_API_KEY` (server‑side only) om projektet använder direkt OpenAI‑integration.

### 4.6 Upstash Redis (rate limiting)

- **Dashboard:** https://upstash.com/
- **Nycklar:**
  - Skapa Redis database → fliken **REST API**:
    - `UPSTASH_REDIS_REST_URL`
    - `UPSTASH_REDIS_REST_TOKEN`
  - Lägg in som env‑variabler (server‑side only).

### 4.7 Webhook‑konsumenter (t.ex. n8n)

- Ingen egen env‑nyckel i appen, men `WEBHOOK_SIGNING_SECRET` används för att signera requests:
  - Konsumerande system (t.ex. n8n) måste konfigureras med samma secret för att verifiera signaturen.

---

## 5. Rekommenderade värden per miljö

### 5.1 Development (`.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL` – dev‑ eller test‑Supabaseprojekt.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon key för samma projekt.
- `SUPABASE_SERVICE_ROLE_KEY` – **kan** vara satt för att testa admin‑flöden lokalt.
- `NEXT_PUBLIC_SITE_URL` – `http://localhost:3000`.
- `WEBHOOK_SIGNING_SECRET` – valfri random hex (kan vara enkel i dev).
- `ALLOWED_ORIGINS` – `http://localhost:3000`.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` – tomma (ingen rate‑limit) eller dev‑Upstash.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` – Google OAuth client ID för lokal dev (valfritt).
- `OPENROUTER_API_KEY`, `OPENAI_API_KEY` – kan lämnas tomma om AI inte testas.

### 5.2 Staging (Vercel Preview / separat projekt)

- Samma struktur som prod, men:
  - `NEXT_PUBLIC_SITE_URL` → staging‑domän.
  - `ALLOWED_ORIGINS` innehåller staging‑domäner.
  - Kan peka mot separat Supabase‑projekt eller ett staging‑schema.
  - `OPENROUTER_API_KEY`/`OPENAI_API_KEY` kan vara egna "staging keys" om du vill separera trafik.

### 5.3 Production

- **Måste** ha:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL` (prod‑URL)
  - `WEBHOOK_SIGNING_SECRET`
  - `ALLOWED_ORIGINS` med alla giltiga frontend‑origins.
- Stark rekommendation:
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` för rate limiting.
  - `OPENROUTER_API_KEY` (eller `OPENAI_API_KEY`) för AI‑funktionalitet.
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` om Google OAuth/One‑Tap används.

---

## 6. Deployment‑miljöer

### 6.1 Vercel (rekommenderad)

- Ett Vercel‑projekt kopplat till GitHub‑repo.
- Env‑variabler sätts per miljö:
  - **Development:** lokalt via `.env.local`.
  - **Preview (staging):** Vercel "Preview" env vars.
  - **Production:** Vercel "Production" env vars.
- Vid ny deploy:
  - Kontrollera `DEPLOYMENT_GUIDE.md` "Pre-Deploy" och "Post-Deploy" checklistor.

### 6.2 Supabase

- Minst ett projekt för systemet.
- Rekommenderat:
  - Dev + Prod som separata projekt (eller en branch‑baserad strategi via Supabase branches).
  - Migrations körs via Supabase CLI (`supabase db push`) eller genom att klistra in SQL i dashboard.

### 6.3 Upstash

- En Redis‑instans för prod (ev. separat för staging).
- Konfigureras endast via env‑vars.

---

## 7. Viktiga länkar

Samling av användbara dashboards och konsoler:

- **Supabase Dashboard:** https://app.supabase.com/
- **Vercel Dashboard:** https://vercel.com/
- **VAPI Dashboard:** https://dashboard.vapi.ai/
- **OpenRouter:** https://openrouter.ai/
- **OpenAI:** https://platform.openai.com/
- **Upstash:** https://upstash.com/
- **n8n (om används):** din egen instans, t.ex. `https://n8n.yourdomain.com`

---

## 8. Användning av detta dokument (för AI‑modeller)

1. Vid kod som använder `process.env.*` – kolla här för att se om variablen ska vara public eller server‑only.
2. Vid nya integrationer – lägg först till env‑variabeln i detta dokument och i `env.example`/`lib/env.ts` innan du använder den.
3. Vid deployment – använd §5 och §6 som checklista för att säkerställa att alla miljöer har rätt värden.
