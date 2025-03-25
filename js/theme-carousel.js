/**
 * Theme Carousel and Enhanced Loading Animation
 * 
 * This script adds carousel functionality for generated themes
 * and improves the loading animation during theme generation.
 */

(function() {
    console.log('Initializing theme carousel...');

    // Track generated themes locally
    let generatedThemes = [];
    let carouselIndex = 0;

    // DOM Elements
    let carousel, carouselThemes, prevBtn, nextBtn, currentIndexEl, totalItemsEl;
    
    // Initialize the carousel when DOM is loaded
    function initCarousel() {
        carousel = document.getElementById('generated-themes-carousel');
        if (!carousel) {
            console.error('Carousel element not found in DOM');
            return;
        }
        
        carouselThemes = document.getElementById('carousel-themes');
        prevBtn = carousel.querySelector('.prev-btn');
        nextBtn = carousel.querySelector('.next-btn');
        currentIndexEl = document.getElementById('current-carousel-index');
        totalItemsEl = document.getElementById('total-carousel-items');
        
        if (!carouselThemes || !prevBtn || !nextBtn) {
            console.error('Required carousel elements not found');
            return;
        }
        
        // Add event listeners
        prevBtn.addEventListener('click', showPreviousTheme);
        nextBtn.addEventListener('click', showNextTheme);
        
        // Add hover helper message
        carousel.title = "Click on a theme to apply it";
        
        // Initialize arrays if needed
        if (!generatedThemes) {
            generatedThemes = [];
        }
        
        console.log('Theme carousel initialized');
    }

    // Navigate to the previous theme
    function showPreviousTheme() {
        if (generatedThemes.length === 0) return;
        
        carouselIndex = (carouselIndex - 1 + generatedThemes.length) % generatedThemes.length;
        updateCarousel();
    }

    // Navigate to the next theme
    function showNextTheme() {
        if (generatedThemes.length === 0) return;
        
        carouselIndex = (carouselIndex + 1) % generatedThemes.length;
        updateCarousel();
    }

    // Update the carousel display
    function updateCarousel() {
        if (!carouselThemes) {
            console.error('Carousel themes container not found');
            return;
        }
        
        // Initialize generatedThemes if not already done
        if (!generatedThemes) {
            generatedThemes = [];
            console.log('Initialized generatedThemes array in updateCarousel');
        }
        
        if (generatedThemes.length === 0) {
            console.log('No themes to display in carousel');
            return;
        }
        
        // Make sure the carousel is visible
        const carouselElement = document.getElementById('generated-themes-carousel');
        if (carouselElement && carouselElement.style.display !== 'flex') {
            carouselElement.style.display = 'flex';
            console.log('Made carousel visible in updateCarousel');
            
            // Show a notification to the user about the carousel
            if (typeof addSystemMessage === 'function' && generatedThemes.length > 1) {
                addSystemMessage(`${generatedThemes.length} themes available in the carousel. Click to apply.`);
            }
        }
        
        console.log(`Updating carousel with ${generatedThemes.length} themes`);
        
        // Clear existing content
        carouselThemes.innerHTML = '';
        
        // Add theme cards
        generatedThemes.forEach((theme, index) => {
            const card = document.createElement('div');
            card.className = 'theme-card';
            
            // Determine position
            if (index === carouselIndex) {
                card.classList.add('active');
            } else if ((index === carouselIndex - 1) || (carouselIndex === 0 && index === generatedThemes.length - 1)) {
                card.classList.add('prev');
            } else if ((index === carouselIndex + 1) || (carouselIndex === generatedThemes.length - 1 && index === 0)) {
                card.classList.add('next');
            }
            
            // Set background if available
            if (theme.backgroundImage) {
                card.style.backgroundImage = `url('${theme.backgroundImage}')`;
            } else {
                card.style.backgroundColor = theme.bgColor;
                // Add a text color that contrasts with the background
                const bgColor = theme.bgColor.toLowerCase();
                if (bgColor.includes('rgba')) {
                    // For rgba colors, check the first three values
                    const rgbPart = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (rgbPart) {
                        const [_, r, g, b] = rgbPart;
                        const brightness = (parseInt(r) * 299 + parseInt(g) * 587 + parseInt(b) * 114) / 1000;
                        card.style.color = brightness > 125 ? '#000000' : '#ffffff';
                    } else {
                        card.style.color = '#ffffff'; // Default to white text
                    }
                } else if (bgColor.includes('#') || bgColor.includes('rgb')) {
                    // For hex or rgb colors, use a simple approach
                    const isDark = bgColor.includes('#') ? 
                        bgColor.replace('#', '').substring(0, 2) < '88' : 
                        bgColor.includes('(0,') || bgColor.includes('(0, ') || 
                        bgColor.includes('(1,') || bgColor.includes('(1, ');
                    
                    card.style.color = isDark ? '#ffffff' : '#000000';
                } else {
                    card.style.color = '#ffffff'; // Default to white text
                }
            }
            
            // Set theme name and create a structure to show colors
            const nameElement = document.createElement('div');
            nameElement.className = 'theme-name';
            nameElement.textContent = theme.name;
            
            // Add color chips to show the theme's color palette
            const colorPalette = document.createElement('div');
            colorPalette.className = 'theme-color-palette';
            
            // Create color chips for the main colors
            const bgColorChip = document.createElement('span');
            bgColorChip.className = 'color-chip bg-color';
            bgColorChip.style.backgroundColor = theme.bgColor;
            bgColorChip.title = 'Background Color';
            
            const borderColorChip = document.createElement('span');
            borderColorChip.className = 'color-chip border-color';
            borderColorChip.style.backgroundColor = theme.borderColor;
            borderColorChip.title = 'Border Color';
            
            const textColorChip = document.createElement('span');
            textColorChip.className = 'color-chip text-color';
            textColorChip.style.backgroundColor = theme.textColor;
            textColorChip.title = 'Text Color';
            
            const usernameColorChip = document.createElement('span');
            usernameColorChip.className = 'color-chip username-color';
            usernameColorChip.style.backgroundColor = theme.usernameColor;
            usernameColorChip.title = 'Username Color';
            
            // Add the color chips to the palette
            colorPalette.appendChild(bgColorChip);
            colorPalette.appendChild(borderColorChip);
            colorPalette.appendChild(textColorChip);
            colorPalette.appendChild(usernameColorChip);
            
            // Add the name and palette to the card
            card.appendChild(nameElement);
            card.appendChild(colorPalette);
            
            // Add click handler to select this theme
            card.addEventListener('click', () => {
                selectTheme(index);
            });
            
            carouselThemes.appendChild(card);
        });
        
        // Update indicators
        if (currentIndexEl && totalItemsEl) {
            currentIndexEl.textContent = carouselIndex + 1;
            totalItemsEl.textContent = generatedThemes.length;
        }
    }

    // Select a theme from the carousel
    function selectTheme(index) {
        console.log(`Selecting theme at index ${index}`);
        
        if (index >= 0 && index < generatedThemes.length) {
            // Update carousel index
            carouselIndex = index;
            
            const selectedTheme = generatedThemes[index];
            console.log(`Selected theme: ${selectedTheme.name}`);
            
            // Apply theme directly to the root element
            const root = document.documentElement;
            
            // Apply colors
            root.style.setProperty('--chat-bg-color', selectedTheme.bgColor);
            root.style.setProperty('--chat-border-color', selectedTheme.borderColor);
            root.style.setProperty('--chat-text-color', selectedTheme.textColor);
            root.style.setProperty('--username-color', selectedTheme.usernameColor);
            
            // Apply border radius (use the value directly if available)
            if (selectedTheme.borderRadiusValue) {
                root.style.setProperty('--chat-border-radius', selectedTheme.borderRadiusValue);
                console.log(`Applied border radius: ${selectedTheme.borderRadiusValue}`);
            } else {
                // Get border radius from preset name
                const borderRadiusMap = {
                    "None": "0px",
                    "Subtle": "8px",
                    "Rounded": "16px",
                    "Pill": "24px"
                };
                const borderRadiusValue = borderRadiusMap[selectedTheme.borderRadius] || "8px";
                root.style.setProperty('--chat-border-radius', borderRadiusValue);
                console.log(`Applied border radius from name: ${selectedTheme.borderRadius} -> ${borderRadiusValue}`);
            }
            
            // Set box shadow - use the boxShadowValue if already available
            if (selectedTheme.boxShadowValue) {
                document.getElementById('chat-container').style.boxShadow = selectedTheme.boxShadowValue;
                console.log(`Applied box shadow value directly: ${selectedTheme.boxShadowValue.substring(0, 30)}...`);
            } else {
                // Otherwise map from preset name
                const boxShadowMap = {
                    "None": "none",
                    "Soft": "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
                    "Simple 3D": "rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px",
                    "Intense 3D": "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px",
                    "Sharp": "8px 8px 0px 0px rgba(0, 0, 0, 0.9)"
                };
                const boxShadowValue = boxShadowMap[selectedTheme.boxShadow] || boxShadowMap["Soft"];
                document.getElementById('chat-container').style.boxShadow = boxShadowValue;
                console.log(`Applied box shadow from name: ${selectedTheme.boxShadow} -> ${boxShadowValue.substring(0, 30)}...`);
            }
            
            // If theme isn't in available themes yet, add it
            if (window.availableThemes) {
                const availableThemeIndex = window.availableThemes.findIndex(t => t.value === selectedTheme.value);
                
                if (availableThemeIndex >= 0) {
                    // Theme exists, select it
                    window.currentThemeIndex = availableThemeIndex;
                    console.log(`Found theme in availableThemes at index ${availableThemeIndex}`);
                } else {
                    // Theme doesn't exist in available themes, add it
                    window.availableThemes.unshift(selectedTheme);
                    window.currentThemeIndex = 0;
                    console.log('Added theme to availableThemes');
                }
                
                // Update theme display UI
                if (window.updateThemeDisplay && typeof window.updateThemeDisplay === 'function') {
                    window.updateThemeDisplay();
                    console.log('Called updateThemeDisplay');
                } else {
                    console.warn('updateThemeDisplay function not found');
                }
                
                // Update current theme display text
                const currentThemeDisplay = document.getElementById('current-theme');
                if (currentThemeDisplay) {
                    currentThemeDisplay.textContent = selectedTheme.name;
                }
                
                // Apply background image if available
                if (selectedTheme.backgroundImage) {
                    console.log('Applying background image to theme');
                    document.documentElement.style.setProperty('--chat-bg-image', `url("${selectedTheme.backgroundImage}")`);
                    document.documentElement.style.setProperty('--popup-bg-image', `url("${selectedTheme.backgroundImage}")`);
                    
                    // Also apply to chat container
                    const chatContainer = document.getElementById('chat-container');
                    if (chatContainer) {
                        chatContainer.style.backgroundImage = `url("${selectedTheme.backgroundImage}")`;
                        chatContainer.style.backgroundRepeat = 'repeat';
                        chatContainer.style.backgroundSize = 'auto';
                    }
                    
                    // Apply to theme preview
                    const themePreview = document.getElementById('theme-preview');
                    if (themePreview) {
                        themePreview.style.backgroundImage = `url("${selectedTheme.backgroundImage}")`;
                        themePreview.style.backgroundRepeat = 'repeat';
                        themePreview.style.backgroundSize = 'auto';
                    }
                    
                    // Also apply to popup container if it exists
                    const popupContainer = document.getElementById('popup-container');
                    if (popupContainer) {
                        popupContainer.style.backgroundImage = `url("${selectedTheme.backgroundImage}")`;
                        popupContainer.style.backgroundRepeat = 'repeat';
                        popupContainer.style.backgroundSize = 'auto';
                    }
                } else {
                    console.log('No background image, clearing any existing background');
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
                if (selectedTheme.fontFamily) {
                    console.log(`Setting font to ${selectedTheme.fontFamily}`);
                    root.style.setProperty('--font-family', selectedTheme.fontFamily);
                    
                    // Also update the font selection UI if available
                    if (window.availableFonts && Array.isArray(window.availableFonts) && typeof window.updateFontDisplay === 'function') {
                        // Find matching font
                        const fontIndex = window.availableFonts.findIndex(f => 
                            f.name === selectedTheme.fontFamily || f.value.includes(selectedTheme.fontFamily));
                        if (fontIndex >= 0) {
                            window.currentFontIndex = fontIndex;
                            window.updateFontDisplay();
                        }
                    }
                }
                
                // Add system message about selected theme
                if (typeof addSystemMessage === 'function') {
                    addSystemMessage(`Applied theme: ${selectedTheme.name}`);
                }
                
                // Update carousel display
                updateCarousel();
            } else {
                console.warn('window.availableThemes not found');
            }
        } else {
            console.warn(`Invalid theme index: ${index}`);
        }
    }

    // Enhance the theme loading indicator
    function enhanceLoadingIndicator() {
        const loadingIndicator = document.getElementById('theme-loading-indicator');
        const loadingStatus = document.getElementById('loading-status');
        const spinner = loadingIndicator ? loadingIndicator.querySelector('.spinner') : null;
        
        if (!loadingIndicator || !loadingStatus) return;
        
        // Original functions to track
        const originalShowLoading = function() {
            loadingIndicator.style.display = 'flex';
            loadingStatus.textContent = 'Generating...';
            if (spinner) spinner.classList.remove('retrying');
        };
        
        const originalUpdateLoading = function(status) {
            loadingStatus.textContent = status;
            // If this is a retry, add the retrying class to the spinner
            if (status.includes('Retrying') && spinner) {
                spinner.classList.add('retrying');
            }
        };
        
        const originalHideLoading = function() {
            loadingIndicator.style.display = 'none';
            loadingStatus.textContent = 'Generating...';
            if (spinner) spinner.classList.remove('retrying');
        };
        
        // Make these functions available globally
        // Expose loading indicator control functions
        const themeLoading = {
            show: originalShowLoading,
            update: originalUpdateLoading,
            hide: originalHideLoading
        };
        
        // Make the loading indicator controls available to other modules
        return themeLoading;
    }

    // Add a theme to the carousel
    function addThemeToCarousel(theme) {
        if (!theme || !theme.name) {
            console.warn('Attempted to add invalid theme to carousel');
            return;
        }
        
        console.log(`Attempting to add theme "${theme.name}" to carousel`, theme);

        // Initialize generatedThemes if it doesn't exist
        if (!generatedThemes) {
            generatedThemes = [];
            console.log('Initialized generatedThemes array');
        }
        
        // Check if theme is already in carousel - use a more detailed comparison
        const existingIndex = generatedThemes.findIndex(t => {
            // If values match exactly, it's definitely the same theme
            if (t.value === theme.value && t.value !== undefined) {
                return true;
            }
            
            // If names match but we have different properties, consider it a unique theme
            if (t.name === theme.name) {
                // Check if core properties are different
                if (t.bgColor !== theme.bgColor ||
                    t.borderColor !== theme.borderColor ||
                    t.textColor !== theme.textColor ||
                    t.usernameColor !== theme.usernameColor ||
                    t.fontFamily !== theme.fontFamily) {
                    // Properties differ - treat as a new theme
                    return false;
                }
                // Same name with same properties - consider it the same theme
                return true;
            }
            
            // Different name - different theme
            return false;
        });
            
        if (existingIndex !== -1) {
            // If this theme already exists but now has a background image while the existing one doesn't,
            // update the existing theme with the background image
            if (theme.backgroundImage && !generatedThemes[existingIndex].backgroundImage) {
                console.log(`Updating existing theme "${theme.name}" with a background image`);
                generatedThemes[existingIndex].backgroundImage = theme.backgroundImage;
                
                // Move this updated theme to the start of the array
                const updatedTheme = generatedThemes.splice(existingIndex, 1)[0];
                generatedThemes.unshift(updatedTheme);
                
                // Reset carousel index
                carouselIndex = 0;
                
                // Update the carousel display
                updateCarousel();
                
                return;
            }
            
            console.log(`Theme "${theme.name}" already in carousel, skipping`);
            return;
        }
        
        console.log(`Adding theme "${theme.name}" to carousel`);
        
        // Add to generated themes array
        generatedThemes.unshift(theme);
        
        // Limit to last 10 themes to avoid memory issues
        if (generatedThemes.length > 10) {
            generatedThemes = generatedThemes.slice(0, 10);
        }
        
        // Show carousel if hidden or force show it
        if (carousel) {
            // Always make sure carousel is visible
            carousel.style.display = 'flex';
            
            // Show a brief animation to draw attention to the carousel
            carousel.style.animation = 'highlight 2s ease-in-out';
            setTimeout(() => {
                carousel.style.animation = 'none';
            }, 2000);
            
            console.log('Made carousel visible');
        } else {
            console.warn('Carousel element not found in DOM');
        }
        
        // Reset index to show the newest theme
        carouselIndex = 0;
        
        // Update the carousel display
        updateCarousel();
        
        // Show message if this is the second theme (first was already displayed in original function)
        if (generatedThemes.length === 2 && typeof addSystemMessage === 'function') {
            addSystemMessage('Multiple themes available in the carousel. Click on a theme to apply it!');
        } else if (generatedThemes.length > 2 && generatedThemes.length % 2 === 0 && typeof addSystemMessage === 'function') {
            // Remind users periodically that they can use the carousel
            addSystemMessage(`${generatedThemes.length} themes now available in the carousel.`);
        }
    };

    // Hook into the theme generation process
    function patchThemeGenerator() {
        // Listen for theme generation events from retry-theme-generator.js
        document.addEventListener('theme-generated', function(event) {
            if (event.detail && event.detail.theme) {
                addThemeToCarousel(event.detail.theme);
            }
        });
            
            // Also hook directly into the generateThemeBtn click event 
            // to capture all themes including those that don't have background images
            const generateThemeBtn = document.getElementById('generate-theme-btn');
            if (generateThemeBtn) {
                // Listen for direct API responses coming back
                const originalClick = generateThemeBtn.onclick;
                
                // Remove fetch interception code that's no longer used
                // We're using the event-based approach instead
                /*
                // This code was causing syntax errors:
                const originalFetch = window.fetch;
                window.fetch = async function(...args) {
                    // Only intercept calls to the theme generator API
                    if (args[0] === 'http://localhost:8091/api/generate-theme' || 
                        (typeof args[0] === 'object' && args[0].url === 'http://localhost:8091/api/generate-theme')) {
                        console.log('Fetch interceptor active for theme generation API');
                        
                        try {
                            const response = await originalFetch.apply(this, args);
                */
                            
                            /* 
                            // Clone the response so we can use it twice
                            const clonedResponse = response.clone();
                            
                            // If successful or receiving a retry response (202), try to extract theme data
                            if (response.ok || response.status === 202) {
                                try {
                                    const data = await clonedResponse.json();
                            */
                                    if (data.themeData) {
                // We replaced the fetch interceptor approach with event-based listeners.
                // See the 'theme-generated' event listener above.
                                        
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
                                        
                                        // Add theme to available themes if not already there
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
                                        window.addThemeToCarousel(theme);
                                        
                                        // Log for debugging
                                        console.log(`Fetch interceptor added theme "${theme.name}" to carousel${backgroundImageDataUrl ? ' with background image' : ''}`);
                                    }
                // End of the commented-out fetch interceptor code
                
                // Listen for our custom event
                generateThemeBtn.addEventListener('theme-data-received', function(event) {
                    console.log('Received theme-data-received event');
                    // Check if we have theme data in the event
                    if (event.detail && event.detail.themeData) {
                        const themeData = event.detail.themeData;
                        const backgroundImage = event.detail.backgroundImage;
                        const backgroundImageDataUrl = backgroundImage ? 
                            `data:${backgroundImage.mimeType};base64,${backgroundImage.data}` : null;
                        
                        console.log(`Processing theme '${themeData.theme_name}' with${backgroundImage ? '' : 'out'} background image`);
                        
                        // Make themes with same name but different properties more unique
                        const propsHash = `${themeData.background_color}-${themeData.border_color}-${themeData.text_color}-${themeData.username_color}`.replace(/[^a-z0-9]/gi, '').substring(0, 8);
                        const newThemeValue = `generated-${Date.now()}-${propsHash}-${Math.floor(Math.random() * 1000)}`;
                        
                        // Get border radius and box shadow values from presets if needed
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
                        
                        // Get the CSS values for border radius and box shadow
                        const borderRadiusValue = borderRadiusValues[themeData.border_radius] || "8px";
                        const boxShadowValue = boxShadowValues[themeData.box_shadow] || boxShadowValues["Soft"];
                        
                        // Add variant number to themes with the same name
                        // Get count of existing themes with the same name
                        const existingThemesWithSameName = window.generatedThemes ? 
                            window.generatedThemes.filter(t => t.name.startsWith(themeData.theme_name)) : [];
                        
                        const variantNum = existingThemesWithSameName.length;
                        const nameSuffix = variantNum > 0 ? ` (Variant ${variantNum + 1})` : '';
                        
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
                        
                        // Add theme to available themes if not already there
                        if (window.availableThemes && Array.isArray(window.availableThemes)) {
                            if (!window.availableThemes.some(t => t.name === theme.name)) {
                                window.availableThemes.push(theme);
                            }
                        }
                        
                        // Add to the carousel
                        window.addThemeToCarousel(theme);
                        
                        // Log for debugging
                        console.log(`Event listener added theme "${theme.name}" to carousel${backgroundImageDataUrl ? ' with background image' : ''}`);
                    }
                });
            }
            
            console.log('Theme generator patched to support carousel');
        }
    }

    // Sync generated themes with available themes
    function syncAvailableThemes() {
        // If we already have themes in availableThemes, add them to the carousel
        const availableThemes = window.availableThemes;
        if (availableThemes && Array.isArray(availableThemes)) {
            const existingGeneratedThemes = availableThemes.filter(theme => theme.isGenerated);
            
            if (existingGeneratedThemes.length > 0) {
                console.log(`Found ${existingGeneratedThemes.length} previously generated themes`);
                
                // Add all generated themes to the carousel
                existingGeneratedThemes.forEach(theme => {
                    addThemeToCarousel(theme);
                });
                
                // Show the carousel if we have themes
                if (carousel && generatedThemes.length > 0) {
                    carousel.style.display = 'flex';
                }
            }
        }
    }
    
    // Initialize when the DOM is loaded
    function init() {
        // Ensure the CSS is loaded
        if (!document.querySelector('link[href="js/theme-carousel.css"]')) {
            console.log('Adding theme-carousel.css link to head');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'js/theme-carousel.css';
            document.head.appendChild(link);
        }
        
        // Add some direct inline styles to ensure basic visibility
        const style = document.createElement('style');
        style.textContent = `
            .generated-themes-carousel {
                display: flex !important;
                flex-direction: column !important;
                margin-top: 10px !important;
                padding: 10px !important;
                border: 1px solid #555 !important;
                border-radius: 8px !important;
            }
            .carousel-themes {
                height: 70px !important;
                position: relative !important;
                overflow: hidden !important;
                border: 1px solid #555 !important;
            }
            .theme-card {
                position: absolute !important;
                width: 100% !important;
                height: 100% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-weight: bold !important;
                cursor: pointer !important;
            }
            .theme-card.active {
                transform: translateX(0) !important;
            }
        `;
        document.head.appendChild(style);
        
        initCarousel();
        enhanceLoadingIndicator();
        patchThemeGenerator();
        
        // Wait a moment before syncing available themes
        // This ensures all other scripts have initialized
        setTimeout(() => {
            syncAvailableThemes();
            
            // Make the carousel visible immediately
            const carousel = document.getElementById('generated-themes-carousel');
            if (carousel) {
                console.log('Forcing carousel visibility');
                carousel.style.display = 'flex';
                carousel.style.visibility = 'visible';
                carousel.style.opacity = '1';
            }
            
            // Also add an obvious info message to prompt users to use the carousel
            if (typeof addSystemMessage === 'function') {
                setTimeout(() => {
                    if (generatedThemes && generatedThemes.length > 0) {
                        addSystemMessage('Theme carousel enabled! Multiple themes will be saved here.');
                    }
                }, 1000);
            }
            
            // Export carousel functionality for other modules
            console.log('Carousel initialized and ready to use');
            
            // Return API for other modules to use
            return {
                addTheme: addThemeToCarousel,
                updateCarousel: updateCarousel,
                selectTheme: selectTheme,
                getThemes: () => generatedThemes.slice() // Return a copy of the themes array
            };
        }, 500);
    }

    // Create and export the carousel API
    let carouselAPI;
    
    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            carouselAPI = init();
            // Make the API available to other modules
            window.themeCarousel = carouselAPI;
        });
    } else {
        carouselAPI = init();
        // Make the API available to other modules
        window.themeCarousel = carouselAPI;
    }
    
    // Return the carousel API for modules that load this script directly
    return carouselAPI;
})();