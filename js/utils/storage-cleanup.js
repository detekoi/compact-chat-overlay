/**
 * Storage Cleanup Utility
 * 
 * Handles localStorage cleanup for theme-related data to prevent hitting storage limits.
 */

// The localStorage key prefix for generated theme images
const THEME_IMAGE_KEY_PREFIX = 'generated-theme-image-';

// Keep only the current theme image
const MAX_STORED_THEMES = 0;

/**
 * Clean up old theme image data when a new theme is generated
 * This helps prevent hitting localStorage limits
 * 
 * @param {string} newThemeId - ID of the newly generated theme (if any)
 * @returns {number} - Number of items cleaned up
 */
function cleanupThemeImages(newThemeId = null) {
    try {
        console.log('Cleaning up old theme image data from localStorage...');
        
        // Get all keys in localStorage that match our theme image pattern
        const themeImageKeys = [];
        let removedCount = 0;
        
        // With MAX_STORED_THEMES set to 0, we want to remove ALL existing theme images
        // except for the new one we're currently creating
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(THEME_IMAGE_KEY_PREFIX)) {
                // Don't remove the new theme we just created
                if (newThemeId && key === `${THEME_IMAGE_KEY_PREFIX}${newThemeId}`) {
                    continue;
                }
                
                // Remove this theme image immediately
                console.log(`Removing old theme image: ${key}`);
                localStorage.removeItem(key);
                removedCount++;
                
                // Adjust index since we're removing items from localStorage while iterating
                i--;
            }
        }
        
        console.log(`Removed ${removedCount} old theme image(s) from localStorage`);
        return removedCount;
        
        return 0;
    } catch (error) {
        console.error('Error cleaning up theme images:', error);
        return 0;
    }
}

/**
 * Clean up theme data to make room for a new theme
 * This specifically targets large image data and keeps only the most recent themes
 * 
 * @param {string} [newThemeId] - Optional ID of a newly created theme to preserve
 */
function cleanupLocalStorage(newThemeId = null) {
    try {
        // Clean up theme images first
        const removedCount = cleanupThemeImages(newThemeId);
        
        // Also clean up any unused theme config data
        let additionalRemoved = 0;
        try {
            // Look for old config data and remove it if not being used
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('twitch-chat-overlay-config-generated-')) {
                    // Check if this config is for the currently used theme
                    const themeId = key.replace('twitch-chat-overlay-config-', '');
                    if (newThemeId && themeId !== newThemeId) {
                        console.log(`Removing unused theme config: ${key}`);
                        localStorage.removeItem(key);
                        additionalRemoved++;
                        i--; // Adjust index
                    }
                }
            }
        } catch (e) {
            console.error('Error cleaning unused theme configs:', e);
        }
        
        // If localStorage is still near capacity (>90%), we could implement more aggressive cleanup
        // But for now, just log a warning
        if (isLocalStorageNearCapacity(0.9)) {
            console.warn('localStorage is still near capacity after cleanup, manual clearing may be needed');
            return {
                success: true,
                removedCount: removedCount + additionalRemoved,
                warning: 'localStorage near capacity'
            };
        }
        
        return {
            success: true, 
            removedCount
        };
    } catch (error) {
        console.error('Error during localStorage cleanup:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check if localStorage is near its capacity limit
 * 
 * @param {number} threshold - Threshold between 0-1 (e.g., 0.9 for 90%)
 * @returns {boolean} - True if storage is near capacity
 */
function isLocalStorageNearCapacity(threshold = 0.9) {
    try {
        // Typical localStorage limit is ~5MB
        const approximateLimit = 5 * 1024 * 1024; // 5MB in bytes
        
        // Calculate current usage by writing and reading a test string
        let totalSize = 0;
        let testString = '';
        
        // First calculate size of existing items
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            const value = localStorage.getItem(key);
            if (value) {
                // Size in bytes is roughly 2 * (length of key + length of value) for UTF-16
                totalSize += 2 * (key.length + value.length);
            }
        }
        
        const usage = totalSize / approximateLimit;
        console.log(`Current localStorage usage: ${Math.round(usage * 100)}% (${(totalSize / (1024 * 1024)).toFixed(2)} MB)`);
        
        return usage >= threshold;
    } catch (error) {
        console.error('Error checking localStorage capacity:', error);
        return false;
    }
}

// Export functions for use in other modules
/**
 * Get the current localStorage usage information
 * @returns {object} - Object with usage info
 */
function getStorageUsageInfo() {
    try {
        // Typical localStorage limit is ~5MB
        const approximateLimit = 5 * 1024 * 1024; // 5MB in bytes
        
        // Calculate current usage
        let totalSize = 0;
        let largestItem = { key: null, size: 0 };
        let itemCounts = { theme: 0, config: 0, other: 0 };
        
        // Iterate through all items
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            const value = localStorage.getItem(key);
            if (value) {
                // Size in bytes is roughly 2 * (length of key + length of value) for UTF-16
                const itemSize = 2 * (key.length + value.length);
                totalSize += itemSize;
                
                // Track largest item
                if (itemSize > largestItem.size) {
                    largestItem = { key, size: itemSize };
                }
                
                // Count by type
                if (key.includes('theme') || key.includes('bgimage')) {
                    itemCounts.theme++;
                } else if (key.includes('config')) {
                    itemCounts.config++;
                } else {
                    itemCounts.other++;
                }
            }
        }
        
        const percentUsed = (totalSize / approximateLimit) * 100;
        
        return {
            totalItems: localStorage.length,
            totalSizeBytes: totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            percentUsed: percentUsed.toFixed(1),
            largestItem,
            itemCounts
        };
    } catch (error) {
        console.error('Error getting storage usage info:', error);
        return { error: error.message };
    }
}

window.storageCleanup = {
    cleanupLocalStorage,
    isLocalStorageNearCapacity,
    cleanupThemeImages,
    getStorageUsageInfo
};
