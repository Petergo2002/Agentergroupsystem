# API Overview – V3 Architecture

> **Version:** 3.0  
> **Last Updated:** 2025-11-27

---

## 1. Översikt

API:et är byggt med Next.js App Router och använder Supabase för datalagring.

### Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

---

## 2. Rapport API

### 2.1 Endpoints

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/reports` | Lista rapporter |
| GET | `/api/reports/[id]` | Hämta rapport |
| POST | `/api/reports` | Skapa rapport |
| PATCH | `/api/reports/[id]` | Uppdatera rapport |
| DELETE | `/api/reports/[id]` | Radera rapport |
| GET | `/api/reports/[id]/pdf` | Generera PDF |
| GET | `/api/reports/public/[publicId]` | Publik vy |

### 2.2 GET /api/reports

Lista alla rapporter för användaren.

**Response:**

```json
{
  "reports": [
    {
      "id": "uuid",
      "title": "Läckagerapport",
      "status": "draft",
      "type": "läckage",
      "templateId": "uuid",
      "metadata": {
        "client": "Kund AB",
        "location": "Stockholm"
      },
      "updatedAt": "2025-11-27T10:00:00Z"
    }
  ]
}
```

### 2.3 GET /api/reports/[id]

Hämta fullständig rapport.

**Response:**

```json
{
  "id": "uuid",
  "title": "Läckagerapport",
  "status": "draft",
  "type": "läckage",
  "version": 3,
  "templateId": "uuid",
  "sections": [
    {
      "id": "sec_001",
      "title": "Inledning",
      "type": "text",
      "content": { "text": "..." },
      "status": "completed"
    }
  ],
  "metadata": { ... },
  "checklist": [ ... ],
  "assets": [ ... ]
}
```

### 2.4 POST /api/reports

Skapa ny rapport.

**Request:**

```json
{
  "title": "Ny rapport",
  "templateId": "uuid",
  "metadata": {
    "client": "Kund AB",
    "location": "Stockholm"
  }
}
```

### 2.5 GET /api/reports/[id]/pdf

Generera PDF för rapport.

**Query Parameters:**

| Parameter | Typ | Beskrivning |
|-----------|-----|-------------|
| `designId` | string | PDF-design (standard, modern_hero) |
| `download` | boolean | Tvinga nedladdning |

**Response:** `application/pdf`

### 2.6 GET /api/reports/public/[publicId]

Publik vy för delad rapport.

**Response:**

```json
{
  "id": "uuid",
  "title": "Läckagerapport",
  "status": "approved",
  "sections": [ ... ],
  "metadata": { ... }
}
```

---

## 3. Template API

### 3.1 Endpoints

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/templates` | Lista mallar |
| GET | `/api/templates/[id]` | Hämta mall |
| POST | `/api/templates` | Skapa mall |
| PATCH | `/api/templates/[id]` | Uppdatera mall |
| DELETE | `/api/templates/[id]` | Radera mall |

### 3.2 GET /api/templates

**Response:**

```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Läckagemall",
      "trade": "läckage",
      "version": 3,
      "designId": "standard",
      "sections": [ ... ]
    }
  ]
}
```

---

## 4. Section API

### 4.1 Endpoints

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/sections` | Lista sektionsdefinitioner |
| POST | `/api/sections` | Skapa sektion |
| PATCH | `/api/sections/[id]` | Uppdatera sektion |
| DELETE | `/api/sections/[id]` | Radera sektion |

---

## 5. Upload API

### 5.1 Bilduppladdning

**Endpoint:** `POST /api/upload/image`

**Request:** `multipart/form-data`

| Field | Typ | Beskrivning |
|-------|-----|-------------|
| `file` | File | Bildfil (max 5MB) |
| `reportId` | string | Rapport-ID |
| `sectionId` | string | Sektions-ID (valfritt) |

**Response:**

```json
{
  "url": "https://storage.supabase.co/...",
  "id": "uuid",
  "name": "image.jpg",
  "size": 123456
}
```

---

## 6. Auth API

### 6.1 Session

**Endpoint:** `GET /api/auth/session`

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "organizationId": "uuid"
  }
}
```

---

## 7. Admin API

### 7.1 Organizations

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/admin/organizations` | Lista organisationer |
| GET | `/api/admin/organizations/[id]` | Hämta organisation |
| PATCH | `/api/admin/organizations/[id]` | Uppdatera organisation |

### 7.2 Users

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/admin/users` | Lista användare |
| PATCH | `/api/admin/users/[id]` | Uppdatera användare |

---

## 8. Vapi Integration API

### 8.1 Endpoints

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/vapi/assistants` | Lista assistenter |
| POST | `/api/vapi` | Webhook för Vapi |
| GET | `/api/vapi/analytics` | Samtalsanalys |

---

## 9. Error Handling

### 9.1 Error Response

```json
{
  "error": "Not found",
  "message": "Report with id 'xyz' not found",
  "code": "REPORT_NOT_FOUND"
}
```

### 9.2 HTTP Status Codes

| Code | Beskrivning |
|------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 10. Authentication

Alla API-anrop (utom publika endpoints) kräver autentisering via Supabase Auth.

### 10.1 Cookie-baserad (Browser)

```typescript
// Automatiskt via Supabase client
const supabase = createBrowserClient();
```

### 10.2 API Key (Server-to-Server)

```
Authorization: Bearer <api_key>
```

---

## 11. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/reports` | 100 req/min |
| `/api/upload` | 20 req/min |
| `/api/vapi` | 1000 req/min |

---

## 12. Relaterade Dokument

- [ARCHITECTURE.md](./ARCHITECTURE.md) – Övergripande arkitektur
- [DATA_MODEL.md](./DATA_MODEL.md) – Datamodeller
- [VAPI_INTEGRATION_GUIDE.md](../dev/VAPI_INTEGRATION_GUIDE.md) – Vapi-integration
