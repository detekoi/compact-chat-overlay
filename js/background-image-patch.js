/**
 * Twitch Chat Overlay - Background Image Patch
 * 
 * This script adds support for AI-generated tiled background graphics
 * to the Twitch Chat Overlay.
 * 
 * To apply this patch, copy and paste the code below into the browser
 * console after loading the chat overlay.
 */

(function() {
    console.log('Applying background image patch...');
    
    /**
     * Enhancement 1: Add backgroundImage property to theme objects
     */
    function enhanceThemeObjects() {
        // Add backgroundImage property to all available themes
        if (window.availableThemes) {
            window.availableThemes.forEach(theme => {
                if (!theme.hasOwnProperty('backgroundImage')) {
                    theme.backgroundImage = null;
                }
            });
            console.log('Enhanced theme objects with backgroundImage property');
        } else {
            console.warn('Could not enhance theme objects: availableThemes not found');
        }
    }

    /**
     * Enhancement 2: Enhance applyTheme to handle background images
     */
    function enhanceApplyTheme() {
        if (!window.applyTheme) {
            console.warn('Could not enhance applyTheme: function not found');
            return;
        }

        // Store reference to original function
        const originalApplyTheme = window.applyTheme;

        // Create enhanced version
        window.applyTheme = function(themeName) {
            // Call the original function first
            originalApplyTheme.call(this, themeName);
            
            // Add background image handling
            try {
                const themeIndex = window.availableThemes.findIndex(theme => theme.value === themeName);
                if (themeIndex !== -1) {
                    const theme = window.availableThemes[themeIndex];
                    
                    // Apply background image if available
                    if (theme.backgroundImage) {
                        document.documentElement.style.setProperty('--chat-bg-image', `url("${theme.backgroundImage}")`);
                        document.documentElement.style.setProperty('--popup-bg-image', `url("${theme.backgroundImage}")`);
                    } else {
                        document.documentElement.style.setProperty('--chat-bg-image', 'none');
                        document.documentElement.style.setProperty('--popup-bg-image', 'none');
                    }
                    
                    // Store the background image in config
                    if (window.config) {
                        window.config.backgroundImage = theme.backgroundImage;
                    }
                }
            } catch (error) {
                console.error('Error applying background image:', error);
            }
        };

        console.log('Enhanced applyTheme function to handle background images');
    }

    /**
     * Enhancement 3: Enhance updateThemePreview to display background images
     */
    function enhanceUpdateThemePreview() {
        if (!window.updateThemePreview) {
            console.warn('Could not enhance updateThemePreview: function not found');
            return;
        }

        // Store reference to original function
        const originalUpdateThemePreview = window.updateThemePreview;

        // Create enhanced version
        window.updateThemePreview = function(theme, useCustom = false) {
            // Call the original function first
            originalUpdateThemePreview.call(this, theme, useCustom);
            
            // Add background image handling
            try {
                // Get the preview element
                const themePreview = document.getElementById('theme-preview');
                if (!themePreview) return;
                
                if (theme.value !== 'default' && !useCustom) {
                    // Apply background image if available
                    if (theme.backgroundImage) {
                        themePreview.style.backgroundImage = `url("${theme.backgroundImage}")`;
                        themePreview.style.backgroundRepeat = 'repeat';
                        themePreview.style.backgroundSize = 'auto';
                    } else {
                        themePreview.style.backgroundImage = 'none';
                    }
                } else {
                    // Apply background image if available in config
                    if (window.config && window.config.backgroundImage) {
                        themePreview.style.backgroundImage = `url("${window.config.backgroundImage}")`;
                        themePreview.style.backgroundRepeat = 'repeat';
                        themePreview.style.backgroundSize = 'auto';
                    } else {
                        themePreview.style.backgroundImage = 'none';
                    }
                }
            } catch (error) {
                console.error('Error updating theme preview with background image:', error);
            }
        };

        console.log('Enhanced updateThemePreview function to display background images');
    }

    /**
     * Enhancement 4: Enhance saveConfiguration to save background image
     */
    function enhanceSaveConfiguration() {
        if (!window.saveConfiguration) {
            console.warn('Could not enhance saveConfiguration: function not found');
            return;
        }

        // Store reference to original function
        const originalSaveConfiguration = window.saveConfiguration;

        // Create enhanced version
        window.saveConfiguration = function() {
            // Store background image in config before saving
            try {
                if (window.config && window.availableThemes && window.currentThemeIndex >= 0) {
                    window.config.backgroundImage = window.availableThemes[window.currentThemeIndex]?.backgroundImage || null;
                }
            } catch (error) {
                console.error('Error storing background image in config:', error);
            }
            
            // Call the original function
            originalSaveConfiguration.call(this);
            
            // Apply background image CSS variable after saving
            try {
                if (window.config && window.config.backgroundImage) {
                    document.documentElement.style.setProperty('--chat-bg-image', `url("${window.config.backgroundImage}")`);
                    document.documentElement.style.setProperty('--popup-bg-image', `url("${window.config.backgroundImage}")`);
                } else {
                    document.documentElement.style.setProperty('--chat-bg-image', 'none');
                    document.documentElement.style.setProperty('--popup-bg-image', 'none');
                }
            } catch (error) {
                console.error('Error applying background image CSS variable after saving:', error);
            }
        };

        console.log('Enhanced saveConfiguration function to save background image');
    }

    /**
     * Enhancement 5: Enhance loadSavedConfig to load background image
     */
    function enhanceLoadSavedConfig() {
        if (!window.loadSavedConfig) {
            console.warn('Could not enhance loadSavedConfig: function not found');
            return;
        }

        // Store reference to original function
        const originalLoadSavedConfig = window.loadSavedConfig;

        // Create enhanced version
        window.loadSavedConfig = function() {
            // Call the original function first
            originalLoadSavedConfig.call(this);
            
            // Add background image handling
            try {
                if (window.config && window.config.backgroundImage) {
                    document.documentElement.style.setProperty('--chat-bg-image', `url("${window.config.backgroundImage}")`);
                    document.documentElement.style.setProperty('--popup-bg-image', `url("${window.config.backgroundImage}")`);
                } else {
                    document.documentElement.style.setProperty('--chat-bg-image', 'none');
                    document.documentElement.style.setProperty('--popup-bg-image', 'none');
                }
            } catch (error) {
                console.error('Error loading background image from config:', error);
            }
        };

        console.log('Enhanced loadSavedConfig function to load background image');
    }

    /**
     * Enhancement 6: Ensure reset config clears background image
     */
    function enhanceResetConfig() {
        // Try to find the reset config button
        const resetConfigBtn = document.getElementById('reset-config');
        if (!resetConfigBtn) {
            console.warn('Could not enhance reset config: button not found');
            return;
        }

        // Add listener that runs after the original click handler
        const originalClick = resetConfigBtn.onclick;
        resetConfigBtn.onclick = null;
        
        resetConfigBtn.addEventListener('click', function(event) {
            if (originalClick) {
                // Call original event or let it proceed
                // The reset logic will execute and clear the config
            }
            
            // Ensure background image is cleared after reset
            setTimeout(() => {
                document.documentElement.style.setProperty('--chat-bg-image', 'none');
                document.documentElement.style.setProperty('--popup-bg-image', 'none');
                
                // Make sure config has backgroundImage property set to null
                if (window.config) {
                    window.config.backgroundImage = null;
                }
                
                console.log('Reset background image settings');
            }, 100); // Small delay to ensure reset completes first
        });

        console.log('Enhanced reset config to clear background image');
    }

    // Apply all enhancements
    enhanceThemeObjects();
    enhanceApplyTheme();
    enhanceUpdateThemePreview();
    enhanceSaveConfiguration();
    enhanceLoadSavedConfig();
    enhanceResetConfig();

    console.log('Background image patch applied successfully!');
    console.log('You can now use the AI Theme Generator to create themes with background images.');
})();
