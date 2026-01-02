-- ============================================================================
-- STORED PROCEDURE: Generate Pengajian Bulanan
-- ============================================================================
-- Fungsi ini membuat jadwal pengajian berdasarkan template jadwal_rutin
-- untuk bulan tertentu
-- ============================================================================

CREATE OR REPLACE FUNCTION sp_generate_pengajian_bulanan(
    p_tahun INTEGER,
    p_bulan INTEGER,
    p_created_by INTEGER DEFAULT NULL
)
RETURNS TABLE (
    jadwal_rutin_id INTEGER,
    tanggal DATE,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_current_date DATE;
    v_hari INTEGER;
    v_rutin RECORD;
    v_exists BOOLEAN;
    v_skipped BOOLEAN;
BEGIN
    -- Set tanggal awal dan akhir bulan
    v_start_date := make_date(p_tahun, p_bulan, 1);
    v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    -- Loop setiap jadwal rutin yang aktif
    FOR v_rutin IN
        SELECT id, wilayah_id, jenjang_id, hari, waktu_mulai, waktu_selesai, keterangan
        FROM jadwal_rutin
        WHERE is_aktif = true
    LOOP
        -- Loop setiap hari dalam bulan
        v_current_date := v_start_date;

        WHILE v_current_date <= v_end_date LOOP
            -- Cek apakah hari ini sesuai dengan jadwal rutin
            -- PostgreSQL: 0=Sunday, 1=Monday, ..., 6=Saturday
            v_hari := EXTRACT(DOW FROM v_current_date)::INTEGER;

            IF v_hari = v_rutin.hari THEN
                -- Cek apakah tanggal ini di-skip
                SELECT EXISTS(
                    SELECT 1 FROM tanggal_skip
                    WHERE tanggal = v_current_date
                    AND (wilayah_id IS NULL OR wilayah_id = v_rutin.wilayah_id)
                    AND is_aktif = true
                ) INTO v_skipped;

                IF v_skipped THEN
                    -- Return status skipped
                    jadwal_rutin_id := v_rutin.id;
                    tanggal := v_current_date;
                    status := 'skipped';
                    RETURN NEXT;
                ELSE
                    -- Cek apakah pengajian sudah ada
                    SELECT EXISTS(
                        SELECT 1 FROM pengajian
                        WHERE tanggal = v_current_date
                        AND wilayah_id = v_rutin.wilayah_id
                        AND jenjang_id = v_rutin.jenjang_id
                    ) INTO v_exists;

                    IF v_exists THEN
                        -- Return status exists
                        jadwal_rutin_id := v_rutin.id;
                        tanggal := v_current_date;
                        status := 'exists';
                        RETURN NEXT;
                    ELSE
                        -- Insert pengajian baru
                        INSERT INTO pengajian (
                            wilayah_id,
                            jenjang_id,
                            tanggal,
                            waktu_mulai,
                            waktu_selesai,
                            keterangan,
                            created_by,
                            created_at
                        ) VALUES (
                            v_rutin.wilayah_id,
                            v_rutin.jenjang_id,
                            v_current_date,
                            v_rutin.waktu_mulai,
                            v_rutin.waktu_selesai,
                            v_rutin.keterangan,
                            p_created_by,
                            NOW()
                        );

                        -- Return status created
                        jadwal_rutin_id := v_rutin.id;
                        tanggal := v_current_date;
                        status := 'created';
                        RETURN NEXT;
                    END IF;
                END IF;
            END IF;

            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION sp_generate_pengajian_bulanan(INTEGER, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- Jika tabel tanggal_skip belum ada, buat tabelnya
-- ============================================================================
CREATE TABLE IF NOT EXISTS tanggal_skip (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    wilayah_id INTEGER REFERENCES wilayah(id) ON DELETE CASCADE,
    keterangan TEXT,
    is_aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Disable RLS untuk tanggal_skip
ALTER TABLE tanggal_skip DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Pastikan tabel jadwal_rutin ada
-- ============================================================================
CREATE TABLE IF NOT EXISTS jadwal_rutin (
    id SERIAL PRIMARY KEY,
    wilayah_id INTEGER REFERENCES wilayah(id) ON DELETE CASCADE,
    jenjang_id INTEGER REFERENCES jenjang(id) ON DELETE CASCADE,
    hari INTEGER NOT NULL CHECK (hari >= 0 AND hari <= 6), -- 0=Minggu, 1=Senin, ..., 6=Sabtu
    waktu_mulai TIME,
    waktu_selesai TIME,
    keterangan TEXT,
    is_aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Disable RLS untuk jadwal_rutin
ALTER TABLE jadwal_rutin DISABLE ROW LEVEL SECURITY;
