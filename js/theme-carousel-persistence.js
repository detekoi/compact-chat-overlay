/**
 * Theme Carousel Persistence
 * 
 * This script adds the ability to save favorite themes from the carousel
 * to localStorage and restore them between sessions.
 */

(function() {
    console.log('Initializing theme persistence module...');

    // Storage configuration
    const STORAGE_KEY = 'twitch-chat-overlay-saved-themes';
    const MAX_SAVED_THEMES = 5; // Maximum number of themes to save permanently

    // Create theme persistence UI elements
    function createPersistenceUI() {
        // Find the theme buttons container (in the main theme selector)
        const themeContainer = document.getElementById('theme-buttons');
        if (!themeContainer) {
            console.error('Theme buttons container not found for persistence UI');
            setTimeout(createPersistenceUI, 500); // Retry
            return;
        }

        // Check if UI already exists
        if (document.getElementById('theme-persistence-controls')) {
            return;
        }

        console.log('Creating theme persistence UI...');

        // Create UI container - now we'll integrate it with the main theme navigation
        const persistenceControls = document.createElement('div');
        persistenceControls.id = 'theme-persistence-controls';
        persistenceControls.className = 'theme-persistence-controls';
        persistenceControls.innerHTML = `
            <button id="save-theme-btn" class="save-theme-btn" title="Save current theme as favorite">
                ⭐
            </button>
            <div class="saved-themes-container" id="saved-themes-container" style="display: none;">
                <div class="saved-themes-header">Saved Themes</div>
                <div class="saved-themes-list" id="saved-themes-list"></div>
            </div>
        `;

        // Insert the UI into the theme navigation section
        const themeNavigation = themeContainer.querySelector('.theme-navigation');
        if (themeNavigation) {
            themeNavigation.appendChild(persistenceControls);
        } else {
            themeContainer.appendChild(persistenceControls);
        }

        // Add event listener to the save button
        const saveThemeBtn = document.getElementById('save-theme-btn');
        if (saveThemeBtn) {
            saveThemeBtn.addEventListener('click', saveCurrentTheme);
        }

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .theme-persistence-controls {
                margin-top: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 100%;
                align-items: center;
            }
            
            .save-theme-btn {
                background-color: #2a2a2a;
                border: 1px solid var(--chat-border-color, #555);
                color: #ffffff;
                border-radius: 50%;
                cursor: pointer;
                width: 25px;
                height: 25px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            
            .save-theme-btn:hover {
                background-color: #404040;
            }
            
            .saved-themes-container {
                width: 100%;
                border: 1px solid var(--chat-border-color, #444);
                border-radius: 6px;
                padding: 8px;
                margin-top: 5px;
                background-color: rgba(0, 0, 0, 0.1);
            }
            
            .saved-themes-header {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 5px;
                text-align: center;
            }
            
            .saved-themes-list {
                display: flex;
                flex-direction: column;
                gap: 5px;
                max-height: 150px;
                overflow-y: auto;
            }
            
            .saved-theme-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 5px 8px;
                border-radius: 4px;
                background-color: rgba(0, 0, 0, 0.2);
                cursor: pointer;
                transition: background-color 0.2s;
                position: relative;
                overflow: hidden;
            }
            
            .saved-theme-item:hover {
                background-color: rgba(0, 0, 0, 0.3);
            }
            
            .saved-theme-item .theme-name {
                flex-grow: 1;
                font-size: 12px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .saved-theme-item .theme-remove {
                font-size: 12px;
                opacity: 0.7;
                cursor: pointer;
                margin-left: 5px;
                padding: 2px 5px;
                background-color: rgba(255, 0, 0, 0.2);
                border-radius: 3px;
                transition: all 0.2s;
            }
            
            .saved-theme-item .theme-remove:hover {
                opacity: 1;
                background-color: rgba(255, 0, 0, 0.4);
            }
            
            .saved-theme-item .theme-preview-color {
                width: 15px;
                height: 15px;
                border-radius: 50%;
                margin-right: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .saved-theme-item .theme-background {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: -1;
                opacity: 0.15;
                background-size: cover;
                background-position: center;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);

        // Load saved themes
        loadSavedThemes();
    }

    // Save the current theme to localStorage
    function saveCurrentTheme() {
        // Check if we have a current theme
        if (!window.generatedThemes || window.generatedThemes.length === 0) {
            if (typeof addSystemMessage === 'function') {
                addSystemMessage('No theme to save. Generate a theme first.');
            }
            console.warn('No theme to save');
            return;
        }

        // Get the currently selected theme from the carousel
        const currentThemeIndex = window.carouselIndex || 0;
        if (currentThemeIndex < 0 || currentThemeIndex >= window.generatedThemes.length) {
            console.error('Invalid theme index');
            return;
        }

        const themeToSave = window.generatedThemes[currentThemeIndex];
        console.log('Saving theme:', themeToSave.name);

        // Create a deep copy of the theme to store
        const savedTheme = JSON.parse(JSON.stringify(themeToSave));
        
        // Remove any circular references or functions
        if (savedTheme.applyTheme) delete savedTheme.applyTheme;
        
        // Ensure theme has a unique value for identification
        if (!savedTheme.value) {
            savedTheme.value = `saved-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        // Load existing saved themes
        let savedThemes = getSavedThemes();
        
        // Check if this theme is already saved (by name)
        const themeExists = savedThemes.some(theme => theme.name === savedTheme.name);
        if (themeExists) {
            // Update the existing theme if it's already saved
            savedThemes = savedThemes.map(theme => {
                if (theme.name === savedTheme.name) {
                    return savedTheme;
                }
                return theme;
            });
            
            if (typeof addSystemMessage === 'function') {
                addSystemMessage(`Updated saved theme: ${savedTheme.name}`);
            }
        } else {
            // Add the new theme to the saved themes
            savedThemes.unshift(savedTheme);
            
            // Limit to MAX_SAVED_THEMES
            if (savedThemes.length > MAX_SAVED_THEMES) {
                savedThemes = savedThemes.slice(0, MAX_SAVED_THEMES);
            }
            
            if (typeof addSystemMessage === 'function') {
                addSystemMessage(`Saved theme: ${savedTheme.name}`);
            }
        }

        // Save to localStorage
        saveSavedThemes(savedThemes);
        
        // Update the UI
        displaySavedThemes(savedThemes);
    }

    // Load saved themes from localStorage
    function getSavedThemes() {
        const savedThemeData = localStorage.getItem(STORAGE_KEY);
        if (savedThemeData) {
            try {
                return JSON.parse(savedThemeData) || [];
            } catch (error) {
                console.error('Error parsing saved themes:', error);
                return [];
            }
        }
        return [];
    }

    // Save themes to localStorage
    function saveSavedThemes(themes) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
            console.log(`Saved ${themes.length} themes to localStorage`);
        } catch (error) {
            console.error('Error saving themes to localStorage:', error);
            
            // Handle localStorage quota exceeded
            if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                console.warn('localStorage quota exceeded - trying to clean up');
                
                // Try to free up space
                if (window.storageCleanup && window.storageCleanup.cleanupLocalStorage) {
                    const cleanupResult = window.storageCleanup.cleanupLocalStorage();
                    console.log('Storage cleanup result:', cleanupResult);
                    
                    // Try saving again after cleanup
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
                        console.log('Successfully saved themes after cleanup');
                    } catch (retryError) {
                        console.error('Still unable to save themes after cleanup:', retryError);
                        if (typeof addSystemMessage === 'function') {
                            addSystemMessage('Unable to save theme due to storage limitations.');
                        }
                    }
                }
            }
        }
    }

    // Display saved themes in the UI
    function displaySavedThemes(themes) {
        const savedThemesContainer = document.getElementById('saved-themes-container');
        const savedThemesList = document.getElementById('saved-themes-list');
        
        if (!savedThemesContainer || !savedThemesList) {
            console.error('Saved themes container or list not found');
            return;
        }
        
        // Show the container if we have themes
        savedThemesContainer.style.display = themes.length > 0 ? 'block' : 'none';
        
        // Empty the list
        savedThemesList.innerHTML = '';
        
        // Add each theme to the list
        themes.forEach(theme => {
            const themeItem = document.createElement('div');
            themeItem.className = 'saved-theme-item';
            
            // Create the preview color if we have a background color
            let previewHtml = '';
            if (theme.bgColor) {
                previewHtml = `<div class="theme-preview-color" style="background-color: ${theme.bgColor};"></div>`;
            }
            
            // Create a background preview if we have a background image
            let backgroundHtml = '';
            if (theme.backgroundImage) {
                backgroundHtml = `<div class="theme-background" style="background-image: url('${theme.backgroundImage}');"></div>`;
            }
            
            themeItem.innerHTML = `
                ${backgroundHtml}
                ${previewHtml}
                <div class="theme-name">${theme.name}</div>
                <div class="theme-remove" title="Remove this theme">✕</div>
            `;
            
            // Add click event to apply the theme
            themeItem.addEventListener('click', (event) => {
                // Ignore if clicking the remove button
                if (event.target.classList.contains('theme-remove')) {
                    return;
                }
                applyTheme(theme);
            });
            
            // Add click event to remove button
            const removeBtn = themeItem.querySelector('.theme-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent theme application
                    removeTheme(theme);
                });
            }
            
            savedThemesList.appendChild(themeItem);
        });
    }

    // Apply a saved theme
    function applyTheme(theme) {
        console.log('Applying saved theme:', theme.name);
        
        // First check if the theme exists in generatedThemes
        let themeExists = false;
        let themeIndex = -1;
        
        if (window.generatedThemes && window.generatedThemes.length > 0) {
            themeIndex = window.generatedThemes.findIndex(t => 
                t.name === theme.name || t.value === theme.value);
            themeExists = themeIndex !== -1;
        }
        
        // If theme doesn't exist in generatedThemes, add it
        if (!themeExists) {
            if (!window.generatedThemes) {
                window.generatedThemes = [];
            }
            
            // Add to the beginning of generatedThemes
            window.generatedThemes.unshift(theme);
            themeIndex = 0;
        }
        
        // Update carousel index
        window.carouselIndex = themeIndex;
        
        // Use the carousel's selectTheme function if available
        if (typeof window.selectTheme === 'function') {
            window.selectTheme(themeIndex);
            
            if (typeof addSystemMessage === 'function') {
                addSystemMessage(`Applied saved theme: ${theme.name}`);
            }
        } else {
            // Direct application as a fallback
            applyThemeDirectly(theme);
        }
        
        // Update carousel display
        if (typeof window.updateCarousel === 'function') {
            window.updateCarousel();
        }
    }

    // Apply a theme directly to elements if selectTheme is not available
    function applyThemeDirectly(theme) {
        console.log('Applying theme directly:', theme.name);
        
        // Apply theme directly to the root element
        const root = document.documentElement;
        
        // Apply colors
        root.style.setProperty('--chat-bg-color', theme.bgColor);
        root.style.setProperty('--chat-border-color', theme.borderColor);
        root.style.setProperty('--chat-text-color', theme.textColor);
        root.style.setProperty('--username-color', theme.usernameColor);
        
        // Apply border radius
        if (theme.borderRadiusValue) {
            root.style.setProperty('--chat-border-radius', theme.borderRadiusValue);
        }
        
        // Set box shadow
        if (theme.boxShadowValue) {
            document.getElementById('chat-container').style.boxShadow = theme.boxShadowValue;
        }
        
        // Apply background image if available
        if (theme.backgroundImage) {
            document.documentElement.style.setProperty('--chat-bg-image', `url("${theme.backgroundImage}")`);
            document.documentElement.style.setProperty('--popup-bg-image', `url("${theme.backgroundImage}")`);
            
            // Also apply to chat container
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                chatContainer.style.backgroundImage = `url("${theme.backgroundImage}")`;
                chatContainer.style.backgroundRepeat = 'repeat';
                chatContainer.style.backgroundSize = 'auto';
            }
            
            // Apply to theme preview
            const themePreview = document.getElementById('theme-preview');
            if (themePreview) {
                themePreview.style.backgroundImage = `url("${theme.backgroundImage}")`;
                themePreview.style.backgroundRepeat = 'repeat';
                themePreview.style.backgroundSize = 'auto';
            }
            
            // Also apply to popup container if it exists
            const popupContainer = document.getElementById('popup-container');
            if (popupContainer) {
                popupContainer.style.backgroundImage = `url("${theme.backgroundImage}")`;
                popupContainer.style.backgroundRepeat = 'repeat';
                popupContainer.style.backgroundSize = 'auto';
            }
        } else {
            // Clear background image if none exists
            document.documentElement.style.setProperty('--chat-bg-image', 'none');
            document.documentElement.style.setProperty('--popup-bg-image', 'none');
            
            // Also clear from chat container
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                chatContainer.style.backgroundImage = 'none';
            }
            
            // Clear from theme preview
            const themePreview = document.getElementById('theme-preview');
            if (themePreview) {
                themePreview.style.backgroundImage = 'none';
            }
            
            // Also clear from popup container if it exists
            const popupContainer = document.getElementById('popup-container');
            if (popupContainer) {
                popupContainer.style.backgroundImage = 'none';
            }
        }
        
        // Apply font if specified
        if (theme.fontFamily) {
            root.style.setProperty('--font-family', theme.fontFamily);
        }
        
        // Update the current theme display text if available
        const currentThemeDisplay = document.getElementById('current-theme');
        if (currentThemeDisplay) {
            currentThemeDisplay.textContent = theme.name;
        }
        
        // Show application message
        if (typeof addSystemMessage === 'function') {
            addSystemMessage(`Applied saved theme: ${theme.name}`);
        }
    }

    // Remove a theme from saved themes
    function removeTheme(themeToRemove) {
        console.log('Removing saved theme:', themeToRemove.name);
        
        // Get current saved themes
        const savedThemes = getSavedThemes();
        
        // Filter out the theme to remove
        const updatedThemes = savedThemes.filter(theme => 
            theme.value !== themeToRemove.value && 
            theme.name !== themeToRemove.name);
        
        // Save the updated list
        saveSavedThemes(updatedThemes);
        
        // Update the UI
        displaySavedThemes(updatedThemes);
        
        if (typeof addSystemMessage === 'function') {
            addSystemMessage(`Removed saved theme: ${themeToRemove.name}`);
        }
    }

    // Load and display saved themes
    function loadSavedThemes() {
        const savedThemes = getSavedThemes();
        displaySavedThemes(savedThemes);
        
        if (savedThemes.length > 0) {
            console.log(`Loaded ${savedThemes.length} saved themes`);
            
            // Add saved themes to the carousel if it exists
            if (window.generatedThemes) {
                // Check for duplicates before adding
                savedThemes.forEach(theme => {
                    const exists = window.generatedThemes.some(t => 
                        t.name === theme.name || t.value === theme.value);
                        
                    if (!exists) {
                        window.generatedThemes.push(theme);
                    }
                });
                
                // Update carousel if function exists
                if (typeof window.updateCarousel === 'function') {
                    window.updateCarousel();
                }
            }
        }
    }

    // Initialize when the DOM is loaded
    function init() {
        // Expose theme storage functions
        window.themePersistence = {
            saveCurrentTheme,
            getSavedThemes,
            loadSavedThemes,
            applyTheme,
            removeTheme,
            MAX_SAVED_THEMES
        };
        
        // Create the persistence UI
        // Delay creation to ensure carousel is loaded
        setTimeout(createPersistenceUI, 500);
        
        // Make some of the carousel functions available globally
        // This will make them accessible to our persistence module
        if (typeof window.updateCarousel !== 'function') {
            window.updateCarousel = function() {
                // Find function in global scope
                for (const key in window) {
                    if (typeof window[key] === 'function' && 
                        window[key].toString().includes('updateCarousel') && 
                        window[key].toString().includes('carouselThemes')) {
                        window[key]();
                        return;
                    }
                }
            };
        }
        
        if (typeof window.selectTheme !== 'function') {
            window.selectTheme = function(index) {
                // Find function in global scope
                for (const key in window) {
                    if (typeof window[key] === 'function' && 
                        window[key].toString().includes('selectTheme') && 
                        window[key].toString().includes('window.generatedThemes')) {
                        window[key](index);
                        return;
                    }
                }
                
                // Fallback to direct application
                if (window.generatedThemes && window.generatedThemes[index]) {
                    applyThemeDirectly(window.generatedThemes[index]);
                }
            };
        }
    }

    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded, run immediately
        init();
    }
})();