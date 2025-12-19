-- Migration: Add jenis_kelamin column to pengajian table
-- This allows filtering participants by gender (L = Laki-laki, P = Perempuan, NULL = Semua)

-- Add jenis_kelamin column to pengajian table
ALTER TABLE pengajian
ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(1) DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN pengajian.jenis_kelamin IS 'Filter peserta berdasarkan jenis kelamin: L = Laki-laki saja, P = Perempuan saja, NULL = Semua';

-- Optional: Add check constraint
ALTER TABLE pengajian
ADD CONSTRAINT chk_pengajian_jenis_kelamin
CHECK (jenis_kelamin IS NULL OR jenis_kelamin IN ('L', 'P'));
