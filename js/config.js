// ============================================================================
// KONFIGURASI SUPABASE - PPG SORONG
// ============================================================================

// Load dari environment variables atau window config
const SUPABASE_URL = window.ENV?.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Validasi konfigurasi
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    console.error('⚠️ SUPABASE CONFIGURATION MISSING!');
    console.error('Please check your environment configuration.');
}

// Inisialisasi Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export untuk digunakan di file lain
window.db = supabaseClient;

// ============================================================================
// KONSTANTA APLIKASI
// ============================================================================

// Status Jamaah
const STATUS_JAMAAH = [
    { value: 'aktif', label: 'Aktif', color: 'success' },
    { value: 'nonaktif', label: 'Non-Aktif', color: 'secondary' },
    { value: 'pindah', label: 'Pindah', color: 'warning' },
    { value: 'meninggal', label: 'Meninggal', color: 'dark' }
];

// Status Enrollment
const STATUS_ENROLLMENT = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'nonaktif', label: 'Non-Aktif' },
    { value: 'pindah', label: 'Pindah' },
    { value: 'selesai', label: 'Selesai' }
];

// Tingkat Wilayah
const TINGKAT_WILAYAH = [
    { value: 'daerah', label: 'Daerah' },
    { value: 'desa', label: 'Desa' },
    { value: 'kelompok', label: 'Kelompok' }
];

// Fase Kehidupan
const FASE_KEHIDUPAN = [
    { value: 'paud', label: 'PAUD', usia: '0-6' },
    { value: 'caberawit', label: 'Caberawit', usia: '7-9' },
    { value: 'praremaja', label: 'Pra-Remaja', usia: '10-12' },
    { value: 'remaja', label: 'Remaja', usia: '13-16' },
    { value: 'pranikah', label: 'Pra-Nikah', usia: '17+' },
    { value: 'nikah', label: 'Menikah', usia: '-' },
    { value: 'orangtua', label: 'Orang Tua', usia: '-' },
    { value: 'lansia', label: 'Lansia', usia: '60+' }
];

// Status Presensi
const STATUS_PRESENSI = [
    { value: 'hadir', label: 'Hadir', color: 'success', icon: '✓' },
    { value: 'izin', label: 'Izin', color: 'info', icon: 'i' },
    { value: 'sakit', label: 'Sakit', color: 'warning', icon: 's' },
    { value: 'alpa', label: 'Alpa', color: 'danger', icon: 'x' }
];

// Jenis Kelamin
const JENIS_KELAMIN = [
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' }
];

// Status Progress Hafalan
const STATUS_PROGRESS = [
    { value: 'belum', label: 'Belum', color: 'secondary' },
    { value: 'sedang', label: 'Sedang', color: 'info' },
    { value: 'selesai', label: 'Selesai', color: 'success' },
    { value: 'lulus', label: 'Lulus', color: 'primary' }
];

// Jenis Pengajian
const JENIS_PENGAJIAN = [
    { value: 'forum', label: 'Forum' },
    { value: 'tambahan', label: 'Tambahan' },
    { value: 'privat', label: 'Privat' }
];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGINATION_SIZE = 10;

// ============================================================================
// ENVIRONMENT
// ============================================================================

const IS_DEVELOPMENT = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
const IS_PRODUCTION = !IS_DEVELOPMENT;

// ============================================================================
// HELPER FUNCTIONS - Get Label dari Value
// ============================================================================

function getStatusJamaahLabel(value) {
    const item = STATUS_JAMAAH.find(s => s.value === value);
    return item ? item.label : value;
}

function getStatusJamaahColor(value) {
    const item = STATUS_JAMAAH.find(s => s.value === value);
    return item ? item.color : 'secondary';
}

function getFaseLabel(value) {
    const item = FASE_KEHIDUPAN.find(f => f.value === value);
    return item ? item.label : value;
}

function getJenisKelaminLabel(value) {
    const item = JENIS_KELAMIN.find(j => j.value === value);
    return item ? item.label : value;
}

function getStatusPresensiLabel(value) {
    const item = STATUS_PRESENSI.find(s => s.value === value);
    return item ? item.label : value;
}

function getTingkatWilayahLabel(value) {
    const item = TINGKAT_WILAYAH.find(t => t.value === value);
    return item ? item.label : value;
}

// ============================================================================
// EXPORT CONSTANTS
// ============================================================================

window.STATUS_JAMAAH = STATUS_JAMAAH;
window.STATUS_ENROLLMENT = STATUS_ENROLLMENT;
window.TINGKAT_WILAYAH = TINGKAT_WILAYAH;
window.FASE_KEHIDUPAN = FASE_KEHIDUPAN;
window.STATUS_PRESENSI = STATUS_PRESENSI;
window.JENIS_KELAMIN = JENIS_KELAMIN;
window.STATUS_PROGRESS = STATUS_PROGRESS;
window.JENIS_PENGAJIAN = JENIS_PENGAJIAN;
window.DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
window.IS_DEVELOPMENT = IS_DEVELOPMENT;
window.IS_PRODUCTION = IS_PRODUCTION;

window.getStatusJamaahLabel = getStatusJamaahLabel;
window.getStatusJamaahColor = getStatusJamaahColor;
window.getFaseLabel = getFaseLabel;
window.getJenisKelaminLabel = getJenisKelaminLabel;
window.getStatusPresensiLabel = getStatusPresensiLabel;
window.getTingkatWilayahLabel = getTingkatWilayahLabel;
