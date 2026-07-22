# Setup Guide

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Supabase](https://supabase.com/) account (free tier works)
- [Git](https://git-scm.com/) (optional)

## 1. Supabase Project Setup

### Create a new Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Choose an organization, enter a name (e.g., `pdf-form-generator`)
4. Set a secure database password
5. Choose a region close to your users
6. Wait for the project to be provisioned (~2 minutes)

### Get API credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy the **anon public key** (starts with `eyJ...`)
4. Keep the **service_role key** for later (used in Edge Functions)

### Create storage buckets

1. Go to **Storage** in the sidebar
2. Create bucket `pdf-templates`
   - Check "Public bucket"
   - File size limit: 20MB
   - Allowed MIME types: `application/pdf`
3. Create bucket `pdf-outputs`
   - Check "Public bucket"
   - File size limit: 50MB
   - Allowed MIME types: `application/pdf`

### Run database migration

1. Go to **SQL Editor** in the sidebar
2. Click "New query"
3. Copy the contents of `supabase/migrations/001_schema.sql`
4. Click "Run"
5. Verify tables are created in **Table Editor**

### Configure Auth

1. Go to **Authentication → Providers**
2. Ensure "Email" provider is enabled
3. Disable "Confirm email" for development (optional, recommended for testing)
4. For Magic Link: it's enabled by default with the Email provider

## 2. Local Environment Setup

### Clone and install

```bash
# From the project root
cd generator_doc

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Configure environment variables

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Deploy Edge Functions

### Install Supabase CLI

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Or use npm:
```bash
npm install -g supabase
```

### Login and link project

```bash
supabase login
supabase link --project-ref your-project-ref
```

Your project ref is the string in your Supabase URL: `https://{project-ref}.supabase.co`

### Set secrets

```bash
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Deploy functions

```bash
supabase functions deploy generate-pdf
supabase functions deploy get-public-template
```

## 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 5. Usage Flow

### Creating a Template

1. Open the app and sign in with your email (magic link)
2. Click "New Template"
3. **Step 1 — Details:** Enter a name and optional description
4. **Step 2 — Form Fields:** Click "Add Field" to define each form field
   - Set field name, label, type (text, number, date, select, checkbox)
   - Mark required fields
   - For select type, enter options (one per line)
   - Click "Save Fields"
5. **Step 3 — Place Fields:** 
   - Upload your PDF template
   - Click a field in the sidebar to select it
   - Click and drag on the PDF page to create a text box
   - Resize and reposition as needed
   - Navigate between pages to place fields on different pages
   - Click "Finish Template"

### Using a Template

1. From the dashboard, click "Publish" on your template
2. Copy the share link
3. Open the share link in any browser
4. Fill in the form fields
5. Click "Generate Document"
6. Download the generated PDF

### Previewing before publishing

1. Open your template from the dashboard
2. Click "Preview with Data"
3. Enter sample values
4. Click "Generate Preview"
5. Review the generated PDF
6. Go back and adjust placements if needed

## 6. Production Deployment

### Build the frontend

```bash
npm run build
```

The output will be in the `dist/` directory.

### Deploy options

- **Vercel / Netlify:** Upload the `dist/` directory, set the output to `dist`
- **Supabase Static Hosting:** Use Supabase's built-in hosting
- **GitHub Pages:** Configure GitHub Actions to build and deploy
- **Any static host:** Serve `dist/` as a static site (Single Page Application)

### Production checklist

- [ ] Enable email confirmation in Supabase Auth
- [ ] Set up a custom domain for your Supabase project
- [ ] Review RLS policies for correctness
- [ ] Set appropriate storage bucket file size limits
- [ ] Configure CORS if needed
- [ ] Monitor Edge Function invocation limits
- [ ] Set up error tracking (e.g., Sentry)

## Troubleshooting

### PDF viewer shows blank page
- Ensure the PDF URL is publicly accessible
- Check browser console for CORS errors
- Verify the `pdf-templates` bucket is public

### Edge Function returns 500 error
- Check Edge Function logs in Supabase Dashboard
- Verify `SUPABASE_SERVICE_ROLE_KEY` secret is set correctly
- Ensure the `pdf-outputs` bucket exists and is public
- Check that the template has `original_pdf_url` set

### Form fields not appearing in placement editor
- Fields must be saved before they appear in the placement editor
- Go back to the "Form Fields" tab and click "Save Fields"
- Refresh the page if needed

### Coordinate placement is offset
- This can happen if the PDF viewer scale changes between placement and generation
- Try keeping the default scale (150%) when placing fields
- The coordinate conversion uses the current scale factor — consistent scale = consistent results
