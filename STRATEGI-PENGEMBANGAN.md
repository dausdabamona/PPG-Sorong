# STRATEGI PENGEMBANGAN SISTEM PPG SORONG
## Sistem Pemantauan Pembinaan Generus Penerus

---

## 1. VISI SISTEM

Sistem PPG Sorong bertujuan menjadi **alat pemantauan pembinaan komprehensif** yang:
- Memantau perkembangan setiap generus secara real-time
- Memberikan **early warning system** untuk pencegahan masalah
- Menjadi alat kontrol bagi **orang tua** untuk memantau kemajuan anak
- Memfasilitasi koordinasi antar **pengurus PPG** di semua level

---

## 2. ANALISIS KONDISI SAAT INI

### 2.1 Modul yang Sudah Ada (✅ Operational)

| No | Modul | File | Status CRUD | Catatan |
|----|-------|------|-------------|---------|
| 1 | Dashboard | dashboard.html | Read | Statistik dasar |
| 2 | Data Generus | generus.html | Full CRUD | Lengkap |
| 3 | Data Jamaah | jamaah.html | Full CRUD | Lengkap |
| 4 | Wilayah | wilayah.html | Full CRUD | Hierarki daerah/desa/kelompok |
| 5 | Kelas Pengajian | kelas.html | Full CRUD | Multi-jenjang |
| 6 | Pengajian | pengajian.html | Full CRUD | Jadwal & kegiatan |
| 7 | Presensi | presensi.html | Full CRUD | Kehadiran pengajian |
| 8 | Penilaian Hafalan | penilaian-hafalan.html | Full CRUD | Progress materi |
| 9 | Penilaian Akhlaq | penilaian-akhlaq.html | Full CRUD | 5 aspek penilaian |
| 10 | Kurikulum | kurikulum.html | Full CRUD | Materi & kategori |
| 11 | Musyawarah | musyawarah.html | Full CRUD | + Peserta |
| 12 | Kegiatan | kegiatan.html | Full CRUD | + Peserta |
| 13 | Kakak Asuh | kakak-asuh.html | Full CRUD | Mentoring |
| 14 | Lima Unsur | lima-unsur.html | Full CRUD | Struktur organisasi |
| 15 | Manajemen User | users.html | Full CRUD | User, Role, Assignment |
| 16 | Rapor | rapor.html | Read | Laporan individu |
| 17 | Laporan Bulanan | laporan-bulanan.html | Read | Statistik bulanan |

### 2.2 Modul yang Perlu Dikembangkan (🔨 To Be Built)

| No | Modul | Prioritas | Fungsi |
|----|-------|-----------|--------|
| 1 | **Portal Orang Tua** | TINGGI | Akses khusus orang tua lihat perkembangan anak |
| 2 | **Early Warning System** | TINGGI | Alert otomatis untuk masalah pembinaan |
| 3 | **Dashboard Analytics** | TINGGI | Visualisasi tren dan insight |
| 4 | **Notifikasi** | SEDANG | Push notification ke pengurus & orang tua |
| 5 | **Tahun Ajaran** | SEDANG | Manajemen periode pembinaan |
| 6 | **Target & Capaian** | SEDANG | Set target per generus/jenjang |
| 7 | **Catatan Khusus** | SEDANG | Catatan perkembangan individual |
| 8 | **Export/Print** | RENDAH | Cetak rapor dan laporan |

---

## 3. ARSITEKTUR PERAN PENGGUNA

### 3.1 Matriks Akses

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        HIERARKI AKSES SISTEM                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐                                                        │
│  │   ADMIN     │  → Full access semua fitur & wilayah                   │
│  └──────┬──────┘                                                        │
│         │                                                               │
│  ┌──────▼──────┐                                                        │
│  │  PENGURUS   │  → Akses sesuai wilayah yang ditugaskan                │
│  │   DAERAH    │    (lihat semua desa & kelompok di bawahnya)           │
│  └──────┬──────┘                                                        │
│         │                                                               │
│  ┌──────▼──────┐                                                        │
│  │  PENGURUS   │  → Akses sesuai desa yang ditugaskan                   │
│  │    DESA     │    (lihat semua kelompok di bawahnya)                  │
│  └──────┬──────┘                                                        │
│         │                                                               │
│  ┌──────▼──────┐                                                        │
│  │  MUBALIGH/  │  → Akses kelompok yang diampu                          │
│  │   GURU      │    (input penilaian, presensi)                         │
│  └──────┬──────┘                                                        │
│         │                                                               │
│  ┌──────▼──────┐                                                        │
│  │ ORANG TUA   │  → Lihat data anak sendiri saja                        │
│  │             │    (read-only, notifikasi)                             │
│  └─────────────┘                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Detail Akses per Role

| Fitur | Admin | Pengurus Daerah | Pengurus Desa | Mubaligh | Orang Tua |
|-------|-------|-----------------|---------------|----------|-----------|
| Dashboard | Full | Wilayah | Desa | Kelompok | Anak |
| Data Generus | CRUD All | CRUD Wilayah | CRUD Desa | Read | Read Anak |
| Presensi | CRUD All | CRUD Wilayah | CRUD Desa | CRUD Kelas | Read Anak |
| Penilaian Hafalan | CRUD All | CRUD Wilayah | CRUD Desa | CRUD Kelas | Read Anak |
| Penilaian Akhlaq | CRUD All | CRUD Wilayah | CRUD Desa | CRUD Kelas | Read Anak |
| Musyawarah | CRUD All | CRUD Wilayah | CRUD Desa | Read | - |
| Kegiatan | CRUD All | CRUD Wilayah | CRUD Desa | Read | Read |
| Rapor | View All | View Wilayah | View Desa | View Kelas | View Anak |
| Warning Alert | Config All | View Wilayah | View Desa | View Kelas | View Anak |
| User Management | Full | - | - | - | - |
| Kurikulum | Full | Read | Read | Read | - |

---

## 4. EARLY WARNING SYSTEM (SISTEM PERINGATAN DINI)

### 4.1 Kategori Warning

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     EARLY WARNING SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔴 MERAH (KRITIS) - Perlu tindakan segera                              │
│  ├── Absen > 3x berturut-turut tanpa keterangan                         │
│  ├── Nilai akhlaq turun drastis (2 level dalam 1 bulan)                 │
│  ├── Tidak ada progress hafalan > 2 bulan                               │
│  └── Masalah perilaku serius (catatan khusus)                           │
│                                                                         │
│  🟡 KUNING (PERHATIAN) - Perlu monitoring                               │
│  ├── Absen 2x berturut-turut                                            │
│  ├── Nilai akhlaq menurun 1 level                                       │
│  ├── Progress hafalan lambat (< 50% target)                             │
│  ├── Tidak hadir di kegiatan wajib                                      │
│  └── Belum ada penilaian bulan ini                                      │
│                                                                         │
│  🟢 HIJAU (BAIK) - Perkembangan normal                                  │
│  ├── Kehadiran > 80%                                                    │
│  ├── Nilai akhlaq stabil/meningkat                                      │
│  ├── Progress hafalan sesuai target                                     │
│  └── Aktif di kegiatan                                                  │
│                                                                         │
│  ⭐ BINTANG (PRESTASI) - Pencapaian luar biasa                          │
│  ├── Kehadiran 100%                                                     │
│  ├── Nilai akhlaq A konsisten                                           │
│  ├── Hafalan melebihi target                                            │
│  └── Kontribusi positif di kegiatan                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Alur Notifikasi Warning

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   TRIGGER    │────▶│   PROSES     │────▶│   ACTION     │
│   (Data)     │     │   (System)   │     │   (User)     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
  - Presensi           - Hitung skor        - Notifikasi ke:
  - Penilaian          - Deteksi anomali      • Orang tua
  - Progress           - Generate alert       • Mubaligh
  - Catatan            - Simpan log          • Pengurus
                                            - Rekomendasi
                                              tindakan
```

---

## 5. PORTAL ORANG TUA

### 5.1 Fitur Portal Orang Tua

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PORTAL ORANG TUA                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📊 DASHBOARD ANAK                                                      │
│  ├── Status kehadiran bulan ini (%)                                     │
│  ├── Nilai akhlaq terkini (5 aspek)                                     │
│  ├── Progress hafalan (target vs aktual)                                │
│  ├── Jadwal pengajian minggu ini                                        │
│  └── Warning aktif (jika ada)                                           │
│                                                                         │
│  📈 GRAFIK PERKEMBANGAN                                                 │
│  ├── Tren kehadiran 6 bulan terakhir                                    │
│  ├── Tren nilai akhlaq 6 bulan terakhir                                 │
│  ├── Progress hafalan per kategori                                      │
│  └── Perbandingan dengan rata-rata kelas                                │
│                                                                         │
│  📋 RAPOR DIGITAL                                                       │
│  ├── Rapor bulanan (download PDF)                                       │
│  ├── Rapor semester                                                     │
│  └── Sertifikat pencapaian                                              │
│                                                                         │
│  🔔 NOTIFIKASI                                                          │
│  ├── Alert ketidakhadiran                                               │
│  ├── Penurunan nilai                                                    │
│  ├── Jadwal kegiatan                                                    │
│  └── Pengumuman dari pengurus                                           │
│                                                                         │
│  💬 KOMUNIKASI                                                          │
│  ├── Pesan ke mubaligh/guru                                             │
│  ├── Catatan dari pengurus                                              │
│  └── Form izin ketidakhadiran                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Rekomendasi Tindakan untuk Orang Tua

| Kondisi | Status | Rekomendasi |
|---------|--------|-------------|
| Kehadiran < 50% | 🔴 | Komunikasi dengan anak tentang pentingnya pengajian |
| Kehadiran 50-80% | 🟡 | Pastikan jadwal tidak bentrok, antar jemput jika perlu |
| Kehadiran > 80% | 🟢 | Apresiasi dan pertahankan |
| Nilai Akhlaq D | 🔴 | Diskusi dengan mubaligh, perhatian khusus di rumah |
| Nilai Akhlaq C | 🟡 | Perkuat pembinaan akhlaq di rumah |
| Nilai Akhlaq B/A | 🟢 | Apresiasi dan motivasi untuk konsisten |
| Hafalan stagnan | 🟡 | Bantu muroja'ah di rumah, ciptakan jadwal belajar |
| Hafalan sesuai target | 🟢 | Dukung dan motivasi untuk lanjut |

---

## 6. FASE PENGEMBANGAN

### FASE 1: STABILISASI (Minggu 1-2)
**Target: Memastikan semua fitur existing berjalan tanpa bug**

| Task | Priority | Status |
|------|----------|--------|
| Audit semua halaman existing | HIGH | ✅ Done |
| Fix bug kritis yang ditemukan | HIGH | ✅ Done |
| Testing CRUD semua modul | HIGH | Pending |
| Dokumentasi API yang ada | MEDIUM | Pending |
| Optimasi query database | MEDIUM | Pending |

### FASE 2: ENHANCEMENT (Minggu 3-4)
**Target: Meningkatkan fitur existing**

| Task | Priority | File |
|------|----------|------|
| Dashboard analytics dengan grafik | HIGH | dashboard.html |
| Tahun ajaran management | HIGH | tahun-ajaran.html (baru) |
| Filter & search di semua list | MEDIUM | All list pages |
| Export PDF rapor | MEDIUM | rapor.html |
| Bulk import data | LOW | generus.html |

### FASE 3: WARNING SYSTEM (Minggu 5-6)
**Target: Implementasi early warning**

| Task | Priority | File |
|------|----------|------|
| Tabel warning_log di database | HIGH | - |
| Service kalkulasi warning | HIGH | js/warning.js (baru) |
| Widget warning di dashboard | HIGH | dashboard.html |
| Halaman detail warning | HIGH | warning.html (baru) |
| Konfigurasi threshold warning | MEDIUM | pengaturan-warning.html (baru) |

### FASE 4: PORTAL ORANG TUA (Minggu 7-8)
**Target: Akses untuk orang tua**

| Task | Priority | File |
|------|----------|------|
| Role orang tua di database | HIGH | - |
| Halaman login orang tua | HIGH | login-ortu.html (baru) |
| Dashboard orang tua | HIGH | dashboard-ortu.html (baru) |
| Lihat rapor anak | HIGH | rapor-anak.html (baru) |
| Notifikasi email/WA | MEDIUM | - |
| Form izin online | LOW | izin.html (baru) |

### FASE 5: INTEGRASI & TESTING (Minggu 9-10)
**Target: Testing menyeluruh dan deployment**

| Task | Priority |
|------|----------|
| Integration testing semua modul | HIGH |
| User acceptance testing (UAT) | HIGH |
| Performance optimization | MEDIUM |
| Security audit | HIGH |
| Documentation final | MEDIUM |
| Training pengurus | HIGH |
| Go-live | HIGH |

---

## 7. CHECKLIST KUALITAS (ANTI-BUG)

### 7.1 Checklist Sebelum Coding

- [ ] Spesifikasi fitur jelas dan disetujui
- [ ] Database schema sudah disiapkan
- [ ] API endpoint sudah ditentukan
- [ ] UI/UX mockup sudah divalidasi
- [ ] Test case sudah ditulis

### 7.2 Checklist Setiap Fitur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CHECKLIST PENGEMBANGAN FITUR                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📝 CRUD OPERATIONS                                                     │
│  ├── [ ] Create dengan validasi input                                   │
│  ├── [ ] Read dengan pagination/filter                                  │
│  ├── [ ] Update dengan konfirmasi                                       │
│  ├── [ ] Delete dengan soft-delete atau konfirmasi                      │
│  └── [ ] Error handling untuk semua operasi                             │
│                                                                         │
│  🔒 SECURITY                                                            │
│  ├── [ ] Role-based access control                                      │
│  ├── [ ] Input sanitization (XSS prevention)                            │
│  ├── [ ] SQL injection prevention (parameterized query)                 │
│  ├── [ ] CSRF protection                                                │
│  └── [ ] Audit log untuk operasi sensitif                               │
│                                                                         │
│  🎨 UI/UX                                                               │
│  ├── [ ] Responsive design (mobile-first)                               │
│  ├── [ ] Loading state saat fetch data                                  │
│  ├── [ ] Empty state untuk data kosong                                  │
│  ├── [ ] Error state dengan pesan jelas                                 │
│  ├── [ ] Konfirmasi untuk aksi destruktif                               │
│  └── [ ] Toast notification untuk feedback                              │
│                                                                         │
│  ⚡ PERFORMANCE                                                         │
│  ├── [ ] Query database efisien (no N+1)                                │
│  ├── [ ] Pagination untuk list besar                                    │
│  ├── [ ] Lazy loading untuk data berat                                  │
│  └── [ ] Caching untuk data statis                                      │
│                                                                         │
│  🧪 TESTING                                                             │
│  ├── [ ] Unit test untuk logic                                          │
│  ├── [ ] Integration test untuk API                                     │
│  ├── [ ] Manual test semua skenario                                     │
│  └── [ ] Cross-browser testing                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Code Review Checklist

- [ ] Tidak ada console.log di production
- [ ] Semua error di-handle dengan try-catch
- [ ] Variable naming yang jelas
- [ ] Tidak ada hardcoded value
- [ ] Comments untuk logic kompleks
- [ ] Consistent code style

---

## 8. DATABASE SCHEMA TAMBAHAN

### 8.1 Tabel Warning System

```sql
-- Tabel untuk log warning
CREATE TABLE warning_log (
    id SERIAL PRIMARY KEY,
    jamaah_id INTEGER REFERENCES jamaah(id),
    jenis VARCHAR(50) NOT NULL, -- 'kehadiran', 'akhlaq', 'hafalan', 'perilaku'
    level VARCHAR(20) NOT NULL, -- 'merah', 'kuning', 'hijau', 'bintang'
    pesan TEXT,
    data_detail JSONB,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel untuk konfigurasi threshold
CREATE TABLE warning_config (
    id SERIAL PRIMARY KEY,
    jenis VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL,
    threshold_value INTEGER,
    threshold_operator VARCHAR(10), -- '>', '<', '>=', '<=', '='
    is_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel untuk notifikasi
CREATE TABLE notifikasi (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    judul VARCHAR(255),
    pesan TEXT,
    jenis VARCHAR(50), -- 'warning', 'info', 'success'
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.2 Tabel Portal Orang Tua

```sql
-- Relasi orang tua - anak
CREATE TABLE orang_tua_anak (
    id SERIAL PRIMARY KEY,
    orang_tua_user_id INTEGER REFERENCES users(id),
    anak_jamaah_id INTEGER REFERENCES jamaah(id),
    relasi VARCHAR(20), -- 'ayah', 'ibu', 'wali'
    is_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(orang_tua_user_id, anak_jamaah_id)
);

-- Form izin dari orang tua
CREATE TABLE izin_kehadiran (
    id SERIAL PRIMARY KEY,
    jamaah_id INTEGER REFERENCES jamaah(id),
    pengajian_id INTEGER REFERENCES pengajian(id),
    tanggal DATE NOT NULL,
    alasan TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 9. METRIK KEBERHASILAN

### 9.1 KPI Sistem

| Metrik | Target | Pengukuran |
|--------|--------|------------|
| Uptime | > 99% | Monthly |
| Response time | < 2 detik | Daily |
| Bug production | 0 critical | Weekly |
| User adoption | > 80% pengurus aktif | Monthly |
| Data accuracy | > 95% | Monthly |

### 9.2 KPI Pembinaan

| Metrik | Target | Pengukuran |
|--------|--------|------------|
| Rata-rata kehadiran | > 80% | Weekly |
| Generus dengan nilai A/B | > 70% | Monthly |
| Warning merah tertangani | < 24 jam | Weekly |
| Orang tua aktif di portal | > 50% | Monthly |
| Progress hafalan sesuai target | > 60% | Monthly |

---

## 10. LANGKAH SELANJUTNYA

### Immediate Actions (Minggu Ini)

1. ✅ Fix bug yang sudah diidentifikasi
2. ⬜ Testing menyeluruh fitur existing
3. ⬜ Setup database tabel warning_log
4. ⬜ Buat prototype dashboard analytics
5. ⬜ Diskusi requirement dengan stakeholder

### Deliverables per Fase

| Fase | Deliverable | Deadline |
|------|-------------|----------|
| 1 | Sistem stabil, bug-free | Minggu 2 |
| 2 | Dashboard analytics, tahun ajaran | Minggu 4 |
| 3 | Warning system operasional | Minggu 6 |
| 4 | Portal orang tua live | Minggu 8 |
| 5 | System production-ready | Minggu 10 |

---

*Dokumen ini akan di-update seiring perkembangan project.*
*Versi: 1.0 | Tanggal: 2 Januari 2026*
