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
                    
                    // Apply the background image
                    document.documentElement.style.setProperty('--chat-bg-image', `url("${bgImageUrl}")`);
                    document.documentElement.style.setProperty('--popup-bg-image', `url("${bgImageUrl}")`);
                    
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
    }
    
    // Apply patches
    init();
    
    console.log('Background image patch applied successfully!');
})();
