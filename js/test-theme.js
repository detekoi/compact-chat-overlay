/**
 * Test Theme Generator
 * 
 * This is a standalone script that can be included to help diagnose theme generation issues.
 */

(function() {
    console.log('Initializing test theme generator...');
    
    // Create a test button
    function addTestButton() {
        // Get the generate theme button
        const generateThemeBtn = document.getElementById('generate-theme-btn');
        if (!generateThemeBtn) {
            console.error('Generate theme button not found');
            return;
        }
        
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
                console.log('Test theme button clicked');
                
                // Show loading indicator
                const themeLoadingIndicator = document.getElementById('theme-loading-indicator');
                if (themeLoadingIndicator) {
                    themeLoadingIndicator.style.display = 'block';
                    themeLoadingIndicator.textContent = 'Testing...';
                }
                
                // Call the test endpoint
                const response = await fetch('http://localhost:8091/api/test-theme');
                const data = await response.json();
                
                console.log('Test theme data received:', data);
                
                // Apply the test theme
                if (data.themeData) {
                    // Create a theme object
                    const testTheme = {
                        name: data.themeData.theme_name,
                        value: `test-${Date.now()}`,
                        bgColor: data.themeData.background_color,
                        borderColor: data.themeData.border_color,
                        textColor: data.themeData.text_color,
                        usernameColor: data.themeData.username_color,
                        borderRadius: data.themeData.border_radius || '8px',
                        boxShadow: data.themeData.box_shadow || 'soft',
                        description: data.themeData.description,
                        isGenerated: true
                    };
                    
                    // Add background image if available
                    if (data.backgroundImage) {
                        console.log('Applying background image from test theme');
                        const bgImageUrl = `data:${data.backgroundImage.mimeType};base64,${data.backgroundImage.data}`;
                        testTheme.backgroundImage = bgImageUrl;
                        
                        // Apply directly to CSS variables
                        document.documentElement.style.setProperty('--chat-bg-image', `url("${bgImageUrl}")`);
                        document.documentElement.style.setProperty('--popup-bg-image', `url("${bgImageUrl}")`);
                        
                        // Apply to theme preview
                        const themePreview = document.getElementById('theme-preview');
                        if (themePreview) {
                            themePreview.style.backgroundImage = `url("${bgImageUrl}")`;
                            themePreview.style.backgroundRepeat = 'repeat';
                            themePreview.style.backgroundSize = 'auto';
                        }
                    }
                    
                    // Add to available themes array
                    if (window.availableThemes) {
                        window.availableThemes.unshift(testTheme);
                        window.currentThemeIndex = 0;
                        
                        // Apply the theme
                        if (typeof window.updateThemeDisplay === 'function') {
                            window.updateThemeDisplay();
                        } else if (typeof window.applyTheme === 'function') {
                            window.applyTheme(testTheme.value);
                        }
                    }
                    
                    // Show success message
                    if (typeof window.addSystemMessage === 'function') {
                        window.addSystemMessage(`Test theme "${testTheme.name}" applied successfully`);
                    }
                } else {
                    console.error('Invalid test theme data:', data);
                    if (typeof window.addSystemMessage === 'function') {
                        window.addSystemMessage('Error: Invalid test theme data');
                    }
                }
            } catch (error) {
                console.error('Error applying test theme:', error);
                if (typeof window.addSystemMessage === 'function') {
                    window.addSystemMessage(`Error testing theme: ${error.message}`);
                }
            } finally {
                // Hide loading indicator
                const themeLoadingIndicator = document.getElementById('theme-loading-indicator');
                if (themeLoadingIndicator) {
                    themeLoadingIndicator.style.display = 'none';
                }
            }
        });
        
        // Add the button next to the generate button
        if (generateThemeBtn.parentNode) {
            generateThemeBtn.parentNode.insertBefore(testButton, generateThemeBtn.nextSibling);
            console.log('Test button added successfully');
        }
    }
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addTestButton);
    } else {
        // DOM already loaded
        setTimeout(addTestButton, 1000); // Delay to ensure other scripts have run
    }
})();
