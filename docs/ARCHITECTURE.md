# Architecture

## Overview

PDF Form Generator is a full-stack web application that allows users to upload PDF templates, define fillable form fields, visually position those fields on the PDF, share the form with others, and generate filled PDF documents.

The entire application runs on the Supabase platform — PostgreSQL for the database, Supabase Auth for authentication, Supabase Storage for file storage, and Supabase Edge Functions for server-side PDF generation logic.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS |
| State Management | Zustand |
| Routing | React Router v6 |
| PDF Rendering (frontend) | pdfjs-dist |
| PDF Generation (backend) | pdf-lib |
| Database | Supabase PostgreSQL |
| Auth | Supabase Magic Link |
| Storage | Supabase Storage |
| Serverless Functions | Supabase Edge Functions (Deno) |

## Project Structure

```
generator_doc/
├── public/                         # Static assets
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx          # App shell (navbar + outlet)
│   │   │   └── Navbar.jsx          # Top navigation bar
│   │   ├── pdf/
│   │   │   ├── PdfViewer.jsx       # PDF renderer using pdfjs-dist
│   │   │   ├── PlacementOverlay.jsx # Drag-and-drop field placement on PDF
│   │   │   └── FieldPlacementEditor.jsx # Full placement editor (sidebar + viewer)
│   │   ├── form/
│   │   │   ├── FieldBuilder.jsx    # Form field definition UI (Google Forms-like)
│   │   │   ├── FieldItem.jsx       # Single field editor row
│   │   │   └── PublicForm.jsx      # Public-facing form renderer
│   │   └── ui/
│   │       ├── Button.jsx          # Reusable button component
│   │       ├── Input.jsx           # Reusable input component
│   │       ├── Modal.jsx           # Modal dialog
│   │       ├── Spinner.jsx         # Loading spinner
│   │       └── EmptyState.jsx      # Empty state placeholder
│   ├── pages/
│   │   ├── Dashboard.jsx           # Landing + templates list
│   │   ├── TemplateNew.jsx         # Step-by-step template creation wizard
│   │   ├── TemplateDetail.jsx      # Template detail view + summary
│   │   ├── TemplateEdit.jsx        # Edit fields & placements
│   │   ├── TemplatePreview.jsx     # Preview page (sample data → generate preview)
│   │   ├── PublicFormPage.jsx      # Shared form page (no auth required)
│   │   └── NotFound.jsx            # 404 page
│   ├── stores/
│   │   ├── useAuthStore.js         # Auth state (user, session, signIn, signOut)
│   │   ├── useTemplateStore.js     # Templates, fields, placements, submissions CRUD
│   │   └── usePdfStore.js          # PDF viewer state (page, scale, selection)
│   ├── lib/
│   │   ├── supabase.js             # Supabase client initialization
│   │   └── utils.js                # Helper utilities (cn, formatDate, etc.)
│   ├── App.jsx                     # Route definitions
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Tailwind imports + base styles
├── supabase/
│   ├── functions/
│   │   ├── generate-pdf/
│   │   │   └── index.ts            # PDF generation endpoint (pdf-lib overlay)
│   │   └── get-public-template/
│   │       └── index.ts            # Public template info + form submission
│   └── migrations/
│       └── 001_schema.sql          # Database schema + RLS policies
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── SETUP.md
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

## Data Flow

### Template Creation
```
User (Template Creator)
  │
  ├─[1] Upload PDF ───────► Supabase Storage (pdf-templates bucket)
  │
  ├─[2] Define fields ───► Supabase PostgreSQL (template_fields table)
  │
  ├─[3] Place fields ─────► pdfjs-dist renders PDF in browser
  │    on PDF                    │
  │                        Supabase PostgreSQL (field_placements table)
  │
  └─[4] Publish ──────────► Sets is_published=true, share_token active
```

### Form Fill & PDF Generation
```
User (Form Filler)
  │
  ├─[1] Open /f/{token} ──► get-public-template Edge Function
  │                         Returns template + field definitions
  │
  ├─[2] Fill form ────────► Client-side validation
  │
  ├─[3] Submit ───────────► get-public-template Edge Function (action=submit)
  │                               │
  │                         Calls generate-pdf Edge Function
  │                               │
  │                         ┌─────┴─────┐
  │                         │  pdf-lib   │
  │                         │ 1. Load PDF │
  │                         │ 2. Embed font│
  │                         │ 3. Draw text │
  │                         │ 4. Save PDF  │
  │                         └─────┬─────┘
  │                               │
  │                         Supabase Storage (pdf-outputs bucket)
  │
  └─[4] Download PDF ◄──── Returns public download URL
```

## Database Schema

See `supabase/migrations/001_schema.sql` for the full schema.

Key entities:

- **templates** — Template metadata (name, creator, original PDF URL, share token)
- **template_fields** — Field definitions (name, label, type, required, options)
- **field_placements** — Visual position of each field on the PDF (page, x, y, font settings)
- **submissions** — Each form submission (template reference, submitted data, output PDF URL)

## Security

- **Row Level Security (RLS)** — Every table has RLS policies scoping data access per user
- **Supabase Auth** — Magic link authentication (no passwords)
- **Edge Functions** — Use service role key for privileged operations (PDF generation)
- **Storage Buckets** — Public read for generated PDFs, authenticated write for uploads
- **Share Tokens** — Random 12-character alphanumeric tokens for public form access

## Key Design Decisions

1. **PDF Points as coordinate system** — All placement positions are stored in PDF points (72 per inch), ensuring scale-independent rendering in the Edge Function.

2. **pdf-lib for server-side PDF generation** — Pure JavaScript library that works in Deno runtime. No LibreOffice or external binaries needed.

3. **pdfjs-dist for client-side PDF rendering** — Industry-standard PDF.js library for rendering pages in the browser canvas.

4. **Zustand for state management** — Lightweight, hook-based state management with no boilerplate. Separate stores for auth, templates, and PDF viewer state.

5. **Supabase client for direct DB access** — Frontend communicates directly with Supabase PostgreSQL for authenticated CRUD operations via RLS, eliminating the need for a separate backend API layer for most operations.
