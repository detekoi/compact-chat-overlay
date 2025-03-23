/**
 * Enhanced Theme Generator with Retry Logic
 * 
 * This script patches the theme generation functionality to add exponential backoff retry logic.
 * It will automatically try to regenerate a theme if the initial request fails.
 */

(function() {
    console.log('Applying theme generator retry patch...');

    // Helper function to handle successful theme data - Define this first so it's available globally
    window.handleThemeData = async function(data, prompt) {
        // This is a simplified version of the original theme generation logic
        // It handles the data after successfully receiving it from the API
        
        // Extract theme data
        const themeData = data.themeData;
        
        // Extract background image if available
        const backgroundImage = data.backgroundImage;
        const backgroundImageDataUrl = backgroundImage ? 
            `data:${backgroundImage.mimeType};base64,${backgroundImage.data}` : null;
        
        // Add the theme to availableThemes or call the original handler
        if (typeof addThemeToAvailableThemes === 'function') {
            await addThemeToAvailableThemes(themeData, backgroundImageDataUrl);
        } else {
            // Generate a unique ID for the new theme
            const newThemeValue = `generated-${Date.now()}`;
            
            // Create a new theme object
            const newTheme = {
                name: themeData.theme_name,
                value: newThemeValue,
                bgColor: themeData.background_color,
                borderColor: themeData.border_color,
                textColor: themeData.text_color,
                usernameColor: themeData.username_color,
                borderRadius: themeData.border_radius || '8px',
                boxShadow: themeData.box_shadow || 'soft',
                description: themeData.description,
                backgroundImage: backgroundImageDataUrl,
                isGenerated: true
            };
            
            // Add to available themes and update UI
            if (window.availableThemes && Array.isArray(window.availableThemes)) {
                window.availableThemes.unshift(newTheme);
                
                // Check for theme display functions
                if (typeof window.updateThemeDisplay === 'function') {
                    window.currentThemeIndex = 0;
                    window.updateThemeDisplay();
                } else if (typeof window.applyTheme === 'function') {
                    window.applyTheme(newTheme.value);
                }
            }
            
            // Update UI elements
            const generatedThemeResult = document.getElementById('generated-theme-result');
            const generatedThemeName = document.getElementById('generated-theme-name');
            
            if (generatedThemeResult) {
                generatedThemeResult.style.display = 'flex';
            }
            
            if (generatedThemeName) {
                generatedThemeName.textContent = themeData.theme_name;
            }
            
            // Select matching font if available
            if (themeData.font_family && window.availableFonts) {
                selectMatchingFont(themeData.font_family);
            }
            
            // Add success message to chat
            if (typeof addSystemMessage === 'function') {
                addSystemMessage(`Generated "${themeData.theme_name}" theme based on "${prompt}"`);
            }
        }
    };

    // Create a test button for manually testing theme generation
    function addTestButton() {
        // Only add in development mode
        if (window.location.hostname !== 'localhost' && 
            window.location.hostname !== '127.0.0.1') {
            return;
        }
        
        const generateThemeBtn = document.getElementById('generate-theme-btn');
        if (!generateThemeBtn) return;
        
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
                const data = await response.json();
                
                console.log('Test theme received:', data);
                
                // Handle the theme data
                if (data.themeData) {
                    // Process the test theme using the global handleThemeData function
                    await window.handleThemeData(data, 'test theme');
                    
                    if (typeof addSystemMessage === 'function') {
                        addSystemMessage(`Test theme "${data.themeData.theme_name}" applied successfully`);
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
    }

    // Wait until the page and original functions are loaded
    function applyPatch() {
        try {
            // Check if generateThemeFromPrompt function exists
            if (typeof window.generateThemeFromPrompt !== 'function') {
                // Try to find it as a property in a global scope
                const globalFunctions = Object.keys(window);
                let themeGenerator = null;
                
                // Try to find the original generator function
                for (const funcName of globalFunctions) {
                    if (funcName.includes('Theme') && typeof window[funcName] === 'function') {
                        const funcStr = window[funcName].toString();
                        if (funcStr.includes('generateTheme') && funcStr.includes('themePromptInput')) {
                            themeGenerator = window[funcName];
                            console.log(`Found theme generator function: ${funcName}`);
                            break;
                        }
                    }
                }
                
                // If we can't find the function directly, patch it when it's used
                if (!themeGenerator) {
                    patchGenerateButton();
                    return;
                }
            }
            
            // Store a reference to the original function
            const originalGenerateTheme = window.generateThemeFromPrompt || themeGenerator;
            
            // Replace with our enhanced version
            window.generateThemeFromPrompt = async function enhancedThemeGenerator() {
                // Get UI elements
                const themePromptInput = document.getElementById('theme-prompt');
                const themeLoadingIndicator = document.getElementById('theme-loading-indicator');
                const generateThemeBtn = document.getElementById('generate-theme-btn');
                
                const prompt = themePromptInput.value.trim();
                
                if (!prompt) {
                    addSystemMessage('Please enter a game or vibe for your theme');
                    return;
                }
                
                // Show loading indicator
                if (themeLoadingIndicator) {
                    themeLoadingIndicator.style.display = 'block';
                    themeLoadingIndicator.textContent = 'Generating...';
                }
                if (generateThemeBtn) {
                    generateThemeBtn.disabled = true;
                }
                
                // Retry configuration
                const maxRetries = 3;
                let retryCount = 0;
                let retryDelay = 1000; // Start with 1 second
                let success = false;
                
                // Storage cleanup before generating theme
                if (window.storageCleanup && window.storageCleanup.cleanupLocalStorage) {
                    const newThemeId = Date.now().toString();
                    const cleanupResult = window.storageCleanup.cleanupLocalStorage(newThemeId);
                    console.log('Storage cleanup result:', cleanupResult);
                }
                
                while (!success && retryCount <= maxRetries) {
                    try {
                        if (retryCount > 0) {
                            console.log(`Retry attempt ${retryCount}/${maxRetries} after ${retryDelay/1000}s delay...`);
                            // Update loading indicator
                            if (themeLoadingIndicator) {
                                themeLoadingIndicator.textContent = `Retrying... (${retryCount}/${maxRetries})`;
                            }
                            
                            // Add message to chat if it exists
                            if (typeof addSystemMessage === 'function') {
                                addSystemMessage(`Retrying theme generation (attempt ${retryCount}/${maxRetries})...`);
                            }
                        }
                        
                        // Modify request on retry attempts to avoid RECITATION errors
                        let requestBody = { prompt };
                        
                        // If this is a retry attempt, add a parameter to hint that we want to avoid RECITATION
                        if (retryCount > 0) {
                            // Add attempt number to promote different responses
                            requestBody = { 
                                prompt: prompt,
                                attempt: retryCount,
                                forceJson: true // Signal to server we want strict JSON 
                            };
                            console.log(`Adding retry parameters to attempt ${retryCount}`);
                        }
                        
                        // Call the API
                        const response = await fetch('http://localhost:8091/api/generate-theme', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(requestBody)
                        });
                        
                        const data = await response.json();
                        
                        if (!response.ok) {
                            throw new Error(`API Error: ${data.error || 'Unknown error'}`);
                        }
                        
                        // Validate the theme data with improved logging
                        if (!data.themeData) {
                            console.error('Response data structure:', JSON.stringify(data, null, 2).slice(0, 500) + '...');
                            
                            // Extract more information from the response if available
                            let errorDetails = 'Unknown error';
                            let shouldRetry = true; // Default to retry
                            
                            if (data.error) {
                                errorDetails = data.error;
                                if (data.responseData) {
                                    const responseInfo = data.responseData;
                                    errorDetails += ` (Status: ${responseInfo.status}, Finish reason: ${responseInfo.finishReason})`;
                                    
                                    // If RECITATION is happening, use different temperature in retry
                                    if (responseInfo.finishReason === 'RECITATION') {
                                        console.log('Got RECITATION error, will try with different parameters');
                                        // Modify the prompt on retry to help avoid RECITATION
                                        // We'll handle this in the next retry
                                    }
                                }
                            }
                            
                            throw new Error(`Could not find valid theme data in the response: ${errorDetails}`);
                        }
                        
                        // Log the theme data we received for debugging
                        console.log('Theme data received:', data.themeData.theme_name);
                        
                        // Apply background image immediately to ensure it's set
                        if (data.backgroundImage) {
                            console.log('Also received background image data');
                            
                            try {
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
                            } catch (error) {
                                console.error('Error applying background image:', error);
                            }
                        }                       
                        
                        // We've successfully received valid data
                        success = true;
                        
                        // Handle the theme data by calling the global function
                        await window.handleThemeData(data, prompt);
                        
                        // If successful, break out of the retry loop
                        break;
                        
                    } catch (error) {
                        console.warn(`Theme generation attempt ${retryCount + 1} failed:`, error);
                        
                        // If we've reached max retries, show the error to the user
                        if (retryCount === maxRetries) {
                            console.error('All retry attempts failed:', error);
                            if (typeof addSystemMessage === 'function') {
                                addSystemMessage(`Error generating theme after ${maxRetries + 1} attempts: ${error.message}`);
                            } else {
                                alert(`Error generating theme after ${maxRetries + 1} attempts: ${error.message}`);
                            }
                            break;
                        }
                        
                        // Wait before the next retry with exponential backoff
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        
                        // Increase retryCount and retryDelay for next attempt
                        retryCount++;
                        retryDelay *= 2; // Exponential backoff
                    }
                }
                
                // Reset loading indicator and button state
                if (themeLoadingIndicator) {
                    themeLoadingIndicator.style.display = 'none';
                    themeLoadingIndicator.textContent = 'Generating...';
                }
                if (generateThemeBtn) {
                    generateThemeBtn.disabled = false;
                }
            };
            
            // Helper function to select a matching font
            function selectMatchingFont(fontName) {
                try {
                    if (!window.availableFonts || !Array.isArray(window.availableFonts)) {
                        return;
                    }
                    
                    // Try exact match first
                    let fontIndex = window.availableFonts.findIndex(font => 
                        font.name === fontName || 
                        font.name.toLowerCase() === fontName.toLowerCase()
                    );
                    
                    // If no exact match, try partial or fuzzy matching
                    if (fontIndex < 0) {
                        // Try to find a font that contains the specified name
                        fontIndex = window.availableFonts.findIndex(font => 
                            font.name.toLowerCase().includes(fontName.toLowerCase()) ||
                            fontName.toLowerCase().includes(font.name.toLowerCase())
                        );
                        
                        // If still no match, try matching by font type
                        if (fontIndex < 0) {
                            const fontType = fontName.toLowerCase();
                            
                            if (fontType.includes('serif') && !fontType.includes('sans')) {
                                // Find a serif font
                                fontIndex = window.availableFonts.findIndex(font => 
                                    font.value.toLowerCase().includes('serif') && 
                                    !font.value.toLowerCase().includes('sans-serif')
                                );
                            } else if (fontType.includes('sans')) {
                                // Find a sans-serif font
                                fontIndex = window.availableFonts.findIndex(font => 
                                    font.value.toLowerCase().includes('sans-serif')
                                );
                            }
                            // Additional font type checks as in the original code
                        }
                    }
                    
                    if (fontIndex >= 0) {
                        window.currentFontIndex = fontIndex;
                        
                        if (typeof window.updateFontDisplay === 'function') {
                            window.updateFontDisplay();
                        }
                        
                        console.log(`Selected font: ${window.availableFonts[fontIndex].name} for theme font: ${fontName}`);
                    }
                }
                catch (error) {
                    console.error('Error selecting matching font:', error);
                }
            }
            
            // Add test button to the UI when in development
            addTestButton();
            
            console.log('Theme generator retry patch applied successfully');
        } catch (error) {
            console.error('Error applying theme generator retry patch:', error);
        }
    }
    
    // Alternative approach: patch the generate theme button
    function patchGenerateButton() {
        const generateThemeBtn = document.getElementById('generate-theme-btn');
        if (!generateThemeBtn) {
            console.error('Generate theme button not found');
            return;
        }
        
        // Store the original onclick handler
        const originalOnClick = generateThemeBtn.onclick;
        console.log(`Generate theme button original onclick = ${!!originalOnClick}`);
        
        // Remove the onclick handler so we can add our own
        if (originalOnClick) {
            generateThemeBtn.onclick = null;
        }
        
        // Replace with our enhanced version
        generateThemeBtn.onclick = async function(event) {
            event.preventDefault();
            
            const themePromptInput = document.getElementById('theme-prompt');
            const themeLoadingIndicator = document.getElementById('theme-loading-indicator');
            
            const prompt = themePromptInput.value.trim();
            
            if (!prompt) {
                if (typeof addSystemMessage === 'function') {
                    addSystemMessage('Please enter a game or vibe for your theme');
                } else {
                    alert('Please enter a game or vibe for your theme');
                }
                return;
            }
            
            // Show loading indicator
            if (themeLoadingIndicator) {
                themeLoadingIndicator.style.display = 'block';
                themeLoadingIndicator.textContent = 'Generating...';
            }
            generateThemeBtn.disabled = true;
            
            // Retry configuration
            const maxRetries = 3;
            let retryCount = 0;
            let retryDelay = 1000; // Start with 1 second
            let success = false;
            
            // Storage cleanup before generating theme
            if (window.storageCleanup && window.storageCleanup.cleanupLocalStorage) {
                const newThemeId = Date.now().toString();
                const cleanupResult = window.storageCleanup.cleanupLocalStorage(newThemeId);
                console.log('Storage cleanup result:', cleanupResult);
            }
            
            while (!success && retryCount <= maxRetries) {
                try {
                    if (retryCount > 0) {
                        console.log(`Retry attempt ${retryCount}/${maxRetries} after ${retryDelay/1000}s delay...`);
                        // Update loading indicator
                        if (themeLoadingIndicator) {
                            themeLoadingIndicator.textContent = `Retrying... (${retryCount}/${maxRetries})`;
                        }
                        
                        // Add message to chat if it exists
                        if (typeof addSystemMessage === 'function') {
                            addSystemMessage(`Retrying theme generation (attempt ${retryCount}/${maxRetries})...`);
                        }
                    }
                    
                    // Modify request on retry attempts to avoid RECITATION errors
                    let requestBody = { prompt };
                    
                    // If this is a retry attempt, add a parameter to hint that we want to avoid RECITATION
                    if (retryCount > 0) {
                        // Add attempt number to promote different responses
                        requestBody = { 
                            prompt: prompt,
                            attempt: retryCount,
                            forceJson: true // Signal to server we want strict JSON 
                        };
                        console.log(`Adding retry parameters to attempt ${retryCount}`);
                    }
                    
                    // Call the API
                    const response = await fetch('http://localhost:8091/api/generate-theme', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(`API Error: ${data.error || 'Unknown error'}`);
                    }
                    
                    // Validate the theme data with improved debugging
                    if (!data.themeData) {
                        console.error('Response data structure:', JSON.stringify(data, null, 2).slice(0, 500) + '...');
                        
                        // Extract more information from the response if available
                        let errorDetails = 'Unknown error';
                        if (data.error) {
                            errorDetails = data.error;
                            if (data.responseData) {
                                errorDetails += ` (Status: ${data.responseData.status}, Finish reason: ${data.responseData.finishReason})`;
                            }
                        }
                        
                        throw new Error(`Could not find valid theme data in the response: ${errorDetails}`);
                    }
                    
                    // Log the theme data we received for debugging
                    console.log('Theme data received:', data.themeData.theme_name);
                    
                    // Apply background image immediately to ensure it's set
                    if (data.backgroundImage) {
                        console.log('Also received background image data');
                        
                        try {
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
                        } catch (error) {
                            console.error('Error applying background image:', error);
                        }
                    }
                    
                    // We've successfully received valid data
                    success = true;
                    
                    // Now call any original handlers but with our validated data
                    if (originalOnClick) {
                        // Store the fetch function temporarily to prevent recursion
                        const originalFetch = window.fetch;
                        
                        // Replace fetch with a function that returns our data
                        window.fetch = async function() {
                            return {
                                ok: true,
                                json: async () => data
                            };
                        };
                        
                        // Call the original handler
                        await originalOnClick.call(generateThemeBtn, event);
                        
                        // Restore the original fetch
                        window.fetch = originalFetch;
                    }
                    
                    // Dispatch a custom event to notify other patches that theme data is ready
                    // This allows background-image-patch.js to properly handle the background image
                    const themeReadyEvent = new CustomEvent('themeDataReady', { detail: data });
                    generateThemeBtn.dispatchEvent(themeReadyEvent);
                    
                    // If successful, break out of the retry loop
                    break;
                    
                } catch (error) {
                    console.warn(`Theme generation attempt ${retryCount + 1} failed:`, error);
                    
                    // If we've reached max retries, show the error to the user
                    if (retryCount === maxRetries) {
                        console.error('All retry attempts failed:', error);
                        if (typeof addSystemMessage === 'function') {
                            addSystemMessage(`Error generating theme after ${maxRetries + 1} attempts: ${error.message}`);
                        } else {
                            alert(`Error generating theme after ${maxRetries + 1} attempts: ${error.message}`);
                        }
                        break;
                    }
                    
                    // Wait before the next retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    
                    // Increase retryCount and retryDelay for next attempt
                    retryCount++;
                    retryDelay *= 2; // Exponential backoff
                }
            }
            
            // Reset loading indicator and button state
            if (themeLoadingIndicator) {
                themeLoadingIndicator.style.display = 'none';
                themeLoadingIndicator.textContent = 'Generating...';
            }
            generateThemeBtn.disabled = false;
        };
        
        console.log('Theme generator button patched successfully with retry logic');
    }

    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPatch);
    } else {
        // DOM already loaded, run immediately
        applyPatch();
    }
})();