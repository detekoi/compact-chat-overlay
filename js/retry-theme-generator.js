/**
 * Enhanced Theme Generator with Retry Logic
 * 
 * This script implements theme generation functionality with exponential backoff retry logic.
 * It will automatically retry theme generation if the initial request fails.
 */

(function() {
    console.log('Initializing theme generator with retry logic...');

    // Private variables
    let latestThemeData = null;
    
    // Helper function to handle successful theme data
    async function handleThemeData(data, prompt) {
        // Extract theme data
        const themeData = data.themeData;
        
        // Extract background image if available
        const backgroundImage = data.backgroundImage;
        const backgroundImageDataUrl = backgroundImage ? 
            `data:${backgroundImage.mimeType};base64,${backgroundImage.data}` : null;
        
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
        
        // Dispatch an event to notify the theme carousel
        const themeEvent = new CustomEvent('theme-generated', { 
            detail: { theme: newTheme } 
        });
        document.dispatchEvent(themeEvent);
    }

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
                    // Additional font type matching can be added here
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

    // Initialize the theme generator
    function initialize() {
        try {
            console.log("Setting up enhanced theme generator with retry logic");
            
            // Replace the theme generator function with our enhanced version 
            window.generateThemeFromPrompt = async function enhancedThemeGenerator() {
                console.log("Enhanced theme generator called with retry functionality!");
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
                    themeLoadingIndicator.style.display = 'flex';
                }
                if (generateThemeBtn) {
                    generateThemeBtn.disabled = true;
                }
                
                // Retry configuration
                const maxRetries = 3;
                let retryCount = 0;
                let retryDelay = 1000; // Start with 1 second
                let success = false;
                
                console.log(`Setting up retry loop with maxRetries=${maxRetries}`);
                
                while (!success && retryCount <= maxRetries) {
                    try {
                        if (retryCount > 0) {
                            console.log(`Retry attempt ${retryCount}/${maxRetries} after ${retryDelay/1000}s delay...`);
                            // Update loading indicator
                            if (document.getElementById('loading-status')) {
                                document.getElementById('loading-status').textContent = `Retrying... (${retryCount}/${maxRetries})`;
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
                            
                            // Include any theme data we already have
                            if (latestThemeData) {
                                requestBody.previousThemeData = latestThemeData;
                                console.log(`Including previous theme data: ${latestThemeData.theme_name}`);
                            }
                            
                            console.log(`Adding retry parameters to attempt ${retryCount} for prompt: "${prompt}"`);
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
                        
                        console.log('Response status:', response.status, 'Response data:', JSON.stringify(data).substring(0, 200));
                        
                        // Add special handling for 202 status code which indicates retry is needed
                        if (response.status === 202 && data.retry) {
                            console.log('Received 202 status with retry flag. Server requested retry:', data);
                            
                            // Apply any theme data we might have from this attempt
                            if (data.themeData) {
                                console.log('Received partial theme data during retry:', data.themeData.theme_name);
                                // Store the theme even while we continue retrying
                                try {
                                    if (window.addThemeToCarousel && typeof window.addThemeToCarousel === 'function') {
                                        window.addThemeToCarousel(data.themeData, null);
                                    }
                                } catch (e) {
                                    console.warn('Error adding theme to carousel:', e);
                                }
                            }
                            
                            // Create custom error with server's attempt number
                            const retryError = new Error(`Server requested retry: ${data.message || 'No background image generated'}`);
                            retryError.serverRequestedAttempt = data.attempt || (retryCount + 1);
                            
                            // Store the theme data for potential fallback
                            if (data.themeData) {
                                window.latestThemeData = data.themeData;
                            }
                            
                            throw retryError;
                        }
                        
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
                            
                            // Check if we have a previous theme to fall back to
                            if (latestThemeData) {
                                console.log('No theme data in response, but we have a previous theme to fall back to');
                                if (data.maxAttemptsReached || data.noImageAvailable) {
                                    // Use the fallback theme if max attempts reached
                                    data.themeData = latestThemeData;
                                    console.log('Using fallback theme:', data.themeData.theme_name);
                                } else {
                                    throw new Error(`Could not find valid theme data in the response: ${errorDetails}`);
                                }
                            } else {
                                throw new Error(`Could not find valid theme data in the response: ${errorDetails}`);
                            }
                        } else {
                            // Store the theme data for potential fallback use
                            latestThemeData = data.themeData;
                        }
                        
                        // Log the theme data we received for debugging
                        console.log('Theme data received:', data.themeData.theme_name);
                        
                        // Check for background image and possibly trigger retry
                        if (!data.backgroundImage && retryCount < 2) {
                            console.log(`No background image in response and retryCount=${retryCount}, manually triggering next retry`);
                            // Manually trigger retry by simulating a 202 response
                            const error = new Error('Manually triggered retry: No background image found');
                            error.serverRequestedAttempt = retryCount + 1;
                            throw error;
                        }
                        
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
                        
                        // Handle the theme data
                        await handleThemeData(data, prompt);
                        
                        // If successful, break out of the retry loop
                        break;
                        
                    } catch (error) {
                        console.warn(`Theme generation attempt ${retryCount + 1} failed:`, error);
                        
                        // If we've reached max retries, show the error to the user
                        if (retryCount === maxRetries) {
                            console.error('All retry attempts failed:', error);
                            
                            // Use the latest theme data we have, even without background
                            if (latestThemeData) {
                                console.log('Using latest theme data despite retry failures:', latestThemeData.theme_name);
                                try {
                                    await handleThemeData({
                                        themeData: latestThemeData,
                                        backgroundImage: null,
                                        maxAttemptsReached: true
                                    }, prompt);
                                    
                                    // Add system message about partial success
                                    if (typeof addSystemMessage === 'function') {
                                        addSystemMessage(`Applied theme without background image: ${latestThemeData.theme_name}`);
                                    }
                                } catch (e) {
                                    console.error('Error applying fallback theme:', e);
                                }
                            } else {
                                // No theme data at all - show error
                                if (typeof addSystemMessage === 'function') {
                                    addSystemMessage(`Error generating theme after ${maxRetries + 1} attempts: ${error.message}`);
                                } else {
                                    alert(`Error generating theme after ${maxRetries + 1} attempts: ${error.message}`);
                                }
                            }
                            break;
                        }
                        
                        // If this was a server-requested retry with a specific attempt number, use that
                        if (error.message?.includes('Server requested retry') && error.serverRequestedAttempt) {
                            retryCount = error.serverRequestedAttempt;
                            console.log(`Using server-provided retry attempt number: ${retryCount}`);
                        } else {
                            // Otherwise just increment
                            retryCount++;
                        }
                        
                        // Wait before the next retry with exponential backoff
                        const waitTime = error.message?.includes('Server requested retry') ? 500 : retryDelay;
                        console.log(`Waiting ${waitTime/1000}s before next retry attempt...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        
                        // Increase retry delay for next attempt
                        retryDelay *= 1.5; // Slightly gentler exponential backoff
                    }
                }
                
                // Reset loading indicator and button state
                if (window.themeLoading && typeof window.themeLoading.hide === 'function') {
                    window.themeLoading.hide();
                } else if (themeLoadingIndicator) {
                    themeLoadingIndicator.style.display = 'none';
                    if (document.getElementById('loading-status')) {
                        document.getElementById('loading-status').textContent = 'Generating...';
                    }
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
            if (window.themeLoading && typeof window.themeLoading.show === 'function') {
                window.themeLoading.show();
            } else if (themeLoadingIndicator) {
                themeLoadingIndicator.style.display = 'flex';
                if (document.getElementById('loading-status')) {
                    document.getElementById('loading-status').textContent = 'Generating...';
                }
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
                    console.log(`Making API request to generate theme with prompt: "${prompt}"${retryCount > 0 ? ` (retry attempt ${retryCount})` : ''}`);
                    
                    const response = await fetch('http://localhost:8091/api/generate-theme', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    console.log(`API response received, status: ${response.status}`);
                    
                    
                    const data = await response.json();
                    
                    // Check for retry response (status 202)
                    if (response.status === 202 && data.retry) {
                        console.log(`Server requests retry (attempt ${data.attempt || retryCount + 1}): ${data.message || 'Retrying...'}`);
                        
                        // If there's still partial theme data, store it in the carousel
                        if (data.themeData) {
                            console.log(`Got partial theme data on retry: ${data.themeData.theme_name}`);
                            
                            // Process CSS values for consistency
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
                            
                            // Get the CSS values for border radius and box shadow if not already provided
                            if (!data.themeData.borderRadiusValue) {
                                data.themeData.borderRadiusValue = borderRadiusValues[data.themeData.border_radius] || "8px";
                            }
                            
                            if (!data.themeData.boxShadowValue) {
                                data.themeData.boxShadowValue = boxShadowValues[data.themeData.box_shadow] || boxShadowValues["Soft"];
                            }
                            
                            // Display system message about the retry status
                            if (typeof addSystemMessage === 'function') {
                                addSystemMessage(`Found theme "${data.themeData.theme_name}" - trying again for one with a background image...`);
                            }
                            
                            // Dispatch an event to store it in the carousel
                            const partialEvent = new CustomEvent('theme-data-received', { 
                                detail: { 
                                    themeData: data.themeData,
                                    backgroundImage: data.backgroundImage,
                                    isPartial: true 
                                }
                            });
                            generateThemeBtn.dispatchEvent(partialEvent);
                        }
                        
                        // Update retryCount if server specified an attempt number
                        if (data.attempt) {
                            retryCount = data.attempt;
                        } else {
                            retryCount++;
                        }
                        
                        // Increase retry delay for subsequent attempts
                        retryDelay = Math.min(retryDelay * 1.5, 5000);
                        
                        // Update loading indicator with proper message
                        if (window.themeLoading && typeof window.themeLoading.update === 'function') {
                            window.themeLoading.update(`Retrying for image... (${retryCount}/${maxRetries})`);
                        } else if (document.getElementById('loading-status')) {
                            document.getElementById('loading-status').textContent = `Retrying for image... (${retryCount}/${maxRetries})`;
                        }
                        
                        console.log(`Waiting ${retryDelay/1000}s before retry attempt ${retryCount}`);
                        
                        // Wait before next attempt
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        
                        // Continue the retry loop
                        continue;
                    }
                    
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
                        
                        // Check if the server indicates max attempts reached
                        if (data.maxAttemptsReached) {
                            console.warn('Maximum retry attempts reached by server');
                            if (typeof addSystemMessage === 'function') {
                                addSystemMessage('Could not generate a theme with background image after multiple attempts.');
                            }
                        }
                        
                        throw new Error(`Could not find valid theme data in the response: ${errorDetails}`);
                    }
                    
                    // Log the theme data we received for debugging
                    console.log('Theme data received:', data.themeData.theme_name);
                    
                    // Check for maxAttemptsReached flag - if true, this is the best theme we could get
                    if (data.maxAttemptsReached || data.noImageAvailable) {
                        console.log('Server indicates this is the final theme after maximum retry attempts');
                        if (typeof addSystemMessage === 'function') {
                            addSystemMessage('Using best theme available - background image generation was unsuccessful.');
                        }
                    }
                    
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
                    
                    // Always dispatch an event to notify our carousel handler
                    // This ensures all themes get added to the main theme carousel with or without a background image
                    console.log('Dispatching theme-data-received event with theme:', data.themeData.theme_name);
                    const carouselUpdateEvent = new CustomEvent('theme-data-received', { detail: data });
                    generateThemeBtn.dispatchEvent(carouselUpdateEvent);
                    
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
                    
                    // Don't need to dispatch another event since we already dispatched one earlier
                    // Just log that we're done
                    console.log('Theme generation complete, ready to use');
                    
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
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM already loaded, run immediately
        initialize();
    }
})();