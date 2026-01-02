/* ============================================================================
   PWA MOBILE COMPONENTS - PPG SORONG
   JavaScript untuk generate komponen PWA mobile
   ============================================================================ */

// ============================================================================
// PWA CONFIG
// ============================================================================
const PWA_MENU = {
    utama: [
        { icon: '👶', label: 'Generus', href: 'generus.html', color: 'green' },
        { icon: '📝', label: 'Penilaian', href: 'penilaian-hafalan.html', color: 'blue' },
        { icon: '📖', label: 'Pengajian', href: 'pengajian.html', color: 'yellow' },
        { icon: '✅', label: 'Presensi', href: 'presensi.html', color: 'purple' },
        { icon: '📈', label: 'Progress', href: 'progress.html', color: 'green' },
        { icon: '📋', label: 'Rapor', href: 'rapor.html', color: 'red' },
        { icon: '📅', label: 'Laporan', href: 'laporan-bulanan.html', color: 'cyan' },
        { icon: '📊', label: 'Dashboard', href: 'hafalan-dashboard.html', color: 'orange' }
    ],
    pengaturan: [
        { icon: '🗺️', label: 'Wilayah', href: 'wilayah.html', color: 'gray' },
        { icon: '📚', label: 'Kurikulum', href: 'kurikulum.html', color: 'gray' },
        { icon: '👥', label: 'Jamaah', href: 'jamaah.html', color: 'gray' },
        { icon: '👤', label: 'Users', href: 'users.html', color: 'gray' },
        { icon: '💾', label: 'Backup', href: 'backup.html', color: 'gray' }
    ]
};

const PWA_BOTTOM_NAV = [
    { icon: '🏠', label: 'Home', href: 'dashboard.html' },
    { icon: '👶', label: 'Generus', href: 'generus.html' },
    { icon: '📝', label: 'Nilai', href: 'penilaian-hafalan.html' },
    { icon: '📊', label: 'Laporan', href: 'rapor.html' },
    { icon: '⚙️', label: 'Lainnya', href: '#more', onclick: 'togglePwaMoreMenu()' }
];

// ============================================================================
// RENDER PWA HEADER (untuk Dashboard)
// ============================================================================
function renderPwaHeader(stats) {
    var userName = '';
    var userRole = '';
    
    if (typeof currentUserData !== 'undefined' && currentUserData) {
        userName = currentUserData.nama || currentUserData.email || 'User';
    }
    
    if (typeof userRoles !== 'undefined' && userRoles && userRoles.length > 0) {
        userRole = userRoles[0].role?.nama || '';
    }
    
    var greeting = getGreeting();
    
    return '<div class="pwa-header">' +
        '<div class="pwa-header-top">' +
            '<div class="pwa-greeting">' +
                greeting + ', ' + escapeHtml(userName.split(' ')[0]) + '! 👋' +
                '<small>' + escapeHtml(userRole) + '</small>' +
            '</div>' +
            '<div class="pwa-header-actions">' +
                '<button class="pwa-header-btn" onclick="location.href=\'dashboard.html\'">🔔</button>' +
                '<button class="pwa-header-btn" onclick="showPwaProfile()">👤</button>' +
            '</div>' +
        '</div>' +
        '<div class="pwa-stats-row">' +
            '<div class="pwa-stat-box">' +
                '<div class="pwa-stat-value">' + (stats?.totalGenerus || '-') + '</div>' +
                '<div class="pwa-stat-label">Generus</div>' +
            '</div>' +
            '<div class="pwa-stat-box">' +
                '<div class="pwa-stat-value">' + (stats?.totalPengajian || '-') + '</div>' +
                '<div class="pwa-stat-label">Pengajian</div>' +
            '</div>' +
            '<div class="pwa-stat-box">' +
                '<div class="pwa-stat-value">' + (stats?.keaktifan || '-') + '%</div>' +
                '<div class="pwa-stat-label">Keaktifan</div>' +
            '</div>' +
        '</div>' +
    '</div>';
}

// ============================================================================
// RENDER PWA PAGE HEADER (untuk halaman non-dashboard)
// ============================================================================
function renderPwaPageHeader(title, showBack, actionBtn) {
    var backBtn = showBack ? 
        '<button class="pwa-back-btn" onclick="history.back()">←</button>' : '';
    
    var action = actionBtn ? 
        '<button class="pwa-page-action" onclick="' + actionBtn.onclick + '">' + actionBtn.icon + '</button>' : '';
    
    return '<div class="pwa-page-header">' +
        backBtn +
        '<h1 class="pwa-page-title">' + escapeHtml(title) + '</h1>' +
        action +
    '</div>';
}

// ============================================================================
// RENDER PWA MENU GRID
// ============================================================================
function renderPwaMenuGrid(items, sectionTitle) {
    var html = '';
    
    if (sectionTitle) {
        html += '<div class="pwa-section-title">' + escapeHtml(sectionTitle) + '</div>';
    }
    
    html += '<div class="pwa-menu-grid">';
    
    items.forEach(function(item) {
        html += '<a href="' + item.href + '" class="pwa-menu-item">' +
            '<div class="pwa-menu-icon ' + item.color + '">' + item.icon + '</div>' +
            '<span class="pwa-menu-label">' + escapeHtml(item.label) + '</span>' +
        '</a>';
    });
    
    html += '</div>';
    
    return html;
}

// ============================================================================
// RENDER PWA BOTTOM NAV
// ============================================================================
function renderPwaBottomNav(activePage) {
    var html = '<nav class="pwa-bottom-nav">';
    
    PWA_BOTTOM_NAV.forEach(function(item) {
        var isActive = (activePage && item.href.includes(activePage)) ? ' active' : '';
        var onclick = item.onclick ? ' onclick="' + item.onclick + '; return false;"' : '';
        
        html += '<a href="' + item.href + '" class="pwa-nav-item' + isActive + '"' + onclick + '>' +
            '<span class="nav-icon">' + item.icon + '</span>' +
            '<span class="nav-label">' + escapeHtml(item.label) + '</span>' +
        '</a>';
    });
    
    html += '</nav>';
    
    return html;
}

// ============================================================================
// RENDER PWA QUICK ACTIONS
// ============================================================================
function renderPwaQuickActions() {
    return '<div class="pwa-quick-actions">' +
        '<a href="penilaian-hafalan.html" class="pwa-quick-card highlight">' +
            '<div class="pwa-quick-icon">📝</div>' +
            '<div class="pwa-quick-text">' +
                '<h4>Input Penilaian</h4>' +
                '<p>Catat hafalan santri</p>' +
            '</div>' +
        '</a>' +
        '<a href="presensi.html" class="pwa-quick-card">' +
            '<div class="pwa-quick-icon primary">✅</div>' +
            '<div class="pwa-quick-text">' +
                '<h4>Input Presensi</h4>' +
                '<p>Absensi pengajian</p>' +
            '</div>' +
        '</a>' +
    '</div>';
}

// ============================================================================
// RENDER PWA LIST ITEM
// ============================================================================
function renderPwaListItem(item) {
    var badge = item.badge ? '<span class="pwa-list-badge">' + escapeHtml(item.badge) + '</span>' : '';
    var arrow = item.href ? '<span class="pwa-list-arrow">›</span>' : '';
    var tag = item.href ? 'a' : 'div';
    var href = item.href ? ' href="' + item.href + '"' : '';
    
    return '<' + tag + ' class="pwa-list-item"' + href + '>' +
        '<div class="pwa-list-icon" style="background:' + (item.iconBg || '#dcfce7') + '">' + item.icon + '</div>' +
        '<div class="pwa-list-content">' +
            '<h4>' + escapeHtml(item.title) + '</h4>' +
            '<p>' + escapeHtml(item.subtitle || '') + '</p>' +
        '</div>' +
        badge +
        arrow +
    '</' + tag + '>';
}

// ============================================================================
// RENDER PWA SEARCH
// ============================================================================
function renderPwaSearch(placeholder, onInput) {
    var inputHandler = onInput ? ' oninput="' + onInput + '"' : '';
    
    return '<div class="pwa-search">' +
        '<div class="pwa-search-box">' +
            '<span class="pwa-search-icon">🔍</span>' +
            '<input type="text" placeholder="' + escapeHtml(placeholder || 'Cari...') + '" id="pwaSearchInput"' + inputHandler + '>' +
        '</div>' +
    '</div>';
}

// ============================================================================
// RENDER PWA FILTERS
// ============================================================================
function renderPwaFilters(filters, activeFilter, onSelect) {
    var html = '<div class="pwa-filters">';
    
    filters.forEach(function(filter) {
        var isActive = filter.value === activeFilter ? ' active' : '';
        var onclick = onSelect ? ' onclick="' + onSelect + '(\'' + filter.value + '\')"' : '';
        
        html += '<button class="pwa-chip' + isActive + '"' + onclick + '>' + 
            escapeHtml(filter.label) + 
        '</button>';
    });
    
    html += '</div>';
    
    return html;
}

// ============================================================================
// RENDER PWA EMPTY STATE
// ============================================================================
function renderPwaEmpty(icon, title, message) {
    return '<div class="pwa-empty">' +
        '<div class="pwa-empty-icon">' + (icon || '📭') + '</div>' +
        '<h3>' + escapeHtml(title || 'Tidak ada data') + '</h3>' +
        '<p>' + escapeHtml(message || '') + '</p>' +
    '</div>';
}

// ============================================================================
// RENDER PWA LOADING
// ============================================================================
function renderPwaLoading(message) {
    return '<div class="pwa-loading">' +
        '<div class="pwa-spinner"></div>' +
        '<p>' + escapeHtml(message || 'Memuat...') + '</p>' +
    '</div>';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getGreeting() {
    var hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

function showPwaProfile() {
    // Show profile modal or navigate to profile
    if (typeof showModal === 'function') {
        // If there's a profile modal
    } else {
        // Show simple alert with logout option
        if (confirm('Keluar dari aplikasi?')) {
            logout();
        }
    }
}

function togglePwaMoreMenu() {
    var moreMenu = document.getElementById('pwaMoreMenu');
    if (moreMenu) {
        moreMenu.classList.toggle('show');
    } else {
        // Create more menu
        var menuHtml = '<div id="pwaMoreMenu" class="pwa-more-menu show">' +
            '<div class="pwa-more-overlay" onclick="togglePwaMoreMenu()"></div>' +
            '<div class="pwa-more-content">' +
                '<div class="pwa-more-header">' +
                    '<h3>Menu Lainnya</h3>' +
                    '<button onclick="togglePwaMoreMenu()">✕</button>' +
                '</div>' +
                renderPwaMenuGrid(PWA_MENU.pengaturan, 'Pengaturan') +
                '<div style="padding:1rem;">' +
                    '<button class="btn btn-outline w-100" onclick="logout()">🚪 Keluar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        document.body.insertAdjacentHTML('beforeend', menuHtml);
    }
}

function showPwaToast(message, duration) {
    duration = duration || 2000;
    
    var existing = document.querySelector('.pwa-toast');
    if (existing) existing.remove();
    
    var toast = document.createElement('div');
    toast.className = 'pwa-toast show';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, duration);
}

// ============================================================================
// INIT PWA MOBILE
// ============================================================================
function initPwaMobile(options) {
    options = options || {};
    
    // Only init on mobile
    if (window.innerWidth > 768) return;
    
    // Add CSS if not already added
    if (!document.querySelector('link[href*="pwa-mobile.css"]')) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/pwa-mobile.css';
        document.head.appendChild(link);
    }
    
    // Create mobile container if needed
    var mobileContainer = document.getElementById('pwaMobileContent');
    if (!mobileContainer) {
        mobileContainer = document.createElement('div');
        mobileContainer.id = 'pwaMobileContent';
        mobileContainer.className = 'pwa-mobile';
        
        // Insert after page-content or main-content
        var pageContent = document.querySelector('.page-content') || document.querySelector('.main-content');
        if (pageContent) {
            pageContent.parentNode.insertBefore(mobileContainer, pageContent);
        }
    }
    
    // Render bottom nav
    var bottomNav = document.querySelector('.pwa-bottom-nav');
    if (!bottomNav) {
        document.body.insertAdjacentHTML('beforeend', renderPwaBottomNav(options.activePage));
    }
    
    return mobileContainer;
}

// ============================================================================
// EXPORT
// ============================================================================
window.PWA_MENU = PWA_MENU;
window.PWA_BOTTOM_NAV = PWA_BOTTOM_NAV;
window.renderPwaHeader = renderPwaHeader;
window.renderPwaPageHeader = renderPwaPageHeader;
window.renderPwaMenuGrid = renderPwaMenuGrid;
window.renderPwaBottomNav = renderPwaBottomNav;
window.renderPwaQuickActions = renderPwaQuickActions;
window.renderPwaListItem = renderPwaListItem;
window.renderPwaSearch = renderPwaSearch;
window.renderPwaFilters = renderPwaFilters;
window.renderPwaEmpty = renderPwaEmpty;
window.renderPwaLoading = renderPwaLoading;
window.initPwaMobile = initPwaMobile;
window.showPwaToast = showPwaToast;
window.togglePwaMoreMenu = togglePwaMoreMenu;
