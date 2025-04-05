/**
 * Theme Carousel implementation for Twitch Chat Overlay
 * 
 * This module implements a carousel to store, manage, and apply themes, including AI-generated ones.
 * It works with the theme generation system to integrate generated themes into the main theme carousel.
 */

(function() {
    console.log('Initializing theme carousel module');
    
    // State for the theme carousel
    let generatedThemes = [];
    
    // Carousel API - publicly accessible functions
    const carouselAPI = {
        addTheme: addThemeToCarousel,
        getThemes: () => generatedThemes,
        applyTheme: applyThemeFromCarousel
    };
    
    // Initialize the carousel when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    /**
     * Initialize the carousel
     */
    function init() {
        // Define the default themes here, creating window.availableThemes
         window.availableThemes = [
             { name: 'Default', value: 'default', bgColor: 'rgba(18, 18, 18, 0.8)', borderColor: '#9147ff', textColor: '#efeff1', usernameColor: '#9147ff', borderRadius: '8px', boxShadow: 'soft' },
             { name: 'Transparent', value: 'transparent-theme', bgColor: 'rgba(0, 0, 0, 0)', borderColor: 'transparent', textColor: '#ffffff', usernameColor: '#9147ff', borderRadius: '0px', boxShadow: 'none' },
             { name: 'Light', value: 'light-theme', bgColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#9147ff', textColor: '#0e0e10', usernameColor: '#9147ff', borderRadius: '8px', boxShadow: 'soft' },
             { name: 'Natural', value: 'natural-theme', bgColor: 'rgba(61, 43, 31, 0.85)', borderColor: '#d4ad76', textColor: '#eee2d3', usernameColor: '#98bf64', borderRadius: '16px', boxShadow: 'simple3d' },
             { name: 'Cyberpunk', value: 'cyberpunk-theme', bgColor: 'rgba(13, 12, 25, 0.85)', borderColor: '#f637ec', textColor: '#9effff', usernameColor: '#f637ec', borderRadius: '0px', boxShadow: 'sharp' },
             { name: 'Pink', value: 'pink-theme', bgColor: 'rgba(255, 222, 236, 0.85)', borderColor: '#ff6bcb', textColor: '#8e2651', usernameColor: '#b81670', borderRadius: '24px', boxShadow: 'intense3d' }
        ];
        console.log('Default themes initialized in theme-carousel.js');

        // Load saved themes from localStorage (will prepend to window.availableThemes)
        loadSavedThemes();
        
        // Add CSS handler for border-radius preset names
        addPresetCSSHandler();
        
        // AI Theme generator logic is now in theme-generator.js
        
        // Make carousel API available globally
        window.themeCarousel = carouselAPI;
        
        // Also expose key functions globally for other modules to use
        window.addThemeToCarousel = addThemeToCarousel;
        
        console.log('Theme carousel initialized');

        // Dispatch event to signal readiness
        document.dispatchEvent(new CustomEvent('theme-carousel-ready'));
        console.log('Dispatched theme-carousel-ready event');
    }
    
    /**
     * Adds a style element to handle preset border-radius and box-shadow names in CSS
     */
    function addPresetCSSHandler() {
        // Create style element
        const styleElement = document.createElement('style');
        styleElement.id = 'preset-css-handler';
        
        // Create CSS content for preset handling
        styleElement.textContent = `
            /* Border radius preset value handling */
            :root[style*="--chat-border-radius: None"] {
                --chat-border-radius: 0px !important;
            }
            :root[style*="--chat-border-radius: none"] {
                --chat-border-radius: 0px !important;
            }
            :root[style*="--chat-border-radius: Subtle"] {
                --chat-border-radius: 8px !important;
            }
            :root[style*="--chat-border-radius: subtle"] {
                --chat-border-radius: 8px !important;
            }
            :root[style*="--chat-border-radius: Rounded"] {
                --chat-border-radius: 16px !important;
            }
            :root[style*="--chat-border-radius: rounded"] {
                --chat-border-radius: 16px !important;
            }
            :root[style*="--chat-border-radius: Pill"] {
                --chat-border-radius: 24px !important;
            }
            :root[style*="--chat-border-radius: pill"] {
                --chat-border-radius: 24px !important;
            }
            
            /* Box shadow preset value handling */
            :root[style*="--chat-box-shadow: None"], 
            :root[style*="--chat-box-shadow: none"] {
                --chat-box-shadow: none !important;
            }
            :root[style*="--chat-box-shadow: Soft"], 
            :root[style*="--chat-box-shadow: soft"] {
                --chat-box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px !important;
            }
            :root[style*="--chat-box-shadow: Simple 3D"],
            :root[style*="--chat-box-shadow: simple 3d"] {
                --chat-box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px !important;
            }
            :root[style*="--chat-box-shadow: Intense 3D"],
            :root[style*="--chat-box-shadow: intense 3d"] {
                --chat-box-shadow: rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px !important;
            }
            :root[style*="--chat-box-shadow: Sharp"],
            :root[style*="--chat-box-shadow: sharp"] {
                --chat-box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 0.9) !important;
            }
        `;
        
        // Add the style element to the head
        document.head.appendChild(styleElement);
        console.log('Added preset CSS handler for border-radius and box-shadow names');
    }
    
    /**
     * Add a theme to the carousel and to the main theme selector
     * @param {Object} theme - The theme object to add
     * @returns {Object} The added theme object
     */
    function addThemeToCarousel(theme) {
        console.log(`Adding theme to main carousel: ${theme.name}`);
        
        // If we already have this theme based on value, skip
        const existingThemeIndex = generatedThemes.findIndex(t => t.value === theme.value);
        if (existingThemeIndex >= 0) {
            console.log(`Theme ${theme.name} already exists in carousel`);
            return generatedThemes[existingThemeIndex];
        }
        
        // Add to the front of the generated themes list
        generatedThemes.unshift(theme);
        
        // Save to localStorage for persistence
        saveThemesToLocalStorage();
        
        // Add to main availableThemes if it exists
        if (window.availableThemes && Array.isArray(window.availableThemes)) {
            // Check if theme with same name/value exists in availableThemes
            const existingInMainIndex = window.availableThemes.findIndex(t => 
                t.name === theme.name || t.value === theme.value);
                
            if (existingInMainIndex === -1) {
                console.log(`Adding theme to main themes carousel: ${theme.name}`);
                // Add to the front so it appears at the beginning of the carousel
                window.availableThemes.unshift(theme);
                
                // Set as current theme if we have currentThemeIndex
                if (typeof window.currentThemeIndex !== 'undefined') {
                    window.currentThemeIndex = 0;
                }
            }
        }
        
        // Fire event that a new theme has been added
        const themeAddedEvent = new CustomEvent('theme-added-to-carousel', {
            detail: { theme }
        });
        document.dispatchEvent(themeAddedEvent);
        
        return theme;
    }
    
    /**
     * Apply a theme from the carousel
     * @param {Object} theme - The theme to apply
     */
    function applyThemeFromCarousel(theme) {
        console.log(`Applying theme from carousel: ${theme.name}`);
        
        // If we have availableThemes global variable, we can use that
        if (window.availableThemes && Array.isArray(window.availableThemes)) {
            // Find the theme in the available themes array
            const themeIndex = window.availableThemes.findIndex(t => t.value === theme.value);
            
            if (themeIndex >= 0) {
                // Set as current theme and update display
                if (typeof window.currentThemeIndex !== 'undefined') {
                    window.currentThemeIndex = themeIndex;
                    if (typeof window.updateThemeDisplay === 'function') {
                        window.updateThemeDisplay();
                        return;
                    }
                }
            } else {
                // If theme doesn't exist in availableThemes yet, add it
                window.availableThemes.unshift(theme);
                window.currentThemeIndex = 0;
                if (typeof window.updateThemeDisplay === 'function') {
                    window.updateThemeDisplay();
                    return;
                }
            }
        }
        
        // Fallback - apply the theme directly
        if (typeof window.applyGeneratedTheme === 'function') {
            window.applyGeneratedTheme(theme);
        } else {
            // Minimal direct application if needed
            applyThemeDirectly(theme);
        }
    }
    
    /**
     * Apply a theme directly to the DOM (fallback method)
     * @param {Object} theme - The theme to apply
     */
    function applyThemeDirectly(theme) {
        console.log(`Direct theme application for: ${theme.name}`);
        
        // Apply CSS variables
        document.documentElement.style.setProperty('--chat-bg-color', theme.bgColor);
        document.documentElement.style.setProperty('--chat-border-color', theme.borderColor);
        document.documentElement.style.setProperty('--chat-text-color', theme.textColor);
        document.documentElement.style.setProperty('--username-color', theme.usernameColor);
        
        // Mirror to popup settings
        document.documentElement.style.setProperty('--popup-bg-color', theme.bgColor);
        document.documentElement.style.setProperty('--popup-border-color', theme.borderColor);
        document.documentElement.style.setProperty('--popup-text-color', theme.textColor);
        document.documentElement.style.setProperty('--popup-username-color', theme.usernameColor);

        // Apply font family if specified
        if (theme.fontFamily) {
            document.documentElement.style.setProperty('--font-family', theme.fontFamily);
        }
        
        // Apply background image if available
        if (theme.backgroundImage) {
            document.documentElement.style.setProperty('--chat-bg-image', `url("${theme.backgroundImage}")`);
            document.documentElement.style.setProperty('--popup-bg-image', `url("${theme.backgroundImage}")`);
        } else {
            document.documentElement.style.setProperty('--chat-bg-image', 'none');
            document.documentElement.style.setProperty('--popup-bg-image', 'none');
        }

        // Apply border radius if specified
        if (theme.borderRadius || theme.borderRadiusValue) {
            // If we have applyBorderRadius function available, use it to apply the radius
            if (typeof window.applyBorderRadius === 'function') {
                // Use the borderRadius property which is the preset name or CSS value
                window.applyBorderRadius(theme.borderRadius || theme.borderRadiusValue);
            } 
            // Fallback: directly apply the borderRadiusValue if available
            else if (theme.borderRadiusValue) {
                document.documentElement.style.setProperty('--chat-border-radius', theme.borderRadiusValue);
            }
        }

        // Apply box shadow if specified
        if (theme.boxShadow || theme.boxShadowValue) {
            // If we have applyBoxShadow function available, use it to apply the shadow
            if (typeof window.applyBoxShadow === 'function') {
                // Use the boxShadow property which is the preset name or CSS value
                window.applyBoxShadow(theme.boxShadow || theme.boxShadowValue);
            }
            // Fallback: directly apply the boxShadowValue if available
            else if (theme.boxShadowValue) {
                document.documentElement.style.setProperty('--chat-box-shadow', theme.boxShadowValue);
            }
        }
        // Update the theme preview to reflect all applied settings
        if (typeof window.updatePreviewFromCurrentSettings === 'function') {
            window.updatePreviewFromCurrentSettings();
        }
    }

    /**
     * Save the generated themes to localStorage (with compressed image)
     */
    function saveThemesToLocalStorage() {
        try {
            // Limit to 1 most recent theme (now potentially with a compressed image)
            const themesToSave = generatedThemes.slice(0, 1); 
            
            // No need to strip backgroundImage anymore, it should be the compressed version
            localStorage.setItem('generatedThemes', JSON.stringify(themesToSave));
            console.log(`Saved ${themesToSave.length} most recent generated theme(s) (with compressed image) to localStorage`);
        } catch (error) {
            console.error('Error saving themes to localStorage:', error);
             // If saving fails due to quota, log the error and notify the user.
             if (error.name === 'QuotaExceededError') {
                 console.error('Quota exceeded trying to save generated themes, even with compression.');
                 // Notify the user
                 if (typeof addSystemMessage === 'function') {
                      addSystemMessage('❌ Error: Local storage quota exceeded. Cannot save new theme image.');
                 }
             }
        }
    }
    
    /**
     * Load saved themes (potentially with compressed image) from localStorage
     */
    function loadSavedThemes() {
        try {
            const savedThemes = localStorage.getItem('generatedThemes');
            if (savedThemes) {
                // Parse the saved theme data (which might include backgroundImage)
                const loadedThemes = JSON.parse(savedThemes);
                
                // Directly use the loaded themes
                generatedThemes = loadedThemes.map(theme => ({
                    ...theme,
                    isGenerated: true // Ensure flag is set
                }));

                console.log(`Loaded ${generatedThemes.length} saved generated themes from localStorage`);
                
                // Add saved themes to availableThemes if they don't already exist
                if (window.availableThemes && Array.isArray(window.availableThemes)) {
                    let themesAdded = 0;
                    
                    generatedThemes.forEach(theme => {
                        const existingThemeIndex = window.availableThemes.findIndex(t => 
                            t.value === theme.value || t.name === theme.name);
                            
                        if (existingThemeIndex === -1) {
                            window.availableThemes.unshift(theme); 
                            themesAdded++;
                        }
                    });
                    
                    if (themesAdded > 0) {
                        console.log(`Added ${themesAdded} saved generated themes to main theme carousel`);
                        
                        if (window.currentThemeIndex === 0 && typeof window.updateThemeDisplay === 'function') {
                            window.updateThemeDisplay();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading themes from localStorage:', error);
            generatedThemes = [];
        }
    }
    
    // Return the carousel API for modules that load this script directly
    return carouselAPI;
})();
