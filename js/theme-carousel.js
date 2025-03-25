/**
 * Theme Carousel implementation for Twitch Chat Overlay
 * 
 * This module implements a carousel to display and manage AI-generated themes.
 * It works with the theme generation system to display and apply generated themes.
 */

(function() {
    console.log('Initializing theme carousel module');
    
    // State for the theme carousel
    let generatedThemes = [];
    let carouselIndex = 0;
    
    // DOM Elements
    const carouselContainer = document.getElementById('carousel-themes');
    const prevCarouselBtn = document.querySelector('.generated-themes-carousel .prev-btn');
    const nextCarouselBtn = document.querySelector('.generated-themes-carousel .next-btn');
    const carouselIndexDisplay = document.getElementById('current-carousel-index');
    const carouselTotalDisplay = document.getElementById('total-carousel-items');
    
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
        // Set up event listeners for carousel navigation
        if (prevCarouselBtn) {
            prevCarouselBtn.addEventListener('click', () => {
                if (generatedThemes.length < 1) return;
                carouselIndex = (carouselIndex - 1 + generatedThemes.length) % generatedThemes.length;
                updateCarousel();
            });
        }
        
        if (nextCarouselBtn) {
            nextCarouselBtn.addEventListener('click', () => {
                if (generatedThemes.length < 1) return;
                carouselIndex = (carouselIndex + 1) % generatedThemes.length;
                updateCarousel();
            });
        }
        
        // Load saved themes from localStorage
        loadSavedThemes();
        
        // Patch the theme generator to use our carousel
        patchThemeGenerator();
        
        // Make carousel API available globally
        window.themeCarousel = carouselAPI;
        
        // Also expose key functions globally for other modules to use
        window.addThemeToCarousel = addThemeToCarousel;
        
        console.log('Theme carousel initialized');
    }
    
    /**
     * Add a theme to the carousel
     * @param {Object} theme - The theme object to add
     * @returns {Object} The added theme object
     */
    function addThemeToCarousel(theme) {
        console.log(`Adding theme to carousel: ${theme.name}`);
        
        // If we already have this theme based on value, skip
        const existingThemeIndex = generatedThemes.findIndex(t => t.value === theme.value);
        if (existingThemeIndex >= 0) {
            console.log(`Theme ${theme.name} already exists in carousel`);
            carouselIndex = existingThemeIndex;
            updateCarousel();
            return generatedThemes[existingThemeIndex];
        }
        
        // Add to the front of the generated themes list
        generatedThemes.unshift(theme);
        carouselIndex = 0; // Always select the newest theme
        
        // Save to localStorage for persistence
        saveThemesToLocalStorage();
        
        // Update carousel display
        updateCarousel();
        
        // Make sure the carousel UI is visible
        const carouselElement = document.getElementById('generated-themes-carousel');
        if (carouselElement) {
            carouselElement.style.display = (generatedThemes.length > 0 ? 'flex' : 'none');
        }
        
        // Fire event that a new theme has been added
        const themeAddedEvent = new CustomEvent('theme-added-to-carousel', {
            detail: { theme }
        });
        document.dispatchEvent(themeAddedEvent);
        
        return theme;
    }
    
    /**
     * Update the carousel display
     */
    function updateCarousel() {
        if (!carouselContainer) return;
        
        carouselContainer.innerHTML = '';
        
        if (generatedThemes.length === 0) {
            // No themes to show
            if (carouselIndexDisplay) carouselIndexDisplay.textContent = '0';
            if (carouselTotalDisplay) carouselTotalDisplay.textContent = '0';
            return;
        }
        
        // Loop through generated themes and create a card for each
        generatedThemes.forEach((theme, index) => {
            const card = document.createElement('div');
            card.className = 'theme-card';
            
            // Add positioning classes
            if (index === carouselIndex) {
                card.classList.add('active');
            } else if (index === (carouselIndex - 1 + generatedThemes.length) % generatedThemes.length) {
                card.classList.add('prev');
            } else if (index === (carouselIndex + 1) % generatedThemes.length) {
                card.classList.add('next');
            }
            
            // Set card background based on theme
            if (theme.backgroundImage) {
                card.style.backgroundImage = `url('${theme.backgroundImage}')`;
                card.style.backgroundSize = 'cover';
            } else {
                card.style.backgroundColor = theme.bgColor;
            }
            
            // Add theme name
            const nameLabel = document.createElement('div');
            nameLabel.className = 'theme-name';
            nameLabel.textContent = theme.name;
            card.appendChild(nameLabel);
            
            // Add color palette
            const palette = document.createElement('div');
            palette.className = 'theme-color-palette';
            ['bgColor', 'borderColor', 'textColor', 'usernameColor'].forEach(key => {
                const chip = document.createElement('span');
                chip.className = 'color-chip';
                chip.style.backgroundColor = theme[key];
                palette.appendChild(chip);
            });
            card.appendChild(palette);
            
            // Add click handler
            card.addEventListener('click', () => {
                applyThemeFromCarousel(theme);
            });
            
            carouselContainer.appendChild(card);
        });
        
        // Update index indicator
        if (carouselIndexDisplay) {
            carouselIndexDisplay.textContent = (carouselIndex + 1).toString();
        }
        if (carouselTotalDisplay) {
            carouselTotalDisplay.textContent = generatedThemes.length.toString();
        }
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
        
        // Apply border radius and box shadow if available
        if (theme.borderRadiusValue) {
            document.documentElement.style.setProperty('--chat-border-radius', theme.borderRadiusValue);
        }
        
        if (theme.boxShadowValue) {
            document.documentElement.style.setProperty('--chat-box-shadow', theme.boxShadowValue);
        }
        
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
                console.log(`Loaded ${generatedThemes.length} themes from localStorage`);
                updateCarousel();
                
                // Show carousel if we have themes
                const carouselElement = document.getElementById('generated-themes-carousel');
                if (carouselElement) {
                    carouselElement.style.display = (generatedThemes.length > 0 ? 'flex' : 'none');
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
                        description: themeData.description,
                        backgroundImage: backgroundImageDataUrl,
                        fontFamily: themeData.font_family,
                        isGenerated: true,
                        originalThemeName: themeData.theme_name,
                        variant: variantNum + 1
                    };
                    
                    // Add the theme to both carousel and available themes
                    if (window.availableThemes && Array.isArray(window.availableThemes)) {
                        // Check if theme with same name exists
                        const existingThemeIndex = window.availableThemes.findIndex(t => 
                            t.name === theme.name || t.value === theme.value);
                            
                        if (existingThemeIndex === -1) {
                            console.log(`Adding new theme to available themes: ${theme.name}`);
                            window.availableThemes.push(theme);
                        }
                    }
                    
                    // Add to carousel
                    addThemeToCarousel(theme);
                }
            });
        }
    }
    
    // Return the carousel API for modules that load this script directly
    return carouselAPI;
})();