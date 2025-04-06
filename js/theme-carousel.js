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
    
    // Define available fonts globally
    window.availableFonts = [
        // Custom fonts
        { name: 'Atkinson Hyperlegible', value: "'Atkinson Hyperlegible', sans-serif", description: 'Designed for high legibility and reading clarity, especially at small sizes.', custom: true },
        { name: 'EB Garamond', value: "'EB Garamond', serif", description: 'Elegant serif font with classical old-style proportions, perfect for literary or historical themes.', custom: true },
        { name: 'Tektur', value: "'Tektur', sans-serif", description: 'Modern and slightly angular typeface with a technical/sci-fi aesthetic.', custom: true },
        { name: 'MedievalSharp', value: "'MedievalSharp', cursive", description: 'Evokes a medieval/fantasy atmosphere with calligraphic details.', custom: true },
        { name: 'Press Start 2P', value: "'Press Start 2P', monospace", description: 'Pixelated retro gaming font that resembles 8-bit text.', custom: true },
        { name: 'Jacquard', value: "'Jacquard', monospace", description: 'Clean monospaced font inspired by classic computer terminals.', custom: true },
        
        // System fonts organized by categories
        // Sans-serif fonts
        { name: 'System UI', value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
        { name: 'Arial', value: "Arial, sans-serif", description: 'Classic sans-serif font with good readability.' },
        { name: 'Helvetica', value: "Helvetica, Arial, sans-serif", description: 'Clean modern sans-serif font widely used in design.' },
        { name: 'Verdana', value: "Verdana, Geneva, sans-serif", description: 'Sans-serif designed for good readability on screens.' },
        { name: 'Tahoma', value: "Tahoma, Geneva, sans-serif", description: 'Compact sans-serif with good readability at small sizes.' },
        { name: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif", description: 'Humanist sans-serif with distinctive character shapes.' },
        { name: 'Calibri', value: "Calibri, sans-serif", description: 'Modern sans-serif with rounded details and good readability.' },
        
        // Serif fonts
        { name: 'Times New Roman', value: "'Times New Roman', Times, serif", description: 'Classic serif font with traditional letterforms.' },
        { name: 'Georgia', value: "Georgia, serif", description: 'Elegant serif font designed for screen readability.' },
        { name: 'Palatino', value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", description: 'Elegant serif based on Renaissance letterforms.' },
        { name: 'Garamond', value: "Garamond, Baskerville, 'Baskerville Old Face', serif", description: 'Classical serif with elegant proportions.' }, // Note: EB Garamond is custom/imported
        
        // Monospace fonts
        { name: 'Courier New', value: "'Courier New', Courier, monospace", description: 'Classic monospaced font resembling typewriter text.' },
        { name: 'Consolas', value: "'Consolas', monaco, monospace", description: 'Modern monospaced font designed for coding.' },
        { name: 'Lucida Console', value: "'Lucida Console', Monaco, monospace", description: 'Clear monospace font with good readability.' },
        
        // Display/Decorative fonts that are commonly available
        { name: 'Impact', value: "Impact, Haettenschweiler, sans-serif", description: 'Bold condensed sans-serif font, often used for headlines.' },
        { name: 'Comic Sans MS', value: "'Comic Sans MS', cursive", description: 'Casual script-like font with a friendly appearance.' },
        { name: 'Arial Black', value: "'Arial Black', Gadget, sans-serif", description: 'Extra bold version of Arial for strong emphasis.' }
    ];
    console.log('Available fonts defined globally in theme-carousel.js');
    
    // Carousel API - publicly accessible functions
    const carouselAPI = {
        addTheme: addThemeToCarousel,
        getThemes: () => generatedThemes,
        applyTheme: applyThemeFromCarousel
    };
    
    // Make updateThemeDetails globally available
    window.updateThemeDetails = updateThemeDetails;
    
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
             {
                 name: 'Default Dark',
                 value: 'default',
                 bgColor: '#121212',
                 bgColorOpacity: 0.85,
                 borderColor: '#9147ff',
                 textColor: '#efeff1',
                 usernameColor: '#9147ff',
                 fontFamily: "'Atkinson Hyperlegible', sans-serif",
                 borderRadius: 'Subtle',
                 borderRadiusValue: '8px',
                 boxShadow: 'Soft',
                 boxShadowValue: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
                 backgroundImage: null,
                 description: 'Classic Twitch purple accents on a dark background. Balanced and readable.'
             },
             {
                 name: 'Default Light',
                 value: 'light-theme',
                 bgColor: '#ffffff',
                 bgColorOpacity: 0.9,
                 borderColor: '#cccccc',
                 textColor: '#1a1a1a',
                 usernameColor: '#9147ff',
                 fontFamily: "'Atkinson Hyperlegible', sans-serif",
                 borderRadius: 'Subtle',
                 borderRadiusValue: '8px',
                 boxShadow: 'Soft',
                 boxShadowValue: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
                 backgroundImage: null,
                 description: 'A clean, bright theme with dark text on a light background.'
             },
             {
                 name: 'Natural',
                 value: 'natural-theme',
                 bgColor: '#f5f2e6',
                 bgColorOpacity: 0.9,
                 borderColor: '#7e6852',
                 textColor: '#4e3629',
                 usernameColor: '#508d69',
                 fontFamily: "'EB Garamond', serif",
                 borderRadius: 'Rounded',
                 borderRadiusValue: '16px',
                 boxShadow: 'Simple 3D',
                 boxShadowValue: 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px',
                 backgroundImage: null,
                 description: 'Earthy tones with wood-like borders and a classic serif font.'
             },
             {
                 name: 'Transparent Dark',
                 value: 'transparent-theme',
                 bgColor: 'rgba(0, 0, 0, 0)',
                 bgColorOpacity: 0,
                 borderColor: 'transparent',
                 textColor: '#efeff1',
                 usernameColor: '#00ffea',
                 fontFamily: "'Atkinson Hyperlegible', sans-serif",
                 borderRadius: 'Subtle',
                 borderRadiusValue: '8px',
                 boxShadow: 'none',
                 boxShadowValue: 'none',
                 backgroundImage: null,
                 description: 'Minimalist dark theme with no background or border, only text.'
             },
             {
                 name: 'Sakura Pink',
                 value: 'pink-theme',
                 bgColor: '#ffdeec',
                 bgColorOpacity: 0.8,
                 borderColor: '#ff6bcb',
                 textColor: '#8e2651',
                 usernameColor: '#b81670',
                 fontFamily: "'Atkinson Hyperlegible', sans-serif",
                 borderRadius: 'Rounded',
                 borderRadiusValue: '16px',
                 boxShadow: 'Soft',
                 boxShadowValue: 'rgba(255, 107, 203, 0.2) 0px 2px 8px 0px',
                 backgroundImage: null,
                 description: 'Soft pink background with darker pink/berry text and accents.'
             },
             {
                 name: 'Cyberpunk Night',
                 value: 'cyberpunk-theme',
                 bgColor: '#0c0c28',
                 bgColorOpacity: 0.85,
                 borderColor: '#00ffb3',
                 textColor: '#00ffea',
                 usernameColor: '#ff2e97',
                 fontFamily: "'Tektur', sans-serif",
                 borderRadius: 'Sharp',
                 borderRadiusValue: '0px',
                 boxShadow: 'Sharp',
                 boxShadowValue: '8px 8px 0px 0px rgba(0, 255, 179, 0.7)',
                 backgroundImage: null,
                 description: 'Neon on dark blue. Tech font, sharp edges, and vibrant accents.'
             }
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
        
        // --- Get DOM elements for navigation buttons ---
        const prevThemeBtn = document.getElementById('prev-theme');
        const nextThemeBtn = document.getElementById('next-theme');

        // --- Add event listeners ONCE during init ---
        if (prevThemeBtn) {
            prevThemeBtn.addEventListener('click', () => {
                // Ensure window.availableThemes is populated and currentThemeIndex is valid
                if (window.availableThemes && window.availableThemes.length > 0) {
                    let currentThemeIndex = window.currentThemeIndex !== undefined ? window.currentThemeIndex : 0;
                    currentThemeIndex = (currentThemeIndex - 1 + window.availableThemes.length) % window.availableThemes.length;
                    window.currentThemeIndex = currentThemeIndex; // Update global index
                    applyAndScrollToTheme(currentThemeIndex);
                } else {
                    console.warn("Cannot navigate previous theme: availableThemes not ready.");
                }
            });
            prevThemeBtn.dataset.listenerAttached = 'true'; // Mark as attached
        } else {
            console.warn("Previous theme button (#prev-theme) not found during init.");
        }

        if (nextThemeBtn) {
            nextThemeBtn.addEventListener('click', () => {
                 // Ensure window.availableThemes is populated and currentThemeIndex is valid
                 if (window.availableThemes && window.availableThemes.length > 0) {
                    let currentThemeIndex = window.currentThemeIndex !== undefined ? window.currentThemeIndex : 0;
                    currentThemeIndex = (currentThemeIndex + 1) % window.availableThemes.length;
                    window.currentThemeIndex = currentThemeIndex; // Update global index
                    applyAndScrollToTheme(currentThemeIndex);
                 } else {
                    console.warn("Cannot navigate next theme: availableThemes not ready.");
                 }
            });
            nextThemeBtn.dataset.listenerAttached = 'true'; // Mark as attached
        } else {
            console.warn("Next theme button (#next-theme) not found during init.");
        }

        // Render the initial carousel state
        renderCarousel();
        
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
        
        // Refresh the visual carousel display
        renderCarousel();
        
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
    
    /**
     * Renders the theme cards into the carousel container.
     */
    function renderCarousel() {
        const container = document.querySelector('.theme-carousel-container');
        if (!container) return;
        
        // Create wrapper for theme cards if it doesn't exist
        let wrapper = container.querySelector('.theme-cards-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'theme-cards-wrapper';
            container.appendChild(wrapper);
        }
        
        // Clear existing cards
        wrapper.innerHTML = '';
        
        // Add theme cards
        if (window.availableThemes && window.availableThemes.length > 0) {
            window.availableThemes.forEach((theme, index) => {
                const card = createThemeCard(theme, index);
                wrapper.appendChild(card);
            });
        } else {
            wrapper.textContent = 'No themes available.';
        }
        
        // Update the theme details for the current theme
        if (window.availableThemes && window.availableThemes.length > 0 && window.currentThemeIndex !== undefined) {
            updateThemeDetails(window.availableThemes[window.currentThemeIndex]);
        } else if (window.availableThemes && window.availableThemes.length > 0) {
            // Default to the first theme if no index is set
            updateThemeDetails(window.availableThemes[0]);
        }
        
        console.log("Theme carousel rendered/updated.");
        
        // Highlight the currently active theme after rendering
        highlightActiveCard(window.availableThemes[typeof window.currentThemeIndex !== 'undefined' ? window.currentThemeIndex : 0]?.value || 'default');
    }

    /**
     * Creates a theme card element for the carousel
     * @param {Object} theme - The theme object to create a card for
     * @param {number} index - The index of the theme in window.availableThemes
     * @returns {HTMLElement} The created theme card element
     */
    function createThemeCard(theme, index) {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.dataset.themeValue = theme.value; // Add theme value as data attribute
        card.style.backgroundColor = theme.bgColor || '#121212';
        card.style.color = theme.textColor || '#efeff1';
        
        // Add theme text for better accessibility and card content visibility
        const textDiv = document.createElement('div');
        textDiv.className = 'theme-card-text';
        
        // Add name element
        const nameSpan = document.createElement('span');
        nameSpan.className = 'theme-name';
        nameSpan.textContent = theme.name || 'Unnamed Theme';
        textDiv.appendChild(nameSpan);
        
        // Set active state if this is the current theme
        if (index === window.currentThemeIndex) {
            card.classList.add('active');
        }
        
        // Add click handler
        card.addEventListener('click', () => {
            applyAndScrollToTheme(index);
        });
        
        card.appendChild(textDiv);
        return card;
    }

    /**
     * Applies the theme at the given index and scrolls the carousel to it.
     * @param {number} index - The index of the theme in window.availableThemes.
     */
    function applyAndScrollToTheme(index) {
        if (index < 0 || index >= window.availableThemes.length) {
            console.error("Invalid theme index for apply/scroll:", index);
            return;
        }
        
        const theme = window.availableThemes[index];
        if (!theme) {
            console.error("Could not find theme at index:", index);
            return;
        }
        
        // Update current theme index
        window.currentThemeIndex = index;
        
        // Apply the theme visuals using chat.js function
        if (typeof window.applyTheme === 'function') {
            window.applyTheme(theme.value);
        } else {
            console.warn("window.applyTheme function not found.");
        }
        
        // Update theme details
        updateThemeDetails(theme);
        
        // Update active state on cards
        const cards = document.querySelectorAll('.theme-card');
        cards.forEach((card, i) => {
            card.classList.toggle('active', i === index);
        });
        
        // Scroll the card into view
        const wrapper = document.querySelector('.theme-cards-wrapper');
        if (wrapper) {
            const cards = wrapper.children;
            if (cards[index]) {
                const card = cards[index];
                const scrollLeft = card.offsetLeft - (wrapper.offsetWidth - card.offsetWidth) / 2;
                wrapper.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }
    
    /**
     * Highlights the active theme card in the carousel.
     * @param {string} themeValue - The value of the theme to highlight.
     */
    function highlightActiveCard(themeValue) {
        const cardsWrapper = document.querySelector('.theme-cards-wrapper');
        if (!cardsWrapper) return;
        
        const allCards = cardsWrapper.querySelectorAll('.theme-card');
        allCards.forEach(card => {
            if (card.dataset.themeValue === themeValue) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    function updateThemeDetails(theme) {
        const nameElement = document.getElementById('selected-theme-name');
        const descElement = document.getElementById('selected-theme-description');
        
        if (nameElement && descElement) {
            nameElement.textContent = theme.name || 'Unnamed Theme';
            descElement.textContent = theme.description || 'No description available';
        }
    }

    // Return the carousel API for modules that load this script directly
    return carouselAPI;
})();
