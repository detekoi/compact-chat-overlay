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
    
    // REMOVED event listener for bgOpacityInput as chat.js now handles it
    // if (bgOpacityInput) { ... listener removed ... }
    
    if (bgImageOpacityInput) {
        bgImageOpacityInput.addEventListener('input', () => {
            const value = parseInt(bgImageOpacityInput.value, 10) / 100;
            document.documentElement.style.setProperty('--chat-bg-image-opacity', value);
            document.documentElement.style.setProperty('--popup-bg-image-opacity', value);
            
            // Update display value
            if (bgImageOpacityValue) {
                bgImageOpacityValue.textContent = `${bgImageOpacityInput.value}%`;
            }

            // Update the theme preview
            if (typeof window.updatePreviewFromCurrentSettings === 'function') {
                window.updatePreviewFromCurrentSettings();
            }
            
            console.log(`Updated background image opacity: ${value}`);
        });
    }
    
    console.log('Background opacity handler initialized');
})();