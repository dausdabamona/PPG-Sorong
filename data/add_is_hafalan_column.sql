-- Add is_hafalan column to materi_item table
-- Run this in Supabase SQL Editor

-- 1. Add column
ALTER TABLE materi_item
ADD COLUMN IF NOT EXISTS is_hafalan BOOLEAN DEFAULT FALSE;

-- 2. Update existing hafalan items (based on kategori names containing 'hafalan', 'surat', 'doa', 'dalil')
UPDATE materi_item mi
SET is_hafalan = TRUE
FROM kategori_materi km
WHERE mi.kategori_id = km.id
AND (
    LOWER(km.nama) LIKE '%hafalan%'
    OR LOWER(km.nama) LIKE '%surat%'
    OR LOWER(km.nama) LIKE '%doa%'
    OR LOWER(km.nama) LIKE '%dalil%'
    OR LOWER(km.kode) LIKE '%hfl%'
);

-- 3. Verify
SELECT
    mi.id,
    mi.nama,
    mi.is_hafalan,
    km.nama as kategori_nama
FROM materi_item mi
LEFT JOIN kategori_materi km ON mi.kategori_id = km.id
WHERE mi.is_hafalan = TRUE
ORDER BY km.nama, mi.nomor;
