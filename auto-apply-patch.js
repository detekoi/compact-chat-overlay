/**
 * Auto-Apply Background Image Patch
 * 
 * This script will automatically apply the background image patch
 * when the chat overlay loads. To use it, add the following code
 * to the end of chat.html, right before the closing </body> tag:
 *
 * <script src="auto-apply-patch.js"></script>
 */

(function() {
    // Wait for DOM to be fully loaded
    function applyPatch() {
        console.log('Auto-applying background image patch...');
        
        // Load the patch script
        const script = document.createElement('script');
        script.src = 'js/background-image-patch.js';
        script.onload = function() {
            console.log('Background image patch loaded and applied!');
        };
        script.onerror = function() {
            console.error('Failed to load background image patch!');
        };
        document.body.appendChild(script);
    }

    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPatch);
    } else {
        // DOM already loaded, run immediately
        applyPatch();
    }
})();
