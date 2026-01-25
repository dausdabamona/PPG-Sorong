# 🕌 PPG Sorong - Pembinaan Generasi Penerus

Sistem Manajemen Pengajian dan Pembinaan Generasi Penerus Sorong berbasis Progressive Web App (PWA).

## 📋 Fitur

- ✅ **Manajemen Data Generus/Jamaah** - CRUD data jamaah dengan fase kehidupan
- ✅ **Sistem Presensi** - Presensi pengajian dengan tracking kehadiran
- ✅ **Penilaian Hafalan** - Input dan tracking progress hafalan
- ✅ **Rapor & Laporan** - Generate rapor dan laporan bulanan
- ✅ **Manajemen Wilayah** - Struktur Daerah → Desa → Kelompok
- ✅ **Role-Based Access Control** - Multi-role dengan permission
- ✅ **PWA Support** - Offline-capable, installable
- ✅ **Mobile-First Design** - Optimized untuk penggunaan mobile

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- [Supabase Account](https://supabase.com) (untuk backend)
- Text editor (VS Code recommended)
- Optional: Live Server extension untuk VS Code

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/dausdabamona/PPG-Sorong.git
   cd PPG-Sorong
   ```

2. **Setup Environment Configuration**
   
   **Opsi A: Local Development**
   ```bash
   # Copy example config
   cp config-local.example.js config-local.js
   
   # Edit config-local.js dan isi dengan Supabase credentials Anda
   ```
   
   **Opsi B: Deployment (GitHub Pages/Netlify)**
   - Set environment variables di platform deployment Anda
   - Atau buat file `env-config.js` yang di-generate saat build

3. **Update HTML files**
   
   Tambahkan script loader di setiap HTML file SEBELUM `config.js`:
   ```html
   <!-- Load environment (if exists) -->
   <script src="config-local.js"></script>
   <script src="js/env-loader.js"></script>
   
   <!-- Supabase JS -->
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/config.js"></script>
   ```

4. **Run Locally**
   
   **Opsi A: VS Code Live Server**
   - Install extension "Live Server"
   - Right-click `index.html` → "Open with Live Server"
   
   **Opsi B: Python HTTP Server**
   ```bash
   python -m http.server 8000
   # Buka http://localhost:8000
   ```
   
   **Opsi C: Node.js HTTP Server**
   ```bash
   npx http-server -p 8000
   ```

5. **Login**
   - Buka aplikasi di browser
   - Gunakan credentials Supabase Anda
   - Atau register user baru via `register.html`

## 🗄️ Database Setup

### Supabase Configuration

1. **Create Project** di [Supabase](https://supabase.com)

2. **Get Credentials**
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → Project API keys → anon public

3. **Setup Database Schema**
   
   Aplikasi ini menggunakan schema dengan tabel utama:
   - `jamaah` - Data jamaah/generus
   - `pengajian` - Data pengajian
   - `presensi` - Presensi pengajian
   - `enrollment` - Enrollment jamaah ke jenjang
   - `fase_kehidupan` - Fase kehidupan jamaah
   - `wilayah` - Struktur wilayah (daerah/desa/kelompok)
   - `kurikulum` - Kurikulum hafalan
   - `user_role` - Role dan permission
   
   Schema SQL bisa ditemukan di folder `database/` (akan dibuat di PR berikutnya)

4. **Setup Row Level Security (RLS)**
   - Enable RLS untuk semua tabel
   - Konfigurasi policies sesuai role

## 📱 PWA Installation

Aplikasi ini bisa di-install sebagai PWA:

1. Buka aplikasi di browser mobile
2. Chrome: Menu → "Add to Home Screen"
3. Safari: Share → "Add to Home Screen"
4. Aplikasi akan berjalan seperti native app

## 🏗️ Struktur Project

```
PPG-Sorong/
├── index.html              # Login page
├── dashboard.html          # Dashboard utama
├── generus.html           # Manajemen data generus
├── pengajian.html         # Manajemen pengajian
├── presensi.html          # Input presensi
├── penilaian-hafalan.html # Input penilaian
├── rapor.html             # Generate rapor
├── css/
│   ├── style.css          # Main styles
│   └── pwa-mobile.css     # Mobile-specific styles
├── js/
│   ├── config.js          # Supabase configuration
│   ├── env-loader.js      # Environment loader
│   ├── auth.js            # Authentication
│   ├── api.js             # Database API layer
│   ├── utils.js           # Utility functions
│   ├── sidebar.js         # Sidebar component
│   └── mobile-menu.js     # Mobile menu component
├── images/                # PWA icons
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker
└── README.md             # Documentation
```

## 🔒 Security Notes

**PENTING:** Jangan commit file berikut ke repository:
- `config-local.js` - Local configuration dengan credentials
- `.env` - Environment variables
- Credentials atau API keys apapun

File-file tersebut sudah ada di `.gitignore`

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

[Sesuaikan dengan license Anda]

## 👥 Authors

- [@dausdabamona](https://github.com/dausdabamona)

## 🙏 Acknowledgments

- Supabase untuk backend
- Inter font dari Google Fonts
- Icons dari emoji native

## 📞 Support

Jika ada pertanyaan atau issue, silakan buat [GitHub Issue](https://github.com/dausdabamona/PPG-Sorong/issues)

---

**Built with ❤️ for Pembinaan Generasi Penerus Sorong**
