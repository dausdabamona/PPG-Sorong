/* ========================================
   Mobile Grid Menu - PPG Sorong PWA
   ======================================== */

// Inject Mobile Menu HTML
function initMobileMenu(activePage) {
    // Create menu HTML
    const menuHTML = `
    <!-- Mobile Grid Menu -->
    <button class="mobile-menu-btn" onclick="openMobileMenu()" aria-label="Open Menu">☰</button>
    <div class="mobile-menu-overlay" id="mobileMenuOverlay" onclick="closeMobileMenu()"></div>
    <div class="mobile-menu-container" id="mobileMenuContainer">
        <div class="mobile-menu-header">
            <span class="mobile-menu-title">📱 Menu PPG Sorong</span>
            <button class="mobile-menu-close" onclick="closeMobileMenu()" aria-label="Close Menu">✕</button>
        </div>
        
        <div class="mobile-menu-grid">
            <div class="mobile-menu-section">Menu Utama</div>
            <a href="dashboard.html" class="mobile-menu-item ${activePage === 'dashboard' ? 'active' : ''}">
                <div class="mobile-menu-icon">📊</div>
                <span class="mobile-menu-text">Dashboard</span>
            </a>
            <a href="generus.html" class="mobile-menu-item ${activePage === 'generus' ? 'active' : ''}">
                <div class="mobile-menu-icon">👶</div>
                <span class="mobile-menu-text">Generus</span>
            </a>
            <a href="pengajian.html" class="mobile-menu-item ${activePage === 'pengajian' ? 'active' : ''}">
                <div class="mobile-menu-icon">📖</div>
                <span class="mobile-menu-text">Pengajian</span>
            </a>
            <a href="presensi.html" class="mobile-menu-item ${activePage === 'presensi' ? 'active' : ''}">
                <div class="mobile-menu-icon">✅</div>
                <span class="mobile-menu-text">Presensi</span>
            </a>
            <a href="progress.html" class="mobile-menu-item ${activePage === 'progress' ? 'active' : ''}">
                <div class="mobile-menu-icon">📈</div>
                <span class="mobile-menu-text">Progress</span>
            </a>
            <a href="penilaian.html" class="mobile-menu-item ${activePage === 'penilaian' ? 'active' : ''}">
                <div class="mobile-menu-icon">✍️</div>
                <span class="mobile-menu-text">Penilaian</span>
            </a>
            <a href="rapor.html" class="mobile-menu-item ${activePage === 'rapor' ? 'active' : ''}">
                <div class="mobile-menu-icon">📋</div>
                <span class="mobile-menu-text">Rapor</span>
            </a>
            
            <div class="mobile-menu-section">Data Master</div>
            <a href="jamaah.html" class="mobile-menu-item ${activePage === 'jamaah' ? 'active' : ''}">
                <div class="mobile-menu-icon">👥</div>
                <span class="mobile-menu-text">Jamaah</span>
            </a>
            <a href="wilayah.html" class="mobile-menu-item ${activePage === 'wilayah' ? 'active' : ''}">
                <div class="mobile-menu-icon">🗺️</div>
                <span class="mobile-menu-text">Wilayah</span>
            </a>
            <a href="kurikulum.html" class="mobile-menu-item ${activePage === 'kurikulum' ? 'active' : ''}">
                <div class="mobile-menu-icon">📚</div>
                <span class="mobile-menu-text">Kurikulum</span>
            </a>
            <a href="pernikahan.html" class="mobile-menu-item ${activePage === 'pernikahan' ? 'active' : ''}" id="mobileMenuPernikahan" style="display:none;">
                <div class="mobile-menu-icon">💒</div>
                <span class="mobile-menu-text">Pernikahan</span>
            </a>
            <a href="users.html" class="mobile-menu-item ${activePage === 'users' ? 'active' : ''}">
                <div class="mobile-menu-icon">👤</div>
                <span class="mobile-menu-text">Users</span>
            </a>
        </div>
        
        <div class="mobile-menu-user">
            <div class="mobile-menu-user-avatar" id="mobileUserAvatar">?</div>
            <div class="mobile-menu-user-info">
                <div class="mobile-menu-user-name" id="mobileUserName">Loading...</div>
                <div class="mobile-menu-user-role" id="mobileUserRole">-</div>
            </div>
            <button class="mobile-menu-logout" onclick="logout()">🚪 Keluar</button>
        </div>
    </div>
    `;
    
    // Append to body
    document.body.insertAdjacentHTML('beforeend', menuHTML);
    
    // Update bottom nav menu link if exists
    const bottomNavMenuLink = document.querySelector('.bottom-nav-item[onclick*="toggleSidebar"]');
    if (bottomNavMenuLink) {
        bottomNavMenuLink.setAttribute('onclick', 'openMobileMenu(); return false;');
    }
}

// Open Mobile Menu
function openMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const container = document.getElementById('mobileMenuContainer');
    
    if (overlay && container) {
        overlay.classList.add('show');
        container.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Update user info
        updateMobileMenuUserInfo();
        
        // Show admin menus
        showAdminMenus();
    }
}

// Close Mobile Menu
function closeMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const container = document.getElementById('mobileMenuContainer');
    
    if (overlay && container) {
        overlay.classList.remove('show');
        container.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Update user info in mobile menu
function updateMobileMenuUserInfo() {
    if (typeof currentUserData !== 'undefined' && currentUserData) {
        const avatar = document.getElementById('mobileUserAvatar');
        const name = document.getElementById('mobileUserName');
        const role = document.getElementById('mobileUserRole');
        
        if (avatar) avatar.textContent = (currentUserData.nama || 'U').charAt(0).toUpperCase();
        if (name) name.textContent = currentUserData.nama || currentUserData.email || 'User';
        
        if (role && typeof userRoles !== 'undefined' && userRoles && userRoles.length > 0) {
            role.textContent = userRoles[0].role?.nama || '-';
        }
    }
}

// Show admin-only menus
function showAdminMenus() {
    if (typeof userRoles !== 'undefined' && userRoles) {
        const isAdmin = userRoles.some(r => r.role?.kode?.toLowerCase() === 'admin');
        
        if (isAdmin) {
            const pernikahanMenu = document.getElementById('mobileMenuPernikahan');
            if (pernikahanMenu) {
                pernikahanMenu.style.display = 'flex';
            }
        }
    }
}

// Handle swipe down to close
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(e) {
    const container = document.getElementById('mobileMenuContainer');
    if (container && container.classList.contains('show')) {
        touchStartY = e.changedTouches[0].screenY;
    }
}, { passive: true });

document.addEventListener('touchend', function(e) {
    const container = document.getElementById('mobileMenuContainer');
    if (container && container.classList.contains('show')) {
        touchEndY = e.changedTouches[0].screenY;
        if (touchEndY - touchStartY > 100) {
            closeMobileMenu();
        }
    }
}, { passive: true });

// Handle escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
});

// Auto-detect active page and init
document.addEventListener('DOMContentLoaded', function() {
    // Detect current page from URL
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1).replace('.html', '') || 'index';
    
    // Map filenames to page names
    const pageMap = {
        'index': 'login',
        'dashboard': 'dashboard',
        'generus': 'generus',
        'pengajian': 'pengajian',
        'presensi': 'presensi',
        'progress': 'progress',
        'penilaian': 'penilaian',
        'rapor': 'rapor',
        'jamaah': 'jamaah',
        'wilayah': 'wilayah',
        'kurikulum': 'kurikulum',
        'pernikahan': 'pernikahan',
        'users': 'users',
        'register': 'register'
    };
    
    const activePage = pageMap[filename] || filename;
    
    // Don't show menu on login/register pages
    if (activePage !== 'login' && activePage !== 'register' && activePage !== 'index') {
        initMobileMenu(activePage);
    }
});
