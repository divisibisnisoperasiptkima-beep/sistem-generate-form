# API Reference

## Supabase Edge Functions

### 1. `generate-pdf`

Generates a filled PDF document by overlaying form data onto a template PDF.

```
POST /functions/v1/generate-pdf
```

**Request Body:**
```json
{
  "template_id": "uuid",
  "data": {
    "field_name_1": "value_1",
    "field_name_2": "value_2"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "download_url": "https://xxx.supabase.co/storage/v1/object/public/pdf-outputs/generated/..."
}
```

**Response (400):**
```json
{ "error": "Missing template_id or data" }
```

**Response (404):**
```json
{ "error": "Template not found" }
```

**Internal Flow:**
1. Validates input
2. Fetches template, fields, and placements from DB using service role key
3. Downloads original PDF from Storage
4. Loads PDF with `pdf-lib`
5. For each placement with a corresponding field value:
   - Looks up field name from field_id
   - Converts coordinates from top-left to bottom-left (PDF native)
   - Draws text with proper font, size, color, and alignment
6. Saves generated PDF to `pdf-outputs` storage bucket
7. Creates submission record
8. Returns public download URL

---

### 2. `get-public-template`

Retrieves template information for public form rendering, or processes form submissions.

```
POST /functions/v1/get-public-template
```

**Get Template (action="get"):**

```json
{
  "share_token": "abc123xyz456",
  "action": "get"
}
```

**Response (200):**
```json
{
  "template": {
    "id": "uuid",
    "name": "Employment Contract",
    "description": "...",
    "created_at": "..."
  },
  "fields": [
    {
      "id": "uuid",
      "name": "full_name",
      "label": "Full Name",
      "field_type": "text",
      "required": true,
      "placeholder": "Enter full name",
      "default_value": null,
      "options": null,
      "sort_order": 0
    }
  ]
}
```

**Submit Form (action="submit"):**

```json
{
  "share_token": "abc123xyz456",
  "action": "submit",
  "data": {
    "full_name": "John Doe",
    "start_date": "2026-01-15"
  }
}
```

Calls `generate-pdf` function internally and returns the same response format.

**Response (404):**
```json
{ "error": "Form not found or not published" }
```

---

## Database API (Supabase Client)

The frontend communicates directly with Supabase PostgreSQL via the Supabase JS client. All operations are protected by Row Level Security.

### Templates

| Operation | Endpoint | Auth Required |
|---|---|---|
| List user templates | `templates.select()` | Yes (user_id = auth.uid()) |
| Get template | `templates.select().eq('id', id).single()` | Yes |
| Create template | `templates.insert({...})` | Yes |
| Update template | `templates.update({...}).eq('id', id)` | Yes |
| Delete template | `templates.delete().eq('id', id)` | Yes |

### Template Fields

| Operation | Endpoint | Auth Required |
|---|---|---|
| List fields | `template_fields.select().eq('template_id', id)` | Yes (template owner) |
| Save fields | `template_fields.insert([...])` | Yes (template owner) |
| Update field | `template_fields.update({...}).eq('id', id)` | Yes |
| Delete field | `template_fields.delete().eq('id', id)` | Yes |

### Field Placements

| Operation | Endpoint | Auth Required |
|---|---|---|
| List placements | `field_placements.select().eq('template_id', id)` | Yes (template owner) |
| Save placement | `field_placements.upsert({...})` | Yes (template owner) |
| Delete placement | `field_placements.delete().eq('id', id)` | Yes |

### Submissions

| Operation | Endpoint | Auth Required |
|---|---|---|
| Insert submission | `submissions.insert({...})` | No (if template is published) |
| View submissions | `submissions.select().eq('template_id', id)` | Yes (template owner) |

## Storage Buckets

### `pdf-templates`
- **Purpose:** Stores original uploaded PDF template files
- **Path structure:** `templates/{template_id}/{filename}`
- **Public read:** Yes
- **Write:** Authenticated users only

### `pdf-outputs`
- **Purpose:** Stores generated PDF documents
- **Path structure:** `generated/{template_id}/{uuid}.pdf`
- **Public read:** Yes
- **Write:** Authenticated users only (Edge Functions use service role)
