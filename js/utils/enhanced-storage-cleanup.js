/**
 * Enhanced Storage Cleanup Utility
 * 
 * Handles localStorage cleanup for theme-related data to prevent hitting storage limits.
 * This enhanced version is more aggressive about cleaning up unused data.
 */

// The localStorage key prefix for generated theme images
const THEME_IMAGE_KEY_PREFIX = 'generated-theme-image-';

// Key prefixes to target during cleanup
const TARGET_PREFIXES = [
    'twitch-chat-overlay-bgimage-',
    'twitch-chat-overlay-config-generated-',
    'generated-theme-image-'
];

// Keep only current theme data and wipe older ones
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
 * @param {boolean} [aggressive] - Whether to perform aggressive cleanup
 * @returns {object} - Result of the cleanup operation
 */
function cleanupLocalStorage(newThemeId = null, aggressive = false) {
    try {
        // Clean up theme images first
        const removedCount = cleanupThemeImages(newThemeId);
        
        // Also clean up any unused theme config data
        let additionalRemoved = 0;
        try {
            // Look for old theme-related data and remove it
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                
                // Handle special case for background images
                if (key.startsWith('twitch-chat-overlay-bgimage-')) {
                    // Keep the default scene's background image and any that match the current scene ID
                    const sceneId = window.location.search.includes('scene=') ? 
                        getUrlParameter('scene') : 
                        (window.location.search.includes('instance=') ? 
                            getUrlParameter('instance') : 'default');
                    
                    // Only preserve the current scene's background image and default
                    if (key !== `twitch-chat-overlay-bgimage-${sceneId}` && key !== 'twitch-chat-overlay-bgimage-default') {
                        console.log(`Removing background image for unused scene: ${key}`);
                        localStorage.removeItem(key);
                        additionalRemoved++;
                        i--; // Adjust index
                    }
                }
                // Clean up unused theme configs
                else if (key.startsWith('twitch-chat-overlay-config-generated-')) {
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
        
        // If localStorage is still near capacity (>85%), and we're not already in aggressive mode
        if (isLocalStorageNearCapacity(0.85) && !aggressive) {
            console.warn('localStorage still near capacity - performing aggressive cleanup');
            return aggressiveCleanup(newThemeId);
        }
        
        // Still near capacity even after standard cleanup
        if (isLocalStorageNearCapacity(0.9)) {
            console.warn('localStorage still near capacity after cleanup, showing warning to user');
            showStorageWarning();
            return {
                success: true,
                removedCount: removedCount + additionalRemoved,
                warning: 'localStorage near capacity'
            };
        }
        
        return {
            success: true, 
            removedCount: removedCount + additionalRemoved
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
 * Perform aggressive cleanup when storage is critically full
 * @param {string} [newThemeId] - ID of the new theme to preserve
 * @returns {object} - Cleanup results
 */
function aggressiveCleanup(newThemeId = null) {
    try {
        let removedCount = 0;
        const sceneId = window.location.search.includes('scene=') ? 
            getUrlParameter('scene') : 
            (window.location.search.includes('instance=') ? 
                getUrlParameter('instance') : 'default');
        
        // Get current usage info
        const usageInfo = getStorageUsageInfo();
        console.log('Storage usage before aggressive cleanup:', usageInfo);

        // First approach: Remove all theme-related items except current scene
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            // Check if it's a theme-related item
            const isThemeRelated = TARGET_PREFIXES.some(prefix => key.startsWith(prefix));
            
            // Preserve only essential items
            const isEssential = 
                (key === `twitch-chat-overlay-config-${sceneId}`) || // Current scene config 
                (key === 'twitch-chat-overlay-config-default') || // Default config
                (newThemeId && key.includes(newThemeId)); // Current theme items
                
            if (isThemeRelated && !isEssential) {
                console.log(`Aggressive cleanup: removing ${key}`);
                localStorage.removeItem(key);
                removedCount++;
                i--; // Adjust index
            }
        }
        
        // Get new usage info after aggressive cleanup
        const newUsageInfo = getStorageUsageInfo();
        console.log('Storage usage after aggressive cleanup:', newUsageInfo);
        
        // If still near capacity, show warning to user
        if (isLocalStorageNearCapacity(0.9)) {
            showStorageWarning();
            return {
                success: true,
                removedCount,
                warning: 'localStorage still critically full'
            };
        }
        
        return {
            success: true,
            removedCount,
            aggressive: true
        };
    } catch (error) {
        console.error('Error during aggressive cleanup:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Show a storage warning message to the user
 */
function showStorageWarning() {
    // Add a warning message to the chat
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const warningElement = document.createElement('div');
        warningElement.className = 'chat-message system-message';
        warningElement.innerHTML = `
            <span class="message-content">
                <strong>Storage Warning:</strong> Local storage is nearly full! 
                Use the "Clear Browser Storage" button in settings to fix this.
            </span>
        `;
        chatMessages.appendChild(warningElement);
    }
    
    // Add a clear storage button to the settings panel if it doesn't exist
    const configPanel = document.getElementById('config-panel');
    if (configPanel && !document.getElementById('clear-storage-btn')) {
        const actionSection = configPanel.querySelector('#channel-actions');
        if (actionSection) {
            const clearBtn = document.createElement('button');
            clearBtn.id = 'clear-storage-btn';
            clearBtn.textContent = 'Clear Browser Storage';
            clearBtn.style.backgroundColor = '#aa5555';
            clearBtn.style.marginTop = '10px';
            clearBtn.onclick = clearAllStorage;
            actionSection.appendChild(clearBtn);
        }
    }
}

/**
 * Clear all localStorage data except essential config
 */
function clearAllStorage() {
    try {
        // Preserve current scene's config
        const sceneId = window.location.search.includes('scene=') ? 
            getUrlParameter('scene') : 
            (window.location.search.includes('instance=') ? 
                getUrlParameter('instance') : 'default');
        
        const currentConfig = localStorage.getItem(`twitch-chat-overlay-config-${sceneId}`);
        const defaultConfig = localStorage.getItem('twitch-chat-overlay-config-default');
        
        // Clear all localStorage
        localStorage.clear();
        
        // Restore essential configs
        if (currentConfig) {
            localStorage.setItem(`twitch-chat-overlay-config-${sceneId}`, currentConfig);
        }
        if (defaultConfig) {
            localStorage.setItem('twitch-chat-overlay-config-default', defaultConfig);
        }
        
        // Show success message
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message system-message';
            messageElement.innerHTML = `
                <span class="message-content">
                    <strong>Success:</strong> Browser storage has been cleared. Please reload the page.
                </span>
            `;
            chatMessages.appendChild(messageElement);
        }
        
        console.log('Storage cleared successfully');
        
        // Suggest a page reload
        setTimeout(() => {
            alert('Browser storage has been cleared. The page will reload now.');
            window.location.reload();
        }, 2000);
    } catch (error) {
        console.error('Error clearing storage:', error);
        alert('Error clearing storage: ' + error.message);
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

/**
 * Helper function to get URL parameters
 */
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Export functions for use in other modules
window.storageCleanup = {
    cleanupLocalStorage,
    isLocalStorageNearCapacity,
    cleanupThemeImages,
    getStorageUsageInfo,
    clearAllStorage,
    aggressiveCleanup,
    showStorageWarning
};
