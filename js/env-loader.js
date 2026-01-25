// ============================================================================
// ENVIRONMENT LOADER - PPG SORONG
// Load this script BEFORE config.js in your HTML files
// ============================================================================

(function() {
    'use strict';
    
    // Initialize ENV object
    window.ENV = window.ENV || {};
    
    // For local development with live server or local file:
    // You can set these values here temporarily (DO NOT COMMIT!)
    // Better: use a local config-local.js file (added to .gitignore)
    
    // For production deployment (GitHub Pages, Netlify, etc):
    // Set these in your deployment platform's environment variables
    
    console.log('🔧 Environment loader initialized');
    
    // Check if config is loaded from external source
    if (!window.ENV.SUPABASE_URL) {
        console.warn('⚠️ Environment variables not set. Using config.js fallback.');
    }
})();
