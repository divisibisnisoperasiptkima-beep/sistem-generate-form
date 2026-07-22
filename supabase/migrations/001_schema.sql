-- 001_schema.sql
-- PDF Form Generator - Database Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Templates
-- ============================================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  original_pdf_url TEXT,
  is_published BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Owner full access" ON templates
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read published templates
CREATE POLICY "Public read published" ON templates
  FOR SELECT USING (is_published = true);

-- ============================================================
-- Template Fields
-- ============================================================
CREATE TABLE template_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  required BOOLEAN DEFAULT false,
  placeholder TEXT,
  default_value TEXT,
  options JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;

-- Owner of template can manage fields
CREATE POLICY "Template owner manage fields" ON template_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_fields.template_id
      AND templates.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_fields.template_id
      AND templates.user_id = auth.uid()
    )
  );

-- Anyone can read fields of published templates
CREATE POLICY "Public read fields" ON template_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_fields.template_id
      AND templates.is_published = true
    )
  );

-- ============================================================
-- Field Placements
-- ============================================================
CREATE TABLE field_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES template_fields(id) ON DELETE CASCADE NOT NULL,
  page INTEGER DEFAULT 1,
  x FLOAT DEFAULT 0,
  y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 150,
  height FLOAT DEFAULT 20,
  font_size FLOAT DEFAULT 12,
  font_family TEXT DEFAULT 'Helvetica',
  font_color TEXT DEFAULT '#000000',
  text_align TEXT DEFAULT 'left',
  font_style TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE field_placements ENABLE ROW LEVEL SECURITY;

-- Owner of template can manage placements
CREATE POLICY "Template owner manage placements" ON field_placements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = field_placements.template_id
      AND templates.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = field_placements.template_id
      AND templates.user_id = auth.uid()
    )
  );

-- ============================================================
-- Submissions
-- ============================================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'completed',
  generated_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert submissions for published templates
CREATE POLICY "Insert submissions" ON submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = submissions.template_id
      AND templates.is_published = true
    )
  );

-- Template owner can view submissions
CREATE POLICY "Owner view submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = submissions.template_id
      AND templates.user_id = auth.uid()
    )
  );

-- ============================================================
-- Storage Buckets
-- ============================================================
-- After running this migration, create these buckets manually in the Supabase dashboard:
-- 1. pdf-templates  (public read, authenticated write)
-- 2. pdf-outputs    (public read, authenticated write)

-- Bucket policy examples (adjust in Supabase dashboard):
-- pdf-templates: 
--   - SELECT: public
--   - INSERT: authenticated only
--   - DELETE: owner only (via RLS, user_id match)
-- pdf-outputs:
--   - SELECT: public  
--   - INSERT: authenticated only
