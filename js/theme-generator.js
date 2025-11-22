/**
 * AI Theme Generator for Twitch Chat Overlay
 * 
 * This module handles communication with the local Theme Proxy service to generate themes based on user prompts.
 * It includes logic for API calls, error handling, retries, image compression, and UI updates.
 */

(function () {
    // DOM elements related to AI theme generation
    const themePromptInput = document.getElementById('theme-prompt');
    let generateThemeBtn = document.getElementById('generate-theme-btn');
    const themeLoadingIndicator = document.getElementById('theme-loading-indicator');
    const generatedThemeResult = document.getElementById('generated-theme-result');
    const generatedThemeName = document.getElementById('generated-theme-name');
    const loadingStatus = document.getElementById('loading-status');
    const generateImageCheckbox = document.getElementById('generate-bg-image');

    // Constants
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000; // ms

    // Dynamically determine API URL based on environment
    const CLOUD_RUN_API_URL = 'https://theme-proxy-361545143046.us-central1.run.app/api/generate-theme';
    const LOCAL_API_URL = 'http://localhost:8091/api/generate-theme';

    // Use local API if running on localhost, otherwise use Cloud Run
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '';

    const PROXY_API_URL = isLocalhost ? LOCAL_API_URL : CLOUD_RUN_API_URL;

    console.log(`[theme-generator] Environment: ${isLocalhost ? 'LOCAL' : 'PRODUCTION'}`);
    console.log(`[theme-generator] API URL: ${PROXY_API_URL}`);

    // --- Wait for theme carousel to be ready --- 
    document.addEventListener('theme-carousel-ready', initializeGenerator);

    function initializeGenerator() {
        console.log("Theme Generator Initializing (after carousel ready)...");

        // --- Now add event listeners ---
        if (generateThemeBtn) {
            // --- Force Re-attachment --- 
            // Clone the button to remove all existing listeners
            const oldBtn = generateThemeBtn;
            const newBtn = oldBtn.cloneNode(true);
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            // Update our reference to the new button
            generateThemeBtn = newBtn; // IMPORTANT: Update the reference
            console.log('[theme-generator] Cloned generate button to remove old listeners.');
            // --- End Force Re-attachment ---

            generateThemeBtn.addEventListener('click', () => {
                console.log('[theme-generator] Generate Theme button clicked. Checking prompt...'); // Log listener firing
                if (themePromptInput) {
                    const prompt = themePromptInput.value.trim();
                    if (prompt) {
                        console.log('[theme-generator] Prompt found. Calling generateThemeWithRetry...');
                        generateThemeWithRetry(prompt);
                    } else {
                        alert('Please enter a game or vibe for the theme.');
                    }
                }
            });
        }

        if (themePromptInput) {
            themePromptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const prompt = themePromptInput.value.trim();
                    if (prompt) {
                        generateThemeWithRetry(prompt);
                    } else {
                        alert('Please enter a game or vibe for the theme.');
                    }
                }
            });
        }
        console.log("Theme Generator Initialized and listeners attached.");
    }

    /**
     * Initiates theme generation with retry logic.
     * @param {string} prompt - The user's prompt for the theme.
     */
    async function generateThemeWithRetry(prompt) {
        console.log(`Attempting to generate theme via proxy for prompt: \"${prompt}\"`);
        if (!themeLoadingIndicator || !generateThemeBtn || !loadingStatus || !generateImageCheckbox) {
            console.error('Required UI elements for loading state not found.');
            return;
        }

        // Get checkbox state
        const generateImage = generateImageCheckbox.checked;
        console.log(`[theme-generator] Generate background image checkbox checked: ${generateImage}`);

        // Show loading indicator, hide tooltip
        themeLoadingIndicator.style.display = 'flex';
        generatedThemeResult.style.display = 'none';
        generateThemeBtn.disabled = true;
        loadingStatus.textContent = 'Generating... (Attempt 1)';

        let currentAttempt = 1;
        let delay = INITIAL_DELAY;
        let previousThemeData = null; // Store potential intermediate theme data

        while (currentAttempt <= MAX_RETRIES) {
            try {
                // Call proxy with checkbox state
                const proxyResponse = await generateThemeViaProxy(prompt, generateImage, currentAttempt - 1, previousThemeData);

                // Check for retry instruction from proxy
                if (proxyResponse.retry) {
                    console.log(`Proxy requested retry (Attempt ${currentAttempt}). Message: ${proxyResponse.message}`);
                    loadingStatus.textContent = proxyResponse.message || `Retrying... (${currentAttempt + 1}/${MAX_RETRIES})`;

                    // Process intermediate theme data if provided
                    if (proxyResponse.themeData && proxyResponse.includesThemeData) {
                        console.log("Processing intermediate theme data while retrying...");
                        // Don't compress image here, as we're retrying for one
                        processAndAddTheme(proxyResponse.themeData, null); // Add intermediate theme without image
                        previousThemeData = proxyResponse.themeData; // Store for next request
                    } else {
                        // If no theme data came back with retry, keep any previous data
                        previousThemeData = previousThemeData;
                    }

                    // Wait and check retry limit
                    if (currentAttempt < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2;
                        currentAttempt++;
                        continue; // Go to next iteration of the loop
                    } else {
                        // Max retries reached even with proxy retry requests
                        throw new Error("Max retries reached after proxy requested further attempts.");
                    }
                }

                // If not retrying, process the final successful response
                const { themeData, backgroundImage } = proxyResponse;
                console.log('[theme-generator] Theme generation via proxy successful on attempt', currentAttempt);
                console.log('[theme-generator] Received themeData:', JSON.stringify(themeData));
                console.log(`[theme-generator] Received backgroundImage? ${!!backgroundImage}`);

                // Compress image if present
                let finalBackgroundImageDataUrl = null;
                if (backgroundImage && backgroundImage.data) {
                    loadingStatus.textContent = 'Compressing image...';
                    
                    // Ensure clean base64 data
                    const cleanBase64 = backgroundImage.data.replace(/[\r\n\s]+/g, '');
                    const mimeType = backgroundImage.mimeType || 'image/png';
                    const backgroundImageDataUrl = `data:${mimeType};base64,${cleanBase64}`;
                    
                    try {
                        finalBackgroundImageDataUrl = await compressImageToBase64JPEG(backgroundImageDataUrl, 0.85); // Use 85% quality
                        console.log('Image compression successful.');
                    } catch (compressionError) {
                        console.error('Image compression failed:', compressionError);
                        // Proceed without the image if compression fails
                        finalBackgroundImageDataUrl = null;
                        if (typeof addSystemMessage === 'function') {
                            addSystemMessage('⚠️ Warning: Background image compression failed.');
                        }
                    }
                }

                // Process and add the theme to the carousel
                processAndAddTheme(themeData, finalBackgroundImageDataUrl);

                // Update UI on success
                loadingStatus.textContent = 'Done!';
                setTimeout(() => {
                    console.log('[theme-generator] Entering setTimeout callback for UI update.');
                    themeLoadingIndicator.style.display = 'none';
                    generateThemeBtn.disabled = false;
                    if (generatedThemeName) {
                        generatedThemeName.textContent = themeData.theme_name || 'Generated Theme';
                        generatedThemeResult.style.display = 'block';
                    }

                    // Optionally clear prompt
                    // themePromptInput.value = '';
                }, 1000); // Show "Done!" for a second

                return; // Exit loop on success

            } catch (error) {
                console.error(`Theme generation attempt ${currentAttempt} failed:`, error);

                if (currentAttempt < MAX_RETRIES) {
                    loadingStatus.textContent = `Retrying... (${currentAttempt + 1}/${MAX_RETRIES})`;
                    console.log(`Waiting ${delay / 1000}s before retrying...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                } else {
                    // Max retries reached, show error
                    loadingStatus.textContent = 'Failed to generate theme.';
                    alert(`Error generating theme after ${MAX_RETRIES} attempts: ${error.message || 'Unknown error'}`);
                    console.error(`Max retries (${MAX_RETRIES}) reached. Theme generation failed.`, error);
                    themeLoadingIndicator.style.display = 'none';
                    generateThemeBtn.disabled = false;
                    if (typeof addSystemMessage === 'function') {
                        addSystemMessage(`❌ Error generating theme: ${error.message || 'Max retries reached.'}`);
                    }
                    return; // Exit loop after max retries
                }
            }
            currentAttempt++; // Increment attempt counter for the next loop iteration
        }
    }

    /**
     * Calls the local Theme Proxy service to generate theme properties and potentially a background image.
     * @param {string} userPrompt - The user's input prompt.
     * @param {boolean} generateImage - Whether to request a background image.
     * @param {number} attempt - The current attempt number (for proxy retry logic).
     * @param {Object | null} previousThemeData - Theme data from a previous (potentially image-less) attempt.
     * @returns {Promise<{themeData: Object, backgroundImage: Object | null, retry: boolean, message: string | null}>} - Response from the proxy.
     */
    async function generateThemeViaProxy(userPrompt, generateImage, attempt = 0, previousThemeData = null) {
        console.log(`Calling Theme Proxy (Attempt ${attempt}). Requesting image: ${generateImage}`);

        const requestBody = {
            prompt: userPrompt,
            attempt: attempt,
            themeType: generateImage ? 'image' : 'color', // Use checkbox state
            previousThemeData: previousThemeData // Send previous data if available
        };

        console.log('[theme-generator] Sending request to proxy with body:', JSON.stringify(requestBody));

        const response = await fetch(PROXY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' // Ensure we accept JSON
            },
            body: JSON.stringify(requestBody)
        });

        console.log(`[theme-generator] Fetch response status: ${response.status}`);

        // Handle 202 Accepted for retries
        if (response.status === 202) {
            const responseData = await response.json();
            console.log('Proxy requested retry:', responseData.message);
            return { ...responseData, retry: true }; // Ensure retry flag is set
        }

        if (!response.ok) {
            let errorDetails = `Proxy Error (${response.status}): ${response.statusText}`;
            try {
                const errorBody = await response.json();
                errorDetails += `. ${errorBody.error || errorBody.details || JSON.stringify(errorBody)}`;
            } catch (e) {
                // If error body isn't JSON, try text
                try {
                    const textBody = await response.text();
                    errorDetails += `. ${textBody}`;
                } catch { }
            }
            console.error('Error response from proxy:', errorDetails);
            throw new Error(errorDetails);
        }

        // If response is OK (200), parse the final theme data
        const data = await response.json();
        console.log("Theme Proxy Response (Final):", data);

        // Basic validation of the proxy response structure
        if (!data || !data.themeData) {
            console.error('Invalid response structure from Proxy:', data);
            throw new Error('Invalid response structure from Theme Proxy.');
        }

        // Ensure expected fields are present in themeData
        if (!data.themeData.theme_name || !data.themeData.background_color || !data.themeData.border_color || !data.themeData.text_color || !data.themeData.username_color) {
            console.error('Missing required fields in themeData from Proxy:', data.themeData);
            throw new Error('Proxy returned incomplete theme data.');
        }

        // Return the successful response, ensuring retry is false
        return { ...data, retry: false };
    }

    /**
     * Compresses an image from a base64 data URL to a JPEG base64 data URL.
     * Reduces file size for localStorage.
     * @param {string} base64DataUrl - The original base64 data URL (e.g., PNG).
     * @param {number} quality - JPEG quality (0.0 to 1.0).
     * @returns {Promise<string>} A Promise that resolves with the compressed JPEG base64 data URL.
     */
    function compressImageToBase64JPEG(base64DataUrl, quality = 0.85) { // Default quality 85%
        return new Promise((resolve, reject) => {
            if (!base64DataUrl) {
                return reject(new Error("No base64 data URL provided for compression."));
            }

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Optional: Limit canvas size for further compression and performance
                const MAX_DIMENSION = 1024; // Max width/height for the compressed image
                let width = img.width;
                let height = img.height;

                if (width === 0 || height === 0) {
                    return reject(new Error("Image has zero dimensions."));
                }

                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                    console.log(`Resizing image for compression to ${width}x${height}`);
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Draw the image onto the canvas (potentially resized)
                ctx.drawImage(img, 0, 0, width, height);

                try {
                    // Export the canvas content as JPEG data URL
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    if (!compressedDataUrl || compressedDataUrl === 'data:,') {
                        throw new Error('Canvas toDataURL produced invalid output.');
                    }
                    console.log(`Image compressed from original size to ${compressedDataUrl.length} bytes (JPEG quality ${quality})`);
                    resolve(compressedDataUrl);
                } catch (error) {
                    console.error("Error converting canvas to JPEG:", error);
                    // Attempt fallback to PNG if JPEG fails (e.g., transparency issues)
                    try {
                        console.log("Attempting PNG fallback for compression...");
                        const pngDataUrl = canvas.toDataURL('image/png');
                        if (!pngDataUrl || pngDataUrl === 'data:,') {
                            throw new Error('Canvas toDataURL (PNG fallback) produced invalid output.');
                        }
                        console.warn("JPEG compression failed, falling back to PNG.", `PNG size: ${pngDataUrl.length} bytes`);
                        resolve(pngDataUrl); // Resolve with PNG if JPEG failed
                    } catch (pngError) {
                        console.error("Error converting canvas to PNG (fallback):", pngError);
                        reject(new Error(`Failed to convert canvas to JPEG or PNG: ${error.message}; ${pngError.message}`));
                    }
                }
            };
            img.onerror = (errorEvent) => {
                // Attempt to get more specific error info if possible
                let errorMsg = "Failed to load image from base64 data for compression.";
                if (errorEvent && typeof errorEvent === 'string') {
                    errorMsg += ` (${errorEvent})`;
                } else if (errorEvent && errorEvent.message) {
                    errorMsg += ` (${errorEvent.message})`;
                } else if (img.src && img.src.length < 200) { // Log short (potentially invalid) src
                    errorMsg += ` Invalid src? ${img.src}`;
                }
                console.error("Error loading image for compression:", errorMsg, errorEvent);
                reject(new Error(errorMsg));
            };

            // Start loading the image
            // Add check for valid base64 prefix
            if (typeof base64DataUrl === 'string' && base64DataUrl.startsWith('data:image')) {
                img.src = base64DataUrl;
            } else {
                reject(new Error("Invalid base64 data URL format provided."));
            }
        });
    }

    /**
     * Processes the generated theme data and adds it to the carousel.
     * @param {Object} themeData - The theme properties generated by the AI.
     * @param {string | null} compressedImageDataUrl - The compressed background image data URL, or null.
     */
    function processAndAddTheme(themeData, compressedImageDataUrl) {
        try {
            console.log(`Processing theme '${themeData.theme_name}' ${compressedImageDataUrl ? 'with' : 'without'} background image`);

            // Create unique theme ID
            const propsHash = `${themeData.background_color}-${themeData.border_color}-${themeData.text_color}-${themeData.username_color}`.replace(/[^a-z0-9]/gi, '').substring(0, 8);
            const newThemeValue = `generated-${Date.now()}-${propsHash}-${Math.floor(Math.random() * 1000)}`;

            // Get actual CSS values from preset names using global helpers from chat.js
            // Ensure these helpers are available globally
            const borderRadiusValue = typeof window.getBorderRadiusValue === 'function'
                ? window.getBorderRadiusValue(themeData.border_radius)
                : (themeData.border_radius || "8px"); // Fallback

            const boxShadowValue = typeof window.getBoxShadowValue === 'function'
                ? window.getBoxShadowValue(themeData.box_shadow)
                : (themeData.box_shadow || "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px"); // Fallback

            // Check for existing themes with same name to add variant number
            const existingThemes = (window.themeCarousel && typeof window.themeCarousel.getThemes === 'function')
                ? window.themeCarousel.getThemes()
                : (window.availableThemes || []); // Fallback to availableThemes if carousel API missing

            const existingThemesWithSameName = existingThemes.filter(t =>
                t.originalThemeName === themeData.theme_name);

            const variantNum = existingThemesWithSameName.length;
            const nameSuffix = variantNum > 0 ? ` (Variant ${variantNum + 1})` : '';

            // Create the final theme object
            const theme = {
                name: themeData.theme_name + nameSuffix,
                value: newThemeValue,
                bgColor: themeData.background_color,
                borderColor: themeData.border_color,
                textColor: themeData.text_color,
                usernameColor: themeData.username_color,
                borderRadius: themeData.border_radius || 'Subtle',        // Preset name from proxy
                borderRadiusValue: themeData.border_radius_value || window.getBorderRadiusValue(themeData.border_radius || 'Subtle'), // CSS value from proxy (or fallback)
                boxShadow: themeData.box_shadow || 'Soft',              // Preset name from proxy
                boxShadowValue: themeData.box_shadow_value || window.getBoxShadowValue(themeData.box_shadow || 'Soft'),      // CSS value from proxy (or fallback)
                description: themeData.description,
                backgroundImage: compressedImageDataUrl, // Use compressed image
                fontFamily: themeData.font_family,
                isGoogleFont: themeData.isGoogleFont,
                googleFontFamily: themeData.googleFontFamily,
                isGenerated: true,
                originalThemeName: themeData.theme_name,
                variant: variantNum + 1
            };

            // Add the theme using the theme carousel's API
            const currentThemeCarousel = window.themeCarousel; // Get reference *now*

            if (currentThemeCarousel && typeof currentThemeCarousel.addTheme === 'function') {
                // Let the carousel handle its internal logic (like localStorage)
                const addedTheme = currentThemeCarousel.addTheme(theme);
                console.log("Theme added to carousel internal state:", addedTheme.name);

                // Dispatch an event for chat.js to handle theme application and display update
                const applyThemeEvent = new CustomEvent('theme-generated-and-added', {
                    detail: { themeValue: addedTheme.value },
                    bubbles: true, // Allow event to bubble up if needed
                    cancelable: true
                });
                console.log(`Dispatching theme-generated-and-added event for theme: ${addedTheme.value}`);
                document.dispatchEvent(applyThemeEvent);

                // Now update the carousel UI to show the newly added theme (at index 0)
                if (typeof window.applyAndScrollToTheme === 'function') {
                    window.applyAndScrollToTheme(0);
                }

                // Dispatch event AFTER applying and updating display
                const themeProcessedEvent = new CustomEvent('theme-data-processed', {
                    detail: { theme }
                });
                document.dispatchEvent(themeProcessedEvent);
                console.log("Dispatched theme-data-processed event");

            } else {
                console.error('Theme carousel API (window.themeCarousel.addTheme) not found or invalid. Cannot add generated theme.');
                if (typeof addSystemMessage === 'function') {
                    addSystemMessage('❌ Error: Could not add or apply generated theme via carousel API.');
                }
            }

        } catch (error) {
            console.error('Error processing theme:', error);
            if (typeof addSystemMessage === 'function') {
                addSystemMessage(`❌ Error processing theme: ${error.message || 'Unknown error'}`);
            }
        }
    }

})();
