-- 004_extend_field_placements.sql
-- Add comprehensive typography, layout, alignment, and box styling options to field_placements

ALTER TABLE field_placements
  ADD COLUMN IF NOT EXISTS vertical_align TEXT DEFAULT 'middle',
  ADD COLUMN IF NOT EXISTS word_wrap BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_fit_font BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_font_size FLOAT DEFAULT 8,
  ADD COLUMN IF NOT EXISTS max_font_size FLOAT DEFAULT 24,
  ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS border_color TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS border_width FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS padding FLOAT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS opacity FLOAT DEFAULT 1.0;
