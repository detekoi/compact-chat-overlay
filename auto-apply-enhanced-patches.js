/**
 * Auto-Apply Enhanced Patches
 * 
 * This script automatically applies the enhanced patches for:
 * 1. Background image syncing
 * 2. Storage cleanup with more aggressive strategies
 * 3. Theme generation with retry logic
 */

(function() {
    // Wait for DOM to be fully loaded
    function applyPatches() {
        console.log('Auto-applying enhanced patches...');
        
        // Apply patches in the correct order
        applyStorageCleanupPatch()
            .then(() => applyBackgroundImagePatch()) // Apply background image patch first 
            .then(() => applyThemeGeneratorPatch()) // Then theme generator patch
            .then(() => {
                console.log('All enhanced patches applied successfully!');
                
                // Check storage usage and show warning if needed
                if (window.storageCleanup && window.storageCleanup.isLocalStorageNearCapacity(0.85)) {
                    console.warn('WARNING: localStorage is near capacity');
                    if (window.storageCleanup.showStorageWarning) {
                        window.storageCleanup.showStorageWarning();
                    }
                }
            })
            .catch(error => {
                console.error('Error applying patches:', error);
            });
    }
    
    // Apply the enhanced storage cleanup patch
    function applyStorageCleanupPatch() {
        return new Promise((resolve, reject) => {
            try {
                console.log('Applying enhanced storage cleanup patch...');
                
                const script = document.createElement('script');
                script.src = 'js/utils/enhanced-storage-cleanup.js';
                script.onload = function() {
                    console.log('Enhanced storage cleanup patch loaded successfully');
                    resolve();
                };
                script.onerror = function(error) {
                    console.error('Failed to load enhanced storage cleanup patch:', error);
                    // Continue even if this fails
                    resolve();
                };
                document.body.appendChild(script);
            } catch (error) {
                console.error('Error applying storage cleanup patch:', error);
                // Continue even if this fails
                resolve();
            }
        });
    }
    
    // Apply the background image patch (original or enhanced version)
    function applyBackgroundImagePatch() {
        return new Promise((resolve, reject) => {
            try {
                console.log('Applying background image patch...');
                
                const script = document.createElement('script');
                script.src = 'js/background-image-patch.js';
                script.onload = function() {
                    console.log('Background image patch loaded successfully');
                    resolve();
                };
                script.onerror = function(error) {
                    console.error('Failed to load background image patch:', error);
                    // Continue even if this fails
                    resolve();
                };
                document.body.appendChild(script);
            } catch (error) {
                console.error('Error applying background image patch:', error);
                // Continue even if this fails
                resolve();
            }
        });
    }
    
    // Apply the theme generator retry patch
    function applyThemeGeneratorPatch() {
        return new Promise((resolve, reject) => {
            try {
                console.log('Applying theme generator retry patch...');
                
                const script = document.createElement('script');
                script.src = 'js/retry-theme-generator.js';
                script.onload = function() {
                    console.log('Theme generator retry patch loaded successfully');
                    resolve();
                };
                script.onerror = function(error) {
                    console.error('Failed to load theme generator retry patch:', error);
                    // Continue even if this fails
                    resolve();
                };
                document.body.appendChild(script);
            } catch (error) {
                console.error('Error applying theme generator retry patch:', error);
                // Continue even if this fails
                resolve();
            }
        });
    }

    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPatches);
    } else {
        // DOM already loaded, run immediately
        applyPatches();
    }
})();
