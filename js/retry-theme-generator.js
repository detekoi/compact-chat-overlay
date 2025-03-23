/**
 * Enhanced Theme Generator with Retry Logic
 * 
 * This script patches the theme generation functionality to add exponential backoff retry logic.
 * It will automatically try to regenerate a theme if the initial request fails.
 */

(function() {
    console.log('Applying theme generator retry patch...');

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
                        
                        // Call the API
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
                        
                        // Validate the theme data
                        if (!data.themeData) {
                            throw new Error('Could not find valid theme data in the response');
                        }
                        
                        // We've successfully received valid data
                        success = true;
                        
                        // Handle the theme data by calling the rest of the original function logic
                        await handleThemeData(data, prompt);
                        
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
            
            // Helper function to handle successful theme data
            async function handleThemeData(data, prompt) {
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
                } catch (error) {
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
        
        // Store the original click handler
        const originalClickHandler = generateThemeBtn.onclick;
        
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
                    
                    // Call the API
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
                    
                    // Validate the theme data
                    if (!data.themeData) {
                        throw new Error('Could not find valid theme data in the response');
                    }
                    
                    // We've successfully received valid data
                    success = true;
                    
                    // Now call the original handler but with our validated data
                    if (originalClickHandler) {
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
                        await originalClickHandler.call(generateThemeBtn, event);
                        
                        // Restore the original fetch
                        window.fetch = originalFetch;
                    }
                    
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
