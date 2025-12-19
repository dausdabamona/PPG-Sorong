-- Migration: Add jenis_kelamin and jenjang_ids columns to pengajian table
-- This allows filtering participants by gender and jenjang

-- Add jenis_kelamin column to pengajian table
ALTER TABLE pengajian
ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(1) DEFAULT NULL;

-- Add jenjang_ids column (JSON array of jenjang IDs)
ALTER TABLE pengajian
ADD COLUMN IF NOT EXISTS jenjang_ids JSONB DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN pengajian.jenis_kelamin IS 'Filter peserta berdasarkan jenis kelamin: L = Laki-laki saja, P = Perempuan saja, NULL = Semua';
COMMENT ON COLUMN pengajian.jenjang_ids IS 'Array JSON berisi ID jenjang yang dipilih, contoh: [1, 2, 3]';

-- Optional: Add check constraint for jenis_kelamin
ALTER TABLE pengajian
DROP CONSTRAINT IF EXISTS chk_pengajian_jenis_kelamin;

ALTER TABLE pengajian
ADD CONSTRAINT chk_pengajian_jenis_kelamin
CHECK (jenis_kelamin IS NULL OR jenis_kelamin IN ('L', 'P'));
