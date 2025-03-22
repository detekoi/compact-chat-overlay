/**
 * Twitch Chat Overlay - Background Image Patch
 * 
 * This script adds support for AI-generated tiled background graphics
 * to the Twitch Chat Overlay.
 */

(function() {
    console.log('Applying background image patch...');
    
    // Ensure CSS variables exist for background images
    document.documentElement.style.setProperty('--chat-bg-image', 'none');
    document.documentElement.style.setProperty('--popup-bg-image', 'none');
    
    // Add CSS to ensure background images are properly displayed
    const style = document.createElement('style');
    style.textContent = `
        #chat-container {
            background-image: var(--chat-bg-image);
            background-repeat: repeat;
            background-size: auto;
        }
        .popup-message {
            background-image: var(--popup-bg-image);
            background-repeat: repeat;
            background-size: auto;
        }
        .theme-preview {
            background-repeat: repeat;
            background-size: auto;
        }
    `;
    document.head.appendChild(style);
    
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
                    
                    // Store the background image in config for later use
                    // We'll put it in localStorage to persist
                    const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
                    const storageKey = `twitch-chat-overlay-bgimage-${sceneId}`;
                    localStorage.setItem(storageKey, bgImageUrl);
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
    
    // Patch the reset-config button to clear background images
    function patchResetConfig() {
        const resetConfigBtn = document.getElementById('reset-config');
        if (!resetConfigBtn) return;
        
        // Add an event listener that runs after other handlers
        resetConfigBtn.addEventListener('click', function() {
            // Clear the background image variables
            document.documentElement.style.setProperty('--chat-bg-image', 'none');
            document.documentElement.style.setProperty('--popup-bg-image', 'none');
            
            // Clear stored background image
            const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
            const storageKey = `twitch-chat-overlay-bgimage-${sceneId}`;
            localStorage.removeItem(storageKey);
            
            console.log('Background image cleared on reset');
        }, false);
        
        console.log('Enhanced reset config button to clear background images');
    }
    
    // Load saved background image
    function loadSavedBackgroundImage() {
        const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
        const storageKey = `twitch-chat-overlay-bgimage-${sceneId}`;
        const savedImage = localStorage.getItem(storageKey);
        
        if (savedImage) {
            document.documentElement.style.setProperty('--chat-bg-image', `url("${savedImage}")`);
            document.documentElement.style.setProperty('--popup-bg-image', `url("${savedImage}")`);
            console.log('Loaded saved background image');
        }
    }
    
    // Helper function to get URL parameters
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
    
    // Apply patches
    patchGenerateThemeBtn();
    patchResetConfig();
    loadSavedBackgroundImage();
    
    console.log('Background image patch applied successfully!');
})();
