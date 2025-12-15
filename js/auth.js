// ============================================================================
// AUTHENTICATION HANDLER - PPG SORONG
// ============================================================================

// State
let currentUser = null;
let currentUserData = null;
let userRoles = [];
let isTestMode = false;
let testActiveRole = null;

// ============================================================================
// TEST MODE FUNCTIONS
// ============================================================================

function checkTestMode() {
    isTestMode = localStorage.getItem('ppg_test_mode') === 'true';
    if (isTestMode) {
        const testUser = localStorage.getItem('ppg_test_user');
        testActiveRole = localStorage.getItem('ppg_test_role');
        if (testUser) {
            currentUserData = JSON.parse(testUser);
        }
    }
    return isTestMode;
}

async function loadTestModeData() {
    if (!isTestMode || !currentUserData) return;
    
    console.log('Loading test mode data for user:', currentUserData.id);
    
    // Get user roles
    const { data: rolesData, error: rolesError } = await db
        .from('user_role')
        .select(`
            *,
            role:role_id(kode, nama, level),
            wilayah:wilayah_id(kode, nama, tingkat)
        `)
        .eq('user_id', currentUserData.id)
        .eq('is_aktif', true);
    
    console.log('User roles result:', { rolesData, rolesError });
    
    if (!rolesError) {
        userRoles = rolesData || [];
    } else {
        console.error('Error loading user roles:', rolesError);
    }
}

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

// Login dengan email dan password
async function login(email, password) {
    try {
        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Clear test mode
        localStorage.removeItem('ppg_test_mode');
        localStorage.removeItem('ppg_test_user');
        localStorage.removeItem('ppg_test_role');
        isTestMode = false;
        
        currentUser = data.user;
        await loadUserData();
        
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Register user baru
async function register(email, password, nama) {
    try {
        const { data, error } = await db.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nama: nama
                }
            }
        });
        
        if (error) throw error;
        
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: error.message };
    }
}

// Logout
async function logout() {
    try {
        // Clear test mode
        localStorage.removeItem('ppg_test_mode');
        localStorage.removeItem('ppg_test_user');
        localStorage.removeItem('ppg_test_role');
        isTestMode = false;
        testActiveRole = null;
        
        await db.auth.signOut();
        currentUser = null;
        currentUserData = null;
        userRoles = [];
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

// Cek session aktif
async function checkSession() {
    try {
        // Check test mode first
        if (checkTestMode()) {
            await loadTestModeData();
            return true;
        }
        
        const { data: { session } } = await db.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            await loadUserData();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Session check error:', error);
        return false;
    }
}

// Load user data dari tabel users
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // Get user data
        const { data: userData, error: userError } = await db
            .from('users')
            .select('*')
            .eq('auth_id', currentUser.id)
            .single();
        
        if (userError) throw userError;
        currentUserData = userData;
        
        // Get user roles
        const { data: rolesData, error: rolesError } = await db
            .from('user_role')
            .select(`
                *,
                role:role_id(kode, nama, level),
                wilayah:wilayah_id(kode, nama, tingkat)
            `)
            .eq('user_id', userData.id)
            .eq('is_aktif', true);
        
        if (rolesError) throw rolesError;
        userRoles = rolesData || [];
        
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

// Cek apakah user punya role tertentu
function hasRole(roleKode) {
    return userRoles.some(ur => ur.role?.kode?.toLowerCase() === roleKode.toLowerCase());
}

// Cek apakah admin
function isAdmin() {
    return userRoles.some(ur => ur.role?.kode?.toLowerCase() === 'admin');
}

// Cek apakah mubaligh/pengajar
function isMubaligh() {
    const mubalighRoles = ['mubaligh', 'mubaligh_daerah', 'mubaligh_desa', 'imam_kelompok', 'wakil_kelompok', 'pakar_pendidik'];
    return userRoles.some(ur => mubalighRoles.includes(ur.role?.kode?.toLowerCase()));
}

// Cek apakah orang tua
function isOrangTua() {
    return hasRole('orang_tua');
}

// Get wilayah IDs yang bisa diakses user
function getUserWilayahIds() {
    return userRoles
        .filter(ur => ur.wilayah_id)
        .map(ur => ur.wilayah_id);
}

// Get active role in test mode
function getActiveTestRole() {
    return testActiveRole;
}

// ============================================================================
// AUTH GUARD - Proteksi halaman
// ============================================================================

async function requireAuth() {
    const isLoggedIn = await checkSession();
    
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Auth guard untuk halaman admin only
async function requireAdmin() {
    const isLoggedIn = await requireAuth();
    if (!isLoggedIn) return false;
    
    if (!isAdmin()) {
        showToast('Akses ditolak. Halaman ini hanya untuk Admin.', 'error');
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

// ============================================================================
// AUTH STATE LISTENER
// ============================================================================

db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        loadUserData();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentUserData = null;
        userRoles = [];
    }
});
