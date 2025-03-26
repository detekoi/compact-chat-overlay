/**
 * Border Radius and Box Shadow Preset Fixer
 * 
 * This script fixes issues with border-radius and box-shadow preset names
 * by directly patching the CSS variables for proper rendering.
 */

(function() {
    // Run immediately when script loads
    fixBorderRadiusAndBoxShadow();
    
    // Also run whenever DOM is loaded (in case script is loaded early)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixBorderRadiusAndBoxShadow);
    }
    
    // Fix again after a short delay to handle any race conditions
    setTimeout(fixBorderRadiusAndBoxShadow, 100);
    
    // Observer to detect changes to root style attribute
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                fixBorderRadiusAndBoxShadow();
                break;
            }
        }
    });
    
    // Start observing once DOM is loaded
    if (document.readyState !== 'loading') {
        startObserver();
    } else {
        document.addEventListener('DOMContentLoaded', startObserver);
    }
    
    function startObserver() {
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style']
        });
        console.log('Border radius and box shadow fixer: observer started');
    }
    
    // Main fix function
    function fixBorderRadiusAndBoxShadow() {
        // Get current style values
        const style = getComputedStyle(document.documentElement);
        const borderRadius = document.documentElement.style.getPropertyValue('--chat-border-radius').trim();
        const boxShadow = document.documentElement.style.getPropertyValue('--chat-box-shadow').trim();
        
        // Define preset mappings
        const borderRadiusMap = {
            'None': '0px',
            'none': '0px',
            'Subtle': '8px',
            'subtle': '8px',
            'Rounded': '16px',
            'rounded': '16px',
            'Pill': '24px',
            'pill': '24px'
        };
        
        const boxShadowMap = {
            'None': 'none',
            'none': 'none',
            'Soft': 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
            'soft': 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
            'Simple 3D': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px',
            'simple 3d': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px',
            'Intense 3D': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px',
            'intense 3d': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px',
            'Sharp': '8px 8px 0px 0px rgba(0, 0, 0, 0.9)',
            'sharp': '8px 8px 0px 0px rgba(0, 0, 0, 0.9)'
        };
        
        // Check and fix border radius
        if (borderRadius && borderRadiusMap[borderRadius]) {
            const newValue = borderRadiusMap[borderRadius];
            console.log(`Border radius fixer: replacing "${borderRadius}" with "${newValue}"`);
            document.documentElement.style.setProperty('--chat-border-radius', newValue);
        }
        
        // Check and fix box shadow
        if (boxShadow && boxShadowMap[boxShadow]) {
            const newValue = boxShadowMap[boxShadow];
            console.log(`Box shadow fixer: replacing "${boxShadow}" with "${newValue}"`);
            document.documentElement.style.setProperty('--chat-box-shadow', newValue);
        }
        
        // Force the chat container to update by toggling a class
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.classList.add('border-radius-fixed');
            setTimeout(() => {
                chatContainer.classList.remove('border-radius-fixed');
            }, 10);
        }
    }
})();