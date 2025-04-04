/**
 * Background Color and Image Opacity Handler
 * 
 * This script manages the separate opacity controls for background color and background image.
 * It allows for independent control of both layers through CSS variables.
 */

(function() {
    console.log('Initializing background opacity handler...');
    
    // Get references to form controls
    const bgColorInput = document.getElementById('bg-color');
    const bgOpacityInput = document.getElementById('bg-opacity');
    const bgOpacityValue = document.getElementById('bg-opacity-value');
    const bgImageOpacityInput = document.getElementById('bg-image-opacity');
    const bgImageOpacityValue = document.getElementById('bg-image-opacity-value');
    
    // Removed the separate functions and replaced with direct event handlers
    
    // Setup event listeners for both opacity sliders
    if (bgOpacityInput) {
        bgOpacityInput.addEventListener('input', () => {
            const value = parseInt(bgOpacityInput.value, 10) / 100;
            document.documentElement.style.setProperty('--chat-bg-opacity', value);
            document.documentElement.style.setProperty('--popup-bg-opacity', value);
            
            // Update display value
            if (bgOpacityValue) {
                bgOpacityValue.textContent = `${bgOpacityInput.value}%`;
            }
            
            console.log(`Updated background color opacity: ${value}`);
        });
    }
    
    if (bgImageOpacityInput) {
        bgImageOpacityInput.addEventListener('input', () => {
            const value = parseInt(bgImageOpacityInput.value, 10) / 100;
            document.documentElement.style.setProperty('--chat-bg-image-opacity', value);
            document.documentElement.style.setProperty('--popup-bg-image-opacity', value);
            
            // Update display value
            if (bgImageOpacityValue) {
                bgImageOpacityValue.textContent = `${bgImageOpacityInput.value}%`;
            }
            
            console.log(`Updated background image opacity: ${value}`);
        });
    }
    
    // Initialize with current values
    if (bgOpacityInput) {
        const value = parseInt(bgOpacityInput.value, 10) / 100;
        document.documentElement.style.setProperty('--chat-bg-opacity', value);
        document.documentElement.style.setProperty('--popup-bg-opacity', value);
        console.log(`Initialized background color opacity: ${value}`);
    }
    
    if (bgImageOpacityInput) {
        const value = parseInt(bgImageOpacityInput.value, 10) / 100;
        document.documentElement.style.setProperty('--chat-bg-image-opacity', value);
        document.documentElement.style.setProperty('--popup-bg-image-opacity', value);
        console.log(`Initialized background image opacity: ${value}`);
    }
    
    // Override the existing chat.js function that handles background color
    // This needs to happen after chat.js loads, so we use setTimeout to ensure proper execution order
    setTimeout(() => {
        if (window.updateBgColor) {
            console.log('Overriding existing updateBgColor function');
            const originalUpdateBgColor = window.updateBgColor;
            
            window.updateBgColor = function() {
                // Get the hex color without opacity conversion
                if (bgColorInput) {
                    const hexColor = bgColorInput.value || '#1e1e1e';
                    
                    // Set the color directly (not as rgba)
                    document.documentElement.style.setProperty('--chat-bg-color', hexColor);
                    document.documentElement.style.setProperty('--popup-bg-color', hexColor);
                }
                
                // Still call the original function for other functionality
                if (typeof originalUpdateBgColor === 'function') {
                    originalUpdateBgColor();
                }
                
                // Make sure opacity is applied correctly
                if (bgOpacityInput) {
                    const value = parseInt(bgOpacityInput.value, 10) / 100;
                    document.documentElement.style.setProperty('--chat-bg-opacity', value);
                    document.documentElement.style.setProperty('--popup-bg-opacity', value);
                }
            };
        }
    }, 500);
    
    console.log('Background opacity handler initialized');
})();