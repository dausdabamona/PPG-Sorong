-- ============================================================================
-- FIX ENUM STATUS_KEAKTIFAN_ENUM UNTUK RAPOR
-- PPG SORONG
-- ============================================================================
-- Error: invalid input value for enum status_keaktifan_enum: "alpa"
-- Solusi: Tambahkan value "alpa" ke enum
-- ============================================================================

-- Cek enum yang ada
-- SELECT unnest(enum_range(NULL::status_keaktifan_enum));

-- Tambahkan 'alpa' ke enum jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'alpa'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_keaktifan_enum')
    ) THEN
        ALTER TYPE status_keaktifan_enum ADD VALUE IF NOT EXISTS 'alpa';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Jika enum tidak ada atau error lain, abaikan
    RAISE NOTICE 'Note: Could not add alpa to enum, might already exist or enum does not exist';
END $$;

-- Alternatif: Jika stored procedure menggunakan text, update untuk handle 'alpa'
-- Atau buat ulang stored procedure get_presensi_rekap yang tidak menggunakan enum

-- ============================================================================
-- ALTERNATIF: Buat function baru tanpa enum
-- ============================================================================

CREATE OR REPLACE FUNCTION get_presensi_rekap_v2(
    p_jamaah_id INTEGER,
    p_bulan INTEGER DEFAULT NULL,
    p_tahun INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_pengajian BIGINT,
    total_hadir BIGINT,
    total_izin BIGINT,
    total_sakit BIGINT,
    total_alpa BIGINT,
    persentase_hadir NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT p.pengajian_id)::BIGINT as total_pengajian,
        COUNT(CASE WHEN p.status = 'hadir' THEN 1 END)::BIGINT as total_hadir,
        COUNT(CASE WHEN p.status = 'izin' THEN 1 END)::BIGINT as total_izin,
        COUNT(CASE WHEN p.status = 'sakit' THEN 1 END)::BIGINT as total_sakit,
        COUNT(CASE WHEN p.status IN ('alpa', 'tidak_hadir', 'alpha') THEN 1 END)::BIGINT as total_alpa,
        CASE
            WHEN COUNT(DISTINCT p.pengajian_id) > 0
            THEN ROUND((COUNT(CASE WHEN p.status = 'hadir' THEN 1 END)::NUMERIC / COUNT(DISTINCT p.pengajian_id)::NUMERIC) * 100, 1)
            ELSE 0
        END as persentase_hadir
    FROM presensi p
    JOIN pengajian pg ON pg.id = p.pengajian_id
    WHERE p.jamaah_id = p_jamaah_id
        AND (p_bulan IS NULL OR EXTRACT(MONTH FROM pg.tanggal) = p_bulan)
        AND (p_tahun IS NULL OR EXTRACT(YEAR FROM pg.tanggal) = p_tahun);
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION get_presensi_rekap_v2 TO anon, authenticated;

-- ============================================================================
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Copy paste seluruh isi file ini
-- 3. Klik "Run"
-- 4. Jika berhasil, API akan menggunakan function baru
-- ============================================================================
