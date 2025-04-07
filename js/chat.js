// Wait for DOM ready to run this code
(function() {
    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        // DOM already loaded, run immediately
        initApp();
    }
    
    function initApp() {
        console.log('DOM is fully loaded, initializing application...');
        
        // --- HELPER FUNCTIONS (Defined Early) ---

        /**
         * Converts a hex color string and an opacity value (0-1) to an rgba string.
         * @param {string} hex - The hex color string (e.g., "#ff0000").
         * @param {number} opacity - The opacity value (0.0 to 1.0).
         * @returns {string} The rgba color string (e.g., "rgba(255, 0, 0, 0.5)").
         */
        function hexToRgba(hex, opacity) {
            // <<< ADD CHECK: If input is already rgba, return it >>>
            if (typeof hex === 'string' && hex.trim().toLowerCase().startsWith('rgba')) {
                console.warn(`[hexToRgba] Received rgba value "${hex}" instead of hex. Returning directly.`);
                return hex; // Input is already rgba
            }

            if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) { // Also check for # prefix
                console.warn(`Invalid hex format provided to hexToRgba: ${hex}`);
                return `rgba(0, 0, 0, ${opacity})`; // Default black if hex invalid
            }

            let r = 0, g = 0, b = 0;
            // 3 digit hex
            if (hex.length === 4) {
                r = parseInt(hex[1] + hex[1], 16);
                g = parseInt(hex[2] + hex[2], 16);
                b = parseInt(hex[3] + hex[3], 16);
            }
            // 6 digit hex
            else if (hex.length === 7) {
                r = parseInt(hex[1] + hex[2], 16);
                g = parseInt(hex[3] + hex[4], 16);
                b = parseInt(hex[5] + hex[6], 16);
            }
             else {
                 // Invalid hex format, return default black with opacity
                 console.warn(`Invalid hex format provided to hexToRgba: ${hex}`);
                 return `rgba(0, 0, 0, ${opacity})`;
             }

            // Ensure opacity is within bounds
            opacity = Math.max(0, Math.min(1, opacity));

            return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`; // Keep 2 decimal places for opacity
        }
        
        // Default configuration
        let config = {
            // Display mode
            chatMode: 'window',
            
            // Window mode settings
            bgColor: 'rgba(18, 18, 18, 0.8)',
            borderColor: '#9147ff',
            textColor: '#efeff1',
            usernameColor: '#9147ff',
            fontSize: 14,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            chatWidth: 95, // Default width set to 95%
            chatHeight: 95, // Default height set to 95%
            maxMessages: 50,
            showTimestamps: true,
            overrideUsernameColors: false,
            borderRadius: '8px',
            boxShadow: 'none',
            
            // Popup mode settings
            popup: {
                direction: 'from-bottom',
                duration: 5, // seconds
                maxMessages: 3
            },
            
            // Theme
            theme: 'default',
            
            // Last connected channel
            lastChannel: ''
        };
        
        // DOM elements
        const chatContainer = document.getElementById('chat-container');
        const chatWrapper = document.getElementById('chat-wrapper'); // Get reference to the wrapper
        const chatMessages = document.getElementById('chat-messages');
        const scrollArea = document.getElementById('chat-scroll-area');
        // Create status indicator if it doesn't exist
        let statusIndicator;
        if (!document.getElementById('status-indicator')) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'status-indicator';
            statusIndicator.className = 'disconnected';
            statusIndicator.title = 'Disconnected';
            document.getElementById('chat-container').appendChild(statusIndicator);
        } else {
            statusIndicator = document.getElementById('status-indicator');
        }
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');
        const channelInput = document.getElementById('channel-input');
        const settingsBtn = document.getElementById('settings-btn');
        const configPanel = document.getElementById('config-panel');
        const saveConfigBtn = document.getElementById('save-config');
        const cancelConfigBtn = document.getElementById('cancel-config');
        const resetConfigBtn = document.getElementById('reset-config');
        const fontSizeSlider = document.getElementById('font-size');
        const fontSizeValue = document.getElementById('font-size-value');
        const bgColorInput = document.getElementById('bg-color');
        const bgOpacityInput = document.getElementById('bg-opacity');
        const bgOpacityValue = document.getElementById('bg-opacity-value'); // Get existing element
        const borderColorInput = document.getElementById('border-color');
        const textColorInput = document.getElementById('text-color');
        const usernameColorInput = document.getElementById('username-color');
        const overrideUsernameColorsInput = document.getElementById('override-username-colors');
        const chatWidthInput = document.getElementById('chat-width');
        const chatWidthValue = document.getElementById('chat-width-value');
        const chatHeightInput = document.getElementById('chat-height');
        const chatHeightValue = document.getElementById('chat-height-value');
        const maxMessagesInput = document.getElementById('max-messages');
        const showTimestampsInput = document.getElementById('show-timestamps');
        
        // Border radius and box shadow presets
        const borderRadiusPresets = document.getElementById('border-radius-presets');
        const boxShadowPresets = document.getElementById('box-shadow-presets');
        
        // Font selection carousel
        const prevFontBtn = document.getElementById('prev-font');
        const nextFontBtn = document.getElementById('next-font');
        const currentFontDisplay = document.getElementById('current-font');
        
        // Theme carousel
        // const prevThemeBtn = document.getElementById('prev-theme'); // REMOVED
        // const nextThemeBtn = document.getElementById('next-theme'); // REMOVED
        // const currentThemeDisplay = document.getElementById('current-theme'); // REMOVED
        const themePreview = document.getElementById('theme-preview'); // Ensure themePreview is defined
        
        // Connection Management Elements (inside config panel)
        const channelForm = document.getElementById('channel-form'); // Now refers to the one in the panel
        
        // Connection and chat state
        let socket = null;
        let channel = '';
        
        // Store config state when panel opens
        let initialConfigBeforeEdit = null; // Use ONLY this for revert state
        
        // Font selection
        let currentFontIndex = 0;
        // availableFonts is now defined globally in theme-carousel.js
        // const availableFonts = [ ... ]; // REMOVED local definition
        
        // Theme selection (populated by theme-carousel.js)
        // let currentThemeIndex = 0; // REMOVED
        let lastAppliedThemeValue = 'default'; // Keep for saving state
        // availableThemes is now managed globally, initialized by theme-carousel.js
        // const availableThemes = [ ... ]; // Removed initial definition
        
        // --- DEFINE HELPER FUNCTIONS EARLY ---

        /**
         * Fix any CSS variables that contain preset names instead of actual CSS values.
         */
        function fixCssVariables() {
            // Get current CSS variable values
            const borderRadius = document.documentElement.style.getPropertyValue('--chat-border-radius').trim();
            const boxShadow = document.documentElement.style.getPropertyValue('--chat-box-shadow').trim();
            
            // Only proceed if variables have values
            if (borderRadius || boxShadow) {
                // Check border radius
                if (borderRadius) {
                    const borderRadiusMap = {
                        'None': '0px', 'none': '0px',
                        'Subtle': '8px', 'subtle': '8px',
                        'Rounded': '16px', 'rounded': '16px',
                        'Pill': '24px', 'pill': '24px'
                    };
                    
                    // If it's a preset name, convert to CSS value
                    if (borderRadiusMap[borderRadius]) {
                        const cssValue = borderRadiusMap[borderRadius];
                        // *** Add check: Only set if value is different ***
                        if (borderRadius !== cssValue) {
                            console.log(`Converting border radius "${borderRadius}" to "${cssValue}"`);
                            document.documentElement.style.setProperty('--chat-border-radius', cssValue);
                        }
                    }
                }
                
                // Check box shadow
                if (boxShadow) {
                    const boxShadowMap = {
                        'None': 'none', 'none': 'none',
                        'Soft': 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px', 'soft': 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
                        'Simple 3D': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px', 'simple 3d': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px', 'simple3d': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px',
                        'Intense 3D': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px', 'intense 3d': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px', 'intense3d': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px',
                        'Sharp': '8px 8px 0px 0px rgba(0, 0, 0, 0.9)', 'sharp': '8px 8px 0px 0px rgba(0, 0, 0, 0.9)'
                    };
                    
                    // If it's a preset name (key exists in map)
                    if (boxShadowMap[boxShadow]) {
                        const cssValue = boxShadowMap[boxShadow];
                        // *** Add check: Only setProperty if the current value is not already the target CSS value ***
                        if (boxShadow !== cssValue) {
                            console.log(`Converting box shadow "${boxShadow}" to "${cssValue}"`);
                            document.documentElement.style.setProperty('--chat-box-shadow', cssValue);
                        } 
                        // Optional: Log that it's already correct - uncomment below for debugging
                        // else { console.log(`Box shadow variable "--chat-box-shadow" already has correct CSS value: "${boxShadow}"`); }
                    }
                }
            }
        }

        /**
         * Get border radius CSS value from preset name or direct value
         */
        window.getBorderRadiusValue = function(value) { // Make global
            if (!value) return '8px'; // Default
            
            const borderRadiusMap = {
                'None': '0px', 'none': '0px',
                'Subtle': '8px', 'subtle': '8px',
                'Rounded': '16px', 'rounded': '16px',
                'Pill': '24px', 'pill': '24px',
                'Sharp': '0px', 'sharp': '0px' // Added Sharp preset
            };
            
            if (borderRadiusMap[value]) {
                return borderRadiusMap[value];
            }
            
            if (typeof value === 'string' && value.endsWith('px')) {
                return value;
            }
            
            console.warn(`Unknown border radius value: ${value}. Defaulting to 8px.`);
            return '8px';
        }

        /**
         * Get box shadow CSS value from preset name or direct value
         */
        window.getBoxShadowValue = function(preset) { // Make global
            if (!preset) return 'none';
            
            const boxShadowMap = {
                'none': 'none',
                'soft': 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
                'simple3d': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px',
                'simple 3d': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px',
                'intense3d': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px',
                'intense 3d': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px',
                'sharp': '8px 8px 0px 0px rgba(0, 0, 0, 0.9)'
            };
            
            const presetLower = preset.toLowerCase();
            if (boxShadowMap[presetLower]) {
                return boxShadowMap[presetLower];
            }
            
            if (preset === 'none' || preset.includes('rgba') || preset.includes('px')) {
                return preset;
            }
            
            return 'none';
        }
        
        /**
         * Highlight the active border radius button based on CSS value
         */
        function highlightBorderRadiusButton(cssValue) {
             if (borderRadiusPresets) {
                const buttons = borderRadiusPresets.querySelectorAll('.preset-btn');
                buttons.forEach(btn => {
                    if (btn.dataset.value === cssValue) { 
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        }

        /**
         * Highlight the active box shadow button based on preset name
         */
        function highlightBoxShadowButton(presetName) {
             if (boxShadowPresets) {
                // Normalize the input preset name to match the data-value format (lowercase, no spaces)
                const normalizedPreset = typeof presetName === 'string' 
                    ? presetName.toLowerCase().replace(/\\s+/g, '') 
                    : 'none'; // Default to 'none' if input is invalid

                const buttons = boxShadowPresets.querySelectorAll('.preset-btn');
                buttons.forEach(btn => {
                    // Compare button's data-value with the normalized preset name
                    if (btn.dataset.value === normalizedPreset) { 
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        }

        // Helper function to get URL parameters
        function getUrlParameter(name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            const results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        }
        
        // --- END OF EARLY HELPER DEFINITIONS ---

        // Add a MutationObserver to fix any incorrect CSS variable values immediately
        const cssVarObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'style') {
                    fixCssVariables();
                }
            });
        });
        
        // Start observing document.documentElement style changes
        cssVarObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style']
        });
        
        
        // Theme selection (populated by theme-carousel.js)
        // window.availableThemes is initialized/populated by theme-carousel.js
        
        // --- REST OF THE initApp FUNCTIONS ---
        
        // Show status indicators and messages
        function updateStatus(connected) {
            if (connected) {
                statusIndicator.classList.add('connected');
                statusIndicator.classList.remove('disconnected');
                statusIndicator.title = `Connected to ${channel}'s chat`;
            } else {
                statusIndicator.classList.add('disconnected');
                statusIndicator.classList.remove('connected');
                statusIndicator.title = 'Disconnected';
            }
        }
        
        /**
         * Check if the user is scrolled near the bottom of an element.
         */
        function isUserScrolledToBottom(element) {
            if (!element) return false;
            // Use a tolerance (e.g., 5 pixels) for slight variations
            const tolerance = 5;
            return element.scrollHeight - element.clientHeight <= element.scrollTop + tolerance;
        }
        
        // Add a system message to the chat
        function addSystemMessage(message) {
            // Determine if we should scroll after adding the message (only in window mode)
            const shouldScroll = config.chatMode === 'window' && isUserScrolledToBottom(scrollArea);

            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message system-message';

            let timestamp = '';
            if (config.showTimestamps) {
                const now = new Date();
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                timestamp = `${hours}:${minutes} `;
            }

            messageElement.innerHTML = `<span class="timestamp">${timestamp}</span><span class="message-content">${message}</span>`;
            
            // Append to the correct container (chatMessages is inside scrollArea)
            if (chatMessages) {
                chatMessages.appendChild(messageElement);
            } else {
                console.error("Chat messages container not found for system message.");
                return;
            }

            // Limit messages (only makes sense in window mode)
            if (config.chatMode === 'window') {
                limitMessages();
            }

            // Conditionally scroll down only if user was at the bottom before adding
            if (shouldScroll && scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
            // Removed unconditional scrollToBottom();
        }
        
        // Add a user message to the chat
        function addChatMessage(data) {
            try {
                if (!data.username || !data.message) return;
                
                // First check which mode we're in and get appropriate container
                let targetContainer;
                let currentScrollArea; // Define specific scroll area for this function instance
                
                if (config.chatMode === 'popup') {
                    targetContainer = document.getElementById('popup-messages');
                    currentScrollArea = null; // No scrolling needed for popup
                    if (!targetContainer) {
                        console.error('Popup messages container not found');
                        return; // Exit early if container not found
                    }
                } else {
                    targetContainer = chatMessages;
                    currentScrollArea = scrollArea; // Use the globally defined scroll area
                    if (!targetContainer) {
                        console.error('Chat messages container not found');
                        return; // Exit early if container not found
                    }
                    if (!currentScrollArea) {
                         console.error('Chat scroll area not found');
                        // Potentially try to find it again, though it should exist
                        // currentScrollArea = document.getElementById('chat-scroll-area');
                        // If still not found, maybe return or log error
                    }
                }

                 if (!targetContainer) {
                    console.error('Target container could not be determined or found.');
                    return;
                 }


                // Check scroll position *before* adding the message (only in window mode)
                const shouldScroll = config.chatMode === 'window' && isUserScrolledToBottom(currentScrollArea);

                const messageElement = document.createElement('div');

                if (config.chatMode === 'popup') {
                    messageElement.className = 'popup-message';
                    // Add animation direction class
                    if (config.popup && config.popup.direction) {
                        messageElement.classList.add(config.popup.direction);
                    } else {
                        messageElement.classList.add('from-bottom'); // Default fallback
                    }
                } else {
                    messageElement.className = 'chat-message';
                }
                
                // Add timestamp if enabled
                let timestamp = '';
                if (config.showTimestamps) {
                    const now = new Date();
                    const hours = now.getHours().toString().padStart(2, '0');
                    const minutes = now.getMinutes().toString().padStart(2, '0');
                    timestamp = `${hours}:${minutes} `;
                }
                
                // Create a random username color if not provided or if we're overriding
                let userColor = data.color || generateColorFromName(data.username);
                
                // The overrideUsernameColors setting controls if we use the user's Twitch color
                if (config.overrideUsernameColors) {
                    userColor = config.usernameColor; // Use the theme's username color instead
                }
                
                // Handle message content
                let message = data.message;
                
                // Parse emotes if available
                if (data.emotes && typeof data.emotes === 'object') {
                    const emotePositions = [];
                    
                    try {
                        // Build a list of all emote positions
                        for (const emoteId in data.emotes) {
                            if (!data.emotes.hasOwnProperty(emoteId)) continue;
                            
                            const emotePositionArray = data.emotes[emoteId];
                            if (!Array.isArray(emotePositionArray)) continue;
                            
                            for (const position of emotePositionArray) {
                                if (!position || !position.includes('-')) continue;
                                
                                const [startStr, endStr] = position.split('-');
                                const start = parseInt(startStr, 10);
                                const end = parseInt(endStr, 10);
                                
                                // Validate the positions are valid numbers and in range
                                if (isNaN(start) || isNaN(end) || start < 0 || end < 0 || start > end || end >= data.message.length) {
                                    continue;
                                }
                                
                                emotePositions.push({
                                    start,
                                    end,
                                    id: emoteId
                                });
                            }
                        }
                    } catch (err) {
                        console.error('Error processing emotes:', err);
                    }
                    
                    // Sort emote positions from end to start to avoid position shifts
                    emotePositions.sort((a, b) => b.start - a.start);
                    
                    // Replace each emote with an img tag
                    for (const emote of emotePositions) {
                        try {
                            const emoteCode = message.substring(emote.start, emote.end + 1);
                            const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`;
                            
                            // Create the replacement HTML with proper escaping
                            const emoteHtml = `<img class="emote" src="${emoteUrl}" alt="${emoteCode.replace(/"/g, '&quot;')}" title="${emoteCode.replace(/"/g, '&quot;')}" />`;
                            
                            // Replace the emote in the message
                            message = message.substring(0, emote.start) + emoteHtml + message.substring(emote.end + 1);
                        } catch (err) {
                            console.error('Error replacing emote:', err);
                        }
                    }
                }
                
                // Skip URL processing entirely if message contains emote tags
                if (!message.includes('<img class="emote"')) {
                    // Only process URLs in messages without emotes
                    message = message.replace(
                        /(\bhttps?:\/\/[^\s<]+)/g,
                        (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
                    );
                }
                
                // Badge functionality removed - requires Twitch API auth
                
                // Assemble the chat message
                messageElement.innerHTML = `
                    <span class="timestamp">${timestamp}</span>
                    <span class="username" style="color: ${userColor}">${data.username}:</span>
                    <span class="message-content">${message}</span>
                `;
                
                // Add to appropriate container
                targetContainer.appendChild(messageElement);

                // Trigger slide-in transition for popup mode
                if (config.chatMode === 'popup') {
                    // Force reflow before adding the class to trigger transition
                    void messageElement.offsetWidth;
                    messageElement.classList.add('visible');
                }

                if (config.chatMode === 'window') {
                    // Limit messages to maintain performance
                    limitMessages();
                    
                    // Conditionally scroll down only if user was at the bottom before adding
                    if (shouldScroll && currentScrollArea) {
                        currentScrollArea.scrollTop = currentScrollArea.scrollHeight;
                    }
                    // Removed unconditional scrollToBottom();
                    
                } else if (config.chatMode === 'popup') {
                    
                    // For popup mode, limit messages and set auto-remove timer
                    // Limit popup messages - Use Array.from to create a static array instead of live NodeList
                    const popupMsgs = Array.from(targetContainer.querySelectorAll('.popup-message'));
                    const maxMessages = config.popup?.maxMessages;
                    
                    // Remove excess messages starting from the oldest ones
                    if (popupMsgs.length > maxMessages && maxMessages > 0) {
                        try {
                            const removeCount = popupMsgs.length - maxMessages;
                            for (let i = 0; i < removeCount; i++) {
                                if (popupMsgs[i] && popupMsgs[i].parentNode) {
                                    popupMsgs[i].parentNode.removeChild(popupMsgs[i]);
                                }
                            }
                        } catch (err) {
                            console.error('Error removing excess popup messages:', err);
                        }
                    }
                    
                    // Set the auto-remove timer with a safety check for duration
                    const duration = (config.popup?.duration || 5) * 1000;
                    if (duration > 0 && duration < 60000) { // Ensure valid duration (0-60 seconds)
                        setTimeout(() => {
                            // 1. Remove .visible to start slide-out transition state
                            messageElement.classList.remove('visible');

                            // 2. Use requestAnimationFrame to ensure .visible removal is processed
                            requestAnimationFrame(() => {
                                // Force reflow before adding .removing (belt-and-suspenders)
                                void messageElement.offsetWidth;
                                // 3. Add .removing class (CSS sets opacity: 0, transition handles the rest)
                                messageElement.classList.add('removing');

                                // 4. Set timeout to remove the DOM element *after* the transition completes
                                setTimeout(() => {
                                    if (messageElement.parentNode) {
                                        messageElement.parentNode.removeChild(messageElement);
                                    }
                                }, 300); // Match the CSS transition duration
                            });
                        }, duration); // Start removal process after configured duration
                    }
                }
            } catch (error) {
                console.error('Error adding chat message:', error);
            }
        }
        
        // Connect to Twitch chat
        function connectToChat() {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
            
            channel = channelInput.value.trim().toLowerCase();
            
            if (!channel) {
                addSystemMessage('Please enter a valid channel name in the settings panel'); // Updated message
                return;
            }
            
            // Hide the channel form and show connecting message
            // No longer need to hide the form in the main area, it's in the panel now.
            // We will hide it in the panel on successful connection (in onopen).
            
            addSystemMessage(`Connecting to ${channel}'s chat...`);
            
            // Connect to Twitch IRC via WebSocket
            socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            
            socket.onopen = function() {
                console.log('WebSocket connection opened');
                // Check if socket is in OPEN state before sending
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
                    socket.send(`PASS SCHMOOPIIE`);
                    socket.send(`NICK justinfan${Math.floor(Math.random() * 999999)}`);
                    socket.send(`JOIN #${channel}`);
                    
                    // Update connection status
                    updateStatus(true);
                    
                    // Save the channel name in config
                    config.lastChannel = channel;
                    
                    // Hide channel form, show disconnect button in panel
                    if (channelForm) channelForm.style.display = 'none';
                    if (disconnectBtn) {
                        disconnectBtn.textContent = `Disconnect from ${channel}`;
                        disconnectBtn.style.display = 'block';
                    }
                    
                    // Add connected message
                    addSystemMessage(`Connected to ${channel}'s chat`);
                }
            };
            
            socket.onclose = function() {
                console.log('WebSocket connection closed');
                updateStatus(false);
                addSystemMessage('Disconnected from chat');
                
                // Hide channel actions and show channel form
                // Hide disconnect button, show channel form in panel
                if (disconnectBtn) {
                    disconnectBtn.style.display = 'none';
                    disconnectBtn.textContent = 'Disconnect'; // Reset text
                }
                if (channelForm) {
                    channelForm.style.display = 'block';
                }
                
                // Reset disconnect button text
                const disconnectButton = document.getElementById('disconnect-btn');
                if (disconnectButton) {
                    disconnectButton.textContent = 'Disconnect';
                }
            };
            
            socket.onerror = function(error) {
                console.error('WebSocket error:', error);
                updateStatus(false);
                addSystemMessage('Error connecting to chat');
                
                // Hide channel actions on error too
                if (disconnectBtn) {
                    disconnectBtn.style.display = 'none';
                    disconnectBtn.textContent = 'Disconnect'; // Reset text
                }
                if (channelForm) {
                    channelForm.style.display = 'block';
                }
            };
            
            socket.onmessage = function(event) {
                const messages = event.data.split('\r\n');
                
                messages.forEach(message => {
                    if (!message) return;
                    
                    // Keep connection alive
                    if (message.includes('PING')) {
                        socket.send('PONG :tmi.twitch.tv');
                        return;
                    }
                    
                    // Handle PRIVMSG (chat messages)
                    if (message.includes('PRIVMSG')) {
                        // Debug log for troubleshooting message format issues
                        console.debug('Received Twitch message:', message);
                        // Parse tags if present (IRCv3)
                        let tags = {};
                        if (message.startsWith('@')) {
                            try {
                                const tagEnd = message.indexOf(' ');
                                if (tagEnd > 0) {
                                    const tagPart = message.slice(1, tagEnd);
                                    tagPart.split(';').forEach(tag => {
                                        if (tag && tag.includes('=')) {
                                            const [key, value] = tag.split('=');
                                            if (key) tags[key] = value || '';
                                        }
                                    });
                                }
                            } catch (err) {
                                console.error('Error parsing IRC tags:', err);
                            }
                        }
                        
                        // Extract username from message - handling both standard and non-standard formats
                        let username = 'Anonymous';
                        try {
                            // First try the display-name from tags (most reliable)
                            if (tags['display-name']) {
                                username = tags['display-name'];
                            } else {
                                // Fall back to extracting from message
                                const usernameMatch = message.match(/:(.*?)!/);
                                if (usernameMatch && usernameMatch[1]) {
                                    username = usernameMatch[1];
                                }
                            }
                        } catch (err) {
                            console.error('Error extracting username:', err);
                        }
                        
                        // Extract message content more reliably
                        let messageContent = '';
                        try {
                            // Look for the PRIVMSG part and extract everything after the colon
                            const messageParts = message.split('PRIVMSG #');
                            if (messageParts.length > 1) {
                                // Get the channel and message part
                                const channelAndMessage = messageParts[1];
                                // Find the first colon after the channel name
                                const colonIndex = channelAndMessage.indexOf(' :');
                                if (colonIndex !== -1) {
                                    // Extract everything after the colon
                                    messageContent = channelAndMessage.substring(colonIndex + 2);
                                }
                            }
                        } catch (err) {
                            console.error('Error extracting message content:', err);
                        }
                        
                        // Parse emotes
                        let emotes = null;
                        if (tags.emotes) {
                            try {
                                emotes = {};
                                const emoteGroups = tags.emotes.split('/');
                                emoteGroups.forEach(group => {
                                    if (!group || !group.includes(':')) return;
                                    const [emoteId, positions] = group.split(':');
                                    if (emoteId && positions) {
                                        emotes[emoteId] = positions.split(',').filter(pos => pos && pos.includes('-'));
                                    }
                                });
                            } catch (err) {
                                console.error('Error parsing emotes:', err, tags.emotes);
                            }
                        }
                        
                        // Badge parsing removed - requires Twitch API auth
                        
                        // Log parsed data for debugging
                        console.debug('Parsed message data:', {
                            username,
                            messageContent,
                            emotes: tags.emotes
                        });
                        
                        // Add the chat message
                        addChatMessage({
                            username,
                            message: messageContent,
                            color: tags.color || null,
                            emotes
                        });
                    }
                });
            };
        }
        
        // Limit the number of messages based on settings
        function limitMessages() {
            // Save scroll position information
            const isAtBottom = Math.abs((chatMessages.scrollHeight - chatMessages.scrollTop) - chatMessages.clientHeight) < 5;
            
            // Remove excess messages
            while (chatMessages.children.length > config.maxMessages) {
                chatMessages.removeChild(chatMessages.firstChild);
            }
            
            // If we were at the bottom before, make sure we stay there
            if (isAtBottom) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
        
        // Generate a color from a username
        function generateColorFromName(name) {
            // Simple hash function for the name
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            
            // Create a color from the hash
            const h = Math.abs(hash) % 360;
            const s = 70 + (Math.abs(hash) % 30); // 70-100%
            const l = 40 + (Math.abs(hash) % 30); // 40-70%
            
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
        
        // Connect button handler
        if (connectBtn) {
            connectBtn.addEventListener('click', function(e) {
                console.log('Connect button clicked');
                if (e) e.preventDefault();
                connectToChat(); // Initiate connection

                // Save ONLY the lastChannel after connection attempt, don't close panel
                if (channel) {
                    config.lastChannel = channel;
                    try {
                        // Update just the lastChannel in localStorage without triggering full save/close
                        const scene = getUrlParameter('scene') || 'default';
                        const configKey = `chatConfig_${scene}`;
                        let existingConfig = {};
                        try {
                            const saved = localStorage.getItem(configKey);
                            if (saved) existingConfig = JSON.parse(saved);
                        } catch (parseError) {
                            console.error("Error parsing existing config for channel save:", parseError);
                        }
                        existingConfig.lastChannel = channel;
                        localStorage.setItem(configKey, JSON.stringify(existingConfig));
                        console.log(`Saved lastChannel '${channel}' for scene '${scene}'`);
                    } catch (storageError) {
                        console.error("Error saving lastChannel to localStorage:", storageError);
                    }
                }

                return false;
            });
            
            // Visual feedback to confirm the button is clickable
            connectBtn.style.cursor = 'pointer';
            connectBtn.style.position = 'relative';
            connectBtn.style.zIndex = '100';
        }
        
        // Channel input connect on Enter
        channelInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                connectToChat();
                
                // Also save ONLY the lastChannel after connection is attempted via Enter
                if (channel) {
                    config.lastChannel = channel;
                    try {
                        // Update just the lastChannel in localStorage without triggering full save/close
                        const scene = getUrlParameter('scene') || 'default';
                        const configKey = `chatConfig_${scene}`;
                        let existingConfig = {};
                        try {
                            const saved = localStorage.getItem(configKey);
                            if (saved) existingConfig = JSON.parse(saved);
                        } catch (parseError) {
                            console.error("Error parsing existing config for channel save:", parseError);
                        }
                        existingConfig.lastChannel = channel;
                        localStorage.setItem(configKey, JSON.stringify(existingConfig));
                        console.log(`Saved lastChannel '${channel}' for scene '${scene}' via Enter`);
                    } catch (storageError) {
                        console.error("Error saving lastChannel to localStorage via Enter:", storageError);
                    }
                }
            }
        });
        
        // Background color + opacity handling
        function updateBgColor() {
            // Get the hex color without transparency
            const hexColor = bgColorInput.value;
            // Get opacity value (0-1) from the slider
            const opacity = parseInt(bgOpacityInput.value) / 100;

            // Convert hex and opacity to rgba string for immediate visual feedback
            const rgbaColorForCSS = hexToRgba(hexColor, opacity);

            // Set the combined rgba color for both chat and popup backgrounds
            document.documentElement.style.setProperty('--chat-bg-color', rgbaColorForCSS);
            document.documentElement.style.setProperty('--popup-bg-color', rgbaColorForCSS);

            // Update the display value for the opacity slider
            const bgOpacityValue = document.getElementById('bg-opacity-value');
            if (bgOpacityValue) {
                bgOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
            }

            // <<< ADD THIS LINE >>>
            updateThemePreview(); // Update preview on bg color/opacity change
        }

        // Add event listeners to update the background color when either input changes
        bgColorInput.addEventListener('input', updateBgColor);
        bgOpacityInput.addEventListener('input', updateBgColor); // Add listener for opacity slider

        // Background image opacity handling
        const bgImageOpacityInput = document.getElementById('bg-image-opacity');
        const bgImageOpacityValue = document.getElementById('bg-image-opacity-value');
        
        function updateBgImageOpacity() {
            const opacity = parseInt(bgImageOpacityInput.value) / 100;
            
            // Set the image opacity
            document.documentElement.style.setProperty('--chat-bg-image-opacity', opacity);
            document.documentElement.style.setProperty('--popup-bg-image-opacity', opacity);
            
            // Update the display value
            if (bgImageOpacityValue) {
                bgImageOpacityValue.textContent = `${bgImageOpacityInput.value}%`;
            }
            
            // <<< ADD THIS LINE >>>
            updateThemePreview(); // Update preview on bg image opacity change
        }
        
        if (bgImageOpacityInput) {
            bgImageOpacityInput.addEventListener('input', updateBgImageOpacity);
        }
        
        // Color button click handlers and styling
        document.querySelectorAll('.color-btn').forEach(button => {
            // Set initial background color of buttons to match their data-color
            const color = button.getAttribute('data-color');
            button.style.backgroundColor = color;
            
            // For buttons with 'transparent' or very light colors, add a border
            if (color === 'transparent' || color === '#ffffff' || color === '#ffdeec' || color === '#f5f2e6') {
                button.style.border = '1px solid #888';
            }
            
            // Make text color contrasting so it's readable
            if (color === '#000000' || color === '#121212' || color === '#1a1a1a' || color === '#0c0c28' || color === '#4e3629') {
                button.style.color = 'white';
            } else {
                button.style.color = 'black';
            }
            
            button.addEventListener('click', (e) => {
                const colorAttr = e.target.getAttribute('data-color');
                const color = colorAttr;
                const target = e.target.getAttribute('data-target');
                
                // Mark this button as active and remove active class from sibling buttons
                const allButtonsForTarget = document.querySelectorAll(`.color-btn[data-target="${target}"]`);
                allButtonsForTarget.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Set the appropriate color input based on target
                if (target === 'bg') {
                    // Special handling for the transparent button
                    if (color === 'transparent') {
                        bgColorInput.value = '#000000'; // Set base color to black for transparent
                        if (bgOpacityInput) {
                            bgOpacityInput.value = 0; // Force opacity slider to 0
                        }
                        updateBgColor(); // Apply black bg with 0 opacity
                    } else {
                        bgColorInput.value = color;
                        // Optionally reset opacity slider to default when a solid color is chosen?
                        // if (bgOpacityInput) bgOpacityInput.value = 85;
                        updateBgColor(); // Apply selected color with current/default opacity
                    }
                } else if (target === 'border') {
                    // For border, handle "transparent" specially
                    if (color === 'transparent') {
                        // Don't try to set 'transparent' on color input - it's not supported
                        // Instead, just set the CSS variables and track the transparent state
                        document.documentElement.style.setProperty('--chat-border-color', 'transparent');
                        document.documentElement.style.setProperty('--popup-border-color', 'transparent');
                        // Store the active state on the button itself for tracking
                        document.querySelectorAll('.color-btn[data-target="border"]').forEach(btn => {
                            if (btn.getAttribute('data-color') === 'transparent') {
                                btn.setAttribute('data-is-transparent', 'true');
                            }
                        });
                    } else {
                        borderColorInput.value = color;
                        document.documentElement.style.setProperty('--chat-border-color', color);
                        document.documentElement.style.setProperty('--popup-border-color', color);
                        // Clear transparent flag
                        document.querySelectorAll('.color-btn[data-target="border"]').forEach(btn => {
                            btn.removeAttribute('data-is-transparent');
                        });
                    }
                } else if (target === 'text') {
                    textColorInput.value = color;
                    document.documentElement.style.setProperty('--chat-text-color', color);
                    document.documentElement.style.setProperty('--popup-text-color', color);
                } else if (target === 'username') {
                    usernameColorInput.value = color;
                    document.documentElement.style.setProperty('--username-color', color);
                    document.documentElement.style.setProperty('--popup-username-color', color);
                }
                
                // Update color previews
                updateColorPreviews();
                // updatePreviewFromCurrentSettings(); // REMOVED CALL
            });
        });
        
        // Update border color
        borderColorInput.addEventListener('input', () => {
            // Special handling for transparent border
            if (borderColorInput.value === 'transparent') {
                document.documentElement.style.setProperty('--chat-border-color', 'transparent');
                document.documentElement.style.setProperty('--popup-border-color', 'transparent');
            } else {
                document.documentElement.style.setProperty('--chat-border-color', borderColorInput.value);
                document.documentElement.style.setProperty('--popup-border-color', borderColorInput.value);
            }
            updateColorPreviews();
            updatePreviewFromCurrentSettings();
        });
        
        textColorInput.addEventListener('input', () => {
            document.documentElement.style.setProperty('--chat-text-color', textColorInput.value);
            document.documentElement.style.setProperty('--popup-text-color', textColorInput.value);
            updateColorPreviews();
            updatePreviewFromCurrentSettings();
        });
        
        usernameColorInput.addEventListener('input', () => {
            document.documentElement.style.setProperty('--username-color', usernameColorInput.value);
            document.documentElement.style.setProperty('--popup-username-color', usernameColorInput.value);
            updateColorPreviews();
            updatePreviewFromCurrentSettings();
        });
        
        // Font size slider
        fontSizeSlider.addEventListener('input', () => {
            const value = fontSizeSlider.value;
            fontSizeValue.textContent = `${value}px`;
            
            // Set CSS variable for live update of main chat
            document.documentElement.style.setProperty('--font-size', `${value}px`);
            
            // Update config immediately so preview gets the right size
            config.fontSize = parseInt(value, 10);

            // Update the preview immediately
            const currentThemeObject = window.availableThemes[currentThemeIndex];
            if (currentThemeObject) {
                updateThemePreview(currentThemeObject);
            } else {
                console.warn("Could not find current theme object to update preview for font size change.");
            }
        });
        
        // Chat width slider
        chatWidthInput.addEventListener('input', () => {
            const value = chatWidthInput.value;
            chatWidthValue.textContent = `${value}%`;
            
            document.documentElement.style.setProperty('--chat-width', `${value}%`);
        });
        
        // Chat height slider
        chatHeightInput.addEventListener('input', () => {
            const value = chatHeightInput.value;
            chatHeightValue.textContent = `${value}%`; // Use %
            
            document.documentElement.style.setProperty('--chat-height', `${value}%`); // Use %
        });
        
        // Open settings panel function
        function openSettingsPanel() {
            // Clear any potential stale state first
            initialConfigBeforeEdit = null; 
            console.log("Opening settings panel...");
            // Store the current config state BEFORE showing the panel
            try {
                 initialConfigBeforeEdit = JSON.parse(JSON.stringify(config));
                 console.log("Stored initial config:", initialConfigBeforeEdit);
            } catch (error) {
                 console.error("Error stringifying config for initial state:", error);
                 // Handle error, maybe notify user or disable cancel?
                 addSystemMessage("Error: Could not store settings state for revert.");
                 initialConfigBeforeEdit = null; // Ensure it's null on error
            }

            // Panel opened: Ensure correct connection control is visible inside the panel
            const isConnected = socket && socket.readyState === WebSocket.OPEN;
            if (channelForm) channelForm.style.display = isConnected ? 'none' : 'flex';
            if (disconnectBtn) disconnectBtn.style.display = isConnected ? 'block' : 'none';
            if (isConnected && disconnectBtn) disconnectBtn.textContent = `Disconnect from ${channel}`; // Ensure text is correct
            
            updateConfigPanelFromConfig(); // Populate panel controls with current config
            configPanel.classList.add('visible');
            configPanel.style.display = 'block';
            // Initial theme preview update when panel opens
            // updatePreviewFromCurrentSettings(); // REMOVED CALL
        }
        
        // Settings button handlers
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                console.log('Settings button clicked');
                if (e) e.preventDefault();
                openSettingsPanel();
            });
            settingsBtn.dataset.listenerAttached = 'true';
        }
        
        const popupSettingsBtn = document.getElementById('popup-settings-btn');
        if (popupSettingsBtn) {
            popupSettingsBtn.addEventListener('click', (e) => {
                console.log('Popup settings button clicked');
                if (e) { e.preventDefault(); e.stopPropagation(); }
                openSettingsPanel();
            });
            popupSettingsBtn.dataset.listenerAttached = 'true';
        }

        // Save Button
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', (e) => {
                console.log('Save button clicked');
                if (e) e.preventDefault();
                saveConfiguration(); 
            });
            saveConfigBtn.dataset.listenerAttached = 'true';
        }
        
        // Cancel Button - IMPORTANT: Only attach this listener once
        if (cancelConfigBtn) {
            cancelConfigBtn.addEventListener('click', () => {
                console.log('Cancel button clicked'); // Should only log ONCE now
                closeConfigPanel(true); // Close and REVERT
            });
            cancelConfigBtn.dataset.listenerAttached = 'true'; 
        }

        // Reset Button
        if (resetConfigBtn) {
             resetConfigBtn.addEventListener('click', () => {
                 console.log("Reset button clicked");
                 applyDefaultSettings(); // Reset config object
                 applyConfiguration(config); // Apply defaults visually
                 updateConfigPanelFromConfig(); // Update panel controls
                 addSystemMessage("Settings reset to default.");
             });
             resetConfigBtn.dataset.listenerAttached = 'true';
        }

        // Close settings panel function
        function closeConfigPanel(shouldRevert = false) {
            if (shouldRevert && initialConfigBeforeEdit) {
                console.log("--- Reverting Changes ---");
                console.log("Current config (before revert):", JSON.stringify(config));
                console.log("Stored initial state:", JSON.stringify(initialConfigBeforeEdit));
                try {
                    // 1. Restore the config object
                    config = JSON.parse(JSON.stringify(initialConfigBeforeEdit));
                    console.log("Config object restored. Theme:", config.theme, "BG Color:", config.bgColor);

                    // 2. Apply the restored configuration visually
                    console.log("Applying restored config visually...");
                    applyConfiguration(config); // This function should log its actions internally if needed
                    console.log("Visual application complete. Current document BG var:", document.documentElement.style.getPropertyValue('--chat-bg-color'));

                    // 3. Update the panel controls to MATCH the restored state
                    console.log("Updating panel controls...");
                    updateConfigPanelFromConfig();
                    console.log("Panel controls updated. BG Input value:", bgColorInput.value);
                    console.log("--- Revert Complete ---");

                } catch (error) {
                     console.error("Error during revert:", error);
                     addSystemMessage("Error: Could not revert settings.");
                }
                } else {
                 console.log("Closing panel without reverting.");
            }
            initialConfigBeforeEdit = null;
            configPanel.classList.remove('visible');
            configPanel.style.display = 'none';
            console.log("Config panel closed.");
        }
        
        // Update theme preview based on current color settings
        function updateColorPreviews() {
            // The color preview swatches have been removed
            // Now we only highlight the active color buttons and update the theme preview
            
            // Highlight the active color buttons based on current values
            highlightActiveColorButtons();
            
            // Update the main theme preview to keep everything in sync
            updateThemePreview(); // Update preview based on config
        }
        
        // Helper function to highlight the active color buttons based on current values
        function highlightActiveColorButtons() {
            // Background color
            const bgColorValue = bgColorInput?.value || '#121212';
            const bgOpacityValue = bgOpacityInput ? parseInt(bgOpacityInput.value) : 85; // Get opacity value as number
            const bgButtons = document.querySelectorAll('.color-btn[data-target="bg"]');
            bgButtons.forEach(btn => {
                const btnColor = btn.getAttribute('data-color');
                // Special case for transparent button
                if (btnColor === 'transparent') {
                    // Active if color is black AND opacity is 0
                    if (bgColorValue === '#000000' && bgOpacityValue === 0) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                } else { // Normal buttons
                    // Active if color matches AND opacity is NOT 0
                    if (btnColor === bgColorValue && bgOpacityValue > 0) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                }
            });

            // Border color
            // Read both the input value and the current CSS value
            const currentBorderCSS = document.documentElement.style.getPropertyValue('--chat-border-color').trim();
            const borderColorInputValue = borderColorInput.value || '#9147ff'; // Fallback for input
            const borderButtons = document.querySelectorAll('.color-btn[data-target="border"]');

            borderButtons.forEach(btn => {
                const btnColor = btn.getAttribute('data-color');
                let isActive = false;

                if (btnColor === 'transparent') {
                    // The 'None' button is active if the CSS variable is literally 'transparent'
                    isActive = (currentBorderCSS === 'transparent');
                } else {
                    // Other buttons are active if the CSS variable is NOT 'transparent'
                    // AND the button's color matches the input value
                    isActive = (currentBorderCSS !== 'transparent' && btnColor === borderColorInputValue);
                }

                if (isActive) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Text color
            const textColorValue = textColorInput.value || '#efeff1';
            const textButtons = document.querySelectorAll('.color-btn[data-target="text"]');
            textButtons.forEach(btn => {
                if (btn.getAttribute('data-color') === textColorValue) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Username color
            const usernameColorValue = usernameColorInput.value || '#9147ff';
            const usernameButtons = document.querySelectorAll('.color-btn[data-target="username"]');
            usernameButtons.forEach(btn => {
                if (btn.getAttribute('data-color') === usernameColorValue) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
        
        // Toggle between window and popup modes
        function switchChatMode(mode, applyConfig = true) { // Added applyConfig flag
            try {
                console.log(`Switching chat mode to: ${mode}`);
                config.chatMode = mode;

                // Get references to containers
                const popupContainer = document.getElementById('popup-container');
                // const chatContainer = document.getElementById('chat-container'); // Already defined globally
                // const chatWrapper = document.getElementById('chat-wrapper'); // Already defined globally

                if (!popupContainer || !chatContainer || !chatWrapper) {
                    console.error('Required containers (popup, chat, wrapper) not found in DOM');
                    return;
                }

                // Clear popup messages container
                const popupMessages = document.getElementById('popup-messages');
                if (popupMessages) popupMessages.innerHTML = '';

                // Update visibility based on mode
                if (mode === 'popup') {
                    popupContainer.style.display = 'block'; // Show popup area
                    chatWrapper.style.display = 'none'; // Hide the main chat window wrapper

                    document.body.classList.add('popup-mode');
                    document.body.classList.remove('window-mode');

                    // Show popup settings button
                    // const popupSettingsBtn = document.getElementById('popup-settings-btn');
                    // if (popupSettingsBtn) popupSettingsBtn.style.opacity = '0.7'; // REMOVED - CSS handles this now

                } else { // Window mode
                    popupContainer.style.display = 'none'; // Hide popup area
                    chatWrapper.style.display = 'block'; // Show the main chat window wrapper

                    document.body.classList.add('window-mode');
                    document.body.classList.remove('popup-mode');
                }

                // Clear main chat messages and add mode-specific info
                if (chatMessages) {
                    chatMessages.innerHTML = ''; // Clear existing messages from window view
                    if (applyConfig) { // Only add messages if not just updating UI
                         if (mode === 'popup') {
                             addSystemMessage(`Switched to popup mode. Messages will appear temporarily.`);
                         } else {
                             addSystemMessage('Switched to window mode.');
                         }
                         // Add a dummy message to demonstrate the mode
                         addChatMessage({
                             username: 'ExampleUser',
                             message: 'This is a sample message to demonstrate the current chat mode.',
                             color: config.usernameColor || '#9147ff'
                         });
                    }
                }

                // Update popup message container position (only relevant if mode is popup)
                if (mode === 'popup' && popupMessages && config.popup) {
                    const direction = config.popup.direction || 'from-bottom';
                    const position = { top: null, bottom: null };
                    switch(direction) {
                        case 'from-top':
                        case 'from-left':
                        case 'from-right':
                            position.top = '10px'; position.bottom = 'auto'; break;
                        case 'from-bottom':
                        default:
                            position.bottom = '10px'; position.top = 'auto';
                    }
                    popupMessages.removeAttribute('style'); // Clear existing styles first
                    popupMessages.style.top = position.top;
                    popupMessages.style.bottom = position.bottom;
                }

                // Update visibility of mode-specific settings in the panel
                updateModeSpecificSettingsVisibility(mode);

            } catch (error) {
                console.error('Error switching chat mode:', error);
                addSystemMessage('Error switching chat mode. Please try refreshing the page.');
            }
        }

        // Helper function to show/hide settings based on mode
        function updateModeSpecificSettingsVisibility(mode) {
            const popupSettings = document.querySelectorAll('.popup-setting');
            const windowOnlySettings = document.querySelectorAll('.window-only-setting');

            if (mode === 'popup') {
                popupSettings.forEach(el => el.style.display = 'flex'); // Use flex for visibility
                windowOnlySettings.forEach(el => el.style.display = 'none');
            } else {
                popupSettings.forEach(el => el.style.display = 'none');
                windowOnlySettings.forEach(el => el.style.display = 'flex'); // Use flex for visibility
            }
        }
        
        // Switch themes with the carousel
        
        function applyTheme(themeName) {
            console.log(`Applying theme: ${themeName}`);
            
            if (!window.availableThemes || window.availableThemes.length === 0) {
                console.error('Available themes not initialized yet.');
                return;
            }
            
            const theme = window.availableThemes.find(t => t.value === themeName || t.name === themeName);
            
            if (!theme) {
                console.warn(`Theme "${themeName}" not found. Applying default.`);
                const defaultTheme = window.availableThemes.find(t => t.value === 'default');
                if (defaultTheme) applyTheme(defaultTheme.value);
                return;
            }
            
            console.log('Theme object found:', theme);

            // --- REMOVED reading current slider opacities --- 
            // Logic that read bgOpacityInput.value and bgImageOpacityInput.value here is GONE.

            // --- NEW: Parse theme background color and opacity --- START
            let themeBgHex = '#121212'; // Default hex
            let themeBgOpacity = 0.85; // Default opacity

            if (theme.bgColor && typeof theme.bgColor === 'string') {
                const bgColorLower = theme.bgColor.trim().toLowerCase();
                if (bgColorLower.startsWith('rgba')) {
                    try {
                        // Extract values from rgba string, e.g., "rgba(153, 217, 234, 0.75)"
                        const parts = bgColorLower.substring(bgColorLower.indexOf('(') + 1, bgColorLower.indexOf(')')).split(',');
                        if (parts.length === 4) {
                            const r = parseInt(parts[0].trim(), 10);
                            const g = parseInt(parts[1].trim(), 10);
                            const b = parseInt(parts[2].trim(), 10);
                            const a = parseFloat(parts[3].trim());

                            // Convert rgb to hex
                            themeBgHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
                            themeBgOpacity = !isNaN(a) ? Math.max(0, Math.min(1, a)) : 0.85; // Use parsed opacity
                            console.log(`[applyTheme] Parsed rgba: Hex=${themeBgHex}, Opacity=${themeBgOpacity}`);
                        } else {
                             console.warn(`[applyTheme] Could not parse rgba: ${theme.bgColor}. Using defaults.`);
                        }
                    } catch (e) {
                        console.error(`[applyTheme] Error parsing rgba string "${theme.bgColor}":`, e);
                    }
                } else if (bgColorLower.startsWith('#')) {
                    // It's a hex color, use theme's opacity if defined, else default
                    themeBgHex = theme.bgColor;
                    themeBgOpacity = (theme.bgColorOpacity !== undefined && theme.bgColorOpacity !== null)
                                        ? theme.bgColorOpacity
                                        : 0.85;
                    console.log(`[applyTheme] Using hex ${themeBgHex} with opacity ${themeBgOpacity}`);
                } else {
                     console.warn(`[applyTheme] Unknown bgColor format: ${theme.bgColor}. Using defaults.`);
                }
            } else {
                // No bg color defined in theme, use defaults
                 themeBgOpacity = (theme.bgColorOpacity !== undefined && theme.bgColorOpacity !== null)
                                     ? theme.bgColorOpacity
                                     : 0.85;
                 console.log(`[applyTheme] No theme bgColor defined. Using default hex ${themeBgHex} with opacity ${themeBgOpacity}`);
            }
            // --- NEW: Parse theme background color and opacity --- END


            // Update config object with theme base settings first
            config.theme = theme.value;
            config.bgColor = themeBgHex; // Store HEX color
            config.bgColorOpacity = themeBgOpacity; // Store PARSED or THEME opacity
            config.borderColor = theme.borderColor === 'transparent' ? 'transparent' : (theme.borderColor || '#9147ff');
            config.textColor = theme.textColor || '#efeff1';
            config.usernameColor = theme.usernameColor || '#9147ff';
            config.borderRadius = theme.borderRadius || theme.borderRadiusValue || '8px';
            config.boxShadow = theme.boxShadow || theme.boxShadowValue || 'none';
            config.bgImage = theme.backgroundImage || null; 

            // *** CORRECT: USE THEME'S DEFINED OPACITY ***
            // config.bgColorOpacity = (theme.bgColorOpacity !== undefined && theme.bgColorOpacity !== null) // <<< REMOVED THIS BLOCK - Handled above
            //                                 ? theme.bgColorOpacity 
            //                                 : 0.85; 
            config.bgImageOpacity = (theme.bgImageOpacity !== undefined && theme.bgImageOpacity !== null)
                                    ? theme.bgImageOpacity
                                    : 0.55; 
            // console.log(`[applyTheme] Using theme opacities - BG: ${config.bgColorOpacity}, Image: ${config.bgImageOpacity}`); // Log moved/changed

            // Update font family from theme
            if (theme.fontFamily) {
                let fontIndex = window.availableFonts.findIndex(f => {
                   const themeFontTrimmedLower = typeof theme.fontFamily === 'string' ? theme.fontFamily.trim().toLowerCase() : '';
                   const fontNameTrimmedLower = f.name ? f.name.trim().toLowerCase() : null;
                   const fontValueTrimmed = f.value ? f.value.trim() : null;
                   const originalThemeFontTrimmed = typeof theme.fontFamily === 'string' ? theme.fontFamily.trim() : '';
                   return (fontNameTrimmedLower !== null && fontNameTrimmedLower === themeFontTrimmedLower) || 
                          (fontValueTrimmed !== null && fontValueTrimmed === originalThemeFontTrimmed);
                });

                if (fontIndex !== -1) {
                    currentFontIndex = fontIndex;
                    config.fontFamily = window.availableFonts[currentFontIndex].value;
                } else {
                    console.warn(`[applyTheme] Theme font "${theme.fontFamily}" not found. Using default.`); 
                    const defaultFontIndex = window.availableFonts.findIndex(f => f.value && f.value.includes('Atkinson'));
                    currentFontIndex = defaultFontIndex !== -1 ? defaultFontIndex : 0;
                    config.fontFamily = window.availableFonts[currentFontIndex]?.value || "'Atkinson Hyperlegible', sans-serif"; 
                }
                updateFontDisplay();
            } else {
                config.fontFamily = window.availableFonts[currentFontIndex]?.value || "'Atkinson Hyperlegible', sans-serif"; 
            }
            
            // Apply the configuration visually using the updated config object
            applyConfiguration(config);
            
            // --- Update UI controls AFTER applying theme --- START
            // Update color inputs and sliders
            if (bgColorInput) {
                bgColorInput.value = config.borderColor === 'transparent' ? '#000000' : config.bgColor; // Use black for transparent input
            }
            if (bgOpacityInput && bgOpacityValue) {
                 const opacityPercent = Math.round(config.bgColorOpacity * 100);
                 bgOpacityInput.value = opacityPercent;
                 bgOpacityValue.textContent = `${opacityPercent}%`;
                 console.log(`[applyTheme] Updated BG opacity slider to: ${opacityPercent}%`);
            }
            if (borderColorInput) {
                // Handle transparent border for the input
                borderColorInput.value = config.borderColor === 'transparent' ? '#000000' : config.borderColor; 
            }
            if (textColorInput) {
                textColorInput.value = config.textColor;
            }
            if (usernameColorInput) {
                usernameColorInput.value = config.usernameColor;
            }
            if (bgImageOpacityInput && bgImageOpacityValue) {
                 const imageOpacityPercent = Math.round(config.bgImageOpacity * 100);
                 bgImageOpacityInput.value = imageOpacityPercent;
                 bgImageOpacityValue.textContent = `${imageOpacityPercent}%`;
                 console.log(`[applyTheme] Updated Image opacity slider to: ${imageOpacityPercent}%`);
            }
            
            // Update preset button highlights
            const effectiveBorderRadius = getBorderRadiusValue(config.borderRadius);
            highlightBorderRadiusButton(effectiveBorderRadius);
            const effectiveBoxShadow = getBoxShadowValue(config.boxShadow);
            highlightBoxShadowButton(config.boxShadow); // Use original preset name for highlighting
            
            // Update color button highlights
            highlightActiveColorButtons();
            // --- Update UI controls AFTER applying theme --- END

            updateThemePreview();

            lastAppliedThemeValue = theme.value;
            
            console.log(`Theme "${theme.name}" applied successfully.`); // Adjusted log message
        }
        
        // Initialize font selection
        function updateFontDisplay() {
            // Ensure window.availableFonts is available
            if (!window.availableFonts || window.availableFonts.length === 0) {
                console.error('Available fonts not initialized yet.');
                currentFontDisplay.textContent = 'Error';
                return;
            }
            
            // Validate currentFontIndex
            if (currentFontIndex < 0 || currentFontIndex >= window.availableFonts.length) {
                console.warn(`Invalid currentFontIndex (${currentFontIndex}), resetting to 0.`);
                currentFontIndex = 0;
            }
            
            const currentFont = window.availableFonts[currentFontIndex];
            currentFontDisplay.textContent = currentFont.name;
            
            // Apply the font immediately
            config.fontFamily = currentFont.value;
            document.documentElement.style.setProperty('--font-family', config.fontFamily);
            
            console.log(`Font updated to: ${currentFont.name} (${currentFont.value})`);
            
            // Update the theme preview to reflect the font change immediately
            updateThemePreview(); // <<< ADD THIS CALL
        }
        
        // Font selection carousel
        if (prevFontBtn && !prevFontBtn.dataset.listenerAttached) {
            prevFontBtn.addEventListener('click', () => {
                currentFontIndex = (currentFontIndex - 1 + window.availableFonts.length) % window.availableFonts.length;
                updateFontDisplay();
            });
            prevFontBtn.dataset.listenerAttached = 'true';
        }
        
        if (nextFontBtn && !nextFontBtn.dataset.listenerAttached) {
            nextFontBtn.addEventListener('click', () => {
                currentFontIndex = (currentFontIndex + 1) % window.availableFonts.length;
                updateFontDisplay();
            });
            nextFontBtn.dataset.listenerAttached = 'true';
        }
        
        // Setting theme listeners only once
        // REMOVED THEME LISTENERS - Handled by theme-carousel.js

        // REMOVED updateThemeDisplay FUNCTION

        window.applyTheme = applyTheme; // Keep applyTheme exposed globally

        /**
         * Update the theme preview based on the currently selected theme in the carousel.
         * NOW: Reads directly from config panel inputs for live updates.
         */
        function updateThemePreview() {
            // No longer reads from theme object, reads from controls
            if (!themePreview) return;
            
            console.log(`Updating theme preview based on config panel inputs...`);

            // --- Get current values from config panel controls --- 
            const bgColor = bgColorInput.value || '#1e1e1e';
            const bgColorOpacity = (bgOpacityInput ? parseInt(bgOpacityInput.value) : 85) / 100.0;
            const borderColor = borderColorInput.value || '#444444'; // Might need handling for 'transparent' button state
            const textColor = textColorInput.value || '#efeff1';
            const usernameColor = usernameColorInput.value || '#9147ff';
            const timestampColor = config.timestampColor || '#adadb8'; // Use config value, as there's no input
            const fontFamily = window.availableFonts[currentFontIndex]?.value || config.fontFamily || "'Atkinson Hyperlegible', sans-serif";
            const activeBorderRadiusBtn = borderRadiusPresets?.querySelector('.preset-btn.active');
            const borderRadiusValue = activeBorderRadiusBtn ? activeBorderRadiusBtn.dataset.value : getBorderRadiusValue(config.borderRadius || '8px');
            const borderRadius = getBorderRadiusValue(borderRadiusValue); // Ensure CSS value
            const activeBoxShadowBtn = boxShadowPresets?.querySelector('.preset-btn.active');
            const boxShadowValue = activeBoxShadowBtn ? activeBoxShadowBtn.dataset.value : (config.boxShadow || 'none');
            const boxShadow = getBoxShadowValue(boxShadowValue); // Ensure CSS value
            const bgImage = config.bgImage || 'none'; // Get from config as there's no direct UI input yet
            const bgImageOpacity = (bgImageOpacityInput ? parseInt(bgImageOpacityInput.value) : 55) / 100.0;
            
            // Handle transparent border specifically
            const borderTransparentButton = document.querySelector('.color-btn[data-target="border"][data-color="transparent"]');
            const finalBorderColor = (borderTransparentButton && borderTransparentButton.classList.contains('active')) 
                                     ? 'transparent' 
                                     : borderColor;

            // --- Calculate background color with opacity --- 
            let finalBgColor;
            // Handle case where transparent bg button is active
            const bgTransparentButton = document.querySelector('.color-btn[data-target="bg"][data-color="transparent"]');
            if (bgTransparentButton && bgTransparentButton.classList.contains('active')) {
                 finalBgColor = 'transparent';
            } else {
                 try {
                     finalBgColor = hexToRgba(bgColor, bgColorOpacity);
                 } catch (e) {
                     console.error(`Error converting hex ${bgColor} for preview:`, e);
                     finalBgColor = `rgba(30, 30, 30, ${bgColorOpacity.toFixed(2)})`;
                 }
            }

            // --- Set preview-specific CSS variables directly on the element --- 
            themePreview.style.setProperty('--preview-bg-color', finalBgColor);
            themePreview.style.setProperty('--preview-border-color', finalBorderColor); // Use finalBorderColor
            themePreview.style.setProperty('--preview-text-color', textColor);
            themePreview.style.setProperty('--preview-username-color', usernameColor);
            themePreview.style.setProperty('--preview-timestamp-color', timestampColor);
            themePreview.style.setProperty('--preview-font-family', fontFamily); 
            themePreview.style.fontFamily = fontFamily; // Also set directly
            themePreview.style.setProperty('--preview-border-radius', borderRadius);
            themePreview.style.setProperty('--preview-box-shadow', boxShadow);
            themePreview.style.setProperty('--preview-bg-image', bgImage === 'none' ? 'none' : `url("${bgImage}")`);
            themePreview.style.setProperty('--preview-bg-image-opacity', bgImageOpacity.toFixed(2));

            // --- Update the preview content (structure remains the same) --- 
            const previewHtml = `
                <div class="preview-chat-message">
                    <span class="timestamp">12:34</span>
                    <span class="username" style="color: var(--preview-username-color);">Username:</span>
                    <span>Example chat message</span>
                </div>
                <div class="preview-chat-message">
                    <span class="timestamp">12:35</span>
                    <span class="username" style="color: var(--preview-username-color);">AnotherUser:</span>
                    <span>This is how your chat will look</span>
                </div>
            `;
            themePreview.innerHTML = previewHtml;
        }

        // Make updateThemePreview globally available if needed by other modules
        window.updateThemePreview = updateThemePreview;

        // Ensure updateThemePreview is called when the theme selection changes
        document.addEventListener('theme-changed', () => updateThemePreview());
        document.addEventListener('theme-carousel-ready', () => updateThemePreview()); // Call on initial load

        // Update the preview whenever colors or settings change
        updateColorPreviews();

        // Username color override toggle
        overrideUsernameColorsInput.addEventListener('change', () => {
            const isChecked = overrideUsernameColorsInput.checked;
            config.overrideUsernameColors = isChecked; // Update config
            if (isChecked) {
                document.documentElement.classList.add('override-username-colors');
            } else {
                document.documentElement.classList.remove('override-username-colors');
            }
            updateThemePreview(); // Update preview
        });
        
        // Chat mode radio buttons
        document.querySelectorAll('input[name="chat-mode"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    switchChatMode(e.target.value);
                    
                    // Show/hide mode-specific settings based on selected mode
                    const popupSettings = document.querySelectorAll('.popup-setting');
                    const windowOnlySettings = document.querySelectorAll('.window-only-setting');
                    
                    if (e.target.value === 'popup') {
                        // Show popup settings, hide window-only settings
                        popupSettings.forEach(el => el.style.display = 'flex');
                        windowOnlySettings.forEach(el => el.style.display = 'none');
                    } else {
                        // Hide popup settings, show window-only settings
                        popupSettings.forEach(el => el.style.display = 'none');
                        windowOnlySettings.forEach(el => el.style.display = 'flex');
                    }
                }
            });
        });
        
        // Popup animation direction
        document.querySelectorAll('input[name="popup-direction"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    config.popup.direction = e.target.value;
                    
                    // Immediately update popup position when direction is changed
                    if (config.chatMode === 'popup') {
                        const popupMessages = document.getElementById('popup-messages');
                        if (popupMessages) {
                            // Get direction
                            const direction = config.popup.direction;
                            
                            // Create a simplified positioning object
                            const position = {
                                top: null,
                                bottom: null
                            };
                            
                            // Set position based on direction
                            switch(direction) {
                                case 'from-top':
                                case 'from-left':
                                case 'from-right':
                                    position.top = '10px'; position.bottom = 'auto'; break;
                                case 'from-bottom':
                                default:
                                    position.bottom = '10px'; position.top = 'auto';
                            }
                            
                            // Clear the style completely first
                            popupMessages.removeAttribute('style');
                            
                            // Apply new styles, only setting vertical position
                            popupMessages.style.top = position.top;
                            popupMessages.style.bottom = position.bottom;
                        }
                    }
                }
            });
        });
        
        // Popup duration
        document.getElementById('popup-duration').addEventListener('input', (e) => {
            config.popup.duration = parseInt(e.target.value);
            document.getElementById('popup-duration-value').textContent = `${config.popup.duration}s`;
        });
        
        // Popup max messages
        document.getElementById('popup-max-messages').addEventListener('change', (e) => {
            config.popup.maxMessages = parseInt(e.target.value);
        });
        
        /**
         * Save current settings from the panel to the config object and local storage.
         */
        function saveConfiguration() {
            console.log("Attempting to save configuration...");
            
            try {
                // Helper function to get values safely (keep existing)
                const getValue = (element, defaultValue, isNumber = false, isBool = false, isOpacity = false) => {
                    if (!element) return defaultValue;
                    if (isBool) return element.checked;
                    let value = element.value;
                    if (isNumber) return parseInt(value, 10) || defaultValue;
                     if (isOpacity) return parseFloat(value) / 100.0; // Convert percentage string/number to 0-1 float
                    return value || defaultValue;
                };
                
                // Helper to get color (keep existing) - REVISED AGAIN FOR BACKGROUND
                const getColor = (inputElement, buttonSelector, defaultColor) => {
                     const targetType = buttonSelector.includes('data-target="bg"') ? 'bg' :
                                        buttonSelector.includes('data-target="border"') ? 'border' :
                                        buttonSelector.includes('data-target="text"') ? 'text' : 'username';

                     const activeButton = document.querySelector(`${buttonSelector}.active`);
                     const activeColor = activeButton?.dataset.color;

                     // --- Background Color Logic --- START
                     if (targetType === 'bg') {
                         // Always read the hex value directly from the input field first.
                         // This input field should be updated correctly by applyTheme/updateConfigPanel.
                         const hexFromInput = inputElement?.value;

                         // Check the transparent button state specifically in conjunction with opacity
                         const bgTransparentButton = document.querySelector('.color-btn[data-target="bg"][data-color="transparent"]');
                         const isTransparentActive = bgTransparentButton?.classList.contains('active');
                         const currentOpacity = getOpacity(bgOpacityInput, -1); // Get opacity, -1 if slider missing

                         // If transparent button is active AND opacity is truly 0, save as black hex.
                         if (isTransparentActive && currentOpacity === 0) {
                              console.log("[getColor/bg] Saving black hex due to active transparent button and 0 opacity.");
                              return '#000000';
                         }

                         // Otherwise (normal colors or transparent button active but opacity > 0),
                         // trust the hex value that's currently in the input field.
                         if (hexFromInput) {
                            // console.log(`[getColor/bg] Using hex from input: ${hexFromInput}`);
                            return hexFromInput;
                         }

                         // Fallback if input is somehow empty (shouldn't normally happen)
                         console.warn("[getColor/bg] Background color input was empty, falling back to default.");
                         return defaultColor;
                     }
                     // --- Background Color Logic --- END

                     // --- Other Color Types (Border, Text, Username) --- START
                     // For other types, the previous logic (active button or input fallback) is fine.
                     if (activeButton) {
                         // Handle transparent border button
                         if (targetType === 'border' && activeColor === 'transparent') {
                             return 'transparent'; // Keep 'transparent' string
                         }
                         // Return the button's color if active
                         return activeColor;
                     }

                     // If NO button is active for border/text/username, use the input value or default
                     return inputElement?.value || defaultColor;
                     // --- Other Color Types (Border, Text, Username) --- END
                 };

                 // Helper to get opacity (0-1 range) from the slider
                  const getOpacity = (element, defaultValue) => {
                      if (!element) return defaultValue;
                       // Make sure to handle potential NaN
                       const parsedValue = parseFloat(element.value);
                       return !isNaN(parsedValue) ? parsedValue / 100.0 : defaultValue; 
                  };

                // --- Read current state from UI controls ---
                const currentFontValue = window.availableFonts[currentFontIndex]?.value || config.fontFamily;
                const currentThemeValue = lastAppliedThemeValue; // USE tracked value instead of index
                const bgImageOpacityValue = getOpacity(bgImageOpacityInput, 0.55);
                const currentBgColorHex = getColor(bgColorInput, '.color-buttons [data-target="bg"]', '#121212', true); // Gets HEX
                const currentBgOpacity = getOpacity(bgOpacityInput, 0.85); // Gets OPACITY 0-1

                // Find the full theme object matching the current theme value (used for theme name and potentially image)
                const currentFullTheme = window.availableThemes?.find(t => t.value === currentThemeValue) || {};

                // --- Create new config object from UI values ---
                // PRIORITIZE UI control values using helpers
                const newConfig = {
                    theme: currentThemeValue, // Still store the last *selected* theme name
                    fontFamily: currentFontValue, // Read from font carousel state
                    fontSize: getValue(fontSizeSlider, 14, true), // Reads from slider

                    // Save background color (hex) and opacity (0-1) separately
                    bgColor: currentBgColorHex, // Save the HEX value from UI/helper
                    bgColorOpacity: currentBgOpacity, // Save the OPACITY value from UI/helper

                    borderColor: getColor(borderColorInput, '.color-buttons [data-target="border"]', '#444444'), // Default dark grey
                    textColor: getColor(textColorInput, '.color-buttons [data-target="text"]', '#efeff1'),
                    usernameColor: getColor(usernameColorInput, '.color-buttons [data-target="username"]', '#9147ff'),
                    
                    // Override username colors based on checkbox
                    overrideUsernameColors: getValue(overrideUsernameColorsInput, false, false, true),
                    
                    // Background Image: Use theme's default ONLY if no specific image is set/saved
                    // This logic might need refinement if users can *upload* images later.
                    // For now, if a theme *has* an image, keep it unless explicitly changed?
                    // Let's keep it simple: if theme has image, use it. Assume UI doesn't change this yet.
                    bgImage: currentFullTheme.backgroundImage || null,
                    // Image opacity always read from slider
                    bgImageOpacity: bgImageOpacityValue, 
                    
                    // Appearance: Read from active preset buttons or fallback to current config
                    borderRadius: borderRadiusPresets?.querySelector('.preset-btn.active')?.dataset.value || config.borderRadius,
                    boxShadow: boxShadowPresets?.querySelector('.preset-btn.active')?.dataset.value || config.boxShadow,
                    
                    // Rest of the settings from UI controls
                    chatMode: document.querySelector('input[name="chat-mode"]:checked')?.value || 'window',
                    chatWidth: getValue(chatWidthInput, 95, true), // Correct fallback
                    chatHeight: getValue(chatHeightInput, 95, true), // Correct fallback
                    maxMessages: getValue(maxMessagesInput, 50, true),
                    showTimestamps: getValue(showTimestampsInput, true, false, true),
                    popup: {
                        direction: document.querySelector('input[name="popup-direction"]:checked')?.value || 'from-bottom',
                        duration: getValue(document.getElementById('popup-duration'), 5, true),
                        maxMessages: getValue(document.getElementById('popup-max-messages'), 3, true)
                    },
                    lastChannel: config.lastChannel // Preserve last connected channel
                };

                // --- Apply & Save ---
                config = newConfig; // Update the global config state
                console.log("[saveConfiguration] Applying saved configuration visually...");
                applyConfiguration(config); // Apply the new config visually
                console.log("[saveConfiguration] Visual application complete.");

                // === CRITICAL LOGGING: Check values JUST BEFORE saving ===
                console.log(`[saveConfiguration] >> Preparing to save - bgColor (hex): ${newConfig.bgColor}, bgColorOpacity (0-1): ${newConfig.bgColorOpacity}`);

                const scene = getUrlParameter('scene') || 'default';
                localStorage.setItem(`chatConfig_${scene}`, JSON.stringify(config));
                console.log(`Configuration saved for scene '${scene}':`, config);
                
                closeConfigPanel(false); // Close without reverting
                // addSystemMessage("Settings saved successfully."); // Keep console cleaner
                
            } catch (error) {
                console.error("Error saving configuration:", error);
                 addSystemMessage("Error saving settings. Check console for details.");
            }
        }
        
        // Load saved config on page load
        function loadSavedConfig() {
            const scene = getUrlParameter('scene') || 'default';
            const storageKey = `chatConfig_${scene}`;
            const savedConfigString = localStorage.getItem(storageKey);

            if (savedConfigString) {
                try {
                    const parsedConfig = JSON.parse(savedConfigString);
                    console.log('Loaded config:', parsedConfig);

                    // Normalize chat height before merging into config
                    if (parsedConfig.chatHeight !== undefined) {
                        const heightValue = parseInt(parsedConfig.chatHeight, 10);
                        if (!isNaN(heightValue) && heightValue > 100) {
                            console.log(`Converting old chat height value (${heightValue}) to 100% for scene '${scene}'`);
                            parsedConfig.chatHeight = 100;
                            // Save the normalized config back to localStorage
                            localStorage.setItem(storageKey, JSON.stringify(parsedConfig));
                        }
                    }

                    // Merge saved config into default config
                    config = { ...config, ...parsedConfig };

                    // Find the full theme object for the saved theme value
                    const savedThemeValue = parsedConfig.theme || 'default';
                    const currentFullTheme = window.availableThemes?.find(t => t.value === savedThemeValue) || window.availableThemes?.[0];
                    const themeBgImage = currentFullTheme?.backgroundImage || null;

                    // Create new config object by merging defaults with saved settings
                    config = {
                        // Display mode
                        chatMode: parsedConfig.chatMode || 'window',
                        
                        // Window mode settings
                        bgColor: parsedConfig.bgColor || '#121212',
                        bgColorOpacity: parsedConfig.bgColorOpacity !== undefined ? parsedConfig.bgColorOpacity : 0.85,
                        bgImage: parsedConfig.bgImage !== undefined ? parsedConfig.bgImage : themeBgImage,
                        bgImageOpacity: parsedConfig.bgImageOpacity !== undefined ? parsedConfig.bgImageOpacity : 0.55,
                        borderColor: parsedConfig.borderColor === 'transparent' ? 'transparent' : (parsedConfig.borderColor || '#9147ff'),
                        textColor: parsedConfig.textColor || '#efeff1',
                        usernameColor: parsedConfig.usernameColor || '#9147ff',
                        fontSize: parsedConfig.fontSize || 14,
                        fontFamily: parsedConfig.fontFamily || "'Atkinson Hyperlegible', sans-serif",
                        chatWidth: parsedConfig.chatWidth || 95, // Correct fallback
                        chatHeight: parsedConfig.chatHeight || 95, // Will use normalized value from above // Correct fallback
                        maxMessages: parsedConfig.maxMessages || 50,
                        showTimestamps: parsedConfig.showTimestamps !== undefined ? parsedConfig.showTimestamps : true,
                        overrideUsernameColors: parsedConfig.overrideUsernameColors || false,
                        borderRadius: window.getBorderRadiusValue(parsedConfig.borderRadius || '8px'),
                        boxShadow: parsedConfig.boxShadow || 'soft',
                        theme: savedThemeValue,
                        lastChannel: parsedConfig.lastChannel || '',
                        
                        // Popup mode settings
                        popup: {
                            direction: parsedConfig.popup?.direction || 'from-bottom',
                            duration: parsedConfig.popup?.duration || 5,
                            maxMessages: parsedConfig.popup?.maxMessages || 3
                        }
                    };

                    // Apply the loaded configuration
                    console.log("[loadSavedConfig] Applying loaded configuration visually...");
                    applyConfiguration(config);
                    console.log("[loadSavedConfig] Visual application complete.");

                    // Hide config panel
                    closeConfigPanel();

                    // Update the panel controls to match loaded state
                    updateConfigPanelFromConfig();

                    // If the channel was previously saved, auto-connect
                    if (config.lastChannel && channelInput) {
                        channelInput.value = config.lastChannel;
                        channel = config.lastChannel;
                        setTimeout(() => {
                            connectToChat();
                        }, 1000);
                    } else {
                        if (channelForm) channelForm.style.display = 'flex';
                        if (disconnectBtn) disconnectBtn.style.display = 'none';
                    }

                } catch (e) {
                    console.error('Error parsing or applying saved config:', e);
                    applyDefaultSettings();
                    updateConfigPanelFromConfig();
                }
            } else {
                applyDefaultSettings();
                updateConfigPanelFromConfig();
            }

            // Add initial system messages
            addSystemMessage('Welcome to Twitch Chat Overlay');
            if (!config.lastChannel) {
                addSystemMessage('Enter a channel name to connect');
            }
        }
        
        // Apply default settings when no saved config or on error
        function applyDefaultSettings() {
            console.log("Applying default settings...");
            // Reset config object to defaults (adjust defaults as needed)
            config = {
                chatMode: 'window',
                // Store default background as RGBA
                bgColor: '#121212', 
                bgColorOpacity: 0.85, 
                bgImage: null,
                bgImageOpacity: 0.55,
                borderColor: '#9147ff',
                textColor: '#efeff1',
                usernameColor: '#9147ff',
                fontSize: 14,
                fontFamily: "'Atkinson Hyperlegible', sans-serif", // <<< CHANGE DEFAULT
                chatWidth: 95, // Correct default
                chatHeight: 95, // Correct default
                maxMessages: 50,
                showTimestamps: true,
                overrideUsernameColors: false,
                borderRadius: '8px', // Use CSS value
                boxShadow: 'soft', // Use preset name
                theme: 'default',
                lastChannel: '',
                popup: {
                    direction: 'from-bottom',
                    duration: 5,
                    maxMessages: 3
                }
            };
             // Apply the default config visually
             applyConfiguration(config);
             
            // If no saved config, initialize the theme preview and set default mode
            // updateThemePreview(availableThemes[currentThemeIndex]); // applyConfiguration handles this now
            // switchChatMode('window'); // applyConfiguration handles this now

            // Hide popup settings by default (applyConfiguration handles this too)
            // const popupSettings = document.querySelectorAll('.popup-setting');
            // popupSettings.forEach(el => el.style.display = 'none');
            console.log("Default settings applied.");
        }
        
        /**
         * Apply border radius to chat container
         */
        function applyBorderRadius(value) {
             // Ensure we have a valid CSS value (e.g., '8px')
             const cssValue = window.getBorderRadiusValue(value); // Use global helper
             if (!cssValue) return;
             document.documentElement.style.setProperty('--chat-border-radius', cssValue);
             config.borderRadius = cssValue; 
             highlightBorderRadiusButton(cssValue); // Now DEFINITELY defined
             updateThemePreview(); // Update preview based on config
        }
        
        /**
         * Apply box shadow to chat container
         */
        function applyBoxShadow(preset) {
             // Ensure we have a valid CSS value (e.g., 'rgba(...) ...')
             const cssValue = window.getBoxShadowValue(preset); // Use global helper
             if (!cssValue) return;
             document.documentElement.style.setProperty('--chat-box-shadow', cssValue);
             config.boxShadow = preset; // Store the preset name in config
             highlightBoxShadowButton(preset); 
             updateThemePreview(); // Update preview based on config
        }

        // Add listeners to preset buttons
         if (borderRadiusPresets) {
             borderRadiusPresets.querySelectorAll('.preset-btn').forEach(btn => {
                 btn.addEventListener('click', () => applyBorderRadius(btn.dataset.value));
             });
         }
         if (boxShadowPresets) {
             boxShadowPresets.querySelectorAll('.preset-btn').forEach(btn => {
                 btn.addEventListener('click', () => applyBoxShadow(btn.dataset.value));
             });
         }
        
        /**
         * Update all config panel controls to match the current config object.
         * Called after reverting or applying a theme.
         */
        function updateConfigPanelFromConfig() {
            // --- Update Background Color Controls --- START
            // Always use config.bgColor directly (hex) and config.bgColorOpacity directly (float)
            const hexColor = (config.bgColor && typeof config.bgColor === 'string' && config.bgColor.startsWith('#')) 
                ? config.bgColor  // Use stored hex color
                : '#121212';      // Fallback to default dark
            
            // Convert opacity (0-1) to percentage for UI
            const opacityPercent = (config.bgColorOpacity !== undefined && typeof config.bgColorOpacity === 'number') // Changed to let
                 ? Math.round(config.bgColorOpacity * 100)  // Convert stored opacity to percentage
                 : 85;                                      // Fallback to default 85%
             
            // Special handling for transparent theme - already handled by applyTheme setting config correctly
            // if (config.theme === 'transparent-theme') { // <<< REMOVED this special case
            //     // Force opacity to 0 for transparent theme
            //     opacityPercent = 0;
            // }

            // Update the UI elements
            if (bgColorInput) bgColorInput.value = hexColor;
            if (bgOpacityInput && bgOpacityValue) {
                bgOpacityInput.value = opacityPercent;
                bgOpacityValue.textContent = `${opacityPercent}%`;
            }
            // --- Update Background Color Controls --- END

            // Update Border/Text/Username Color Inputs (Simplified)
            borderColorInput.value = config.borderColor === 'transparent' ? '#000000' : config.borderColor; // Use black for transparent input
            textColorInput.value = config.textColor || '#efeff1';
            usernameColorInput.value = config.usernameColor || '#9147ff';
            highlightActiveColorButtons(); // Highlight buttons based on config

            // Update Appearance            
            const effectiveBorderRadius = getBorderRadiusValue(config.borderRadius);
            highlightBorderRadiusButton(effectiveBorderRadius);
            
            const effectiveBoxShadow = getBoxShadowValue(config.boxShadow);
            highlightBoxShadowButton(config.boxShadow); // Use original preset name for highlighting
            
            // Update Settings
            overrideUsernameColorsInput.checked = config.overrideUsernameColors;
            
            // Find the current font index based on config.fontFamily
            // console.log(`[updateConfigPanel] Checking font: config.fontFamily = "${config.fontFamily}" (Type: ${typeof config.fontFamily})`); // REMOVE LOG
            const fontIndex = window.availableFonts.findIndex(f => {
                // console.log(`[updateConfigPanel] Comparing with availableFont: f.value = "${f.value}" (Type: ${typeof f.value})`); // REMOVE LOG
                // Ensure both values are strings before trimming
                const fValue = typeof f.value === 'string' ? f.value.trim() : f.value;
                const cfgFontFamily = typeof config.fontFamily === 'string' ? config.fontFamily.trim() : config.fontFamily;
                return fValue === cfgFontFamily; // KEEP TRIMMED COMPARISON
            });
            
            if (fontIndex !== -1) {
                // console.log(`[updateConfigPanel] Font index found: ${fontIndex}`); // REMOVE LOG
                currentFontIndex = fontIndex;
            } else {
                 // console.warn(`[updateConfigPanel] Font index NOT found for "${config.fontFamily}". Attempting fallback.`); // REMOVE LOG
                 const defaultFontIndex = window.availableFonts.findIndex(f => typeof f.value === 'string' && f.value.includes('Atkinson')); // Add type check
                 currentFontIndex = defaultFontIndex !== -1 ? defaultFontIndex : 0;
                 // Check if availableFonts[currentFontIndex] exists before accessing value
                 if (window.availableFonts && window.availableFonts[currentFontIndex]) {
                    config.fontFamily = window.availableFonts[currentFontIndex].value; // Ensure config is updated
                 } else {
                    console.error("[updateConfigPanel] Fallback font index invalid or availableFonts is empty.");
                    // Handle error appropriately, maybe set a very basic default
                    config.fontFamily = "sans-serif"; 
                 }
                 console.warn(`Font from config ("${config.fontFamily}") not found, defaulting.`); // Keep this useful warning
            }
            updateFontDisplay();
            
            fontSizeSlider.value = config.fontSize;
            fontSizeValue.textContent = `${config.fontSize}px`;
            chatWidthInput.value = config.chatWidth;
            chatWidthValue.textContent = `${config.chatWidth}%`;
            chatHeightInput.value = config.chatHeight;
            chatHeightValue.textContent = `${config.chatHeight}%`;
            maxMessagesInput.value = config.maxMessages;
            showTimestampsInput.checked = config.showTimestamps;
            
            // Update Theme Carousel
            const themeIndex = window.availableThemes.findIndex(t => t.value === config.theme);
            if (themeIndex !== -1) {
                currentThemeIndex = themeIndex;
            } else {
                // If theme not found, default to 'default' theme or index 0
                const defaultThemeIndex = window.availableThemes.findIndex(t => t.value === 'default');
                currentThemeIndex = defaultThemeIndex !== -1 ? defaultThemeIndex : 0;
                config.theme = window.availableThemes[currentThemeIndex].value; // Ensure config is updated
                console.warn(`Theme from config ("${config.theme}") not found, defaulting.`);
            }
            // updateThemeDisplay(); // Update carousel UI - REMOVED RECURSIVE CALL
            // updateThemeDisplay(); // <<< ADD THIS LINE to update the display text // <<< REMOVE THIS OLD COMMENT
            // <<< REPLACE updateThemeDisplay() call with these two lines: >>>
            if (typeof window.updateThemeDetails === 'function') {
                window.updateThemeDetails(window.availableThemes[currentThemeIndex]);
            }
            if (typeof window.highlightActiveCard === 'function') {
                window.highlightActiveCard(window.availableThemes[currentThemeIndex]?.value);
            }
            updateThemePreview(); // Update preview

            // Update Connection status
            channelInput.value = config.lastChannel || '';
            // updateConnectionUI(socket && socket.readyState === WebSocket.OPEN);
            // --- BEGIN REPLACEMENT for updateConnectionUI ---
            const isConnected = socket && socket.readyState === WebSocket.OPEN;
            if (channelForm) {
                channelForm.style.display = isConnected ? 'none' : 'flex'; // Use 'flex' for visibility
            }
            if (disconnectBtn) {
                disconnectBtn.style.display = isConnected ? 'block' : 'none';
                if (isConnected) {
                    disconnectBtn.textContent = `Disconnect from ${channel || config.lastChannel}`; // Ensure channel name is shown
                }
            }
            // --- END REPLACEMENT ---
            
            // --- Update Chat Mode Radio Buttons --- START
            const currentMode = config.chatMode || 'window'; // Default to window if undefined
            const modeRadioButtons = document.querySelectorAll('input[name="chat-mode"]');
            modeRadioButtons.forEach(radio => {
                if (radio.value === currentMode) {
                    radio.checked = true;
                } else {
                    radio.checked = false;
                }
            });
            updateModeSpecificSettingsVisibility(currentMode); // Also update settings visibility
            // --- Update Chat Mode Radio Buttons --- END
            
            // --- Update Popup Direction --- START
            const currentPopupDirection = config.popup?.direction || 'from-bottom';
            const directionRadioButtons = document.querySelectorAll('input[name="popup-direction"]');
            directionRadioButtons.forEach(radio => {
                 radio.checked = (radio.value === currentPopupDirection);
            });
            // --- Update Popup Direction --- END

            // --- Update Popup Duration/Max Messages --- START
            const popupDurationInput = document.getElementById('popup-duration');
            const popupDurationValue = document.getElementById('popup-duration-value');
            const popupMaxMessagesInput = document.getElementById('popup-max-messages');

            if (popupDurationInput && popupDurationValue) {
                const duration = config.popup?.duration || 5;
                popupDurationInput.value = duration;
                popupDurationValue.textContent = `${duration}s`;
            }
            if (popupMaxMessagesInput) {
                popupMaxMessagesInput.value = config.popup?.maxMessages || 3;
            }
            // --- Update Popup Duration/Max Messages --- END

            console.log("Config panel updated.");
        }

        // ... (rest of event listeners: disconnect, reset, save, enter key) ...
        
        // Initialize the application
        updateFontDisplay();  // Helpers are defined before this now
        // REMOVED Initial updateThemeDisplay() call, applyConfiguration handles initial theme
        loadSavedConfig();    // Helpers are defined before this now
        
        // Listen for newly generated themes being added
        document.addEventListener('theme-generated-and-added', (event) => {
            if (event.detail && event.detail.themeValue) {
                const newThemeValue = event.detail.themeValue;
                console.log(`[Event Listener] Received theme-generated-and-added event for: ${newThemeValue}`);
                // Apply the theme visuals first
                // The theme application will now be handled by the applyAndScrollToTheme call in theme-generator.js
            } else {
                console.warn("[Event Listener] Received theme-generated-and-added event without valid themeValue in detail.");
            }
        });
        
        // Ensure channel form is visible and disconnect button is hidden initially
        if (channelForm) channelForm.style.display = 'flex';
        
        // Disconnect button
        disconnectBtn.addEventListener('click', () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
                console.log('Disconnected via button.');
            }
            // No need to explicitly call updateStatus(false) or addSystemMessage here,
            // as the socket.onclose event handler already does that.
            
            // Reset button text, hide disconnect btn, show channel form
            disconnectBtn.textContent = 'Disconnect'; 
            if (disconnectBtn) disconnectBtn.style.display = 'none';
            if (channelForm) channelForm.style.display = 'flex';
            
            // Show the connection form again
            // No longer needed, handled by showing channelForm above
            
            // Clear the last channel from config
            if (config) {
                config.lastChannel = null;
                // Optionally save the config change immediately
                // saveConfiguration(); // Consider if this is desired UX
            }
        });
        
        // Reset to defaults button
        resetConfigBtn.addEventListener('click', () => {
             // ... (implementation exists) ...
        });
        
        // Save button handler
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', (e) => {
                console.log('Save button clicked');
                if (e) e.preventDefault();
                saveConfiguration();
            });
            saveConfigBtn.dataset.listenerAttached = 'true';
        }
        
        // Add generate theme button click handler
        // This is now handled by theme-generator.js
        // if (generateThemeBtn) { ... } // Removed original listener
        
        // Add prompt input enter key handler
        // This is now handled by theme-generator.js
        // if (themePromptInput) { ... } // Removed original listener

        /**
         * Apply a full configuration object to the chat overlay UI.
         * Centralizes the application of various settings.
         * @param {object} cfg - The configuration object to apply.
         */
        function applyConfiguration(cfg) {
            console.log("Applying configuration:", JSON.parse(JSON.stringify(cfg)));
            
            // --- Update lastAppliedThemeValue --- NEW
            if (cfg.theme) {
                lastAppliedThemeValue = cfg.theme;
                console.log(`[applyConfiguration] Updated lastAppliedThemeValue to: ${lastAppliedThemeValue}`);
            }

            // --- Get base color and opacity separately --- // NEW BLOCK
            const baseBgColor = cfg.bgColor || '#121212'; // Should always be hex now
            const bgOpacity = cfg.bgColorOpacity !== undefined ? cfg.bgColorOpacity : 0.85; // Should be 0-1 float
            
            // Generate the final rgba color string using the hex and opacity
            let finalRgbaColor;
            try {
                finalRgbaColor = hexToRgba(baseBgColor, bgOpacity);
            } catch (e) {
                 console.error(`[applyConfiguration] Error converting hex ${baseBgColor} with opacity ${bgOpacity}:`, e);
                 finalRgbaColor = `rgba(18, 18, 18, ${bgOpacity.toFixed(2)})`; // Fallback to default dark + opacity
            }
            console.log(`[applyConfiguration] Applying background: ${finalRgbaColor} (from hex: ${baseBgColor}, opacity: ${bgOpacity})`);
  
              // --- Apply Core CSS Variables ---
              // Set the combined RGBA value for the background color variable
              document.documentElement.style.setProperty('--chat-bg-color', finalRgbaColor);
              // REMOVE setting --chat-bg-opacity
  
              document.documentElement.style.setProperty('--chat-border-color', cfg.borderColor || '#444444');
              document.documentElement.style.setProperty('--chat-text-color', cfg.textColor || '#efeff1');
              document.documentElement.style.setProperty('--username-color', cfg.usernameColor || '#9147ff');
              document.documentElement.style.setProperty('--timestamp-color', cfg.timestampColor || '#adadb8'); // Add if you have this var
              document.documentElement.style.setProperty('--font-size', `${cfg.fontSize || 14}px`);
              document.documentElement.style.setProperty('--font-family', cfg.fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif");
              document.documentElement.style.setProperty('--chat-width', `${cfg.chatWidth || 95}%`); // Correct fallback
              document.documentElement.style.setProperty('--chat-height', `${cfg.chatHeight || 95}%`); // Correct fallback
              document.documentElement.style.setProperty('--chat-border-radius', window.getBorderRadiusValue(cfg.borderRadius || '8px'));
              document.documentElement.style.setProperty('--chat-box-shadow', window.getBoxShadowValue(cfg.boxShadow || 'none'));
              // document.documentElement.style.setProperty('--override-username-colors', cfg.overrideUsernameColors ? 1 : 0); // Better handled by class

               // Background Image (Opacity is handled separately)
               const bgImageURL = cfg.bgImage && cfg.bgImage !== 'none' ? `url("${cfg.bgImage}")` : 'none';
               document.documentElement.style.setProperty('--chat-bg-image', bgImageURL);
               document.documentElement.style.setProperty('--chat-bg-image-opacity', cfg.bgImageOpacity !== undefined ? cfg.bgImageOpacity : 0.55);

               // Popup styles (mirror chat styles)
               // Set the combined RGBA value for the popup background color variable
               document.documentElement.style.setProperty('--popup-bg-color', finalRgbaColor);
               // REMOVE setting --popup-bg-opacity

               document.documentElement.style.setProperty('--popup-border-color', cfg.borderColor || '#444444'); // Ensure this is set
               document.documentElement.style.setProperty('--popup-text-color', cfg.textColor || '#efeff1');
               document.documentElement.style.setProperty('--popup-username-color', cfg.usernameColor || '#9147ff');
               document.documentElement.style.setProperty('--popup-bg-image', bgImageURL);
               document.documentElement.style.setProperty('--popup-bg-image-opacity', cfg.bgImageOpacity !== undefined ? cfg.bgImageOpacity : 0.55);

              // --- Apply Font Size to Theme Preview Directly --- NEW
              if (themePreview) {
                themePreview.style.fontSize = `${cfg.fontSize || 14}px`;
              }

              // --- Apply Theme Class & Override Class ---
              // Remove all potential theme classes first
              document.documentElement.classList.remove(
                  'light-theme', 
                  'natural-theme', 
                  'transparent-theme', 
                  'pink-theme', 
                  'cyberpunk-theme'
                  // Add any other theme-specific classes here dynamically later if needed
                  // Or better, rely purely on CSS variables set below
              );
              // Dynamically remove potential generated theme classes as well
              const classList = document.documentElement.classList;
              for (let i = classList.length - 1; i >= 0; i--) {
                  const className = classList[i];
                  if (className.endsWith('-theme') && className !== 'default-theme') { // Assuming 'default' doesn't use a class
                      classList.remove(className);
                  }
              }

              // Apply the theme class regardless of whether it's predefined or generated
              if (cfg.theme && cfg.theme !== 'default') {
                  document.documentElement.classList.add(cfg.theme); // Add class based on cfg.theme value
              }

              // Special class for override? (If CSS uses it)
              if (cfg.overrideUsernameColors) {
                   document.documentElement.classList.add('override-username-colors');
              } else {
                   document.documentElement.classList.remove('override-username-colors');
              }

              // --- Update UI State ---
              // Apply timestamp visibility class (if CSS uses it)
              if (cfg.showTimestamps) {
                  document.documentElement.classList.remove('hide-timestamps');
              } else {
                  document.documentElement.classList.add('hide-timestamps');
              }
              // Maybe force redraw of existing messages if needed? (Less critical now)

              // Update chat mode display (Handles showing/hiding containers)
              console.log("[applyConfiguration] Switching chat mode based on config...");
              switchChatMode(cfg.chatMode || 'window', false); // Pass false to prevent adding messages
              console.log("[applyConfiguration] Mode switch complete.");

              // Ensure visual previews reflect the applied config
              updateColorPreviews(); // Update color button highlights
              // updatePreviewFromCurrentSettings(); // REMOVED CALL
              // Ensure theme preview updates based on the applied config's theme
              const appliedThemeObj = window.availableThemes.find(t => t.value === cfg.theme) || window.availableThemes[0];
              if (appliedThemeObj) {
                  updateThemePreview(appliedThemeObj);
              }

              console.log("Configuration applied.");
          }

        // Event listeners for config panel inputs
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                const newSize = e.target.value;
                if (fontSizeValue) {
                    fontSizeValue.textContent = `${newSize}px`;
                }
                document.documentElement.style.setProperty('--chat-font-size', `${newSize}px`);
                
                // Apply font size to theme preview as well
                if (themePreview) {
                    themePreview.style.fontSize = `${newSize}px`; 
                }
            });
        }

    } // End of initApp
})(); // Ensure closing IIFE is correct
