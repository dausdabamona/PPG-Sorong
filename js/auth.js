// ============================================================================
// AUTHENTICATION HANDLER - PPG SORONG (FIXED VERSION)
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
// SESSION REFRESH HANDLER (NEW)
// ============================================================================

// Auto refresh session sebelum expired
async function setupSessionRefresh() {
    // Refresh session setiap 10 menit
    setInterval(async () => {
        try {
            const { data: { session }, error } = await db.auth.getSession();
            if (session && !error) {
                // Session masih valid, cek apakah perlu refresh
                const expiresAt = session.expires_at * 1000; // convert to ms
                const now = Date.now();
                const timeUntilExpiry = expiresAt - now;
                
                // Refresh jika kurang dari 5 menit
                if (timeUntilExpiry < 5 * 60 * 1000) {
                    console.log('Session akan expire, refreshing...');
                    await refreshSession();
                }
            }
        } catch (e) {
            console.error('Error checking session:', e);
        }
    }, 10 * 60 * 1000); // Check setiap 10 menit
}

// Refresh session token
async function refreshSession() {
    try {
        const { data, error } = await db.auth.refreshSession();
        if (error) {
            console.error('Failed to refresh session:', error);
            // Jika refresh gagal, redirect ke login
            if (error.message.includes('JWT') || error.message.includes('expired')) {
                clearAuthData();
                window.location.href = 'index.html';
            }
            return false;
        }
        console.log('Session refreshed successfully');
        return true;
    } catch (e) {
        console.error('Error refreshing session:', e);
        return false;
    }
}

// Clear semua auth data
function clearAuthData() {
    // Clear test mode
    localStorage.removeItem('ppg_test_mode');
    localStorage.removeItem('ppg_test_user');
    localStorage.removeItem('ppg_test_role');
    
    // Clear Supabase tokens (pattern: sb-[project-ref]-auth-token)
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('sb-') && key.includes('-auth-token')) {
            localStorage.removeItem(key);
        }
    });
    
    // Clear state
    currentUser = null;
    currentUserData = null;
    userRoles = [];
    isTestMode = false;
    testActiveRole = null;
}

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

// Login dengan email dan password
async function login(email, password) {
    try {
        // Clear any stale tokens first
        clearAuthData();
        
        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await loadUserData();
        
        // Setup auto refresh
        setupSessionRefresh();
        
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
        await db.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        clearAuthData();
        window.location.href = 'index.html';
    }
}

// Cek session aktif (IMPROVED)
async function checkSession() {
    try {
        // Check test mode first
        if (checkTestMode()) {
            await loadTestModeData();
            return true;
        }
        
        const { data: { session }, error } = await db.auth.getSession();
        
        // Handle JWT errors
        if (error) {
            console.error('Session error:', error);
            if (error.message.includes('JWT') || error.message.includes('expired') || error.message.includes('invalid')) {
                console.log('JWT error detected, attempting refresh...');
                
                // Try to refresh
                const refreshResult = await refreshSession();
                if (!refreshResult) {
                    clearAuthData();
                    return false;
                }
                
                // Get session again after refresh
                const { data: { session: newSession } } = await db.auth.getSession();
                if (newSession) {
                    currentUser = newSession.user;
                    await loadUserData();
                    setupSessionRefresh();
                    return true;
                }
            }
            return false;
        }
        
        if (session) {
            currentUser = session.user;
            await loadUserData();
            
            // Setup auto refresh for existing session
            setupSessionRefresh();
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('Session check error:', error);
        
        // Jika error adalah JWT related, clear dan redirect
        if (error.message && (error.message.includes('JWT') || error.message.includes('expired'))) {
            clearAuthData();
        }
        
        return false;
    }
}

// Load user data dari tabel users (IMPROVED with retry)
async function loadUserData(retryCount = 0) {
    if (!currentUser) return;
    
    try {
        // Get user data
        const { data: userData, error: userError } = await db
            .from('users')
            .select('*')
            .eq('auth_id', currentUser.id)
            .single();
        
        if (userError) {
            // Jika JWT error, coba refresh
            if (userError.message && userError.message.includes('JWT') && retryCount < 2) {
                console.log('JWT error in loadUserData, refreshing session...');
                await refreshSession();
                return loadUserData(retryCount + 1);
            }
            throw userError;
        }
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
        
        if (rolesError) {
            // Jika JWT error, coba refresh
            if (rolesError.message && rolesError.message.includes('JWT') && retryCount < 2) {
                console.log('JWT error in loadUserData roles, refreshing session...');
                await refreshSession();
                return loadUserData(retryCount + 1);
            }
            throw rolesError;
        }
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

// Cek apakah operator (admin atau operator)
function isOperator() {
    return userRoles.some(ur => 
        ur.role?.kode?.toLowerCase() === 'operator' || 
        ur.role?.kode?.toLowerCase() === 'admin'
    );
}

// Cek apakah mubaligh/pengajar (semua yang bisa mengajar)
function isMubaligh() {
    const mubalighRoles = [
        // Daerah
        'ki_daerah',
        'wakil_ki_daerah',
        'mubaligh_daerah',
        'pakar_pendidik',
        // Desa
        'ki_desa',
        'wakil_ki_desa',
        'mubaligh_desa',
        // Kelompok
        'ki_kelompok',
        'pjp',
        'asisten_mubaligh'
    ];
    return userRoles.some(ur => mubalighRoles.includes(ur.role?.kode?.toLowerCase()));
}

// Cek apakah pimpinan (KI atau Wakil KI)
function isPimpinan() {
    const pimpinanRoles = [
        'ki_daerah', 'wakil_ki_daerah',
        'ki_desa', 'wakil_ki_desa',
        'ki_kelompok'
    ];
    return userRoles.some(ur => pimpinanRoles.includes(ur.role?.kode?.toLowerCase()));
}

// Cek apakah punya akses level tertentu (daerah/desa/kelompok)
function hasLevel(level) {
    return userRoles.some(ur => ur.role?.level?.toLowerCase() === level.toLowerCase());
}

// Cek apakah pengurus/admin desa
function isPengurusDesa() {
    return userRoles.some(ur => 
        ur.role?.kode?.toLowerCase() === 'pengurus_desa' || 
        ur.role?.kode?.toLowerCase() === 'operator'
    );
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

// Get user roles dengan detail wilayah
function getUserRolesWithWilayah() {
    return userRoles.map(ur => ({
        role_kode: ur.role?.kode,
        role_nama: ur.role?.nama,
        role_level: ur.role?.level,
        wilayah_id: ur.wilayah_id,
        wilayah_nama: ur.wilayah?.nama,
        wilayah_tingkat: ur.wilayah?.tingkat
    }));
}

// Get tingkat akses tertinggi user (daerah > desa > kelompok)
function getUserAccessLevel() {
    var levels = ['daerah', 'desa', 'kelompok'];
    for (var i = 0; i < levels.length; i++) {
        if (userRoles.some(ur => ur.wilayah?.tingkat === levels[i])) {
            return levels[i];
        }
    }
    return 'kelompok'; // default paling rendah
}

// Cek apakah user punya akses ke wilayah tertentu
// Admin/Operator bisa akses semua
// Daerah bisa akses semua desa dan kelompok di bawahnya
// Desa bisa akses semua kelompok di bawahnya
// Kelompok hanya bisa akses kelompoknya sendiri
async function canAccessWilayah(wilayahId, db) {
    // Admin dan operator bisa akses semua
    if (isAdmin() || isOperator()) return true;
    
    var userWilayahIds = getUserWilayahIds();
    
    // Cek langsung
    if (userWilayahIds.includes(wilayahId)) return true;
    
    // Cek hirarki - ambil wilayah dan cek parent
    try {
        var { data: wilayah } = await db.from('wilayah').select('id, parent_id, tingkat').eq('id', wilayahId).single();
        if (!wilayah) return false;
        
        // Cek apakah parent ada di userWilayahIds
        if (wilayah.parent_id && userWilayahIds.includes(wilayah.parent_id)) return true;
        
        // Cek grandparent (untuk kelompok -> desa -> daerah)
        if (wilayah.parent_id) {
            var { data: parent } = await db.from('wilayah').select('id, parent_id').eq('id', wilayah.parent_id).single();
            if (parent && parent.parent_id && userWilayahIds.includes(parent.parent_id)) return true;
        }
    } catch (e) {
        console.error('Error checking wilayah access:', e);
    }
    
    return false;
}

// Get filter wilayah untuk query berdasarkan role user
// Mengembalikan array wilayah_id yang bisa diakses
async function getAccessibleWilayahIds(db, tingkat) {
    // Admin dan operator bisa akses semua
    if (isAdmin() || isOperator()) return null; // null = semua
    
    var userWilayahIds = getUserWilayahIds();
    if (!userWilayahIds.length) return []; // tidak ada akses
    
    var accessibleIds = [];
    
    for (var i = 0; i < userWilayahIds.length; i++) {
        var wid = userWilayahIds[i];
        
        // Ambil info wilayah user
        var { data: userWilayah } = await db.from('wilayah').select('id, tingkat').eq('id', wid).single();
        if (!userWilayah) continue;
        
        if (tingkat === 'kelompok') {
            if (userWilayah.tingkat === 'kelompok') {
                // User level kelompok - hanya kelompoknya
                accessibleIds.push(wid);
            } else if (userWilayah.tingkat === 'desa') {
                // User level desa - semua kelompok di desa
                var { data: kelompoks } = await db.from('wilayah').select('id').eq('parent_id', wid).eq('tingkat', 'kelompok');
                if (kelompoks) accessibleIds = accessibleIds.concat(kelompoks.map(k => k.id));
            } else if (userWilayah.tingkat === 'daerah') {
                // User level daerah - semua kelompok di semua desa
                var { data: desas } = await db.from('wilayah').select('id').eq('parent_id', wid).eq('tingkat', 'desa');
                if (desas) {
                    for (var j = 0; j < desas.length; j++) {
                        var { data: kelompoks } = await db.from('wilayah').select('id').eq('parent_id', desas[j].id).eq('tingkat', 'kelompok');
                        if (kelompoks) accessibleIds = accessibleIds.concat(kelompoks.map(k => k.id));
                    }
                }
            }
        } else if (tingkat === 'desa') {
            if (userWilayah.tingkat === 'desa') {
                accessibleIds.push(wid);
            } else if (userWilayah.tingkat === 'daerah') {
                var { data: desas } = await db.from('wilayah').select('id').eq('parent_id', wid).eq('tingkat', 'desa');
                if (desas) accessibleIds = accessibleIds.concat(desas.map(d => d.id));
            }
        }
    }
    
    return [...new Set(accessibleIds)]; // unique
}

// Get active role in test mode
function getActiveTestRole() {
    return testActiveRole;
}

// ============================================================================
// AUTH GUARD - Proteksi halaman (IMPROVED)
// ============================================================================

async function requireAuth() {
    try {
        const isLoggedIn = await checkSession();
        
        if (!isLoggedIn) {
            clearAuthData();
            window.location.href = 'index.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('requireAuth error:', error);
        clearAuthData();
        window.location.href = 'index.html';
        return false;
    }
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
// AUTH STATE LISTENER (IMPROVED)
// ============================================================================

db.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        loadUserData();
        setupSessionRefresh();
    } else if (event === 'SIGNED_OUT') {
        clearAuthData();
    } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed automatically');
        currentUser = session.user;
    } else if (event === 'USER_UPDATED') {
        currentUser = session.user;
        loadUserData();
    }
});

// ============================================================================
// UTILITY: Force clear and re-login (untuk debugging)
// ============================================================================

function forceRelogin() {
    clearAuthData();
    window.location.href = 'index.html';
}

// ============================================================================
// COMPATIBILITY: checkAuth function (alias untuk checkSession)
// ============================================================================

async function checkAuth() {
    try {
        // Check test mode first
        if (checkTestMode()) {
            await loadTestModeData();
            // Return user-like object for test mode
            if (currentUserData) {
                return {
                    id: currentUserData.auth_id || currentUserData.id,
                    email: currentUserData.email,
                    user_metadata: {
                        nama: currentUserData.nama,
                        role: userRoles.length > 0 ? userRoles[0].role?.nama : 'user'
                    }
                };
            }
        }
        
        const { data: { session }, error } = await db.auth.getSession();
        
        if (error) {
            console.error('checkAuth error:', error);
            // Try refresh if JWT error
            if (error.message && (error.message.includes('JWT') || error.message.includes('expired'))) {
                const refreshed = await refreshSession();
                if (refreshed) {
                    const { data: { session: newSession } } = await db.auth.getSession();
                    if (newSession) {
                        currentUser = newSession.user;
                        await loadUserData();
                        return newSession.user;
                    }
                }
            }
            return null;
        }
        
        if (session && session.user) {
            currentUser = session.user;
            await loadUserData();
            
            // Enhance user object with role info
            var user = session.user;
            if (currentUserData) {
                user.user_metadata = user.user_metadata || {};
                user.user_metadata.nama = currentUserData.nama || user.user_metadata.nama;
                if (userRoles.length > 0) {
                    user.user_metadata.role = userRoles[0].role?.nama || 'user';
                }
            }
            
            return user;
        }
        
        return null;
    } catch (error) {
        console.error('checkAuth exception:', error);
        return null;
    }
}

// Expose untuk debugging
window.forceRelogin = forceRelogin;
window.clearAuthData = clearAuthData;
window.refreshSession = refreshSession;
window.checkAuth = checkAuth;
