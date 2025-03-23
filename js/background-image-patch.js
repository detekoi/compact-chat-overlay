/**
 * Twitch Chat Overlay - Background Image Patch
 * 
 * This script adds support for AI-generated tiled background graphics
 * to the Twitch Chat Overlay.
 */

(function() {
    console.log('Applying background image patch...');
    
    // Define default background image settings
    const defaultSettings = {
        imageUrl: null,
        opacity: 70 // Default to 70% opacity
    };
    
    // Ensure CSS variables exist for background images
    document.documentElement.style.setProperty('--chat-bg-image', 'none');
    document.documentElement.style.setProperty('--popup-bg-image', 'none');
    document.documentElement.style.setProperty('--bg-image-opacity', '0.7'); // Default 70% opacity
    
    // Add CSS to ensure background images are properly displayed
    const style = document.createElement('style');
    style.textContent = `
        #chat-container {
            background-image: var(--chat-bg-image);
            background-repeat: repeat;
            background-size: auto;
            background-blend-mode: normal;
            position: relative;
        }
        #chat-container::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0);
            opacity: calc(1 - var(--bg-image-opacity));
            pointer-events: none;
            z-index: 1;
        }
        .popup-message {
            background-image: var(--popup-bg-image);
            background-repeat: repeat;
            background-size: auto;
            background-blend-mode: normal;
            position: relative;
        }
        .popup-message::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0);
            opacity: calc(1 - var(--bg-image-opacity));
            pointer-events: none;
            z-index: 1;
        }
        .theme-preview {
            background-repeat: repeat;
            background-size: auto;
            background-blend-mode: normal;
        }
        
        /* Styling for the opacity slider section */
        .bg-image-opacity-container {
            margin-top: 10px;
            display: flex;
            gap: 8px;
            align-items: center;
            margin-bottom: 5px;
            width: 100%;
        }
    `;
    document.head.appendChild(style);
    
    // Add background image opacity slider to the UI
    function addOpacitySlider() {
        // Find the container for the background color options
        const bgColorContainer = document.querySelector('.config-row .color-picker');
        if (!bgColorContainer || !bgColorContainer.parentNode) return;
        
        // Create container for background image opacity slider
        const container = document.createElement('div');
        container.className = 'bg-image-opacity-container';
        container.innerHTML = `
            <span>Background Image Opacity:</span>
            <input type="range" id="bg-image-opacity" min="0" max="100" value="70" style="flex-grow: 1;">
            <span id="bg-image-opacity-value">70%</span>
        `;
        
        // Insert after the background color row
        bgColorContainer.parentNode.parentNode.insertBefore(container, bgColorContainer.parentNode.nextSibling);
        
        // Add event listener for the opacity slider
        const slider = document.getElementById('bg-image-opacity');
        const valueDisplay = document.getElementById('bg-image-opacity-value');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', () => {
                const opacity = parseInt(slider.value) / 100;
                valueDisplay.textContent = `${slider.value}%`;
                document.documentElement.style.setProperty('--bg-image-opacity', opacity);
                
                // Save the opacity setting to localStorage
                saveBackgroundImageSettings();
            });
            
            console.log('Added background image opacity slider');
        }
    }
    
    // Get current background image settings from localStorage
    function getBackgroundImageSettings() {
        const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
        const storageKey = `twitch-chat-overlay-bgimage-${sceneId}`;
        const savedSettings = localStorage.getItem(storageKey);
        
        if (savedSettings) {
            try {
                return JSON.parse(savedSettings);
            } catch (e) {
                console.error('Error parsing saved background image settings:', e);
            }
        }
        
        return {...defaultSettings}; // Return a copy of default settings
    }
    
    // Save background image settings to localStorage
    function saveBackgroundImageSettings() {
        // Clean up old images from localStorage first
        if (window.storageCleanup && window.storageCleanup.cleanupThemeImages) {
            window.storageCleanup.cleanupThemeImages();
        }
        
        const opacitySlider = document.getElementById('bg-image-opacity');
        const opacity = opacitySlider ? parseInt(opacitySlider.value) : 70;
        
        // Get current background image URL from CSS
        const bgImageStyle = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg-image');
        const urlMatch = bgImageStyle.match(/url\("([^"]+)"\)/);
        const imageUrl = urlMatch ? urlMatch[1] : null;
        
        const settings = {
            imageUrl: imageUrl,
            opacity: opacity
        };
        
        const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
        const storageKey = `twitch-chat-overlay-bgimage-${sceneId}`;
        
        localStorage.setItem(storageKey, JSON.stringify(settings));
        console.log('Saved background image settings:', settings);
    }
    
    // Load saved background image settings
    function loadSavedBackgroundImage() {
        const settings = getBackgroundImageSettings();
        
        if (settings.imageUrl) {
            document.documentElement.style.setProperty('--chat-bg-image', `url("${settings.imageUrl}")`);
            document.documentElement.style.setProperty('--popup-bg-image', `url("${settings.imageUrl}")`);
            
            // Also apply to theme preview
            const themePreview = document.getElementById('theme-preview');
            if (themePreview) {
                themePreview.style.backgroundImage = `url("${settings.imageUrl}")`;
                themePreview.style.backgroundRepeat = 'repeat';
                themePreview.style.backgroundSize = 'auto';
            }
            
            console.log('Loaded saved background image:', settings.imageUrl);
        }
        
        if (settings.opacity !== undefined) {
            const opacity = settings.opacity / 100;
            document.documentElement.style.setProperty('--bg-image-opacity', opacity);
            
            // Update slider if it exists
            const slider = document.getElementById('bg-image-opacity');
            const valueDisplay = document.getElementById('bg-image-opacity-value');
            
            if (slider) {
                slider.value = settings.opacity;
            }
            
            if (valueDisplay) {
                valueDisplay.textContent = `${settings.opacity}%`;
            }
            
            console.log('Applied background image opacity:', settings.opacity);
        }
    }
    
    // Patch the generateThemeBtn click handler
    function patchGenerateThemeBtn() {
        const generateThemeBtn = document.getElementById('generate-theme-btn');
        if (!generateThemeBtn) return;

        // Check if the button already has an event listener from retry-theme-generator.js
        if (generateThemeBtn.onclick && generateThemeBtn.onclick.toString().includes('retry')) {
            console.log('Theme button already patched by retry-theme-generator.js, integrating background image handling');
            
            // Instead of replacing the click handler, we'll listen for the response data
            generateThemeBtn.addEventListener('themeDataReady', function(e) {
                const data = e.detail;
                try {
                    if (data.themeData && data.backgroundImage) {
                        console.log('Received theme data and background image from themeDataReady event');
                        
                        // Create background image URL
                        const bgImageUrl = `data:${data.backgroundImage.mimeType};base64,${data.backgroundImage.data}`;
                        
                        // Apply the background image to all relevant elements
                        document.documentElement.style.setProperty('--chat-bg-image', `url("${bgImageUrl}")`);
                        document.documentElement.style.setProperty('--popup-bg-image', `url("${bgImageUrl}")`);
                        
                        // Also apply to theme preview
                        const themePreview = document.getElementById('theme-preview');
                        if (themePreview) {
                            themePreview.style.backgroundImage = `url("${bgImageUrl}")`;
                            themePreview.style.backgroundRepeat = 'repeat';
                            themePreview.style.backgroundSize = 'auto';
                        }
                        
                        // Save the background image settings
                        saveBackgroundImageSettings();
                    }
                } catch (error) {
                    console.error('Error handling background image from event:', error);
                }
            });
            
            return;
        }
        
        // Store the original click handler
        const originalClick = generateThemeBtn.onclick;
        generateThemeBtn.onclick = null;
        
        // Add our enhanced handler
        generateThemeBtn.addEventListener('click', async function(event) {
            // Get the theme prompt
            const themePromptInput = document.getElementById('theme-prompt');
            if (!themePromptInput) return;
            
            const prompt = themePromptInput.value.trim();
            if (!prompt) {
                alert('Please enter a game or vibe for your theme');
                return;
            }
            
            // Show loading indicator
            const themeLoadingIndicator = document.getElementById('theme-loading-indicator');
            if (themeLoadingIndicator) {
                themeLoadingIndicator.style.display = 'block';
            }
            generateThemeBtn.disabled = true;
            
            try {
                // Show current localStorage usage
                if (window.storageCleanup && window.storageCleanup.getStorageUsageInfo) {
                    const usageBefore = window.storageCleanup.getStorageUsageInfo();
                    console.log('localStorage usage before cleanup:', usageBefore);
                }
                
                // Clean up localStorage before generating a new theme
                if (window.storageCleanup && window.storageCleanup.cleanupLocalStorage) {
                    // Do an aggressive cleanup - force removal of all theme images
                    // Generate a timestamp for the new theme we're about to create
                    const newThemeId = Date.now().toString();
                    const cleanupResult = window.storageCleanup.cleanupLocalStorage(newThemeId);
                    console.log('Storage cleanup result:', cleanupResult);
                    
                    if (cleanupResult.warning) {
                        console.warn(cleanupResult.warning);
                        
                        // If still near capacity, try a more aggressive approach
                        console.log('Attempting more aggressive cleanup...');
                        // Clear any theme-related items from localStorage
                        // This is a last resort to avoid hitting storage limits
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && (key.includes('theme') || key.includes('bgimage'))) {
                                if (key.startsWith('twitch-chat-overlay-config-default')) {
                                    // Keep the default config
                                    continue;
                                }
                                console.log('Emergency cleanup: removing', key);
                                localStorage.removeItem(key);
                                i--; // Adjust index
                            }
                        }
                    }
                }
                
                // Show storage usage after cleanup
                if (window.storageCleanup && window.storageCleanup.getStorageUsageInfo) {
                    const usageAfter = window.storageCleanup.getStorageUsageInfo();
                    console.log('localStorage usage after cleanup:', usageAfter);
                }
                
                // Call the proxy service
                const response = await fetch('http://localhost:8091/api/generate-theme', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(`API Error: ${data.error || 'Unknown error'}`);
                }
                
                // Handle the response
                if (data.themeData && data.backgroundImage) {
                    console.log('Received theme data and background image from API');
                    
                    // Create background image URL
                    const bgImageUrl = `data:${data.backgroundImage.mimeType};base64,${data.backgroundImage.data}`;
                    
                    // Apply the background image to all relevant elements
                    document.documentElement.style.setProperty('--chat-bg-image', `url("${bgImageUrl}")`);  
                    document.documentElement.style.setProperty('--popup-bg-image', `url("${bgImageUrl}")`); 
                    
                    // Also apply to theme preview
                    const themePreview = document.getElementById('theme-preview');
                    if (themePreview) {
                        themePreview.style.backgroundImage = `url("${bgImageUrl}")`;
                        themePreview.style.backgroundRepeat = 'repeat';
                        themePreview.style.backgroundSize = 'auto';
                    }
                    
                    // Check if localStorage is near capacity after setting the image
                    if (window.storageCleanup && window.storageCleanup.isLocalStorageNearCapacity) {
                        if (window.storageCleanup.isLocalStorageNearCapacity(0.9)) {
                            console.warn('localStorage is near capacity after setting background image!');
                            // Optionally show a message to the user
                            const chatMessages = document.getElementById('chat-messages');
                            if (chatMessages) {
                                const warningElement = document.createElement('div');
                                warningElement.className = 'chat-message system-message';
                                warningElement.innerHTML = `<span class="message-content">Warning: Local storage is getting full. Old themes have been removed.</span>`;
                                chatMessages.appendChild(warningElement);
                            }
                        }
                    }
                    
                    // Save the background image settings
                    saveBackgroundImageSettings();
                }
                
                // Show theme info
                const generatedThemeResult = document.getElementById('generated-theme-result');
                const generatedThemeName = document.getElementById('generated-theme-name');
                if (generatedThemeResult && generatedThemeName && data.themeData) {
                    generatedThemeResult.style.display = 'flex';
                    generatedThemeName.textContent = data.themeData.theme_name;
                }
                
                // Call the original click handler to handle the rest of the theme properties
                if (originalClick) {
                    setTimeout(() => {
                        // We delay a bit to make sure the background image is set first
                        originalClick.call(generateThemeBtn, event);
                    }, 100); 
                }
                
            } catch (error) {
                console.error('Error generating theme with background image:', error);
                
                // Fall back to original handler
                if (originalClick) {
                    originalClick.call(generateThemeBtn, event);
                }
            } finally {
                // Hide loading indicator
                if (themeLoadingIndicator) {
                    themeLoadingIndicator.style.display = 'none';
                }
                generateThemeBtn.disabled = false;
            }
        });
        
        console.log('Enhanced generate theme button to handle background images');
    }
    
    // Patch the saveConfigBtn to save background image settings
    function patchSaveConfigBtn() {
        const saveConfigBtn = document.getElementById('save-config');
        if (!saveConfigBtn) return;
        
        saveConfigBtn.addEventListener('click', function() {
            saveBackgroundImageSettings();
        }, false);
        
        console.log('Enhanced save config button to save background image settings');
    }
    
    // Patch the reset-config button to clear background images
    function patchResetConfig() {
        const resetConfigBtn = document.getElementById('reset-config');
        if (!resetConfigBtn) return;
        
        // Add an event listener that runs after other handlers
        resetConfigBtn.addEventListener('click', function() {
            // Clear the background image variables
            document.documentElement.style.setProperty('--chat-bg-image', 'none');
            document.documentElement.style.setProperty('--popup-bg-image', 'none');
            document.documentElement.style.setProperty('--bg-image-opacity', '0.7'); // Reset opacity to default
            
            // Also clear the theme preview background image
            const themePreview = document.getElementById('theme-preview');
            if (themePreview) {
                themePreview.style.backgroundImage = 'none';
            }
            
            // Reset slider if it exists
            const slider = document.getElementById('bg-image-opacity');
            const valueDisplay = document.getElementById('bg-image-opacity-value');
            
            if (slider) {
                slider.value = 70;
            }
            
            if (valueDisplay) {
                valueDisplay.textContent = '70%';
            }
            
            // Clear stored background image settings
            const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
            const storageKey = `twitch-chat-overlay-bgimage-${sceneId}`;
            localStorage.removeItem(storageKey);
            
            console.log('Background image settings cleared on reset');
        }, false);
        
        console.log('Enhanced reset config button to clear background image settings');
    }
    
    // Helper function to get URL parameters
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
    
    // Function to synchronize background image across all components
    function syncBackgroundImages() {
        // Get current background image from CSS variable
        const bgImage = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg-image').trim();
        
        if (bgImage && bgImage !== 'none') {
            // Apply to all components
            document.documentElement.style.setProperty('--chat-bg-image', bgImage);
            document.documentElement.style.setProperty('--popup-bg-image', bgImage);
            
            const themePreview = document.getElementById('theme-preview');
            if (themePreview) {
                themePreview.style.backgroundImage = bgImage;
                themePreview.style.backgroundRepeat = 'repeat';
                themePreview.style.backgroundSize = 'auto';
            }
        }
    }
    
    // Initialize the patch
    function init() {
        // First add UI elements
        addOpacitySlider();
        
        // Then load saved settings
        loadSavedBackgroundImage();
        
        // Finally patch event handlers
        patchGenerateThemeBtn();
        patchSaveConfigBtn();
        patchResetConfig();
        
        // Set up periodic background image sync
        setInterval(syncBackgroundImages, 1000); // Check every second
    }
    
    // Apply patches
    init();
    
    // Add a MutationObserver to monitor theme preview changes
    const themePreview = document.getElementById('theme-preview');
    if (themePreview) {
        const observer = new MutationObserver(function(mutations) {
            // Sync background images when theme preview changes
            syncBackgroundImages();
        });
        
        observer.observe(themePreview, { 
            attributes: true, 
            attributeFilter: ['style', 'class'] 
        });
    }
    
    console.log('Background image patch applied successfully!');
})();
