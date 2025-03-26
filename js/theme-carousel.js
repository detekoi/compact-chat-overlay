/**
 * Theme Carousel implementation for Twitch Chat Overlay
 * 
 * This module implements a carousel to store, manage, and apply AI-generated themes.
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
        // Load saved themes from localStorage
        loadSavedThemes();
        
        // Add CSS handler for border-radius preset names
        addPresetCSSHandler();
        
        // Patch the theme generator to integrate with main theme carousel
        patchThemeGenerator();
        
        // Make carousel API available globally
        window.themeCarousel = carouselAPI;
        
        // Also expose key functions globally for other modules to use
        window.addThemeToCarousel = addThemeToCarousel;
        
        console.log('Theme carousel initialized');
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
                    if (typeof window.updateThemeDisplay === 'function') {
                        window.updateThemeDisplay();
                    }
                }
                
                // Update the theme display if function exists
                if (typeof window.updateThemePreview === 'function') {
                    window.updateThemePreview(theme);
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
        }

        // Update the theme preview to reflect all applied settings
        if (typeof window.updatePreviewFromCurrentSettings === 'function') {
            window.updatePreviewFromCurrentSettings();
        }
    }

    /**
     * Save the generated themes to localStorage
     */
    function saveThemesToLocalStorage() {
        try {
            // Limit to 10 themes to avoid storage issues
            const themesToSave = generatedThemes.slice(0, 10);
            localStorage.setItem('generatedThemes', JSON.stringify(themesToSave));
            console.log(`Saved ${themesToSave.length} themes to localStorage`);
        } catch (error) {
            console.error('Error saving themes to localStorage:', error);
        }
    }
    
    /**
     * Load saved themes from localStorage
     */
    function loadSavedThemes() {
        try {
            const savedThemes = localStorage.getItem('generatedThemes');
            if (savedThemes) {
                generatedThemes = JSON.parse(savedThemes);
                console.log(`Loaded ${generatedThemes.length} saved generated themes from localStorage`);
                
                // Add any saved themes to availableThemes if they don't already exist
                if (window.availableThemes && Array.isArray(window.availableThemes)) {
                    let themesAdded = 0;
                    
                    generatedThemes.forEach(theme => {
                        // Check if theme with same name/value exists in availableThemes
                        const existingThemeIndex = window.availableThemes.findIndex(t => 
                            t.value === theme.value || t.name === theme.name);
                            
                        if (existingThemeIndex === -1) {
                            window.availableThemes.unshift(theme);
                            themesAdded++;
                        }
                    });
                    
                    if (themesAdded > 0) {
                        console.log(`Added ${themesAdded} saved generated themes to main theme carousel`);
                        
                        // Update the theme display if currentThemeIndex is 0 (to show the first generated theme)
                        if (window.currentThemeIndex === 0 && typeof window.updateThemeDisplay === 'function') {
                            window.updateThemeDisplay();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading themes from localStorage:', error);
            // Reset to empty to avoid issues
            generatedThemes = [];
        }
    }
    
    /**
     * Patch the theme generator to work with our carousel
     */
    function patchThemeGenerator() {
        // Listen for theme generation events from retry-theme-generator.js
        document.addEventListener('theme-generated', function(event) {
            if (event.detail && event.detail.theme) {
                addThemeToCarousel(event.detail.theme);
            }
        });
        
        // Also hook into the generateThemeBtn's theme-data-received event
        const generateThemeBtn = document.getElementById('generate-theme-btn');
        if (generateThemeBtn) {
            generateThemeBtn.addEventListener('theme-data-received', function(event) {
                console.log('Received theme-data-received event');
                if (event.detail && event.detail.themeData) {
                    const themeData = event.detail.themeData;
                    const backgroundImage = event.detail.backgroundImage;
                    const backgroundImageDataUrl = backgroundImage ? 
                        `data:${backgroundImage.mimeType};base64,${backgroundImage.data}` : null;
                    
                    console.log(`Processing theme '${themeData.theme_name}' with${backgroundImage ? '' : 'out'} background image`);
                    
                    // Create unique theme ID
                    const propsHash = `${themeData.background_color}-${themeData.border_color}-${themeData.text_color}-${themeData.username_color}`.replace(/[^a-z0-9]/gi, '').substring(0, 8);
                    const newThemeValue = `generated-${Date.now()}-${propsHash}-${Math.floor(Math.random() * 1000)}`;
                    
                    // Get border radius and box shadow values
                    const borderRadiusValues = {
                        "None": "0px",
                        "Subtle": "8px",
                        "Rounded": "16px",
                        "Pill": "24px"
                    };
                    
                    const boxShadowValues = {
                        "None": "none",
                        "Soft": "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
                        "Simple 3D": "rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px",
                        "Intense 3D": "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                        "Sharp": "8px 8px 0px 0px rgba(0, 0, 0, 0.9)"
                    };
                    
                    const borderRadiusValue = borderRadiusValues[themeData.border_radius] || "8px";
                    const boxShadowValue = boxShadowValues[themeData.box_shadow] || boxShadowValues["Soft"];
                    
                    // Check for existing themes with same name to add variant number
                    const existingThemesWithSameName = generatedThemes.filter(t => 
                        t.originalThemeName === themeData.theme_name);
                    
                    const variantNum = existingThemesWithSameName.length;
                    const nameSuffix = variantNum > 0 ? ` (Variant ${variantNum + 1})` : '';
                    
                    // Create the theme object
                    const theme = {
                        name: themeData.theme_name + nameSuffix,
                        value: newThemeValue,
                        bgColor: themeData.background_color,
                        borderColor: themeData.border_color,
                        textColor: themeData.text_color,
                        usernameColor: themeData.username_color,
                        borderRadius: themeData.border_radius || 'Subtle',
                        borderRadiusValue: borderRadiusValue,
                        boxShadow: themeData.box_shadow || 'Soft',
                        boxShadowValue: boxShadowValue,
                        // Store both the name and the CSS values for clarity
                        description: themeData.description,
                        backgroundImage: backgroundImageDataUrl,
                        fontFamily: themeData.font_family,
                        isGenerated: true,
                        originalThemeName: themeData.theme_name,
                        variant: variantNum + 1
                    };
                    
                    // Add the theme using our integration function
                    addThemeToCarousel(theme);
                }
            });
        }
    }
    
    // Return the carousel API for modules that load this script directly
    return carouselAPI;
})();
