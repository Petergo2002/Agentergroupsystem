# 🚀 Deployment Guide - Redo för Produktion

## ✅ Säkerhetsförbättringar Implementerade

Alla kritiska säkerhetsproblem är fixade! Se `SECURITY_FIXES.md` för detaljer.

---

## 📋 Snabb Deployment Checklista

### 1. Environment Variables (5 min)

Lägg till dessa i din production environment (Vercel/Netlify/etc):

```env
# Supabase (OBLIGATORISKT)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter AI (OBLIGATORISKT)
OPENROUTER_API_KEY=your_openrouter_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Webhook Signing (OBLIGATORISKT)
# Generera med: openssl rand -hex 32
WEBHOOK_SIGNING_SECRET=your_generated_secret

# CORS (OBLIGATORISKT)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting (STARKT REKOMMENDERAT)
# Gratis på https://upstash.com
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

---

### 2. Upstash Redis Setup (5 min) - REKOMMENDERAT

Rate limiting fungerar utan Redis i development, men för production behöver du det:

1. **Gå till https://upstash.com/**
2. **Skapa gratis konto** (ingen kreditkort behövs)
3. **Skapa ny Redis database**
   - Välj region närmast dina användare
   - Gratis tier räcker för de flesta
4. **Kopiera credentials**
   - REST URL
   - REST Token
5. **Lägg till i environment variables**

**Utan Redis:** Alla requests tillåts (OK för development, INTE för production)

---

### 3. Deploy till Vercel (5 min)

```bash
# 1. Installera Vercel CLI (om du inte har det)
npm i -g vercel

# 2. Logga in
vercel login

# 3. Deploy
vercel

# 4. Lägg till environment variables i Vercel dashboard
# Gå till: Settings > Environment Variables

# 5. Re-deploy för att aktivera nya env vars
vercel --prod
```

---

### 4. Testa Deployment (5 min)

#### A. Testa API-nyckel säkerhet
1. Öppna din production site
2. Logga in som admin
3. Öppna DevTools > Network tab
4. Gå till AI Assistants sidan
5. **Verifiera:** API-nycklar visas som `****xxxx` INTE hela nyckeln

#### B. Testa Rate Limiting
```bash
# Kör detta script för att testa rate limiting
for i in {1..35}; do
  curl -X GET https://yourdomain.com/api/admin/vapi/assistants \
    -H "Authorization: Bearer YOUR_TOKEN"
  echo "Request $i"
done

# Efter 30 requests ska du få 429 Too Many Requests
```

#### C. Testa CORS
```bash
# Detta ska INTE fungera från annan domän
curl -X POST https://yourdomain.com/api/mcp \
  -H "Origin: https://evil-site.com" \
  -H "Content-Type: application/json"

# Förväntat: CORS error
```

---

## 🔒 Säkerhetskonfiguration

### Rekommenderade Security Headers

Lägg till i `next.config.ts` eller din hosting platform:

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ];
},
```

---

## 📊 Monitoring Setup (REKOMMENDERAT)

### Option 1: Sentry (Gratis tier)

```bash
npm install @sentry/nextjs

# Kör setup wizard
npx @sentry/wizard@latest -i nextjs
```

Lägg till i `lib/logger-production.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

// I sendToExternalService metoden:
if (entry.level === 'error' && entry.error) {
  Sentry.captureException(entry.error, {
    contexts: { custom: entry.context }
  });
}
```

### Option 2: LogRocket

```bash
npm install logrocket

# Lägg till i app/layout.tsx
import LogRocket from 'logrocket';
if (process.env.NODE_ENV === 'production') {
  LogRocket.init('your-app-id');
}
```

---

## 🧪 Pre-Deploy Checklist

Kör dessa kommandon innan deploy:

```bash
# 1. Kör linting
npm run lint

# 2. Kör build (kontrollera inga errors)
npm run build

# 3. Testa production build lokalt
npm run start

# 4. Verifiera environment variables
cat .env.local  # Kontrollera alla är satta
```

---

## 🚨 Post-Deploy Checklist

Efter deployment, verifiera:

- [ ] Sidan laddas korrekt
- [ ] Login fungerar
- [ ] Admin panel fungerar
- [ ] API-nycklar är maskerade i Network tab
- [ ] Rate limiting fungerar (testa med många requests)
- [ ] CORS blockerar externa domäner
- [ ] Inga errors i browser console
- [ ] Inga errors i server logs

---

## 🆘 Troubleshooting

### Problem: Rate limiting fungerar inte
**Lösning:** Kontrollera att `UPSTASH_REDIS_REST_URL` och `UPSTASH_REDIS_REST_TOKEN` är satta

### Problem: CORS errors
**Lösning:** Lägg till din domän i `ALLOWED_ORIGINS`

### Problem: API-nycklar exponeras fortfarande
**Lösning:** Kör `npm run build` igen och re-deploy

### Problem: 500 errors
**Lösning:** Kolla server logs och verifiera alla environment variables är satta

---

## 📈 Performance Tips

### 1. Enable Caching
```typescript
// I dina API routes
export const revalidate = 60; // Cache i 60 sekunder
```

### 2. Optimize Images
Alla bilder går redan genom Next.js Image optimization

### 3. Enable Compression
Vercel gör detta automatiskt, men för andra platforms:
```bash
npm install compression
```

---

## 🎯 Success Metrics

Efter deployment, övervaka:

1. **Response Times:** Ska vara < 200ms för de flesta requests
2. **Error Rate:** Ska vara < 1%
3. **Rate Limit Hits:** Om många 429 errors, öka limits
4. **API Key Exposure:** 0 (verifiera i logs)

---

## 📞 Support

Om något går fel:
1. Kolla `SECURITY_FIXES.md` för vad som är fixat
2. Kolla server logs för errors
3. Verifiera alla environment variables
4. Testa lokalt först med `npm run build && npm run start`

---

## 🎉 Du är redo!

Med alla dessa fixes kan du säkert sälja och deploya din app.

**Viktiga länkar:**
- Upstash: https://upstash.com/
- Sentry: https://sentry.io/
- Vercel: https://vercel.com/

**Nästa steg:**
1. Sätt upp Upstash Redis (5 min)
2. Deploy till Vercel (5 min)
3. Testa allt (10 min)
4. 🚀 Börja sälja!
