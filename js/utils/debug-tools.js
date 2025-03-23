/**
 * Debug Tools for Twitch Chat Overlay
 * 
 * This script adds various debug tools to help with development and testing.
 * It's only active in development mode (localhost or 127.0.0.1).
 */

(function() {
    // Only run in development environment
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return;
    }
    
    console.log('Initializing debug tools...');
    
    // Wait for DOM to be loaded
    function init() {
        // Add test theme button
        addTestThemeButton();
        
        // Add other debug tools here
        addDebugPanel();
        
        console.log('Debug tools initialized');
    }
    
    // Add a button to generate a test theme
    function addTestThemeButton() {
        // Wait for the generate theme button to be available
        const waitForElement = setInterval(() => {
            const generateThemeBtn = document.getElementById('generate-theme-btn');
            if (!generateThemeBtn) return;
            
            // Check if a test button already exists
            if (document.getElementById('test-theme-btn')) {
                console.log('Test theme button already exists, skipping creation');
                clearInterval(waitForElement);
                return;
            }
            
            clearInterval(waitForElement);
            
            // Create test button
            const testButton = document.createElement('button');
            testButton.id = 'test-theme-btn';
            testButton.className = 'btn';
            testButton.textContent = 'Test Theme';
            testButton.style.marginLeft = '10px';
            testButton.style.backgroundColor = '#5a3c88';
            
            // Add click handler
            testButton.addEventListener('click', async function() {
                try {
                    // Show loading indicator
                    const themeLoadingIndicator = document.getElementById('theme-loading-indicator');
                    if (themeLoadingIndicator) {
                        themeLoadingIndicator.style.display = 'block';
                        themeLoadingIndicator.textContent = 'Testing...';
                    }
                    
                    // Call the test endpoint
                    const response = await fetch('http://localhost:8091/api/test-theme');
                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    console.log('Test theme received:', data);
                    
                    // Handle the theme data
                    if (data.themeData) {
                        // Create a new theme object
                        const newThemeValue = `test-${Date.now()}`;
                        const newTheme = {
                            name: data.themeData.theme_name,
                            value: newThemeValue,
                            bgColor: data.themeData.background_color,
                            borderColor: data.themeData.border_color,
                            textColor: data.themeData.text_color,
                            usernameColor: data.themeData.username_color,
                            borderRadius: data.themeData.border_radius || '8px',
                            boxShadow: data.themeData.box_shadow || 'soft',
                            description: data.themeData.description,
                            backgroundImage: data.backgroundImage ? 
                                `data:${data.backgroundImage.mimeType};base64,${data.backgroundImage.data}` : null,
                            isGenerated: true
                        };
                        
                        // Add to available themes
                        if (window.availableThemes) {
                            window.availableThemes.unshift(newTheme);
                            window.currentThemeIndex = 0;
                            
                            if (typeof window.updateThemeDisplay === 'function') {
                                window.updateThemeDisplay();
                            } else if (typeof window.applyTheme === 'function') {
                                window.applyTheme(newTheme.value);
                            }
                        }
                        
                        // Apply background image immediately
                        if (data.backgroundImage) {
                            const bgImageUrl = `data:${data.backgroundImage.mimeType};base64,${data.backgroundImage.data}`;
                            document.documentElement.style.setProperty('--chat-bg-image', `url("${bgImageUrl}")`);
                            document.documentElement.style.setProperty('--popup-bg-image', `url("${bgImageUrl}")`);
                            
                            // Also apply to theme preview
                            const themePreview = document.getElementById('theme-preview');
                            if (themePreview) {
                                themePreview.style.backgroundImage = `url("${bgImageUrl}")`;
                                themePreview.style.backgroundRepeat = 'repeat';
                                themePreview.style.backgroundSize = 'auto';
                            }
                        }
                        
                        // Add success message
                        if (typeof addSystemMessage === 'function') {
                            addSystemMessage(`Test theme "${data.themeData.theme_name}" applied successfully`);
                        }
                    } else {
                        console.error('Invalid test theme data');
                        if (typeof addSystemMessage === 'function') {
                            addSystemMessage('Error: Invalid test theme data');
                        }
                    }
                } catch (error) {
                    console.error('Error applying test theme:', error);
                    if (typeof addSystemMessage === 'function') {
                        addSystemMessage(`Error testing theme: ${error.message}`);
                    }
                } finally {
                    // Hide loading indicator
                    const themeLoadingIndicator = document.getElementById('theme-loading-indicator');
                    if (themeLoadingIndicator) {
                        themeLoadingIndicator.style.display = 'none';
                    }
                }
            });
            
            // Insert after generate button
            generateThemeBtn.parentNode.insertBefore(testButton, generateThemeBtn.nextSibling);
            console.log('Added test theme button');
        }, 500); // Check every 500ms
    }
    
    // Add a debug panel with useful information and controls
    function addDebugPanel() {
        // Create debug panel
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            background-color: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            display: none;
        `;
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Debug';
        toggleButton.style.cssText = `
            position: fixed;
            top: 5px;
            right: 5px;
            background-color: #5a3c88;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 3px 8px;
            font-size: 10px;
            cursor: pointer;
            z-index: 10000;
        `;
        
        // Toggle panel visibility
        toggleButton.addEventListener('click', () => {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
            updateDebugInfo();
        });
        
        // Add debug information
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debug-info';
        debugPanel.appendChild(debugInfo);
        
        // Add controls section
        const controlsSection = document.createElement('div');
        controlsSection.innerHTML = `
            <h3>Debug Controls</h3>
            <button id="debug-check-server">Check Server</button>
            <button id="debug-clear-storage">Clear Storage</button>
        `;
        debugPanel.appendChild(controlsSection);
        
        // Add to page
        document.body.appendChild(debugPanel);
        document.body.appendChild(toggleButton);
        
        // Update debug information
        function updateDebugInfo() {
            if (debugPanel.style.display === 'none') return;
            
            const debugInfo = document.getElementById('debug-info');
            if (!debugInfo) return;
            
            // Gather debug information
            let info = '';
            
            // Add current theme
            if (window.currentThemeIndex !== undefined && window.availableThemes) {
                const theme = window.availableThemes[window.currentThemeIndex];
                info += `<h3>Current Theme</h3>`;
                info += `<div>Name: ${theme.name}</div>`;
                info += `<div>Value: ${theme.value}</div>`;
                info += `<div>Background: ${theme.bgColor}</div>`;
                info += `<div>Has background image: ${theme.backgroundImage ? 'Yes' : 'No'}</div>`;
            }
            
            // Add localStorage usage
            const storageInfo = getLocalStorageInfo();
            info += `<h3>Storage</h3>`;
            info += `<div>Used: ${storageInfo.percentUsed}% (${storageInfo.totalSizeMB}MB)</div>`;
            info += `<div>Items: ${storageInfo.totalItems}</div>`;
            
            // Update the info
            debugInfo.innerHTML = info;
            
            // Schedule next update
            setTimeout(updateDebugInfo, 5000);
        }
        
        // Calculate localStorage usage
        function getLocalStorageInfo() {
            let totalSizeBytes = 0;
            let largestItem = { key: null, size: 0 };
            const items = {};
            
            // Iterate through localStorage items
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                const size = (key.length + value.length) * 2; // UTF-16 characters = 2 bytes
                
                totalSizeBytes += size;
                items[key] = size;
                
                if (size > largestItem.size) {
                    largestItem = { key, size };
                }
            }
            
            // Calculate percentage (5MB limit per localStorage spec)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            const percentUsed = ((totalSizeBytes / maxSize) * 100).toFixed(1);
            const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
            
            return {
                totalItems: localStorage.length,
                totalSizeBytes,
                totalSizeMB,
                percentUsed,
                largestItem,
                items
            };
        }
        
        // Add event handlers for controls
        document.getElementById('debug-check-server').addEventListener('click', async () => {
            try {
                const response = await fetch('http://localhost:8091/api/debug');
                const data = await response.json();
                console.log('Server debug info:', data);
                
                if (typeof addSystemMessage === 'function') {
                    addSystemMessage(`Server is running: API key ${data.geminiApiKeyConfigured ? 'configured' : 'missing'}`);
                }
            } catch (error) {
                console.error('Error checking server:', error);
                if (typeof addSystemMessage === 'function') {
                    addSystemMessage(`Server error: ${error.message}`);
                }
            }
        });
        
        document.getElementById('debug-clear-storage').addEventListener('click', () => {
            // Only clear theme-related storage, not all localStorage
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.includes('theme') || key.includes('bgimage'))) {
                    localStorage.removeItem(key);
                }
            }
            
            console.log('Cleared theme-related localStorage items');
            if (typeof addSystemMessage === 'function') {
                addSystemMessage('Cleared theme storage');
            }
            
            updateDebugInfo();
        });
    }
    
    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }
})();
