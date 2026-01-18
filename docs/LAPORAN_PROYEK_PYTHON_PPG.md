# LAPORAN LENGKAP PROYEK PPG SORONG
## Konversi ke Aplikasi Offline Python Desktop + Mobile Data Collector

---

## DAFTAR ISI

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Database Schema](#3-database-schema)
4. [Spesifikasi Aplikasi Desktop Python](#4-spesifikasi-aplikasi-desktop-python)
5. [Spesifikasi Aplikasi Mobile](#5-spesifikasi-aplikasi-mobile)
6. [Mekanisme Sinkronisasi via WhatsApp](#6-mekanisme-sinkronisasi-via-whatsapp)
7. [Struktur Proyek](#7-struktur-proyek)
8. [Implementasi Detail](#8-implementasi-detail)
9. [Fitur per Modul](#9-fitur-per-modul)
10. [Timeline Pengembangan](#10-timeline-pengembangan)
11. [Rekap Materi Kurikulum](#11-rekap-materi-kurikulum)
12. [Skema Database Kurikulum](#12-skema-database-kurikulum)

---

## 1. RINGKASAN EKSEKUTIF

### 1.1 Tentang Sistem Saat Ini

PPG Sorong (Pembinaan Generasi Penerus) adalah sistem manajemen pendidikan Islam yang mencakup:
- Manajemen data generus (santri belum menikah)
- Pengelolaan pengajian dan presensi
- Penilaian hafalan dan akhlaq
- Kurikulum pembelajaran
- Struktur organisasi wilayah
- Laporan dan rapor

### 1.2 Tujuan Konversi

Mengubah aplikasi web menjadi:
1. **Aplikasi Desktop Python (Offline)** - Aplikasi utama di laptop untuk:
   - Mengelola semua data
   - Menerima backup dari HP
   - Menghasilkan laporan

2. **Aplikasi Mobile (Android)** - Pengumpul data di lapangan untuk:
   - Input presensi
   - Input penilaian
   - Ekspor backup ke WhatsApp

### 1.3 Alur Kerja

```
┌─────────────────┐     WhatsApp      ┌─────────────────┐
│  Aplikasi HP    │ ──────────────►   │ Aplikasi Laptop │
│  (Data Input)   │   File Backup     │   (Laporan)     │
│                 │   (.ppg/.json)    │                 │
└─────────────────┘                   └─────────────────┘
```

---

## 2. ARSITEKTUR SISTEM

### 2.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEM PPG SORONG OFFLINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐         ┌─────────────────────┐        │
│  │   MOBILE APP        │         │   DESKTOP APP       │        │
│  │   (Flutter/Kivy)    │         │   (Python + PyQt6)  │        │
│  │                     │         │                     │        │
│  │  ┌───────────────┐  │   WA    │  ┌───────────────┐  │        │
│  │  │ Input Presensi│  │ ──────► │  │ Import Data   │  │        │
│  │  │ Input Nilai   │  │ Backup  │  │ Restore       │  │        │
│  │  │ Lihat Data    │  │ File    │  │ Merge Data    │  │        │
│  │  └───────────────┘  │         │  └───────────────┘  │        │
│  │          │          │         │          │          │        │
│  │  ┌───────────────┐  │         │  ┌───────────────┐  │        │
│  │  │ SQLite Local  │  │         │  │ SQLite Master │  │        │
│  │  │ (data_hp.db)  │  │         │  │ (ppg_main.db) │  │        │
│  │  └───────────────┘  │         │  └───────────────┘  │        │
│  │          │          │         │          │          │        │
│  │  ┌───────────────┐  │         │  ┌───────────────┐  │        │
│  │  │ Export Backup │  │         │  │ Generate      │  │        │
│  │  │ (.ppg file)   │  │         │  │ Reports (PDF) │  │        │
│  │  └───────────────┘  │         │  └───────────────┘  │        │
│  └─────────────────────┘         └─────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Teknologi yang Digunakan

| Komponen | Teknologi | Alasan |
|----------|-----------|--------|
| Desktop App | Python 3.11+ | Mudah dikembangkan, cross-platform |
| GUI Framework | PyQt6 / CustomTkinter | Modern, responsif |
| Database | SQLite | Offline, portable, tanpa server |
| Mobile App | Flutter / Kivy | Cross-platform Android/iOS |
| Report Generator | ReportLab / WeasyPrint | PDF generation |
| Backup Format | JSON (compressed) | Mudah dibaca, portable |

---

## 3. DATABASE SCHEMA

### 3.1 Daftar Tabel (25 Tabel)

#### A. MANAJEMEN ORANG

```sql
-- Tabel Utama Jamaah
CREATE TABLE jamaah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama VARCHAR(255) NOT NULL,
    nama_panggilan VARCHAR(100),
    jenis_kelamin CHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
    tanggal_lahir DATE,
    tempat_lahir VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    alamat_lengkap TEXT,
    status_aktif BOOLEAN DEFAULT TRUE,
    status_pernikahan VARCHAR(20) DEFAULT 'belum_menikah',
    pasangan_id INTEGER REFERENCES jamaah(id),
    tanggal_menikah DATE,
    ayah_id INTEGER REFERENCES jamaah(id),
    ibu_id INTEGER REFERENCES jamaah(id),
    golongan_darah VARCHAR(5),
    pendidikan_terakhir VARCHAR(50),
    pekerjaan VARCHAR(100),
    penghasilan_range VARCHAR(50),
    foto_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    sync_id VARCHAR(36) UNIQUE,  -- UUID untuk sinkronisasi
    last_sync TIMESTAMP
);

-- Fase Kehidupan
CREATE TABLE fase_kehidupan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jamaah_id INTEGER NOT NULL REFERENCES jamaah(id),
    fase VARCHAR(20) CHECK (fase IN ('paud', 'caberawit', 'praremaja', 'remaja', 'pranikah', 'nikah', 'orangtua', 'lansia')),
    tanggal_masuk DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);

-- Users (Pengguna Sistem)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    alamat TEXT,
    is_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);
```

#### B. STRUKTUR ORGANISASI

```sql
-- Wilayah (Hierarki: Daerah > Desa > Kelompok)
CREATE TABLE wilayah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode VARCHAR(20) UNIQUE,
    nama VARCHAR(100) NOT NULL,
    tingkat VARCHAR(20) CHECK (tingkat IN ('daerah', 'desa', 'kelompok')),
    parent_id INTEGER REFERENCES wilayah(id),
    is_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);

-- Jenjang Pendidikan
CREATE TABLE jenjang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode VARCHAR(20) UNIQUE,
    nama VARCHAR(50) NOT NULL,
    usia_mulai INTEGER,
    usia_sampai INTEGER,
    urutan INTEGER,
    is_aktif BOOLEAN DEFAULT TRUE,
    sync_id VARCHAR(36) UNIQUE
);

-- Tahun Ajaran
CREATE TABLE tahun_ajaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode VARCHAR(20) NOT NULL,  -- contoh: 2024/2025
    nama VARCHAR(100),
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    is_aktif BOOLEAN DEFAULT FALSE,
    sync_id VARCHAR(36) UNIQUE
);
```

#### C. ENROLLMENT & KEANGGOTAAN

```sql
-- Enrollment (Pendaftaran Generus)
CREATE TABLE enrollment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jamaah_id INTEGER NOT NULL REFERENCES jamaah(id),
    wilayah_id INTEGER NOT NULL REFERENCES wilayah(id),
    jenjang_id INTEGER REFERENCES jenjang(id),
    tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
    status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif', 'pindah', 'selesai', 'lulus', 'keluar')),
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);

-- Anggota Kelas
CREATE TABLE anggota_kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kelas_id INTEGER NOT NULL REFERENCES kelas_pengajian(id),
    jamaah_id INTEGER NOT NULL REFERENCES jamaah(id),
    status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'keluar')),
    tanggal_bergabung DATE,
    tanggal_keluar DATE,
    sync_id VARCHAR(36) UNIQUE
);
```

#### D. PENGAJIAN & JADWAL

```sql
-- Pengajian (Sesi Mengajar)
CREATE TABLE pengajian (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wilayah_id INTEGER REFERENCES wilayah(id),
    jenjang_id INTEGER REFERENCES jenjang(id),
    jadwal_rutin_id INTEGER REFERENCES jadwal_rutin(id),
    tanggal DATE NOT NULL,
    waktu_mulai TIME,
    waktu_selesai TIME,
    materi_pokok TEXT,
    penyaji_id INTEGER REFERENCES users(id),
    catatan TEXT,
    status VARCHAR(20) DEFAULT 'terlaksana',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);

-- Jadwal Rutin
CREATE TABLE jadwal_rutin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wilayah_id INTEGER REFERENCES wilayah(id),
    jenjang_id INTEGER REFERENCES jenjang(id),
    nama VARCHAR(100),
    hari VARCHAR(10) CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    jam TIME,
    is_aktif BOOLEAN DEFAULT TRUE,
    sync_id VARCHAR(36) UNIQUE
);

-- Kelas Pengajian
CREATE TABLE kelas_pengajian (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wilayah_id INTEGER REFERENCES wilayah(id),
    tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
    nama VARCHAR(100) NOT NULL,
    muballigh_id INTEGER REFERENCES users(id),
    pendamping_id INTEGER REFERENCES users(id),
    keterangan TEXT,
    is_aktif BOOLEAN DEFAULT TRUE,
    sync_id VARCHAR(36) UNIQUE
);

-- Kelas Tingkat (Many-to-Many Kelas-Jenjang)
CREATE TABLE kelas_tingkat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kelas_id INTEGER NOT NULL REFERENCES kelas_pengajian(id),
    jenjang_id INTEGER NOT NULL REFERENCES jenjang(id),
    sync_id VARCHAR(36) UNIQUE
);

-- Tanggal Skip (Libur)
CREATE TABLE tanggal_skip (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal DATE NOT NULL,
    keterangan VARCHAR(255),
    is_aktif BOOLEAN DEFAULT TRUE,
    sync_id VARCHAR(36) UNIQUE
);
```

#### E. KURIKULUM & MATERI

```sql
-- Bidang Materi
CREATE TABLE bidang_materi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama VARCHAR(100) NOT NULL,
    urutan INTEGER,
    is_aktif BOOLEAN DEFAULT TRUE,
    sync_id VARCHAR(36) UNIQUE
);

-- Kategori Materi
CREATE TABLE kategori_materi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bidang_id INTEGER REFERENCES bidang_materi(id),
    nama VARCHAR(100) NOT NULL,
    kode VARCHAR(20),
    urutan INTEGER,
    is_aktif BOOLEAN DEFAULT TRUE,
    sync_id VARCHAR(36) UNIQUE
);

-- Materi Item
CREATE TABLE materi_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategori_id INTEGER REFERENCES kategori_materi(id),
    nama VARCHAR(255) NOT NULL,
    nomor VARCHAR(20),
    tipe VARCHAR(20) CHECK (tipe IN ('hafalan', 'level', 'checklist', 'status')),
    is_aktif BOOLEAN DEFAULT TRUE,
    sync_id VARCHAR(36) UNIQUE
);

-- Target per Jenjang
CREATE TABLE target_jenjang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jenjang_id INTEGER REFERENCES jenjang(id),
    kategori_id INTEGER REFERENCES kategori_materi(id),
    target_jumlah INTEGER,
    sync_id VARCHAR(36) UNIQUE
);
```

#### F. PROGRESS PEMBELAJARAN

```sql
-- Progress Jamaah
CREATE TABLE progress_jamaah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jamaah_id INTEGER NOT NULL REFERENCES jamaah(id),
    materi_item_id INTEGER NOT NULL REFERENCES materi_item(id),
    status VARCHAR(20) DEFAULT 'belum' CHECK (status IN ('belum', 'sedang', 'selesai', 'lulus')),
    nilai DECIMAL(5,2),
    catatan TEXT,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    periode_bulan INTEGER,
    periode_tahun INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);
```

#### G. PRESENSI & PENILAIAN

```sql
-- Keaktifan Pengajian (Presensi)
CREATE TABLE keaktifan_pengajian (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pengajian_id INTEGER NOT NULL REFERENCES pengajian(id),
    jamaah_id INTEGER NOT NULL REFERENCES jamaah(id),
    status VARCHAR(10) CHECK (status IN ('hadir', 'izin', 'sakit', 'alpa')),
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);

-- Penilaian Akhlaq
CREATE TABLE penilaian_akhlaq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jamaah_id INTEGER NOT NULL REFERENCES jamaah(id),
    periode_bulan INTEGER NOT NULL,
    periode_tahun INTEGER NOT NULL,
    -- Kolom sifat (A/B/C/D atau skor 1-4)
    sholat_wajib VARCHAR(5),
    sholat_jamaah VARCHAR(5),
    puasa VARCHAR(5),
    tilawah VARCHAR(5),
    birrul_walidain VARCHAR(5),
    adab_makan VARCHAR(5),
    adab_tidur VARCHAR(5),
    adab_berbicara VARCHAR(5),
    kebersihan VARCHAR(5),
    kedisiplinan VARCHAR(5),
    kejujuran VARCHAR(5),
    tanggung_jawab VARCHAR(5),
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);
```

#### H. ORGANISASI

```sql
-- Musyawarah
CREATE TABLE musyawarah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wilayah_id INTEGER REFERENCES wilayah(id),
    jenis VARCHAR(20) CHECK (jenis IN ('internal', 'umum')),
    tanggal DATE,
    lokasi VARCHAR(255),
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);

-- Peserta Musyawarah
CREATE TABLE musyawarah_peserta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    musyawarah_id INTEGER NOT NULL REFERENCES musyawarah(id),
    jamaah_id INTEGER NOT NULL REFERENCES jamaah(id),
    sync_id VARCHAR(36) UNIQUE
);

-- Hasil Musyawarah
CREATE TABLE musyawarah_hasil (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    musyawarah_id INTEGER NOT NULL REFERENCES musyawarah(id),
    urutan INTEGER,
    isi TEXT,
    sync_id VARCHAR(36) UNIQUE
);

-- Kegiatan
CREATE TABLE kegiatan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wilayah_id INTEGER REFERENCES wilayah(id),
    nama VARCHAR(255) NOT NULL,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    lokasi VARCHAR(255),
    deskripsi TEXT,
    status VARCHAR(20) DEFAULT 'rencana',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_id VARCHAR(36) UNIQUE
);

-- Peserta Kegiatan
CREATE TABLE peserta_kegiatan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kegiatan_id INTEGER NOT NULL REFERENCES kegiatan(id),
    jamaah_id INTEGER NOT NULL REFERENCES jamaah(id),
    status VARCHAR(20),
    sync_id VARCHAR(36) UNIQUE
);

-- Kakak Asuh
CREATE TABLE kakak_asuh (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jamaah_id INTEGER NOT NULL REFERENCES jamaah(id),
    mentor_id INTEGER NOT NULL REFERENCES jamaah(id),
    status VARCHAR(20) DEFAULT 'aktif',
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    catatan TEXT,
    sync_id VARCHAR(36) UNIQUE
);

-- Lima Unsur
CREATE TABLE lima_unsur (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wilayah_id INTEGER REFERENCES wilayah(id),
    tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
    unsur VARCHAR(50),
    nilai INTEGER,
    catatan TEXT,
    sync_id VARCHAR(36) UNIQUE
);
```

#### I. ROLE & PERMISSION

```sql
-- Role
CREATE TABLE role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode VARCHAR(50) UNIQUE,
    nama VARCHAR(100) NOT NULL,
    level INTEGER,
    sync_id VARCHAR(36) UNIQUE
);

-- User Role
CREATE TABLE user_role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    role_id INTEGER NOT NULL REFERENCES role(id),
    wilayah_id INTEGER REFERENCES wilayah(id),
    is_aktif BOOLEAN DEFAULT TRUE,
    sync_id VARCHAR(36) UNIQUE
);

-- Resource
CREATE TABLE resource (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode VARCHAR(50) UNIQUE,
    nama VARCHAR(100),
    urutan INTEGER,
    is_aktif BOOLEAN DEFAULT TRUE,
    sync_id VARCHAR(36) UNIQUE
);

-- Role Permission
CREATE TABLE role_permission (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL REFERENCES role(id),
    resource_id INTEGER NOT NULL REFERENCES resource(id),
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    sync_id VARCHAR(36) UNIQUE
);
```

#### J. TABEL SINKRONISASI

```sql
-- Log Sinkronisasi
CREATE TABLE sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id VARCHAR(100),
    device_name VARCHAR(100),
    sync_type VARCHAR(20) CHECK (sync_type IN ('export', 'import', 'merge')),
    sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    records_count INTEGER,
    file_name VARCHAR(255),
    status VARCHAR(20),
    notes TEXT
);

-- Conflict Resolution
CREATE TABLE sync_conflict (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(50),
    record_sync_id VARCHAR(36),
    local_data TEXT,  -- JSON
    remote_data TEXT, -- JSON
    resolution VARCHAR(20),  -- 'keep_local', 'keep_remote', 'merged', 'pending'
    resolved_at TIMESTAMP,
    resolved_by INTEGER
);
```

### 3.2 Data Awal (Seed Data)

```sql
-- Jenjang Default
INSERT INTO jenjang (kode, nama, usia_mulai, usia_sampai, urutan) VALUES
('BATITA', 'Batita', 0, 2, 1),
('BALITA', 'Balita', 2, 5, 2),
('CABERAWIT', 'Caberawit', 5, 8, 3),
('PRAREMAJA', 'Pra-Remaja', 8, 12, 4),
('REMAJA', 'Remaja', 12, 17, 5),
('DEWASA', 'Dewasa', 17, 99, 6);

-- Role Default
INSERT INTO role (kode, nama, level) VALUES
('super_admin', 'Super Administrator', 1),
('admin', 'Administrator', 2),
('muballigh', 'Muballigh', 3),
('operator', 'Operator', 4),
('viewer', 'Viewer', 5);

-- Resource Default
INSERT INTO resource (kode, nama, urutan) VALUES
('dashboard', 'Dashboard', 1),
('generus', 'Data Generus', 2),
('jamaah', 'Data Jamaah', 3),
('pengajian', 'Pengajian', 4),
('presensi', 'Presensi', 5),
('penilaian', 'Penilaian', 6),
('kurikulum', 'Kurikulum', 7),
('wilayah', 'Wilayah', 8),
('laporan', 'Laporan', 9),
('users', 'Manajemen User', 10),
('settings', 'Pengaturan', 11);
```

---

## 4. SPESIFIKASI APLIKASI DESKTOP PYTHON

### 4.1 Teknologi

| Komponen | Library | Versi |
|----------|---------|-------|
| Python | - | 3.11+ |
| GUI | PyQt6 / CustomTkinter | Latest |
| Database | sqlite3 (built-in) | - |
| ORM | SQLAlchemy | 2.0+ |
| PDF Report | ReportLab / WeasyPrint | Latest |
| Excel Export | openpyxl | Latest |
| JSON | json (built-in) | - |
| Compression | gzip / zipfile | - |
| Charts | matplotlib | Latest |

### 4.2 Struktur Folder

```
ppg-desktop/
├── main.py                 # Entry point
├── requirements.txt        # Dependencies
├── config.py              # Konfigurasi
├── database/
│   ├── __init__.py
│   ├── connection.py      # Database connection
│   ├── models.py          # SQLAlchemy models
│   ├── migrations/        # Database migrations
│   └── seed_data.py       # Data awal
├── services/
│   ├── __init__.py
│   ├── jamaah_service.py
│   ├── enrollment_service.py
│   ├── pengajian_service.py
│   ├── presensi_service.py
│   ├── penilaian_service.py
│   ├── progress_service.py
│   ├── wilayah_service.py
│   ├── user_service.py
│   ├── sync_service.py    # Sinkronisasi
│   └── report_service.py  # Generate laporan
├── ui/
│   ├── __init__.py
│   ├── main_window.py     # Window utama
│   ├── components/        # Reusable components
│   │   ├── sidebar.py
│   │   ├── table_widget.py
│   │   ├── form_dialog.py
│   │   └── chart_widget.py
│   ├── pages/
│   │   ├── dashboard.py
│   │   ├── generus_page.py
│   │   ├── jamaah_page.py
│   │   ├── pengajian_page.py
│   │   ├── presensi_page.py
│   │   ├── penilaian_page.py
│   │   ├── kurikulum_page.py
│   │   ├── wilayah_page.py
│   │   ├── laporan_page.py
│   │   ├── sync_page.py   # Import/Export
│   │   └── settings_page.py
│   └── styles/
│       └── theme.py
├── utils/
│   ├── __init__.py
│   ├── helpers.py
│   ├── validators.py
│   ├── date_utils.py
│   └── export_utils.py
├── reports/
│   ├── __init__.py
│   ├── rapor_generator.py
│   ├── presensi_report.py
│   ├── progress_report.py
│   └── templates/
│       └── rapor_template.html
├── sync/
│   ├── __init__.py
│   ├── backup_manager.py
│   ├── restore_manager.py
│   ├── conflict_resolver.py
│   └── file_format.py
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── data/
│   └── ppg_main.db        # Database utama
└── backups/               # Folder backup
```

### 4.3 Contoh Implementasi

#### 4.3.1 Model Database (models.py)

```python
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text, Time, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_sync_id():
    return str(uuid.uuid4())

class Jamaah(Base):
    __tablename__ = 'jamaah'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nama = Column(String(255), nullable=False)
    nama_panggilan = Column(String(100))
    jenis_kelamin = Column(String(1))
    tanggal_lahir = Column(Date)
    tempat_lahir = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    alamat_lengkap = Column(Text)
    status_aktif = Column(Boolean, default=True)
    status_pernikahan = Column(String(20), default='belum_menikah')
    pasangan_id = Column(Integer, ForeignKey('jamaah.id'))
    tanggal_menikah = Column(Date)
    ayah_id = Column(Integer, ForeignKey('jamaah.id'))
    ibu_id = Column(Integer, ForeignKey('jamaah.id'))
    golongan_darah = Column(String(5))
    pendidikan_terakhir = Column(String(50))
    pekerjaan = Column(String(100))
    foto_url = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    sync_id = Column(String(36), unique=True, default=generate_sync_id)
    last_sync = Column(DateTime)

    # Relationships
    pasangan = relationship("Jamaah", foreign_keys=[pasangan_id], remote_side=[id])
    ayah = relationship("Jamaah", foreign_keys=[ayah_id], remote_side=[id])
    ibu = relationship("Jamaah", foreign_keys=[ibu_id], remote_side=[id])
    enrollments = relationship("Enrollment", back_populates="jamaah")

    def to_dict(self):
        return {
            'id': self.id,
            'nama': self.nama,
            'nama_panggilan': self.nama_panggilan,
            'jenis_kelamin': self.jenis_kelamin,
            'tanggal_lahir': self.tanggal_lahir.isoformat() if self.tanggal_lahir else None,
            'phone': self.phone,
            'alamat_lengkap': self.alamat_lengkap,
            'status_aktif': self.status_aktif,
            'status_pernikahan': self.status_pernikahan,
            'ayah_id': self.ayah_id,
            'ibu_id': self.ibu_id,
            'sync_id': self.sync_id,
        }

    @property
    def umur(self):
        if not self.tanggal_lahir:
            return None
        today = datetime.now().date()
        age = today.year - self.tanggal_lahir.year
        if today.month < self.tanggal_lahir.month or \
           (today.month == self.tanggal_lahir.month and today.day < self.tanggal_lahir.day):
            age -= 1
        return age


class Wilayah(Base):
    __tablename__ = 'wilayah'

    id = Column(Integer, primary_key=True, autoincrement=True)
    kode = Column(String(20), unique=True)
    nama = Column(String(100), nullable=False)
    tingkat = Column(String(20))  # daerah, desa, kelompok
    parent_id = Column(Integer, ForeignKey('wilayah.id'))
    is_aktif = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    sync_id = Column(String(36), unique=True, default=generate_sync_id)

    parent = relationship("Wilayah", remote_side=[id], backref="children")

    def to_dict(self):
        return {
            'id': self.id,
            'kode': self.kode,
            'nama': self.nama,
            'tingkat': self.tingkat,
            'parent_id': self.parent_id,
            'is_aktif': self.is_aktif,
            'sync_id': self.sync_id,
        }


class Jenjang(Base):
    __tablename__ = 'jenjang'

    id = Column(Integer, primary_key=True, autoincrement=True)
    kode = Column(String(20), unique=True)
    nama = Column(String(50), nullable=False)
    usia_mulai = Column(Integer)
    usia_sampai = Column(Integer)
    urutan = Column(Integer)
    is_aktif = Column(Boolean, default=True)
    sync_id = Column(String(36), unique=True, default=generate_sync_id)

    @staticmethod
    def get_by_age(session, age):
        """Get jenjang based on age"""
        return session.query(Jenjang).filter(
            Jenjang.usia_mulai <= age,
            Jenjang.usia_sampai >= age,
            Jenjang.is_aktif == True
        ).first()


class Enrollment(Base):
    __tablename__ = 'enrollment'

    id = Column(Integer, primary_key=True, autoincrement=True)
    jamaah_id = Column(Integer, ForeignKey('jamaah.id'), nullable=False)
    wilayah_id = Column(Integer, ForeignKey('wilayah.id'), nullable=False)
    jenjang_id = Column(Integer, ForeignKey('jenjang.id'))
    tahun_ajaran_id = Column(Integer, ForeignKey('tahun_ajaran.id'))
    status = Column(String(20), default='aktif')
    tanggal_mulai = Column(Date)
    tanggal_selesai = Column(Date)
    keterangan = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    sync_id = Column(String(36), unique=True, default=generate_sync_id)

    jamaah = relationship("Jamaah", back_populates="enrollments")
    wilayah = relationship("Wilayah")
    jenjang = relationship("Jenjang")


class Pengajian(Base):
    __tablename__ = 'pengajian'

    id = Column(Integer, primary_key=True, autoincrement=True)
    wilayah_id = Column(Integer, ForeignKey('wilayah.id'))
    jenjang_id = Column(Integer, ForeignKey('jenjang.id'))
    tanggal = Column(Date, nullable=False)
    waktu_mulai = Column(Time)
    waktu_selesai = Column(Time)
    materi_pokok = Column(Text)
    penyaji_id = Column(Integer, ForeignKey('users.id'))
    catatan = Column(Text)
    status = Column(String(20), default='terlaksana')
    created_at = Column(DateTime, default=datetime.now)
    sync_id = Column(String(36), unique=True, default=generate_sync_id)

    wilayah = relationship("Wilayah")
    jenjang = relationship("Jenjang")
    presensi = relationship("KeaktifanPengajian", back_populates="pengajian")


class KeaktifanPengajian(Base):
    __tablename__ = 'keaktifan_pengajian'

    id = Column(Integer, primary_key=True, autoincrement=True)
    pengajian_id = Column(Integer, ForeignKey('pengajian.id'), nullable=False)
    jamaah_id = Column(Integer, ForeignKey('jamaah.id'), nullable=False)
    status = Column(String(10))  # hadir, izin, sakit, alpa
    keterangan = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    sync_id = Column(String(36), unique=True, default=generate_sync_id)

    pengajian = relationship("Pengajian", back_populates="presensi")
    jamaah = relationship("Jamaah")


# ... (model lainnya serupa)
```

#### 4.3.2 Service Layer (jamaah_service.py)

```python
from sqlalchemy.orm import Session
from database.models import Jamaah, Enrollment, Jenjang
from typing import List, Optional, Dict
from datetime import datetime

class JamaahService:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, filters: Dict = None) -> List[Jamaah]:
        """Get all jamaah with optional filters"""
        query = self.session.query(Jamaah).filter(Jamaah.status_aktif == True)

        if filters:
            if filters.get('jenis_kelamin'):
                query = query.filter(Jamaah.jenis_kelamin == filters['jenis_kelamin'])
            if filters.get('search'):
                search = f"%{filters['search']}%"
                query = query.filter(Jamaah.nama.ilike(search))

        return query.order_by(Jamaah.nama).all()

    def get_generus(self, wilayah_id: int = None, jenjang_id: int = None) -> List[Dict]:
        """Get generus (belum menikah) with enrollment info"""
        query = self.session.query(Jamaah, Enrollment, Jenjang).join(
            Enrollment, Jamaah.id == Enrollment.jamaah_id
        ).join(
            Jenjang, Enrollment.jenjang_id == Jenjang.id
        ).filter(
            Jamaah.status_aktif == True,
            Jamaah.status_pernikahan == 'belum_menikah',
            Enrollment.status == 'aktif'
        )

        if wilayah_id:
            query = query.filter(Enrollment.wilayah_id == wilayah_id)
        if jenjang_id:
            query = query.filter(Enrollment.jenjang_id == jenjang_id)

        results = []
        for jamaah, enrollment, jenjang in query.all():
            results.append({
                **jamaah.to_dict(),
                'jenjang_id': jenjang.id,
                'jenjang_nama': jenjang.nama,
                'wilayah_id': enrollment.wilayah_id,
                'enrollment_id': enrollment.id,
                'umur': jamaah.umur
            })

        return results

    def get_by_id(self, jamaah_id: int) -> Optional[Jamaah]:
        """Get jamaah by ID"""
        return self.session.query(Jamaah).filter(Jamaah.id == jamaah_id).first()

    def create(self, data: Dict) -> Jamaah:
        """Create new jamaah"""
        jamaah = Jamaah(**data)
        self.session.add(jamaah)
        self.session.commit()
        self.session.refresh(jamaah)
        return jamaah

    def update(self, jamaah_id: int, data: Dict) -> Optional[Jamaah]:
        """Update jamaah"""
        jamaah = self.get_by_id(jamaah_id)
        if not jamaah:
            return None

        for key, value in data.items():
            if hasattr(jamaah, key):
                setattr(jamaah, key, value)

        jamaah.updated_at = datetime.now()
        self.session.commit()
        return jamaah

    def delete(self, jamaah_id: int) -> bool:
        """Soft delete jamaah"""
        jamaah = self.get_by_id(jamaah_id)
        if not jamaah:
            return False

        jamaah.status_aktif = False
        jamaah.updated_at = datetime.now()
        self.session.commit()
        return True

    def get_family(self, jamaah_id: int) -> Dict:
        """Get family relationships"""
        jamaah = self.get_by_id(jamaah_id)
        if not jamaah:
            return None

        return {
            'jamaah': jamaah.to_dict(),
            'ayah': jamaah.ayah.to_dict() if jamaah.ayah else None,
            'ibu': jamaah.ibu.to_dict() if jamaah.ibu else None,
            'pasangan': jamaah.pasangan.to_dict() if jamaah.pasangan else None,
            'anak': [
                j.to_dict() for j in self.session.query(Jamaah).filter(
                    (Jamaah.ayah_id == jamaah_id) | (Jamaah.ibu_id == jamaah_id)
                ).all()
            ]
        }

    def auto_assign_jenjang(self, jamaah_id: int) -> Optional[int]:
        """Auto assign jenjang based on age"""
        jamaah = self.get_by_id(jamaah_id)
        if not jamaah or not jamaah.umur:
            return None

        jenjang = Jenjang.get_by_age(self.session, jamaah.umur)
        if jenjang:
            return jenjang.id
        return None
```

#### 4.3.3 Sync Service (sync_service.py)

```python
import json
import gzip
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from database.models import *
from sqlalchemy.orm import Session

class SyncService:
    """Service untuk sinkronisasi data antar device"""

    EXPORT_VERSION = "1.0"
    FILE_EXTENSION = ".ppg"  # PPG backup file

    # Urutan tabel untuk export/import (parent dulu)
    TABLE_ORDER = [
        'wilayah',
        'jenjang',
        'tahun_ajaran',
        'role',
        'resource',
        'users',
        'jamaah',
        'enrollment',
        'jadwal_rutin',
        'pengajian',
        'keaktifan_pengajian',
        'bidang_materi',
        'kategori_materi',
        'materi_item',
        'progress_jamaah',
        'penilaian_akhlaq',
        'kelas_pengajian',
        'anggota_kelas',
        'musyawarah',
        'kegiatan',
        'kakak_asuh',
        'lima_unsur',
    ]

    MODEL_MAP = {
        'wilayah': Wilayah,
        'jenjang': Jenjang,
        'tahun_ajaran': TahunAjaran,
        'role': Role,
        'users': Users,
        'jamaah': Jamaah,
        'enrollment': Enrollment,
        'pengajian': Pengajian,
        'keaktifan_pengajian': KeaktifanPengajian,
        # ... dll
    }

    def __init__(self, session: Session, device_id: str = None):
        self.session = session
        self.device_id = device_id or self._generate_device_id()

    def _generate_device_id(self) -> str:
        import uuid
        return str(uuid.uuid4())[:8]

    def export_backup(self,
                      output_path: str = None,
                      tables: List[str] = None,
                      since: datetime = None,
                      wilayah_id: int = None) -> str:
        """
        Export data ke file backup

        Args:
            output_path: Path file output
            tables: Daftar tabel yang di-export (default semua)
            since: Export data yang diubah sejak tanggal ini
            wilayah_id: Filter berdasarkan wilayah

        Returns:
            Path file backup yang dibuat
        """
        tables = tables or self.TABLE_ORDER

        export_data = {
            'version': self.EXPORT_VERSION,
            'device_id': self.device_id,
            'export_time': datetime.now().isoformat(),
            'tables': {}
        }

        total_records = 0

        for table_name in tables:
            if table_name not in self.MODEL_MAP:
                continue

            model = self.MODEL_MAP[table_name]
            query = self.session.query(model)

            # Filter by updated date if specified
            if since and hasattr(model, 'updated_at'):
                query = query.filter(model.updated_at >= since)
            elif since and hasattr(model, 'created_at'):
                query = query.filter(model.created_at >= since)

            # Filter by wilayah if specified
            if wilayah_id and hasattr(model, 'wilayah_id'):
                query = query.filter(model.wilayah_id == wilayah_id)

            records = []
            for row in query.all():
                if hasattr(row, 'to_dict'):
                    records.append(row.to_dict())
                else:
                    records.append({c.name: getattr(row, c.name)
                                   for c in row.__table__.columns})

            export_data['tables'][table_name] = records
            total_records += len(records)

        # Generate filename
        if not output_path:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = f"backup_{self.device_id}_{timestamp}{self.FILE_EXTENSION}"

        # Compress and save
        json_str = json.dumps(export_data, indent=2, default=str)

        with gzip.open(output_path, 'wt', encoding='utf-8') as f:
            f.write(json_str)

        # Log export
        self._log_sync('export', output_path, total_records)

        return output_path

    def import_backup(self,
                      file_path: str,
                      merge_strategy: str = 'update') -> Dict:
        """
        Import data dari file backup

        Args:
            file_path: Path file backup
            merge_strategy:
                - 'update': Update existing, insert new
                - 'replace': Replace all data
                - 'skip': Only insert new

        Returns:
            Summary of import operation
        """
        # Read and decompress
        with gzip.open(file_path, 'rt', encoding='utf-8') as f:
            import_data = json.loads(f.read())

        summary = {
            'version': import_data.get('version'),
            'source_device': import_data.get('device_id'),
            'export_time': import_data.get('export_time'),
            'tables': {},
            'errors': []
        }

        # Import in order
        for table_name in self.TABLE_ORDER:
            if table_name not in import_data.get('tables', {}):
                continue

            records = import_data['tables'][table_name]
            model = self.MODEL_MAP.get(table_name)

            if not model:
                continue

            inserted = 0
            updated = 0
            skipped = 0
            errors = 0

            for record in records:
                try:
                    result = self._import_record(model, record, merge_strategy)
                    if result == 'inserted':
                        inserted += 1
                    elif result == 'updated':
                        updated += 1
                    else:
                        skipped += 1
                except Exception as e:
                    errors += 1
                    summary['errors'].append({
                        'table': table_name,
                        'record': record.get('sync_id'),
                        'error': str(e)
                    })

            summary['tables'][table_name] = {
                'inserted': inserted,
                'updated': updated,
                'skipped': skipped,
                'errors': errors
            }

        self.session.commit()

        # Log import
        total = sum(t['inserted'] + t['updated'] for t in summary['tables'].values())
        self._log_sync('import', file_path, total)

        return summary

    def _import_record(self, model, record: Dict, strategy: str) -> str:
        """Import single record"""
        sync_id = record.get('sync_id')

        if not sync_id:
            # No sync_id, always insert
            new_record = model(**record)
            self.session.add(new_record)
            return 'inserted'

        # Check if exists
        existing = self.session.query(model).filter(
            model.sync_id == sync_id
        ).first()

        if existing:
            if strategy == 'skip':
                return 'skipped'
            elif strategy in ('update', 'replace'):
                for key, value in record.items():
                    if key != 'id' and hasattr(existing, key):
                        setattr(existing, key, value)
                return 'updated'
        else:
            # Remove id to let database assign new one
            record_copy = {k: v for k, v in record.items() if k != 'id'}
            new_record = model(**record_copy)
            self.session.add(new_record)
            return 'inserted'

    def _log_sync(self, sync_type: str, file_name: str, records_count: int):
        """Log sync operation"""
        log = SyncLog(
            device_id=self.device_id,
            sync_type=sync_type,
            records_count=records_count,
            file_name=file_name,
            status='success'
        )
        self.session.add(log)
        self.session.commit()

    def get_sync_history(self, limit: int = 50) -> List[Dict]:
        """Get sync history"""
        logs = self.session.query(SyncLog).order_by(
            SyncLog.sync_time.desc()
        ).limit(limit).all()

        return [
            {
                'id': log.id,
                'device_id': log.device_id,
                'sync_type': log.sync_type,
                'sync_time': log.sync_time.isoformat(),
                'records_count': log.records_count,
                'file_name': log.file_name,
                'status': log.status
            }
            for log in logs
        ]
```

#### 4.3.4 Main Window (main_window.py)

```python
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QStackedWidget, QPushButton, QLabel, QFrame
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QIcon

class MainWindow(QMainWindow):
    def __init__(self, session):
        super().__init__()
        self.session = session
        self.setWindowTitle("PPG Sorong - Sistem Manajemen Generus")
        self.setMinimumSize(1200, 800)

        # Central widget
        central = QWidget()
        self.setCentralWidget(central)

        # Main layout
        layout = QHBoxLayout(central)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Sidebar
        self.sidebar = self._create_sidebar()
        layout.addWidget(self.sidebar)

        # Content area
        self.content = QStackedWidget()
        layout.addWidget(self.content, 1)

        # Add pages
        self._setup_pages()

        # Show dashboard by default
        self.show_page('dashboard')

    def _create_sidebar(self) -> QFrame:
        sidebar = QFrame()
        sidebar.setFixedWidth(250)
        sidebar.setStyleSheet("""
            QFrame {
                background-color: #1f2937;
            }
            QPushButton {
                text-align: left;
                padding: 12px 20px;
                border: none;
                color: #9ca3af;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #374151;
                color: white;
            }
            QPushButton:checked {
                background-color: #059669;
                color: white;
            }
        """)

        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Logo
        logo = QLabel("PPG SORONG")
        logo.setStyleSheet("""
            padding: 20px;
            color: white;
            font-size: 20px;
            font-weight: bold;
            background-color: #059669;
        """)
        layout.addWidget(logo)

        # Menu items
        self.menu_buttons = {}

        menus = [
            ('dashboard', '📊 Dashboard'),
            ('generus', '👶 Data Generus'),
            ('pengajian', '📖 Pengajian'),
            ('presensi', '✅ Presensi'),
            ('penilaian', '📝 Penilaian'),
            ('kurikulum', '📚 Kurikulum'),
            ('wilayah', '🗺️ Wilayah'),
            ('laporan', '📋 Laporan'),
            ('sync', '🔄 Sinkronisasi'),
            ('settings', '⚙️ Pengaturan'),
        ]

        for key, label in menus:
            btn = QPushButton(label)
            btn.setCheckable(True)
            btn.clicked.connect(lambda checked, k=key: self.show_page(k))
            layout.addWidget(btn)
            self.menu_buttons[key] = btn

        layout.addStretch()

        return sidebar

    def _setup_pages(self):
        from ui.pages.dashboard import DashboardPage
        from ui.pages.generus_page import GenerusPage
        from ui.pages.pengajian_page import PengajianPage
        from ui.pages.presensi_page import PresensiPage
        from ui.pages.penilaian_page import PenilaianPage
        from ui.pages.kurikulum_page import KurikulumPage
        from ui.pages.wilayah_page import WilayahPage
        from ui.pages.laporan_page import LaporanPage
        from ui.pages.sync_page import SyncPage
        from ui.pages.settings_page import SettingsPage

        self.pages = {
            'dashboard': DashboardPage(self.session),
            'generus': GenerusPage(self.session),
            'pengajian': PengajianPage(self.session),
            'presensi': PresensiPage(self.session),
            'penilaian': PenilaianPage(self.session),
            'kurikulum': KurikulumPage(self.session),
            'wilayah': WilayahPage(self.session),
            'laporan': LaporanPage(self.session),
            'sync': SyncPage(self.session),
            'settings': SettingsPage(self.session),
        }

        for page in self.pages.values():
            self.content.addWidget(page)

    def show_page(self, page_name: str):
        if page_name in self.pages:
            # Update sidebar buttons
            for key, btn in self.menu_buttons.items():
                btn.setChecked(key == page_name)

            # Show page
            self.content.setCurrentWidget(self.pages[page_name])

            # Refresh page data
            if hasattr(self.pages[page_name], 'refresh'):
                self.pages[page_name].refresh()
```

---

## 5. SPESIFIKASI APLIKASI MOBILE

### 5.1 Teknologi

| Komponen | Opsi 1 | Opsi 2 |
|----------|--------|--------|
| Framework | Flutter | Kivy (Python) |
| Language | Dart | Python |
| Database | SQLite | SQLite |
| State Mgmt | Provider/Riverpod | - |

### 5.2 Fitur Mobile App

1. **Input Presensi**
   - Pilih wilayah & jenjang
   - Pilih/buat pengajian
   - Input kehadiran (hadir/izin/sakit/alpa)
   - Simpan ke database lokal

2. **Input Penilaian**
   - Pilih generus
   - Input nilai hafalan
   - Input penilaian akhlaq
   - Simpan ke database lokal

3. **Lihat Data**
   - Daftar generus
   - Riwayat pengajian
   - Progress hafalan

4. **Export Backup**
   - Generate file .ppg
   - Share via WhatsApp/email
   - Pilih rentang tanggal
   - Pilih wilayah

### 5.3 Struktur Folder (Flutter)

```
ppg_mobile/
├── lib/
│   ├── main.dart
│   ├── config/
│   │   ├── constants.dart
│   │   └── theme.dart
│   ├── models/
│   │   ├── jamaah.dart
│   │   ├── pengajian.dart
│   │   ├── presensi.dart
│   │   └── ...
│   ├── database/
│   │   ├── database_helper.dart
│   │   └── tables.dart
│   ├── services/
│   │   ├── jamaah_service.dart
│   │   ├── presensi_service.dart
│   │   ├── sync_service.dart
│   │   └── ...
│   ├── screens/
│   │   ├── home_screen.dart
│   │   ├── presensi_screen.dart
│   │   ├── penilaian_screen.dart
│   │   ├── generus_screen.dart
│   │   └── export_screen.dart
│   ├── widgets/
│   │   ├── generus_card.dart
│   │   ├── presensi_form.dart
│   │   └── ...
│   └── utils/
│       ├── date_utils.dart
│       └── export_utils.dart
├── android/
├── ios/
└── pubspec.yaml
```

### 5.4 Contoh Implementasi (Flutter)

#### Model (jamaah.dart)

```dart
class Jamaah {
  final int? id;
  final String nama;
  final String? namaPanggilan;
  final String? jenisKelamin;
  final DateTime? tanggalLahir;
  final String? phone;
  final String? alamat;
  final bool statusAktif;
  final String syncId;
  final DateTime? lastSync;

  Jamaah({
    this.id,
    required this.nama,
    this.namaPanggilan,
    this.jenisKelamin,
    this.tanggalLahir,
    this.phone,
    this.alamat,
    this.statusAktif = true,
    String? syncId,
    this.lastSync,
  }) : syncId = syncId ?? _generateUuid();

  static String _generateUuid() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }

  int? get umur {
    if (tanggalLahir == null) return null;
    final now = DateTime.now();
    int age = now.year - tanggalLahir!.year;
    if (now.month < tanggalLahir!.month ||
        (now.month == tanggalLahir!.month && now.day < tanggalLahir!.day)) {
      age--;
    }
    return age;
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'nama': nama,
      'nama_panggilan': namaPanggilan,
      'jenis_kelamin': jenisKelamin,
      'tanggal_lahir': tanggalLahir?.toIso8601String(),
      'phone': phone,
      'alamat_lengkap': alamat,
      'status_aktif': statusAktif ? 1 : 0,
      'sync_id': syncId,
      'last_sync': lastSync?.toIso8601String(),
    };
  }

  factory Jamaah.fromMap(Map<String, dynamic> map) {
    return Jamaah(
      id: map['id'],
      nama: map['nama'],
      namaPanggilan: map['nama_panggilan'],
      jenisKelamin: map['jenis_kelamin'],
      tanggalLahir: map['tanggal_lahir'] != null
          ? DateTime.parse(map['tanggal_lahir'])
          : null,
      phone: map['phone'],
      alamat: map['alamat_lengkap'],
      statusAktif: map['status_aktif'] == 1,
      syncId: map['sync_id'],
      lastSync: map['last_sync'] != null
          ? DateTime.parse(map['last_sync'])
          : null,
    );
  }
}
```

#### Export Service (sync_service.dart)

```dart
import 'dart:convert';
import 'dart:io';
import 'package:archive/archive.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class SyncService {
  final DatabaseHelper _db;

  SyncService(this._db);

  Future<String> exportBackup({
    DateTime? since,
    int? wilayahId,
  }) async {
    final exportData = {
      'version': '1.0',
      'device_id': await _getDeviceId(),
      'export_time': DateTime.now().toIso8601String(),
      'tables': <String, List<Map<String, dynamic>>>{},
    };

    // Export each table
    final tables = [
      'jamaah',
      'enrollment',
      'pengajian',
      'keaktifan_pengajian',
      'progress_jamaah',
      'penilaian_akhlaq',
    ];

    for (final table in tables) {
      final records = await _db.getAll(table,
        since: since,
        wilayahId: wilayahId
      );
      exportData['tables'][table] = records;
    }

    // Convert to JSON and compress
    final jsonStr = jsonEncode(exportData);
    final bytes = utf8.encode(jsonStr);
    final compressed = GZipEncoder().encode(bytes);

    // Save to file
    final dir = await getTemporaryDirectory();
    final timestamp = DateTime.now().toString().replaceAll(RegExp(r'[:\s]'), '_');
    final fileName = 'backup_$timestamp.ppg';
    final file = File('${dir.path}/$fileName');
    await file.writeAsBytes(compressed!);

    return file.path;
  }

  Future<void> shareBackup(String filePath) async {
    await Share.shareXFiles(
      [XFile(filePath)],
      text: 'Backup Data PPG Sorong',
    );
  }

  Future<Map<String, dynamic>> importBackup(String filePath) async {
    final file = File(filePath);
    final compressed = await file.readAsBytes();
    final decompressed = GZipDecoder().decodeBytes(compressed);
    final jsonStr = utf8.decode(decompressed);
    final importData = jsonDecode(jsonStr) as Map<String, dynamic>;

    final summary = <String, int>{};

    for (final entry in (importData['tables'] as Map).entries) {
      final table = entry.key as String;
      final records = entry.value as List;

      int count = 0;
      for (final record in records) {
        await _db.upsertBySyncId(table, record as Map<String, dynamic>);
        count++;
      }
      summary[table] = count;
    }

    return summary;
  }
}
```

---

## 6. MEKANISME SINKRONISASI VIA WHATSAPP

### 6.1 Alur Sinkronisasi

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALUR SINKRONISASI                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HP (Data Collector)                  Laptop (Main App)          │
│  ─────────────────                    ─────────────────          │
│                                                                  │
│  1. Input presensi/nilai                                         │
│     ↓                                                            │
│  2. Data tersimpan lokal                                         │
│     ↓                                                            │
│  3. Pilih "Export Backup"                                        │
│     ↓                                                            │
│  4. Pilih rentang tanggal                                        │
│     ↓                                                            │
│  5. Generate file .ppg                                           │
│     ↓                                                            │
│  6. Share via WhatsApp ─────────────────────────────────────►    │
│                                                                  │
│                                    7. Terima file .ppg           │
│                                       ↓                          │
│                                    8. Buka app desktop           │
│                                       ↓                          │
│                                    9. Pilih "Import Backup"      │
│                                       ↓                          │
│                                   10. Pilih file .ppg            │
│                                       ↓                          │
│                                   11. Review konflik (jika ada)  │
│                                       ↓                          │
│                                   12. Data ter-merge             │
│                                       ↓                          │
│                                   13. Generate laporan           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Format File Backup (.ppg)

```json
{
  "version": "1.0",
  "device_id": "HP001",
  "device_name": "HP Operator Kelompok A",
  "export_time": "2024-01-15T14:30:00",
  "export_range": {
    "from": "2024-01-01",
    "to": "2024-01-15"
  },
  "wilayah_filter": {
    "id": 5,
    "nama": "Kelompok Al-Ikhlas"
  },
  "tables": {
    "pengajian": [
      {
        "sync_id": "uuid-123",
        "wilayah_id": 5,
        "tanggal": "2024-01-10",
        "waktu_mulai": "16:00",
        "waktu_selesai": "17:30",
        "materi_pokok": "Surat Al-Fatihah",
        "status": "terlaksana"
      }
    ],
    "keaktifan_pengajian": [
      {
        "sync_id": "uuid-456",
        "pengajian_sync_id": "uuid-123",
        "jamaah_sync_id": "uuid-789",
        "status": "hadir"
      }
    ],
    "progress_jamaah": [
      {
        "sync_id": "uuid-abc",
        "jamaah_sync_id": "uuid-789",
        "materi_item_id": 1,
        "status": "selesai",
        "nilai": 85
      }
    ]
  },
  "checksum": "sha256:abc123..."
}
```

### 6.3 Conflict Resolution

Ketika data dari HP diimpor ke Laptop dan terjadi konflik:

| Skenario | Strategi Default | Aksi |
|----------|------------------|------|
| Record baru | Auto insert | Masukkan ke database |
| Record sama (sync_id) | Update if newer | Cek timestamp, ambil yang lebih baru |
| Data berbeda | Manual review | Tampilkan dialog konflik |
| Data dihapus di HP | Keep in laptop | Pertahankan data di laptop |

```python
def resolve_conflict(local_record, remote_record):
    """
    Resolve conflict between local and remote records
    """
    # Jika salah satu None, ambil yang ada
    if local_record is None:
        return remote_record, 'inserted'
    if remote_record is None:
        return local_record, 'kept_local'

    # Bandingkan timestamp
    local_time = local_record.get('updated_at') or local_record.get('created_at')
    remote_time = remote_record.get('updated_at') or remote_record.get('created_at')

    if remote_time > local_time:
        return remote_record, 'updated'
    else:
        return local_record, 'kept_local'
```

---

## 7. STRUKTUR PROYEK LENGKAP

```
ppg-system/
├── desktop/                    # Aplikasi Desktop Python
│   ├── main.py
│   ├── requirements.txt
│   ├── config.py
│   ├── database/
│   ├── services/
│   ├── ui/
│   ├── utils/
│   ├── reports/
│   ├── sync/
│   └── assets/
│
├── mobile/                     # Aplikasi Mobile
│   ├── lib/                    # Flutter
│   │   ├── main.dart
│   │   ├── models/
│   │   ├── services/
│   │   ├── screens/
│   │   └── widgets/
│   ├── android/
│   ├── ios/
│   └── pubspec.yaml
│
├── shared/                     # Shared resources
│   ├── schema.sql              # Database schema
│   ├── seed_data.sql           # Data awal
│   └── sync_format.json        # Format file backup
│
├── docs/                       # Dokumentasi
│   ├── user_manual.md
│   ├── admin_guide.md
│   └── api_reference.md
│
└── README.md
```

---

## 8. IMPLEMENTASI DETAIL

### 8.1 Modul Dashboard

**Desktop:**
- Statistik jumlah generus per jenjang
- Grafik kehadiran bulanan
- Pengajian terbaru
- Progress hafalan terkini
- Quick actions

**Mobile:**
- Ringkasan harian
- Shortcut input presensi
- Notifikasi jadwal pengajian

### 8.2 Modul Generus

**Fitur:**
- CRUD data generus
- Hubungan keluarga (ayah, ibu)
- Auto-assign jenjang berdasarkan umur
- Filter by wilayah, jenjang, status
- Pencarian nama
- Export ke Excel

### 8.3 Modul Pengajian

**Fitur:**
- CRUD sesi pengajian
- Jadwal rutin (recurring)
- Generate otomatis bulanan
- Kelola tanggal libur
- Riwayat pengajian

### 8.4 Modul Presensi

**Fitur:**
- Input kehadiran batch
- Status: hadir, izin, sakit, alpa
- Rekapitulasi per jamaah
- Rekapitulasi per pengajian
- Export laporan presensi

### 8.5 Modul Penilaian

**Fitur:**
- Penilaian hafalan (per materi)
- Penilaian akhlaq (bulanan)
- Progress tracking
- Generate rapor

### 8.6 Modul Laporan

**Jenis Laporan:**
1. Laporan Presensi Bulanan
2. Laporan Progress Hafalan
3. Laporan Penilaian Akhlaq
4. Rapor Individual
5. Statistik Wilayah
6. Rekap Tahun Ajaran

---

## 9. FITUR PER MODUL

### Tabel Perbandingan Desktop vs Mobile

| Modul | Desktop | Mobile |
|-------|---------|--------|
| Dashboard | ✅ Full | ✅ Ringkas |
| Data Generus | ✅ CRUD | 👁️ View only |
| Data Jamaah | ✅ CRUD | ❌ |
| Enrollment | ✅ CRUD | ❌ |
| Wilayah | ✅ CRUD | 👁️ View only |
| Jenjang | ✅ CRUD | ❌ |
| Tahun Ajaran | ✅ CRUD | ❌ |
| Pengajian | ✅ CRUD | ✅ Create |
| Presensi | ✅ CRUD | ✅ Create |
| Penilaian Hafalan | ✅ CRUD | ✅ Create |
| Penilaian Akhlaq | ✅ CRUD | ✅ Create |
| Kurikulum | ✅ CRUD | 👁️ View only |
| Laporan | ✅ Generate PDF | ❌ |
| Export Backup | ✅ Full | ✅ Partial |
| Import Backup | ✅ Full | ❌ |
| User Management | ✅ CRUD | ❌ |

### Legenda:
- ✅ Fitur lengkap
- 👁️ Hanya lihat
- ❌ Tidak tersedia

---

## 10. TIMELINE PENGEMBANGAN

### Fase 1: Persiapan (1-2 minggu)
- [ ] Setup environment Python
- [ ] Setup database SQLite
- [ ] Migrasi schema dari web app
- [ ] Import data awal

### Fase 2: Desktop Core (3-4 minggu)
- [ ] Implementasi models
- [ ] Implementasi services
- [ ] UI: Dashboard
- [ ] UI: Data Generus
- [ ] UI: Pengajian
- [ ] UI: Presensi

### Fase 3: Desktop Advanced (2-3 minggu)
- [ ] UI: Penilaian
- [ ] UI: Kurikulum
- [ ] UI: Laporan (PDF)
- [ ] UI: Sinkronisasi

### Fase 4: Mobile App (3-4 minggu)
- [ ] Setup Flutter project
- [ ] Database lokal
- [ ] UI: Presensi
- [ ] UI: Penilaian
- [ ] Export backup

### Fase 5: Integrasi (1-2 minggu)
- [ ] Format file backup
- [ ] Import/export testing
- [ ] Conflict resolution
- [ ] End-to-end testing

### Fase 6: Polish (1 minggu)
- [ ] Bug fixing
- [ ] Performance tuning
- [ ] User manual
- [ ] Deployment

**Total Estimasi: 11-16 minggu**

---

## KESIMPULAN

Proyek konversi PPG Sorong dari web app ke sistem offline (Python Desktop + Mobile) sangat memungkinkan dan memberikan keuntungan:

1. **Offline Operation** - Tidak perlu internet
2. **Data Security** - Data tersimpan lokal
3. **Flexibility** - Input data di lapangan via HP
4. **Portability** - Sinkronisasi via WhatsApp

### Rekomendasi Teknologi:

| Komponen | Rekomendasi |
|----------|-------------|
| Desktop | Python + PyQt6 + SQLite |
| Mobile | Flutter + SQLite |
| Backup Format | Compressed JSON (.ppg) |
| Reports | ReportLab (PDF) |

### File Penting untuk Referensi:

1. `/js/api.js` - Semua API dan business logic
2. `/js/auth.js` - Autentikasi
3. `*.html` - UI/UX reference
4. Dokumen ini - Panduan pengembangan

---

## 11. REKAP MATERI KURIKULUM

### 11.1 Struktur Kurikulum PPG

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        STRUKTUR KURIKULUM PPG                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   PILAR 1       │    │   PILAR 2       │    │   PILAR 3       │     │
│  │  ALIM-FAQIH     │    │    AKHLAQ       │    │  KEMANDIRIAN    │     │
│  │  (Keilmuan)     │    │  (Karakter)     │    │ (Kemandirian)   │     │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘     │
│           │                      │                      │               │
│           ▼                      ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         BIDANG MATERI                           │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Alim    │   Faqih   │   Akhlaq    │  Kemandirian │  Keaktifan  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      KATEGORI MATERI                            │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Hafalan Surat │ Hafalan Doa │ Hafalan Dalil │ Praktek Ibadah  │   │
│  │  Tajwid        │ Keilmuan    │ Adab/Tatakrama│ ASAD Beladiri   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       MATERI ITEM                               │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Surat Al-Fatihah │ Doa Makan │ Dalil Sholat │ Wudhu │ dll.    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Pilar Tri-Sukses

Kurikulum PPG didasarkan pada 3 Pilar Tri-Sukses:

| No | Pilar | Kode | Deskripsi | Icon |
|----|-------|------|-----------|------|
| 1 | Alim-Faqih | `alim_faqih` | Penguasaan ilmu dan pemahaman agama Islam | 📘 |
| 2 | Akhlaq | `akhlaq` | Pembentukan karakter dan perilaku mulia | 🤝 |
| 3 | Kemandirian | `kemandirian` | Pengembangan kemandirian dan keterampilan hidup | 💪 |

### 11.3 Jenjang Pendidikan

Generus dibagi berdasarkan usia dan tingkat kemampuan:

| No | Jenjang | Rentang Usia | Keterangan |
|----|---------|--------------|------------|
| 1 | PAUD | < 5 tahun | Pendidikan Anak Usia Dini |
| 2 | Caberawit Iqro 1-2 | 5 - 6 tahun | Tingkat dasar Iqro |
| 3 | Caberawit Iqro 3-4 | 6 - 7 tahun | Tingkat menengah Iqro |
| 4 | Caberawit Quran | 7 - 8 tahun | Sudah bisa baca Al-Quran |
| 5 | Pra Remaja | 8 - 12 tahun | Persiapan remaja |
| 6 | Remaja | 12 - 17 tahun | Masa remaja |
| 7 | Pra Nikah | 17+ tahun | Persiapan menikah |

### 11.4 Bidang Materi

| No | Bidang | Pilar | Deskripsi |
|----|--------|-------|-----------|
| 1 | Alim | Alim-Faqih | Hafalan dan keilmuan dasar (surat, doa, dalil, tajwid) |
| 2 | Faqih | Alim-Faqih | Pemahaman dan praktek ibadah |
| 3 | Akhlaq | Akhlaq | Adab, tatakrama, dan 6 Thobiat Luhur |
| 4 | Kemandirian | Kemandirian | Keterampilan hidup dan ASAD Beladiri |
| 5 | Keaktifan | - | Kehadiran dan partisipasi pengajian |

### 11.5 Teknik Penilaian

| No | Teknik | Kode | Deskripsi | Contoh |
|----|--------|------|-----------|--------|
| 1 | Hafalan | `hafalan` | Penilaian persentase 0-100% | Hafalan Surat (85%) |
| 2 | Level | `level` | Penilaian bertingkat (A, B, C, D) | Kualitas Bacaan |
| 3 | Checklist | `checklist` | Penyelesaian materi (Ya/Tidak) | Praktek Wudhu |
| 4 | Status | `status` | Status pencapaian | Belum/Proses/Selesai |

### 11.6 Kategori Hafalan (Materi Bertahap)

Materi hafalan adalah materi yang dinilai secara bertahap dan berkesinambungan (persentase 0-100%):

| ID | Kode | Nama Kategori | Icon | Pilar |
|----|------|---------------|------|-------|
| 60 | ALM-HFL-01 | Hafalan Surat | 📖 | Alim-Faqih |
| 61 | ALM-HFL-02 | Hafalan Doa | 🤲 | Alim-Faqih |
| 63 | ALM-HFL-04 | Hafalan Dalil | 📜 | Alim-Faqih |

### 11.7 Rekap Target Materi per Jenjang

#### A. PAUD (Usia Dini)

| Bidang | Kategori | Target | Satuan | Keterangan |
|--------|----------|--------|--------|------------|
| Alim | Iqro/Tilawaty | 35 | halaman | Iqro Jilid 1 |
| Alim | Hafalan Surat | 6 | surat | Al-Fatihah & An-Nas s/d Al-Kafirun |
| Alim | Hafalan Doa GBMTPG | 6 | doa | Asmaul Husna & Doa harian |
| Alim | Hafalan Doa Generus Sorong | 12 | doa | Doa Generus Sorong dasar |
| Alim | Keilmuan GBMTPG | 4 | materi | Dasar aqidah |
| Faqih | Kefahaman Agama GBMTPG | 10 | materi | Kefahaman dasar |
| Faqih | Praktek Ibadah GBMTPG | 6 | materi | Praktek ibadah dasar |
| Faqih | Praktek Wudhu Sholat | 1 | nilai | Praktek wudhu sholat |
| Faqih | 4 Tali Keimanan | 100 | nilai | Pengenalan 4 Tali Keimanan |
| Akhlaq | 6 Thobiat Luhur | 100 | nilai | Pengenalan 6 Thobiat |
| Akhlaq | Adab/Tatakrama | 35 | materi | Tatakrama dasar |
| Kemandirian | Kemandirian GBMTPG | 8 | materi | Kemandirian dasar |
| Kemandirian | ASAD Beladiri | 1 | jurus | Jurus 1 |
| Keaktifan | Keaktifan Bulanan | 20 | kali | Target 20x/bulan |

#### B. Caberawit Iqro 1-2

| Bidang | Kategori | Target | Satuan | Keterangan |
|--------|----------|--------|--------|------------|
| Alim | Iqro/Tilawaty | 131 | halaman | Iqro Jilid 1-4 |
| Alim | Hafalan Surat | 12 | surat | 12 surat pendek |
| Alim | Hafalan Doa GBMTPG | 11 | doa | Doa harian lengkap |
| Alim | Hafalan Doa Generus Sorong | 24 | doa | Doa Generus Sorong lanjutan |
| Alim | Keilmuan GBMTPG | 7 | materi | Aqidah dasar |
| Faqih | Kefahaman Agama GBMTPG | 15 | materi | Kefahaman agama dasar |
| Faqih | Praktek Ibadah GBMTPG | 9 | materi | Praktek ibadah dasar |
| Faqih | 4 Tali Keimanan | 100 | nilai | Pemahaman 4 Tali Keimanan |
| Akhlaq | 6 Thobiat Luhur | 100 | nilai | Pemahaman 6 Thobiat |
| Akhlaq | Adab/Tatakrama | 55 | materi | Tatakrama lanjutan |
| Kemandirian | Kemandirian GBMTPG | 16 | materi | Kemandirian lanjutan |
| Kemandirian | ASAD Beladiri | 2 | jurus | Jurus 1-2 |

#### C. Caberawit Iqro 3-4

| Bidang | Kategori | Target | Satuan | Keterangan |
|--------|----------|--------|--------|------------|
| Alim | Iqro/Tilawaty | 195 | halaman | Iqro Jilid 1-6 |
| Alim | Hafalan Surat | 18 | surat | 18 surat pendek |
| Alim | Hafalan Doa GBMTPG | 8 | doa | Doa harian |
| Alim | Hafalan Doa Generus Sorong | 30 | doa | Doa Generus lengkap |
| Alim | Keilmuan GBMTPG | 15 | materi | Aqidah menengah |
| Faqih | Kefahaman Agama GBMTPG | 20 | materi | Kefahaman agama menengah |
| Faqih | Praktek Ibadah GBMTPG | 14 | materi | Praktek ibadah menengah |
| Faqih | 4 Tali Keimanan | 100 | nilai | Pendalaman 4 Tali Keimanan |
| Akhlaq | 6 Thobiat Luhur | 100 | nilai | Pendalaman 6 Thobiat |
| Akhlaq | Adab/Tatakrama | 108 | materi | Tatakrama lengkap |
| Kemandirian | Kemandirian GBMTPG | 17 | materi | Kemandirian menengah |
| Kemandirian | ASAD Beladiri | 4 | jurus | Jurus 1-4 |

#### D. Caberawit Quran

| Bidang | Kategori | Target | Satuan | Keterangan |
|--------|----------|--------|--------|------------|
| Alim | Makna Quran | 20 | halaman | Juz 30 |
| Alim | Makna Hadits | 9 | kitab | 9 Kitab Hadits |
| Alim | Hafalan Surat | 30 | surat | Juz Amma |
| Alim | Hafalan Doa GBMTPG | 8 | doa | Doa harian |
| Alim | Hafalan Doa Generus Sorong | 36 | doa | Doa Generus lengkap |
| Alim | Hafalan Dalil GBMTPG | 9 | dalil | Dalil dasar |
| Alim | Hafalan Dalil Generus Sorong | 34 | dalil | Dalil lengkap |
| Alim | Keilmuan GBMTPG | 15 | materi | Aqidah lengkap |
| Alim | Tajwid | 30 | materi | Tajwid lengkap |
| Alim | Kualitas Bacaan | 1 | nilai | Kualitas bacaan Quran |
| Alim | Praktek Pegon | 1 | nilai | Tulisan pegon |
| Faqih | Kefahaman Agama GBMTPG | 25 | materi | Kefahaman agama lanjut |
| Faqih | Praktek Ibadah GBMTPG | 16 | materi | Praktek ibadah lanjut |
| Faqih | 4 Tali Keimanan | 100 | nilai | Penguasaan 4 Tali Keimanan |
| Akhlaq | 6 Thobiat Luhur | 100 | nilai | Penguasaan 6 Thobiat |
| Akhlaq | Adab/Tatakrama | 110 | materi | Tatakrama lengkap |
| Kemandirian | Kemandirian GBMTPG | 21 | materi | Kemandirian lanjut |
| Kemandirian | ASAD Beladiri | 7 | jurus | Jurus 1-7 |

#### E. Pra Remaja

| Bidang | Kategori | Target | Satuan | Keterangan |
|--------|----------|--------|--------|------------|
| Alim | Makna Quran | 10 | juz | Juz 21-30 |
| Alim | Makna Hadits | 21 | kitab | 21 Kitab Hadits |
| Alim | Hafalan Surat | 45 | surat | 45 surat |
| Alim | Hafalan Doa Generus Sorong | 39 | doa | Doa Generus lengkap |
| Alim | Hafalan Dalil Generus Sorong | 34 | dalil | Dalil lengkap |
| Alim | Keilmuan GBMTPG | 15 | materi | Keilmuan lengkap |
| Alim | Tajwid | 30 | materi | Tajwid lengkap |
| Alim | Tadarus Al-Quran | 30 | juz | Khatam Quran |
| Faqih | Kefahaman Agama GBMTPG | 35 | materi | Kefahaman agama lengkap |
| Faqih | Praktek Ibadah GBMTPG | 20 | materi | Praktek ibadah lengkap |
| Faqih | Nasehat Bernomor BPI | 95 | nasehat | 95 Nasehat BPI |
| Faqih | 4 Tali Keimanan | 100 | nilai | Penguasaan 4 Tali Keimanan |
| Akhlaq | 6 Thobiat Luhur | 100 | nilai | Penguasaan 6 Thobiat |
| Akhlaq | Adab/Tatakrama | 120 | materi | Tatakrama lengkap |
| Kemandirian | Kemandirian GBMTPG | 25 | materi | Kemandirian lengkap |
| Kemandirian | ASAD Beladiri | 7 | jurus | Jurus 1-7 |

#### F. Remaja

| Bidang | Kategori | Target | Satuan | Keterangan |
|--------|----------|--------|--------|------------|
| Alim | Makna Quran | 20 | juz | Juz 11-30 |
| Alim | Makna Hadits | 27 | kitab | 27 Kitab Hadits |
| Alim | Hafalan Surat | 45 | surat | 45 surat |
| Alim | Hafalan Doa Generus Sorong | 39 | doa | Doa Generus lengkap |
| Alim | Hafalan Dalil Generus Sorong | 34 | dalil | Dalil lengkap |
| Alim | Keilmuan GBMTPG | 15 | materi | Keilmuan lengkap |
| Alim | Tajwid | 30 | materi | Tajwid lengkap |
| Alim | Tadarus Al-Quran | 30 | juz | Khatam Quran |
| Faqih | Kefahaman Agama GBMTPG | 35 | materi | Kefahaman agama lengkap |
| Faqih | Praktek Ibadah GBMTPG | 20 | materi | Praktek ibadah lengkap |
| Faqih | Praktek Perawatan Jenazah | 1 | nilai | Perawatan jenazah |
| Faqih | Nasehat Bernomor BPI | 95 | nasehat | 95 Nasehat BPI |
| Faqih | 4 Tali Keimanan | 100 | nilai | Penguasaan 4 Tali Keimanan |
| Akhlaq | 6 Thobiat Luhur | 100 | nilai | Penguasaan 6 Thobiat |
| Akhlaq | Adab/Tatakrama | 120 | materi | Tatakrama lengkap |
| Kemandirian | Kemandirian GBMTPG | 25 | materi | Kemandirian lengkap |
| Kemandirian | ASAD Beladiri | 7 | jurus | Jurus 1-7 |

#### G. Pra Nikah

| Bidang | Kategori | Target | Satuan | Keterangan |
|--------|----------|--------|--------|------------|
| Alim | Makna Quran | 30 | juz | Juz 1-30 lengkap |
| Alim | Makna Hadits | 30 | kitab | 30 Kitab Hadits |
| Alim | Hafalan Surat | 45 | surat | 45 surat |
| Alim | Hafalan Doa Generus Sorong | 39 | doa | Doa Generus lengkap |
| Alim | Hafalan Dalil Generus Sorong | 34 | dalil | Dalil lengkap |
| Alim | Keilmuan GBMTPG | 15 | materi | Keilmuan lengkap |
| Alim | Tajwid | 30 | materi | Tajwid lengkap |
| Alim | Tadarus Al-Quran | 30 | juz | Khatam Quran |
| Faqih | Kefahaman Agama GBMTPG | 35 | materi | Kefahaman agama lengkap |
| Faqih | Praktek Ibadah GBMTPG | 20 | materi | Praktek ibadah lengkap |
| Faqih | Praktek Perawatan Jenazah | 1 | nilai | Perawatan jenazah |
| Faqih | Nasehat Bernomor BPI | 95 | nasehat | 95 Nasehat BPI |
| Faqih | 4 Tali Keimanan | 100 | nilai | Penguasaan 4 Tali Keimanan |
| Akhlaq | 6 Thobiat Luhur | 100 | nilai | Penguasaan 6 Thobiat |
| Akhlaq | Adab/Tatakrama | 120 | materi | Tatakrama lengkap |
| Kemandirian | Kemandirian GBMTPG | 25 | materi | Kemandirian lengkap |
| Kemandirian | ASAD Beladiri | 7 | jurus | Jurus 1-7 |

### 11.8 Penilaian Akhlaq Bulanan

Setiap bulan, generus dinilai berdasarkan 5 aspek akhlaq dengan skala 1-4:

| No | Aspek | Deskripsi | Skala |
|----|-------|-----------|-------|
| 1 | Kedisiplinan | Ketepatan waktu, mengikuti aturan | 1-4 |
| 2 | Adab | Sopan santun, tata krama | 1-4 |
| 3 | Akhlaq Sesama | Hubungan dengan teman sebaya | 1-4 |
| 4 | Kemandirian | Kemampuan mandiri, tidak bergantung | 1-4 |
| 5 | Kebersihan | Kebersihan diri dan lingkungan | 1-4 |

**Predikat Penilaian Akhlaq:**

| Predikat | Rentang Rata-rata | Keterangan |
|----------|-------------------|------------|
| A | >= 3.5 | Sangat Baik |
| B | >= 2.5 | Baik |
| C | >= 1.5 | Cukup |
| D | < 1.5 | Perlu Bimbingan |

**Rumus Nilai:**
```
Rata-rata = (Kedisiplinan + Adab + Akhlaq_Sesama + Kemandirian + Kebersihan) / 5
```

### 11.9 Konsep 4 Tali Keimanan & 6 Thobiat Luhur

#### 4 Tali Keimanan:
1. Iman kepada Allah
2. Iman kepada Malaikat
3. Iman kepada Kitab
4. Iman kepada Rasul

#### 6 Thobiat Luhur:
1. Kejujuran (Shiddiq)
2. Amanah (Trustworthy)
3. Tabligh (Menyampaikan)
4. Fathonah (Cerdas)
5. Sabar (Patience)
6. Syukur (Gratitude)

### 11.10 Sumber Materi

| Kode | Sumber | Keterangan |
|------|--------|------------|
| GBMTPG | Gerakan Bimbingan Murid TPA/TQ | Standar nasional |
| Panduan | Panduan Lokal Sorong | Pengembangan lokal |

---

## 12. SKEMA DATABASE KURIKULUM

### 12.1 Tabel Kurikulum

```sql
-- Tabel Bidang Materi
CREATE TABLE bidang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode TEXT UNIQUE,
    nama TEXT NOT NULL,
    deskripsi TEXT,
    urutan INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Kategori Materi
CREATE TABLE kategori_materi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bidang_id INTEGER REFERENCES bidang(id),
    kode TEXT UNIQUE,
    nama TEXT NOT NULL,
    pilar_trisukses TEXT CHECK(pilar_trisukses IN ('alim_faqih', 'akhlaq', 'kemandirian')),
    teknik_penilaian TEXT CHECK(teknik_penilaian IN ('hafalan', 'level', 'checklist', 'status')),
    urutan INTEGER DEFAULT 1,
    is_aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Materi Item
CREATE TABLE materi_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategori_id INTEGER REFERENCES kategori_materi(id),
    kode TEXT,
    nama TEXT NOT NULL,
    nomor INTEGER,
    tipe TEXT,
    detail JSON,
    is_hafalan BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Target per Jenjang
CREATE TABLE target_jenjang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jenjang_id INTEGER REFERENCES jenjang(id),
    kategori_id INTEGER REFERENCES kategori_materi(id),
    target_jumlah INTEGER,
    satuan TEXT,
    keterangan TEXT,
    jenis TEXT CHECK(jenis IN ('Obj', 'Subj')),
    rumus TEXT,
    max_nilai INTEGER DEFAULT 100,
    sumber TEXT,
    UNIQUE(jenjang_id, kategori_id)
);

-- Tabel Progress Jamaah
CREATE TABLE progress_jamaah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jamaah_id INTEGER REFERENCES generus(id),
    materi_item_id INTEGER REFERENCES materi_item(id),
    tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
    status TEXT DEFAULT 'belum',
    nilai INTEGER,
    tanggal DATE,
    penilai_id INTEGER REFERENCES users(id),
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jamaah_id, materi_item_id, tahun_ajaran_id)
);

-- Tabel Penilaian Akhlaq
CREATE TABLE penilaian_akhlaq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jamaah_id INTEGER REFERENCES generus(id),
    periode_bulan INTEGER NOT NULL,
    periode_tahun INTEGER NOT NULL,
    kedisiplinan INTEGER CHECK(kedisiplinan BETWEEN 1 AND 4),
    adab INTEGER CHECK(adab BETWEEN 1 AND 4),
    akhlaq_sesama INTEGER CHECK(akhlaq_sesama BETWEEN 1 AND 4),
    kemandirian INTEGER CHECK(kemandirian BETWEEN 1 AND 4),
    kebersihan INTEGER CHECK(kebersihan BETWEEN 1 AND 4),
    predikat TEXT CHECK(predikat IN ('A', 'B', 'C', 'D')),
    catatan TEXT,
    penilai_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jamaah_id, periode_bulan, periode_tahun)
);
```

### 12.2 Contoh Data Materi

```python
# Data Hafalan Surat (sample)
HAFALAN_SURAT = [
    {'nomor': 1, 'nama': 'Al-Fatihah', 'tipe': 'wajib', 'detail': {'jumlah_ayat': 7, 'tempat_turun': 'Makkah'}},
    {'nomor': 114, 'nama': 'An-Nas', 'tipe': 'wajib', 'detail': {'jumlah_ayat': 6, 'tempat_turun': 'Madinah'}},
    {'nomor': 113, 'nama': 'Al-Falaq', 'tipe': 'wajib', 'detail': {'jumlah_ayat': 5, 'tempat_turun': 'Madinah'}},
    {'nomor': 112, 'nama': 'Al-Ikhlas', 'tipe': 'wajib', 'detail': {'jumlah_ayat': 4, 'tempat_turun': 'Makkah'}},
    # ... dst sampai 45 surat
]

# Data Hafalan Doa (sample)
HAFALAN_DOA = [
    {'nomor': 1, 'nama': 'Doa Sebelum Makan', 'kategori': 'harian'},
    {'nomor': 2, 'nama': 'Doa Sesudah Makan', 'kategori': 'harian'},
    {'nomor': 3, 'nama': 'Doa Masuk Masjid', 'kategori': 'ibadah'},
    {'nomor': 4, 'nama': 'Doa Keluar Masjid', 'kategori': 'ibadah'},
    # ... dst
]

# Data Hafalan Dalil (sample)
HAFALAN_DALIL = [
    {'nomor': 1, 'nama': 'Dalil Sholat', 'kategori': 'ibadah'},
    {'nomor': 2, 'nama': 'Dalil Puasa', 'kategori': 'ibadah'},
    {'nomor': 3, 'nama': 'Dalil Zakat', 'kategori': 'muamalah'},
    # ... dst
]
```

---

*Dokumen ini dibuat sebagai panduan lengkap untuk pengembangan ulang sistem PPG Sorong menggunakan Python.*

**Versi:** 1.1 (dengan tambahan Rekap Materi Kurikulum)
**Tanggal:** Januari 2026
**Penulis:** Claude AI Assistant
