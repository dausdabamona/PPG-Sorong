// ============================================================================
// AUTHENTICATION HANDLER - PPG SORONG
// ============================================================================

// State
let currentUser = null;
let currentUserData = null;
let userRoles = [];
let userPermissions = {}; // Permission dari database
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

        // Load user permissions dari database
        await loadUserPermissions();

    } catch (error) {
        console.error('Load user data error:', error);
    }
}

// Load user permissions dari database
async function loadUserPermissions() {
    if (!currentUserData) return;

    try {
        // Cek apakah tabel role_permission sudah ada
        const { data, error } = await db
            .from('role_permission')
            .select(`
                resource:resource_id(kode),
                can_view, can_create, can_edit, can_delete
            `)
            .in('role_id', userRoles.map(ur => ur.role_id));

        if (error) {
            console.log('Permission table not ready, using fallback');
            return;
        }

        // Merge permissions (OR logic untuk multiple roles)
        userPermissions = {};
        (data || []).forEach(p => {
            const kode = p.resource?.kode;
            if (!kode) return;

            if (!userPermissions[kode]) {
                userPermissions[kode] = {
                    can_view: false,
                    can_create: false,
                    can_edit: false,
                    can_delete: false
                };
            }

            // OR logic - jika salah satu role punya permission, maka user punya permission
            userPermissions[kode].can_view = userPermissions[kode].can_view || p.can_view;
            userPermissions[kode].can_create = userPermissions[kode].can_create || p.can_create;
            userPermissions[kode].can_edit = userPermissions[kode].can_edit || p.can_edit;
            userPermissions[kode].can_delete = userPermissions[kode].can_delete || p.can_delete;
        });

        console.log('User permissions loaded:', userPermissions);
    } catch (error) {
        console.log('Load permissions error (fallback to hardcoded):', error.message);
    }
}

// Cek permission dari database
function hasPermission(resourceKode, action = 'view') {
    // Admin selalu punya akses penuh
    if (isAdmin()) return true;

    const perm = userPermissions[resourceKode];
    if (!perm) {
        // Fallback ke permission hardcoded jika tidak ada di database
        return checkHardcodedPermission(resourceKode, action);
    }

    switch (action) {
        case 'view': return perm.can_view;
        case 'create': return perm.can_create;
        case 'edit': return perm.can_edit;
        case 'delete': return perm.can_delete;
        default: return false;
    }
}

// Fallback ke permission hardcoded (untuk backward compatibility)
function checkHardcodedPermission(resourceKode, action) {
    // Mapping resource ke logic lama
    const resourceMapping = {
        'dashboard': 'dashboard',
        'generus': 'jamaah',
        'pengajian': 'pengajian',
        'presensi': 'presensi',
        'progress': 'progress',
        'penilaian': 'progress',
        'rapor': 'progress',
        'laporan_bulanan': 'progress',
        'wilayah': 'wilayah',
        'kurikulum': 'kurikulum',
        'materi_hafalan': 'kurikulum',
        'jamaah': 'jamaah',
        'users': 'user',
        'pengaturan_akses': 'user',
        'backup': 'user'
    };

    const mappedResource = resourceMapping[resourceKode] || resourceKode;

    switch (action) {
        case 'view': return canView(mappedResource);
        case 'create': return canCreate(mappedResource);
        case 'edit': return canEdit(mappedResource);
        case 'delete': return canDelete(mappedResource);
        default: return false;
    }
}

// Get semua permission user (untuk cek di client side)
function getUserPermissions() {
    return userPermissions;
}

// Cek apakah user punya role tertentu
function hasRole(roleKode) {
    return userRoles.some(ur => ur.role?.kode?.toLowerCase() === roleKode.toLowerCase());
}

// Cek apakah admin
function isAdmin() {
    return userRoles.some(ur => {
        const kode = ur.role?.kode?.toLowerCase();
        return kode === 'admin' || kode === 'super_admin' || kode === 'superadmin';
    });
}

// Cek apakah super admin (level tertinggi)
function isSuperAdmin() {
    return userRoles.some(ur => {
        const kode = ur.role?.kode?.toLowerCase();
        return kode === 'super_admin' || kode === 'superadmin' || kode === 'admin';
    });
}

// Cek apakah operator
function isOperator() {
    return userRoles.some(ur => ur.role?.kode?.toLowerCase() === 'operator');
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

// ============================================================================
// ROLE CONSTANTS (BARU)
// ============================================================================

const ROLES = {
    ADMIN: 'admin',
    MUBALIGH_DAERAH: 'mubaligh_daerah',
    MUBALIGH_DESA: 'mubaligh_desa',
    IMAM_KELOMPOK: 'imam_kelompok',
    WAKIL_KELOMPOK: 'wakil_kelompok',
    SEKRETARIS_KELOMPOK: 'sekretaris_kelompok',
    BENDAHARA_KELOMPOK: 'bendahara_kelompok',
    PAKAR_PENDIDIK: 'pakar_pendidik',
    ORANG_TUA: 'orang_tua'
};

// Role levels (semakin kecil semakin tinggi)
const ROLE_LEVELS = {
    'admin': 1,
    'mubaligh_daerah': 2,
    'mubaligh_desa': 3,
    'imam_kelompok': 4,
    'wakil_kelompok': 5,
    'pakar_pendidik': 5,
    'sekretaris_kelompok': 6,
    'bendahara_kelompok': 6,
    'orang_tua': 10
};

// ============================================================================
// ALIAS FUNCTIONS (BARU) - Untuk kompatibilitas dengan kode lama
// ============================================================================

/**
 * Alias untuk requireAuth - dipanggil di jamaah.js tapi tidak ada
 * @returns {Promise<boolean>}
 */
async function checkAuth() {
    return await requireAuth();
}

// ============================================================================
// PERMISSION FUNCTIONS (BARU)
// ============================================================================

/**
 * Cek apakah user bisa edit resource tertentu
 * @param {string} resource - 'jamaah', 'pengajian', 'presensi', 'progress', 'wilayah', 'user'
 * @param {Object} data - Data yang akan di-edit (optional, untuk cek ownership)
 * @returns {boolean}
 */
function canEdit(resource, data = null) {
    // Admin bisa edit semua
    if (isAdmin()) return true;
    
    switch (resource) {
        case 'jamaah':
            // Mubaligh bisa edit jamaah di wilayahnya
            if (isMubaligh()) {
                if (!data) return true;
                const userWilayahIds = getUserWilayahIds();
                return userWilayahIds.length === 0 || userWilayahIds.includes(data.wilayah_id);
            }
            return false;
            
        case 'pengajian':
            // Mubaligh bisa edit pengajian
            return isMubaligh();
            
        case 'presensi':
            // Mubaligh bisa edit presensi
            return isMubaligh();
            
        case 'progress':
            // Mubaligh bisa edit progress
            return isMubaligh();
            
        case 'wilayah':
            // Hanya admin yang bisa edit wilayah
            return false;
            
        case 'user':
            // Hanya admin yang bisa edit user lain
            // User bisa edit data sendiri
            if (data && currentUserData && data.id === currentUserData.id) return true;
            return false;
            
        case 'kurikulum':
            // Admin dan mubaligh daerah bisa edit kurikulum
            return hasRole('mubaligh_daerah');
            
        default:
            return false;
    }
}

/**
 * Cek apakah user bisa delete resource tertentu
 * @param {string} resource
 * @param {Object} data
 * @returns {boolean}
 */
function canDelete(resource, data = null) {
    // Admin bisa delete semua
    if (isAdmin()) return true;
    
    switch (resource) {
        case 'jamaah':
            // Hanya admin yang bisa delete jamaah
            return false;
            
        case 'pengajian':
            // Mubaligh bisa delete pengajian yang dia buat
            if (isMubaligh()) {
                if (!data) return true;
                return data.created_by === currentUserData?.id;
            }
            return false;
            
        case 'presensi':
            // Mubaligh bisa delete presensi
            return isMubaligh();
            
        case 'progress':
            // Mubaligh bisa delete progress
            return isMubaligh();
            
        case 'wilayah':
            // Hanya admin yang bisa delete wilayah
            return false;
            
        case 'user':
            // Hanya admin yang bisa delete user
            return false;
            
        default:
            return false;
    }
}

/**
 * Cek apakah user bisa view resource tertentu
 * @param {string} resource
 * @param {Object} data
 * @returns {boolean}
 */
function canView(resource, data = null) {
    // Jika tidak login, tidak bisa lihat apapun
    if (!currentUserData) return false;
    
    // Admin bisa lihat semua
    if (isAdmin()) return true;
    
    switch (resource) {
        case 'jamaah':
            // Semua user yang login bisa lihat jamaah
            // Orang tua hanya bisa lihat anaknya
            if (isOrangTua() && data) {
                // TODO: cek relasi orang tua - anak
                return true;
            }
            return true;
            
        case 'pengajian':
        case 'presensi':
        case 'progress':
        case 'wilayah':
            // Semua user yang login bisa lihat
            return true;
            
        case 'user':
            // Hanya admin yang bisa lihat daftar user
            // User bisa lihat data sendiri
            if (data && data.id === currentUserData?.id) return true;
            return false;
            
        default:
            return true;
    }
}

/**
 * Cek apakah user bisa create resource tertentu
 * @param {string} resource
 * @returns {boolean}
 */
function canCreate(resource) {
    // Admin bisa create semua
    if (isAdmin()) return true;
    
    switch (resource) {
        case 'jamaah':
        case 'pengajian':
        case 'presensi':
        case 'progress':
            return isMubaligh();
            
        case 'wilayah':
        case 'user':
        case 'kurikulum':
            return false;
            
        default:
            return false;
    }
}

/**
 * Get highest role level user (semakin kecil semakin tinggi)
 * @returns {number}
 */
function getHighestRoleLevel() {
    if (userRoles.length === 0) return 999;
    
    let minLevel = 999;
    userRoles.forEach(ur => {
        const roleKode = ur.role?.kode?.toLowerCase();
        const level = ROLE_LEVELS[roleKode] || 100;
        if (level < minLevel) {
            minLevel = level;
        }
    });
    return minLevel;
}

/**
 * Cek apakah role level user lebih tinggi atau sama
 * @param {string} requiredRole
 * @returns {boolean}
 */
function hasRoleLevelOrHigher(requiredRole) {
    const requiredLevel = ROLE_LEVELS[requiredRole.toLowerCase()] || 100;
    const userLevel = getHighestRoleLevel();
    return userLevel <= requiredLevel;
}

/**
 * Get current user's primary role
 * @returns {Object|null}
 */
function getPrimaryRole() {
    if (userRoles.length === 0) return null;
    
    // Return role dengan level tertinggi (angka terkecil)
    let primaryRole = userRoles[0];
    let minLevel = 999;
    
    userRoles.forEach(ur => {
        const roleKode = ur.role?.kode?.toLowerCase();
        const level = ROLE_LEVELS[roleKode] || 100;
        if (level < minLevel) {
            minLevel = level;
            primaryRole = ur;
        }
    });
    
    return primaryRole;
}

/**
 * Get display name for current user
 * @returns {string}
 */
function getCurrentUserName() {
    return currentUserData?.nama || currentUser?.email || 'User';
}

/**
 * Get current user's role names as string
 * @returns {string}
 */
function getCurrentUserRoles() {
    if (userRoles.length === 0) return '-';
    return userRoles.map(ur => ur.role?.nama || ur.role?.kode).join(', ');
}

// ============================================================================
// WILAYAH ACCESS (BARU)
// ============================================================================

/**
 * Cek apakah user punya akses ke wilayah tertentu
 * @param {number} wilayahId
 * @returns {boolean}
 */
function hasWilayahAccess(wilayahId) {
    if (isAdmin()) return true;
    
    const userWilayahIds = getUserWilayahIds();
    
    // Jika user tidak punya wilayah assignment, bisa akses semua (untuk mubaligh daerah)
    if (userWilayahIds.length === 0 && isMubaligh()) return true;
    
    return userWilayahIds.includes(wilayahId);
}

/**
 * Filter data berdasarkan akses wilayah user
 * @param {Array} data
 * @param {string} wilayahKey - key untuk wilayah_id di data
 * @returns {Array}
 */
function filterByWilayahAccess(data, wilayahKey = 'wilayah_id') {
    if (isAdmin()) return data;
    
    const userWilayahIds = getUserWilayahIds();
    
    // Jika tidak ada wilayah assignment, return semua
    if (userWilayahIds.length === 0) return data;
    
    return data.filter(item => userWilayahIds.includes(item[wilayahKey]));
}

// ============================================================================
// EXPORT NEW FUNCTIONS
// ============================================================================

window.ROLES = ROLES;
window.ROLE_LEVELS = ROLE_LEVELS;
window.checkAuth = checkAuth;
window.canEdit = canEdit;
window.canDelete = canDelete;
window.canView = canView;
window.canCreate = canCreate;
window.getHighestRoleLevel = getHighestRoleLevel;
window.hasRoleLevelOrHigher = hasRoleLevelOrHigher;
window.getPrimaryRole = getPrimaryRole;
window.getCurrentUserName = getCurrentUserName;
window.getCurrentUserRoles = getCurrentUserRoles;
window.hasWilayahAccess = hasWilayahAccess;
window.filterByWilayahAccess = filterByWilayahAccess;

/**
 * Get all accessible wilayah IDs including children
 * For example, if user is assigned to a desa, returns desa + all kelompok under it
 * @param {Array} allWilayah - Array of all wilayah data
 * @returns {Array} Array of wilayah IDs user can access
 */
function getAccessibleWilayahIds(allWilayah) {
    if (isAdmin()) return []; // Admin sees all, return empty to indicate no filter

    const userWilayahIds = getUserWilayahIds();
    if (!userWilayahIds || userWilayahIds.length === 0) return [];

    const accessibleIds = [];

    userWilayahIds.forEach(function(wId) {
        const wilayah = allWilayah.find(function(w) { return w.id === wId; });
        if (!wilayah) return;

        accessibleIds.push(wId);

        // Add children based on tingkat
        if (wilayah.tingkat === 'daerah') {
            // Add all desa and kelompok under this daerah
            allWilayah.forEach(function(child) {
                if (child.parent_id === wId) {
                    accessibleIds.push(child.id); // desa
                    // Add kelompok under this desa
                    allWilayah.forEach(function(grandchild) {
                        if (grandchild.parent_id === child.id) {
                            accessibleIds.push(grandchild.id); // kelompok
                        }
                    });
                }
            });
        } else if (wilayah.tingkat === 'desa') {
            // Add all kelompok under this desa
            allWilayah.forEach(function(child) {
                if (child.parent_id === wId) {
                    accessibleIds.push(child.id); // kelompok
                }
            });
        }
        // kelompok tingkat doesn't have children
    });

    return accessibleIds;
}

/**
 * Get user's assigned wilayah tingkat (highest level)
 * @returns {string|null} 'daerah', 'desa', 'kelompok', or null
 */
function getUserWilayahTingkat(allWilayah) {
    if (isAdmin()) return null;

    const userWilayahIds = getUserWilayahIds();
    if (!userWilayahIds || userWilayahIds.length === 0) return null;

    // Find the highest level
    const tingkatOrder = { 'daerah': 3, 'desa': 2, 'kelompok': 1 };
    let highestTingkat = null;
    let highestLevel = 0;

    userWilayahIds.forEach(function(wId) {
        const wilayah = allWilayah.find(function(w) { return w.id === wId; });
        if (wilayah && tingkatOrder[wilayah.tingkat] > highestLevel) {
            highestLevel = tingkatOrder[wilayah.tingkat];
            highestTingkat = wilayah.tingkat;
        }
    });

    return highestTingkat;
}

window.getAccessibleWilayahIds = getAccessibleWilayahIds;
window.getUserWilayahTingkat = getUserWilayahTingkat;

// Export existing functions (untuk memastikan tersedia di window)
window.currentUser = currentUser;
window.currentUserData = currentUserData;
window.userRoles = userRoles;
window.userPermissions = userPermissions;
window.login = login;
window.logout = logout;
window.register = register;
window.checkSession = checkSession;
window.loadUserData = loadUserData;
window.loadUserPermissions = loadUserPermissions;
window.hasRole = hasRole;
window.hasPermission = hasPermission;
window.getUserPermissions = getUserPermissions;
window.isAdmin = isAdmin;
window.isMubaligh = isMubaligh;
window.isOrangTua = isOrangTua;
window.getUserWilayahIds = getUserWilayahIds;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
