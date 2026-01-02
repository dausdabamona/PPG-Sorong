-- ============================================================================
-- ROLE PERMISSION SCHEMA - PPG SORONG
-- ============================================================================
-- Jalankan SQL ini di Supabase SQL Editor untuk membuat tabel role_permission
-- ============================================================================

-- 1. Buat tabel resource (daftar resource/modul yang bisa diakses)
CREATE TABLE IF NOT EXISTS resource (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    kategori VARCHAR(50) DEFAULT 'menu',  -- 'menu', 'fitur', 'data'
    urutan INT DEFAULT 0,
    is_aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Buat tabel role_permission
CREATE TABLE IF NOT EXISTS role_permission (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES resource(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, resource_id)
);

-- 3. Insert data resource default
INSERT INTO resource (kode, nama, deskripsi, kategori, urutan) VALUES
    -- Menu Utama
    ('dashboard', 'Dashboard', 'Halaman dashboard utama', 'menu', 1),
    ('generus', 'Data Generus', 'Manajemen data generus/santri', 'menu', 2),
    ('pengajian', 'Pengajian', 'Manajemen jadwal pengajian', 'menu', 3),
    ('presensi', 'Presensi', 'Pencatatan kehadiran', 'menu', 4),
    ('progress', 'Progress Hafalan', 'Tracking progress hafalan', 'menu', 5),
    ('penilaian', 'Penilaian Hafalan', 'Input nilai hafalan', 'menu', 6),

    -- Laporan
    ('rapor', 'Rapor', 'Rapor siswa', 'menu', 10),
    ('laporan_bulanan', 'Laporan Bulanan', 'Laporan bulanan', 'menu', 11),

    -- Pengaturan
    ('wilayah', 'Wilayah', 'Manajemen wilayah', 'menu', 20),
    ('kurikulum', 'Kurikulum', 'Manajemen kurikulum', 'menu', 21),
    ('materi_hafalan', 'Materi Hafalan', 'Manajemen materi hafalan', 'menu', 22),
    ('jamaah', 'Data Jamaah', 'Manajemen data jamaah lengkap', 'menu', 23),
    ('users', 'Manajemen User', 'Manajemen user dan role', 'menu', 24),
    ('pengaturan_akses', 'Pengaturan Akses', 'Pengaturan permission role', 'menu', 25),
    ('backup', 'Backup & Database', 'Backup dan restore data', 'menu', 26)
ON CONFLICT (kode) DO NOTHING;

-- 4. Insert permission default untuk Admin (full access)
INSERT INTO role_permission (role_id, resource_id, can_view, can_create, can_edit, can_delete)
SELECT
    r.id as role_id,
    res.id as resource_id,
    true as can_view,
    true as can_create,
    true as can_edit,
    true as can_delete
FROM role r
CROSS JOIN resource res
WHERE r.kode = 'admin'
ON CONFLICT (role_id, resource_id) DO UPDATE SET
    can_view = true,
    can_create = true,
    can_edit = true,
    can_delete = true;

-- 5. Insert permission default untuk Mubaligh Daerah
INSERT INTO role_permission (role_id, resource_id, can_view, can_create, can_edit, can_delete)
SELECT
    r.id as role_id,
    res.id as resource_id,
    true as can_view,
    CASE WHEN res.kode IN ('generus', 'pengajian', 'presensi', 'progress', 'penilaian', 'jamaah') THEN true ELSE false END as can_create,
    CASE WHEN res.kode IN ('generus', 'pengajian', 'presensi', 'progress', 'penilaian', 'jamaah', 'kurikulum') THEN true ELSE false END as can_edit,
    CASE WHEN res.kode IN ('pengajian', 'presensi', 'progress') THEN true ELSE false END as can_delete
FROM role r
CROSS JOIN resource res
WHERE r.kode = 'mubaligh_daerah'
    AND res.kode NOT IN ('users', 'pengaturan_akses', 'backup')
ON CONFLICT (role_id, resource_id) DO NOTHING;

-- 6. Insert permission default untuk Mubaligh Desa
INSERT INTO role_permission (role_id, resource_id, can_view, can_create, can_edit, can_delete)
SELECT
    r.id as role_id,
    res.id as resource_id,
    true as can_view,
    CASE WHEN res.kode IN ('generus', 'pengajian', 'presensi', 'progress', 'penilaian', 'jamaah') THEN true ELSE false END as can_create,
    CASE WHEN res.kode IN ('generus', 'pengajian', 'presensi', 'progress', 'penilaian', 'jamaah') THEN true ELSE false END as can_edit,
    CASE WHEN res.kode IN ('pengajian', 'presensi', 'progress') THEN true ELSE false END as can_delete
FROM role r
CROSS JOIN resource res
WHERE r.kode = 'mubaligh_desa'
    AND res.kode NOT IN ('users', 'pengaturan_akses', 'backup', 'wilayah', 'kurikulum')
ON CONFLICT (role_id, resource_id) DO NOTHING;

-- 7. Insert permission default untuk Imam Kelompok
INSERT INTO role_permission (role_id, resource_id, can_view, can_create, can_edit, can_delete)
SELECT
    r.id as role_id,
    res.id as resource_id,
    true as can_view,
    CASE WHEN res.kode IN ('presensi', 'progress') THEN true ELSE false END as can_create,
    CASE WHEN res.kode IN ('presensi', 'progress') THEN true ELSE false END as can_edit,
    false as can_delete
FROM role r
CROSS JOIN resource res
WHERE r.kode = 'imam_kelompok'
    AND res.kode IN ('dashboard', 'generus', 'pengajian', 'presensi', 'progress', 'penilaian', 'rapor', 'laporan_bulanan')
ON CONFLICT (role_id, resource_id) DO NOTHING;

-- 8. Insert permission default untuk Pakar Pendidik
INSERT INTO role_permission (role_id, resource_id, can_view, can_create, can_edit, can_delete)
SELECT
    r.id as role_id,
    res.id as resource_id,
    true as can_view,
    CASE WHEN res.kode IN ('kurikulum', 'materi_hafalan', 'penilaian') THEN true ELSE false END as can_create,
    CASE WHEN res.kode IN ('kurikulum', 'materi_hafalan', 'penilaian') THEN true ELSE false END as can_edit,
    CASE WHEN res.kode IN ('kurikulum', 'materi_hafalan') THEN true ELSE false END as can_delete
FROM role r
CROSS JOIN resource res
WHERE r.kode = 'pakar_pendidik'
    AND res.kode IN ('dashboard', 'generus', 'pengajian', 'presensi', 'progress', 'penilaian', 'rapor', 'laporan_bulanan', 'kurikulum', 'materi_hafalan')
ON CONFLICT (role_id, resource_id) DO NOTHING;

-- 9. Insert permission default untuk Orang Tua (view only terbatas)
INSERT INTO role_permission (role_id, resource_id, can_view, can_create, can_edit, can_delete)
SELECT
    r.id as role_id,
    res.id as resource_id,
    true as can_view,
    false as can_create,
    false as can_edit,
    false as can_delete
FROM role r
CROSS JOIN resource res
WHERE r.kode = 'orang_tua'
    AND res.kode IN ('dashboard', 'progress', 'rapor')
ON CONFLICT (role_id, resource_id) DO NOTHING;

-- 10. Buat view untuk mempermudah query
CREATE OR REPLACE VIEW v_role_permission AS
SELECT
    rp.id,
    rp.role_id,
    r.kode as role_kode,
    r.nama as role_nama,
    r.level as role_level,
    rp.resource_id,
    res.kode as resource_kode,
    res.nama as resource_nama,
    res.kategori as resource_kategori,
    res.urutan as resource_urutan,
    rp.can_view,
    rp.can_create,
    rp.can_edit,
    rp.can_delete,
    rp.updated_at
FROM role_permission rp
JOIN role r ON r.id = rp.role_id
JOIN resource res ON res.id = rp.resource_id
WHERE res.is_aktif = true
ORDER BY r.level, res.urutan;

-- 11. Function untuk mengecek permission
CREATE OR REPLACE FUNCTION check_permission(
    p_role_kode VARCHAR,
    p_resource_kode VARCHAR,
    p_action VARCHAR DEFAULT 'view'
) RETURNS BOOLEAN AS $$
DECLARE
    v_result BOOLEAN := false;
BEGIN
    -- Admin selalu punya akses penuh
    IF p_role_kode = 'admin' THEN
        RETURN true;
    END IF;

    SELECT
        CASE p_action
            WHEN 'view' THEN can_view
            WHEN 'create' THEN can_create
            WHEN 'edit' THEN can_edit
            WHEN 'delete' THEN can_delete
            ELSE false
        END
    INTO v_result
    FROM role_permission rp
    JOIN role r ON r.id = rp.role_id
    JOIN resource res ON res.id = rp.resource_id
    WHERE r.kode = p_role_kode AND res.kode = p_resource_kode;

    RETURN COALESCE(v_result, false);
END;
$$ LANGUAGE plpgsql;

-- 12. Function untuk mendapatkan semua permission user berdasarkan role-nya
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INT)
RETURNS TABLE (
    resource_kode VARCHAR,
    resource_nama VARCHAR,
    can_view BOOLEAN,
    can_create BOOLEAN,
    can_edit BOOLEAN,
    can_delete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        res.kode::VARCHAR as resource_kode,
        res.nama::VARCHAR as resource_nama,
        BOOL_OR(rp.can_view) as can_view,
        BOOL_OR(rp.can_create) as can_create,
        BOOL_OR(rp.can_edit) as can_edit,
        BOOL_OR(rp.can_delete) as can_delete
    FROM user_role ur
    JOIN role_permission rp ON rp.role_id = ur.role_id
    JOIN resource res ON res.id = rp.resource_id
    WHERE ur.user_id = p_user_id
        AND ur.is_aktif = true
        AND res.is_aktif = true
    GROUP BY res.kode, res.nama, res.urutan
    ORDER BY res.urutan;
END;
$$ LANGUAGE plpgsql;

-- 13. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_role_permission_role ON role_permission(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permission_resource ON role_permission(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_kode ON resource(kode);

-- ============================================================================
-- SELESAI - Jalankan SQL ini di Supabase SQL Editor
-- ============================================================================
