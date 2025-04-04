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
            chatWidth: 100,
            chatHeight: 600,
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
        const chatMessages = document.getElementById('chat-messages');
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
        const closeConfigBtn = document.getElementById('cancel-config');
        const saveConfigBtn = document.getElementById('save-config');
        const cancelConfigBtn = document.getElementById('cancel-config');
        const resetConfigBtn = document.getElementById('reset-config');
        const fontSizeSlider = document.getElementById('font-size');
        const fontSizeValue = document.getElementById('font-size-value');
        const bgColorInput = document.getElementById('bg-color');
        const bgOpacityInput = document.getElementById('bg-opacity');
        // bg-opacity-value doesn't exist in the HTML, so let's create it - ** Correction: It DOES exist! **
        // let bgOpacityValue = document.createElement('span'); 
        // bgOpacityValue.id = 'bg-opacity-value';
        // bgOpacityValue.textContent = `${bgOpacityInput.value}%`;
        // bgOpacityInput.parentNode.appendChild(bgOpacityValue);
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
        const prevThemeBtn = document.getElementById('prev-theme');
        const nextThemeBtn = document.getElementById('next-theme');
        const currentThemeDisplay = document.getElementById('current-theme');
        const themePreview = document.getElementById('theme-preview');
        
        // AI Theme Generator elements
        // Remove these definitions as they will be in theme-generator.js
        // const themePromptInput = document.getElementById('theme-prompt');
        // const generateThemeBtn = document.getElementById('generate-theme-btn');
        // const themeLoadingIndicator = document.getElementById('theme-loading-indicator');
        // const generatedThemeResult = document.getElementById('generated-theme-result');
        // const generatedThemeName = document.getElementById('generated-theme-name');
        
        // Connection and chat state
        let socket = null;
        let channel = '';
        
        // Font selection
        let currentFontIndex = 0;
        const availableFonts = [
            // Custom fonts
            { name: 'Atkinson Hyperlegible', value: "'Atkinson Hyperlegible', sans-serif", description: 'Designed for high legibility and reading clarity, especially at small sizes.', custom: true },
            { name: 'EB Garamond', value: "'EB Garamond', serif", description: 'Elegant serif font with classical old-style proportions, perfect for literary or historical themes.', custom: true },
            { name: 'Tektur', value: "'Tektur', sans-serif", description: 'Modern and slightly angular typeface with a technical/sci-fi aesthetic.', custom: true },
            { name: 'Medieval Sharp', value: "'MedievalSharp', cursive", description: 'Evokes a medieval/fantasy atmosphere with calligraphic details.', custom: true },
            { name: 'Press Start 2P', value: "'Press Start 2P', monospace", description: 'Pixelated retro gaming font that resembles 8-bit text.', custom: true },
            { name: 'Jacquard 12', value: "'Jacquard', monospace", description: 'Clean monospaced font inspired by classic computer terminals.', custom: true },
            
            // System fonts organized by categories
            // Sans-serif fonts
            { name: 'System UI', value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
            { name: 'Arial', value: "Arial, sans-serif", description: 'Classic sans-serif font with good readability.' },
            { name: 'Helvetica', value: "Helvetica, Arial, sans-serif", description: 'Clean modern sans-serif font widely used in design.' },
            { name: 'Verdana', value: "Verdana, Geneva, sans-serif", description: 'Sans-serif designed for good readability on screens.' },
            { name: 'Tahoma', value: "Tahoma, Geneva, sans-serif", description: 'Compact sans-serif with good readability at small sizes.' },
            { name: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif", description: 'Humanist sans-serif with distinctive character shapes.' },
            { name: 'Calibri', value: "Calibri, sans-serif", description: 'Modern sans-serif with rounded details and good readability.' },
            
            // Serif fonts
            { name: 'Times New Roman', value: "'Times New Roman', Times, serif", description: 'Classic serif font with traditional letterforms.' },
            { name: 'Georgia', value: "Georgia, serif", description: 'Elegant serif font designed for screen readability.' },
            { name: 'Palatino', value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", description: 'Elegant serif based on Renaissance letterforms.' },
            { name: 'Garamond', value: "Garamond, Baskerville, 'Baskerville Old Face', serif", description: 'Classical serif with elegant proportions.' },
            
            // Monospace fonts
            { name: 'Courier New', value: "'Courier New', Courier, monospace", description: 'Classic monospaced font resembling typewriter text.' },
            { name: 'Consolas', value: "Consolas, monaco, monospace", description: 'Modern monospaced font designed for coding.' },
            { name: 'Lucida Console', value: "'Lucida Console', Monaco, monospace", description: 'Clear monospace font with good readability.' },
            
            // Display/Decorative fonts that are commonly available
            { name: 'Impact', value: "Impact, Haettenschweiler, sans-serif", description: 'Bold condensed sans-serif font, often used for headlines.' },
            { name: 'Comic Sans MS', value: "'Comic Sans MS', cursive", description: 'Casual script-like font with a friendly appearance.' },
            { name: 'Arial Black', value: "'Arial Black', Gadget, sans-serif", description: 'Extra bold version of Arial for strong emphasis.' }
        ];
        
        // Theme selection (populated by theme-carousel.js)
        let currentThemeIndex = 0;
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
                        console.log(`Converting border radius "${borderRadius}" to "${cssValue}"`);
                        document.documentElement.style.setProperty('--chat-border-radius', cssValue);
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
                    
                    // If it's a preset name, convert to CSS value
                    if (boxShadowMap[boxShadow]) {
                        const cssValue = boxShadowMap[boxShadow];
                        console.log(`Converting box shadow "${boxShadow}" to "${cssValue}"`);
                        document.documentElement.style.setProperty('--chat-box-shadow', cssValue);
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
                'Pill': '24px', 'pill': '24px'
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
                const buttons = boxShadowPresets.querySelectorAll('.preset-btn');
                buttons.forEach(btn => {
                    if (btn.dataset.value === presetName) {
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
        
        // Add a system message to the chat
        function addSystemMessage(message) {
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
            chatMessages.appendChild(messageElement);
            
            // Auto-scroll and limit messages
            limitMessages();
            scrollToBottom();
        }
        
        // Add a user message to the chat
        function addChatMessage(data) {
            try {
                if (!data.username || !data.message) return;
                
                // First check which mode we're in and get appropriate container
                let targetContainer;
                if (config.chatMode === 'popup') {
                    targetContainer = document.getElementById('popup-messages');
                    if (!targetContainer) {
                        console.error('Popup messages container not found');
                        return; // Exit early if container not found
                    }
                } else {
                    targetContainer = chatMessages;
                    if (!targetContainer) {
                        console.error('Chat messages container not found');
                        return; // Exit early if container not found
                    }
                }
                
                // Create appropriate message element based on mode
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
                
                if (config.chatMode === 'window') {
                    // Limit messages to maintain performance
                    limitMessages();
                    // Auto-scroll to the bottom
                    scrollToBottom();
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
                            messageElement.classList.add('removing');
                            setTimeout(() => {
                                if (messageElement.parentNode) {
                                    messageElement.parentNode.removeChild(messageElement);
                                }
                            }, 300); // Fade-out animation duration
                        }, duration);
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
                addSystemMessage('Please enter a valid channel name');
                return;
            }
            
            // Hide the channel form and show connecting message
            const channelForm = document.getElementById('channel-form');
            if (channelForm) {
                channelForm.style.display = 'none';
            }
            
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
                    
                    // Show channel actions
                    const channelActions = document.getElementById('channel-actions');
                    if (channelActions) {
                        channelActions.style.display = 'flex';
                    }
                    
                    const disconnectButton = document.getElementById('disconnect-btn');
                    if (disconnectButton) {
                        disconnectButton.textContent = `Disconnect from ${channel}`;
                    }
                    
                    // Add connected message
                    addSystemMessage(`Connected to ${channel}'s chat`);
                }
            };
            
            socket.onclose = function() {
                console.log('WebSocket connection closed');
                updateStatus(false);
                addSystemMessage('Disconnected from chat');
            };
            
            socket.onerror = function(error) {
                console.error('WebSocket error:', error);
                updateStatus(false);
                addSystemMessage('Error connecting to chat');
                
                const channelForm = document.getElementById('channel-form');
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
        
        // Scroll chat to bottom
        function scrollToBottom() {
            if (config.chatMode === 'window') {
                // Get the chat container element
                const chatContainer = document.getElementById('chat-container');
                
                // Ensure we always show the bottom of chat
                if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
                if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
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
                connectToChat();
                
                // Save the channel immediately after connection attempt
                if (channel) {
                    config.lastChannel = channel;
                    saveConfiguration();
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
                
                // Also save the channel after connection is attempted
                if (channel) {
                    config.lastChannel = channel;
                    saveConfiguration();
                }
            }
        });
        
        // Background color + opacity handling
        function updateBgColor() {
            // Get the hex color without transparency
            const hexColor = bgColorInput.value;
            const opacity = parseInt(bgOpacityInput.value) / 100;
            
            // Set the color and opacity separately
            document.documentElement.style.setProperty('--chat-bg-color', hexColor);
            document.documentElement.style.setProperty('--chat-bg-opacity', opacity);
            
            // Also update popup settings for consistency
            document.documentElement.style.setProperty('--popup-bg-color', hexColor);
            document.documentElement.style.setProperty('--popup-bg-opacity', opacity);
            
            // Update the display value
            const bgOpacityValue = document.getElementById('bg-opacity-value');
            if (bgOpacityValue) {
                bgOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
            }
        }
        
        bgColorInput.addEventListener('input', updateBgColor);
        
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
            
            updatePreviewFromCurrentSettings();
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
                const color = e.target.getAttribute('data-color');
                const target = e.target.getAttribute('data-target');
                
                // Mark this button as active and remove active class from sibling buttons
                const allButtonsForTarget = document.querySelectorAll(`.color-btn[data-target="${target}"]`);
                allButtonsForTarget.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Set the appropriate color input based on target
                if (target === 'bg') {
                    bgColorInput.value = color;
                    updateBgColor();
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
                updatePreviewFromCurrentSettings();
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
            
            document.documentElement.style.setProperty('--font-size', `${value}px`);
            updatePreviewFromCurrentSettings();
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
            chatHeightValue.textContent = `${value}px`;
            
            document.documentElement.style.setProperty('--chat-height', `${value}px`);
        });
        
        // Open settings panel function
        function openSettingsPanel() {
            console.log('Opening settings panel');
            try {
                const panel = document.getElementById('config-panel');
                if (!panel) {
                    console.error('Config panel not found in DOM');
                    return;
                }
                
                // Store the current configuration for cancel functionality
                originalConfig = JSON.parse(JSON.stringify(config));
                
                panel.classList.add('visible');
                // Also directly set the style in case the CSS isn't working
                panel.style.display = 'block';
                
                // Update form fields to match current config
                updateConfigPanelFromConfig();
            } catch (error) {
                console.error('Error opening settings panel:', error);
            }
        }
        
        // Settings button handlers
        if (settingsBtn) {
            settingsBtn.onclick = function(e) {
                console.log('Settings button clicked');
                if (e) e.preventDefault();
                
                const panel = document.getElementById('config-panel');
                if (panel) {
                    // Store original config for cancel functionality
                    originalConfig = JSON.parse(JSON.stringify(config));
                    
                    panel.classList.add('visible');
                    panel.style.display = 'block';
                    updateConfigPanelFromConfig();
                }
                
                return false;
            };
            
            settingsBtn.style.cursor = 'pointer';
        }
        
        // Popup mode settings button
        const popupSettingsBtn = document.getElementById('popup-settings-btn');
        if (popupSettingsBtn) {
            popupSettingsBtn.onclick = function(e) {
                console.log('Popup settings button clicked');
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                const panel = document.getElementById('config-panel');
                if (panel) {
                    // Store original config for cancel functionality
                    originalConfig = JSON.parse(JSON.stringify(config));
                    
                    panel.classList.add('visible');
                    panel.style.display = 'block';
                    updateConfigPanelFromConfig();
                }
                
                return false;
            };
            
            popupSettingsBtn.style.cursor = 'pointer';
            // Don't set opacity here to allow CSS hover control
        }
        
        // Variable to store original config when opening settings
        let originalConfig = null;

        // Close settings panel function
        function closeConfigPanel() {
            configPanel.classList.remove('visible');
            configPanel.style.display = 'none';
        }
        
        // Cancel button click handler
        cancelConfigBtn.addEventListener('click', () => {
            // Restore original config if it exists
            if (originalConfig) {
                // Restore config from backup
                config = JSON.parse(JSON.stringify(originalConfig));
                
                // Re-apply the original settings to the UI
                applyTheme(config.theme);
                
                // Reset CSS variables to original values
                document.documentElement.style.setProperty('--chat-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--chat-border-color', config.borderColor);
                document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                document.documentElement.style.setProperty('--username-color', config.usernameColor);
                document.documentElement.style.setProperty('--font-size', `${config.fontSize}px`);
                document.documentElement.style.setProperty('--font-family', config.fontFamily);
                document.documentElement.style.setProperty('--chat-width', `${config.chatWidth}%`);
                document.documentElement.style.setProperty('--chat-height', `${config.chatHeight}px`);
                
                // Apply original username color override setting
                if (config.overrideUsernameColors) {
                    document.documentElement.classList.add('override-username-colors');
                } else {
                    document.documentElement.classList.remove('override-username-colors');
                }
                
                // Apply original chat mode
                switchChatMode(config.chatMode);
            }
            
            // Close the panel
            closeConfigPanel();
        });
        
        // Update theme preview based on current color settings
        function updateColorPreviews() {
            // The color preview swatches have been removed
            // Now we only highlight the active color buttons and update the theme preview
            
            // Highlight the active color buttons based on current values
            highlightActiveColorButtons();
            
            // Update the main theme preview to keep everything in sync
            updatePreviewFromCurrentSettings();
        }
        
        // Helper function to highlight the active color buttons based on current values
        function highlightActiveColorButtons() {
            // Background color
            const bgColorValue = bgColorInput.value || '#121212';
            const bgButtons = document.querySelectorAll('.color-btn[data-target="bg"]');
            bgButtons.forEach(btn => {
                if (btn.getAttribute('data-color') === bgColorValue) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Border color
            const borderColorValue = borderColorInput.value || '#9147ff';
            const borderButtons = document.querySelectorAll('.color-btn[data-target="border"]');
            borderButtons.forEach(btn => {
                if ((borderColorValue === 'transparent' && btn.getAttribute('data-color') === 'transparent') || 
                    (borderColorValue !== 'transparent' && btn.getAttribute('data-color') === borderColorValue)) {
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
        function switchChatMode(mode) {
            try {
                console.log(`Switching chat mode to: ${mode}`);
                config.chatMode = mode;
                
                // Make sure message containers and settings are properly initialized
                const popupContainer = document.getElementById('popup-container');
                const popupMessages = document.getElementById('popup-messages');
                if (!popupContainer || !popupMessages) {
                    console.error('Popup containers not found in DOM');
                    return;
                }
                
                // Clear existing messages from popup container to prevent them from persisting
                if (popupMessages) {
                    popupMessages.innerHTML = '';
                }
                
                // Update both containers based on mode
                if (mode === 'popup') {
                    // Show popup container, hide window container
                    popupContainer.style.display = 'block';
                    
                    if (chatContainer) {
                        chatContainer.style.display = 'none';
                    }
                    
                    // Move channel form to popup container if not connected
                    const channelForm = document.getElementById('channel-form');
                    if (channelForm && (!socket || socket.readyState !== WebSocket.OPEN)) {
                        const popupSettingsArea = document.querySelector('.popup-settings-area');
                        if (popupSettingsArea && !popupSettingsArea.contains(channelForm)) {
                            popupSettingsArea.appendChild(channelForm);
                        }
                        channelForm.style.display = 'block';
                    }
                    
                    document.body.classList.add('popup-mode');
                    document.body.classList.remove('window-mode');
                    
                    // Ensure popup settings button is visible
                    const popupSettingsBtn = document.getElementById('popup-settings-btn');
                    if (popupSettingsBtn) {
                        popupSettingsBtn.style.opacity = '0.7';
                    }
                } else {
                    // Show window container, hide popup container
                    popupContainer.style.display = 'none';
                    
                    if (chatContainer) {
                        chatContainer.style.display = 'block';
                    }
                    
                    // Move channel form back to main container if not connected
                    const channelForm = document.getElementById('channel-form');
                    if (channelForm && (!socket || socket.readyState !== WebSocket.OPEN)) {
                        if (!chatContainer.contains(channelForm)) {
                            chatContainer.insertBefore(channelForm, chatMessages);
                        }
                        channelForm.style.display = 'block';
                    }
                    
                    document.body.classList.add('window-mode');
                    document.body.classList.remove('popup-mode');
                }
                
                // Only clear messages if we have a container to display them
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                    
                    // Re-add some system messages explaining the current mode
                    if (mode === 'popup') {
                        addSystemMessage(`Switched to popup mode. Messages will appear temporarily from the ${(config.popup?.direction || 'from-bottom').replace('from-', '')}.`);
                    } else {
                        addSystemMessage('Switched to window mode. Messages will appear in a scrollable window.');
                    }
                    
                    // Add a dummy message to demonstrate the mode
                    addChatMessage({
                        username: 'ExampleUser',
                        message: 'This is a sample message to demonstrate the current chat mode.',
                        color: config.usernameColor || '#9147ff'
                    });
                }
                
                // Update popup message container position based on direction
                if (popupMessages && config.popup) {
                    // Get direction with fallback
                    const direction = config.popup.direction || 'from-bottom';
                    
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
                            position.top = '10px';
                            position.bottom = 'auto';
                            break;
                        case 'from-bottom':
                        default:
                            position.bottom = '10px';
                            position.top = 'auto';
                    }
                    
                    // Clear the style completely first
                    popupMessages.removeAttribute('style');
                    
                    // Apply new styles, only setting vertical position
                    popupMessages.style.top = position.top;
                    popupMessages.style.bottom = position.bottom;
                }
            } catch (error) {
                console.error('Error switching chat mode:', error);
                addSystemMessage('Error switching chat mode. Please try refreshing the page.');
            }
        }
        
        // Switch themes with the carousel
        
        function applyTheme(themeName) {
            try {
                // First find the theme object matching this name
                const themeIndex = availableThemes.findIndex(theme => theme.value === themeName);
                if (themeIndex === -1) return;
                
                const theme = availableThemes[themeIndex];
                console.log("Applying theme:", theme.name);
                
                // First remove all theme classes
                document.documentElement.classList.remove(
                    'light-theme', 
                    'natural-theme', 
                    'transparent-theme', 
                    'pink-theme', 
                    'cyberpunk-theme'
                );
                
                // Store the theme in config
                config.theme = themeName;
                
                // Then apply the selected theme if it's not default
                if (themeName !== 'default') {
                    document.documentElement.classList.add(themeName);
                }
                
                // Apply CSS variables directly
                document.documentElement.style.setProperty('--chat-bg-color', theme.bgColor);
                document.documentElement.style.setProperty('--chat-border-color', theme.borderColor);
                document.documentElement.style.setProperty('--chat-text-color', theme.textColor);
                document.documentElement.style.setProperty('--username-color', theme.usernameColor);
                
                // Also set popup mode variables for consistent theming
                document.documentElement.style.setProperty('--popup-bg-color', theme.bgColor);
                document.documentElement.style.setProperty('--popup-border-color', theme.borderColor);
                document.documentElement.style.setProperty('--popup-text-color', theme.textColor);
                document.documentElement.style.setProperty('--popup-username-color', theme.usernameColor);
                
                // Special handling for Transparent theme to ensure border is transparent
                if (theme.value === 'transparent-theme') {
                    document.documentElement.style.setProperty('--chat-border-color', 'transparent');
                    document.documentElement.style.setProperty('--popup-border-color', 'transparent');
                }
                
                // Apply background image if available
                if (theme.backgroundImage) {
                    // Apply to both chat container and popup container
                    document.documentElement.style.setProperty('--chat-bg-image', `url("${theme.backgroundImage}")`); 
                    document.documentElement.style.setProperty('--popup-bg-image', `url("${theme.backgroundImage}")`); 
                } else {
                    document.documentElement.style.setProperty('--chat-bg-image', 'none');
                    document.documentElement.style.setProperty('--popup-bg-image', 'none');
                }
                
                // Only update config if we explicitly want to - this prevents
                // unwanted config overrides during save operations
                if (config.theme === theme.value) {
                    config.bgColor = theme.bgColor;
                    config.borderColor = theme.borderColor;
                    config.textColor = theme.textColor;
                    config.usernameColor = theme.usernameColor;
                    config.backgroundImage = theme.backgroundImage;
                    
                    // Apply border radius and box shadow if specified in the theme
                    if (theme.borderRadius) {
                        config.borderRadius = theme.borderRadius;
                        
                        // Check if the value is a preset name or an actual CSS value
                        const borderRadiusValues = {
                            "none": "0px",
                            "subtle": "8px",
                            "rounded": "16px",
                            "pill": "24px"
                        };
                        
                        // Convert named values to CSS values if needed
                        const borderRadiusValue = borderRadiusValues[theme.borderRadius.toLowerCase()] || theme.borderRadius;
                        document.documentElement.style.setProperty('--chat-border-radius', borderRadiusValue);
                        
                        // Highlight the matching button in the UI
                        applyBorderRadius(theme.borderRadius);
                    }
                    
                    if (theme.boxShadow) {
                        config.boxShadow = theme.boxShadow;
                        const boxShadowValue = window.getBoxShadowValue(theme.boxShadow);
                        document.documentElement.style.setProperty('--chat-box-shadow', boxShadowValue);
                        // Highlight the matching button in the UI
                        applyBoxShadow(theme.boxShadow);
                    }
                }
                
                // Update the theme index and display
                currentThemeIndex = themeIndex;
                if (currentThemeDisplay) {
                    currentThemeDisplay.textContent = theme.name;
                }
                
                // Also apply the preview
                updateThemePreview(theme);
                
                // Update any hidden color inputs to match the theme
                if (bgColorInput) {
                    // Extract RGB from rgba color
                    const rgbaMatch = theme.bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
                    if (rgbaMatch) {
                        const [, r, g, b, a] = rgbaMatch;
                        const hexColor = '#' + parseInt(r).toString(16).padStart(2, '0') + 
                                        parseInt(g).toString(16).padStart(2, '0') + 
                                        parseInt(b).toString(16).padStart(2, '0');
                        bgColorInput.value = hexColor;
                        
                        // // Update opacity slider if it exists
                        // if (bgOpacityInput) {
                        //     bgOpacityInput.value = parseFloat(a) * 100;
                            
                        //     // Update display value if it exists
                        //     const bgOpacityValue = document.getElementById('bg-opacity-value');
                        //     if (bgOpacityValue) {
                        //         bgOpacityValue.textContent = `${parseInt(parseFloat(a) * 100)}%`;
                        //     }
                        // }
                    }
                }
                
                // Special handling for transparent border
                if (borderColorInput) {
                    if (theme.value === 'transparent-theme' || theme.borderColor === 'transparent') {
                        borderColorInput.value = 'transparent';
                        // Also update the None button to appear active
                        const borderButtons = document.querySelectorAll('.color-btn[data-target="border"]');
                        borderButtons.forEach(btn => {
                            if (btn.getAttribute('data-color') === 'transparent') {
                                btn.classList.add('active');
                            } else {
                                btn.classList.remove('active');
                            }
                        });
                    } else {
                        borderColorInput.value = theme.borderColor;
                    }
                }
                if (textColorInput) textColorInput.value = theme.textColor;
                if (usernameColorInput) usernameColorInput.value = theme.usernameColor;
                
                // Update color previews (which also highlights buttons)
                updateColorPreviews();
                
            } catch (error) {
                console.error("Error applying theme:", error);
            }
        }
        
        // Initialize font selection
        function updateFontDisplay() {
            currentFontDisplay.textContent = availableFonts[currentFontIndex].name;
            
            // Update the CSS variable
            const fontFamily = availableFonts[currentFontIndex].value;
            document.documentElement.style.setProperty('--font-family', fontFamily);
            
            // Update the theme preview's font
            const themePreview = document.getElementById('theme-preview');
            if (themePreview) {
                themePreview.style.fontFamily = fontFamily;
            }
            
            // Show font description if available
            const fontDescription = document.getElementById('font-description');
            if (fontDescription) {
                fontDescription.textContent = availableFonts[currentFontIndex].description || '';
            }
        }
        
        // Font selection carousel
        prevFontBtn.addEventListener('click', () => {
            currentFontIndex = (currentFontIndex - 1 + availableFonts.length) % availableFonts.length;
            updateFontDisplay();
        });
        
        nextFontBtn.addEventListener('click', () => {
            currentFontIndex = (currentFontIndex + 1) % availableFonts.length;
            updateFontDisplay();
        });
        
        // AI Theme Generator function with retry logic
        // This is now handled by retry-theme-generator.js patching the button click
        // async function generateThemeFromPrompt() { ... } // Removed original function
        
        // Function to apply generated theme - REMOVED
        // function applyGeneratedTheme(theme) { ... } // Removed this function entirely
        
        // Initialize theme display
        function updateThemeDisplay() {
            currentThemeDisplay.textContent = availableThemes[currentThemeIndex].name;
            
            // Save current theme to config before applying
            const theme = availableThemes[currentThemeIndex];
            config.theme = theme.value;
            
            // Update config with theme colors
            config.bgColor = theme.bgColor;
            config.borderColor = theme.borderColor;
            config.textColor = theme.textColor;
            config.usernameColor = theme.usernameColor;
            
            // If it's a generated theme, apply it using our specialized function
            // if (theme.isGenerated) {
                // applyGeneratedTheme(theme); // REMOVED call
            // } else {
                // Apply the current theme using existing method
                applyTheme(theme.value); // applyTheme now handles all cases
                
                // Update theme preview
                updateThemePreview(theme);
            // } // REMOVED else block wrapper
        }
        
        // Update theme preview with current theme
        function updateThemePreview(theme, useCustom = false) {
            // Get the preview element
            const themePreview = document.getElementById('theme-preview');
            if (!themePreview) return;
            
            // Update the HTML example first so we can style its elements
            themePreview.innerHTML = `
                <div class="preview-chat-message">
                    ${config.showTimestamps ? '<span class="timestamp">12:34</span> ' : ''}
                    <span class="preview-username">Username:</span> 
                    <span class="preview-message">Example chat message</span>
                </div>
                <div class="preview-chat-message">
                    ${config.showTimestamps ? '<span class="timestamp">12:35</span> ' : ''}
                    <span class="preview-username">AnotherUser:</span> 
                    <span class="preview-message">This is how your chat will look</span>
                </div>
            `;
            
            // First remove all theme classes
            themePreview.classList.remove(
                'light-theme', 
                'natural-theme', 
                'transparent-theme', 
                'pink-theme', 
                'cyberpunk-theme'
            );
            
            // Apply theme colors directly regardless of class
            const usernameElems = themePreview.querySelectorAll('.preview-username');
            const messageElems = themePreview.querySelectorAll('.preview-message');
            const timestampElems = themePreview.querySelectorAll('.timestamp');
            
            // Use either theme colors or custom input colors
            if (theme.value !== 'default' && !useCustom) {
                // Apply predefined theme colors directly
                themePreview.style.backgroundColor = theme.bgColor;
                
                // Apply background image if available
                if (theme.backgroundImage) {
                    themePreview.style.backgroundImage = `url("${theme.backgroundImage}")`;
                    themePreview.style.backgroundRepeat = 'repeat';
                    themePreview.style.backgroundSize = 'auto';
                } else {
                    themePreview.style.backgroundImage = 'none';
                }
                
                // Special handling for transparent border in themes
                if (theme.borderColor === 'transparent') {
                    themePreview.style.border = 'none';
                } else {
                    themePreview.style.border = `2px solid ${theme.borderColor}`;
                }
                
                // Apply border radius if specified in the theme
                if (theme.borderRadius) {
                    // Check if the value is a preset name or an actual CSS value
                    const borderRadiusValues = {
                        "none": "0px",
                        "subtle": "8px",
                        "rounded": "16px",
                        "pill": "24px"
                    };
                    
                    // Convert named values to CSS values if needed
                    const borderRadiusValue = borderRadiusValues[theme.borderRadius.toLowerCase()] || theme.borderRadius;
                    themePreview.style.borderRadius = borderRadiusValue;
                }
                
                // Apply box shadow if specified in the theme
                if (theme.boxShadow) {
                    const boxShadowValue = window.getBoxShadowValue(theme.boxShadow);
                    themePreview.style.boxShadow = boxShadowValue;
                }
                
                themePreview.style.color = theme.textColor;
                
                // Add the theme class for any additional styles (especially important for transparent theme)
                themePreview.classList.add(theme.value);
                
                // Apply text colors
                if (usernameElems && usernameElems.length) {
                    usernameElems.forEach(elem => {
                        elem.style.color = theme.usernameColor;
                    });
                }
                
                if (messageElems && messageElems.length) {
                    messageElems.forEach(elem => {
                        elem.style.color = theme.textColor;
                    });
                }
                
                if (timestampElems && timestampElems.length) {
                    timestampElems.forEach(elem => {
                        elem.style.color = "rgba(170, 170, 170, 0.8)"; // Timestamp color
                    });
                }
                
            } else {
                // Apply custom colors from inputs
                const bgColor = bgColorInput.value || '#121212';
                const opacity = parseInt(bgOpacityInput.value || 80) / 100;
                const rgbaMatch = bgColor.match(/#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i);
                
                if (rgbaMatch) {
                    const [, r, g, b] = rgbaMatch;
                    const r_int = parseInt(r, 16);
                    const g_int = parseInt(g, 16);
                    const b_int = parseInt(b, 16);
                    themePreview.style.backgroundColor = `rgba(${r_int}, ${g_int}, ${b_int}, ${opacity})`;
                } else {
                    themePreview.style.backgroundColor = bgColor;
                    themePreview.style.opacity = opacity;
                }
                
                // Apply background image from the current theme if available
                if (config.backgroundImage) {
                    themePreview.style.backgroundImage = `url("${config.backgroundImage}")`;
                    themePreview.style.backgroundRepeat = 'repeat';
                    themePreview.style.backgroundSize = 'auto';
                } else {
                    themePreview.style.backgroundImage = 'none';
                }
                
                // Handle transparent borders properly
                if (borderColorInput.value === 'transparent') {
                    themePreview.style.border = 'none';
                } else {
                    themePreview.style.border = `2px solid ${borderColorInput.value || '#9147ff'}`;
                }
                
                // Apply text colors
                if (usernameElems && usernameElems.length) {
                    usernameElems.forEach(elem => {
                        elem.style.color = usernameColorInput.value || '#9147ff';
                    });
                }
                
                if (messageElems && messageElems.length) {
                    messageElems.forEach(elem => {
                        elem.style.color = textColorInput.value || '#efeff1';
                    });
                }
                
                if (timestampElems && timestampElems.length) {
                    timestampElems.forEach(elem => {
                        elem.style.color = "rgba(170, 170, 170, 0.8)"; // Timestamp color
                    });
                }
                
                // Special handling for transparent background
                if (bgColor === '#000' || opacity === 0) {
                    themePreview.classList.add('transparent-theme');
                }
            }
            
            // Apply the current font family and size
            const fontFamily = availableFonts[currentFontIndex].value;
            const fontSize = fontSizeSlider.value;
            document.documentElement.style.setProperty('--font-family', fontFamily);
            themePreview.style.fontFamily = fontFamily;
            themePreview.style.fontSize = `${fontSize}px`;
        }
        
        // Update the preview whenever colors or settings change
        function updatePreviewFromCurrentSettings() {
            updateThemePreview(availableThemes[currentThemeIndex], true);
        }
        
        // Previous theme button
        prevThemeBtn.addEventListener('click', () => {
            currentThemeIndex = (currentThemeIndex - 1 + availableThemes.length) % availableThemes.length;
            updateThemeDisplay();
        });
        
        // Next theme button
        nextThemeBtn.addEventListener('click', () => {
            currentThemeIndex = (currentThemeIndex + 1) % availableThemes.length;
            updateThemeDisplay();
        });
        
        // Username color override toggle
        overrideUsernameColorsInput.addEventListener('change', () => {
            if (overrideUsernameColorsInput.checked) {
                document.documentElement.classList.add('override-username-colors');
            } else {
                document.documentElement.classList.remove('override-username-colors');
            }
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
                                    position.top = '10px';
                                    position.bottom = 'auto';
                                    break;
                                case 'from-bottom':
                                default:
                                    position.bottom = '10px';
                                    position.top = 'auto';
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
        
        // Save configuration
        function saveConfiguration() {
            console.log('Saving settings');
            try {
                // Get the current chat mode
                const chatModeRadio = document.querySelector('input[name="chat-mode"]:checked');
                if (!chatModeRadio) {
                    console.error('No chat mode selected');
                    addSystemMessage('Error saving settings: No chat mode selected');
                    return;
                }
                
                // Get values from form fields with robust error handling
                const getValue = (element, defaultValue) => {
                    if (!element) return defaultValue;
                    if (element.type === 'checkbox') return element.checked;
                    if (element.type === 'number' || element.type === 'range') return parseInt(element.value) || defaultValue;
                    return element.value || defaultValue;
                };
                
                // Special function to handle border-color which might be 'transparent'
                const getBorderColor = () => {
                    // First check our custom attribute for transparent state
                    const transparentButton = document.querySelector('.color-btn[data-target="border"][data-is-transparent="true"]');
                    if (transparentButton) {
                        return 'transparent';
                    }
                    
                    // Check if the "None" (transparent) button is active
                    const borderButtons = document.querySelectorAll('.color-btn[data-target="border"]');
                    for (const btn of borderButtons) {
                        if (btn.classList.contains('active') && btn.getAttribute('data-color') === 'transparent') {
                            return 'transparent'; // The transparent button is active
                        }
                    }
                    
                    // Check if the CSS variable is set to transparent
                    if (getComputedStyle(document.documentElement).getPropertyValue('--chat-border-color').trim() === 'transparent') {
                        return 'transparent';
                    }
                    
                    // If the Transparent theme is currently selected, use transparent
                    if (availableThemes[currentThemeIndex].value === 'transparent-theme') {
                        return 'transparent';
                    }
                    
                    // Otherwise use the color input value
                    return borderColorInput.value || '#9147ff';
                };
                
                // Get the current theme object DIRECTLY using the index
                const activeThemeObject = window.availableThemes[currentThemeIndex];
                const currentThemeValue = activeThemeObject?.value || 'default';
                const currentBgImage = activeThemeObject?.backgroundImage || null; // Get the image from the active object

                // Get opacity values directly
                const bgColorOpacityValue = bgOpacityInput ? parseInt(bgOpacityInput.value, 10) / 100 : 0.85;
                const bgImageOpacityValue = bgImageOpacityInput ? parseInt(bgImageOpacityInput.value, 10) / 100 : 0.55;

                // Create updated config object with all settings (NO background image)
                const newConfig = {
                    chatMode: chatModeRadio.value,
                    // bgColor: getRgbaColor(), // Removed - bg color is stored without opacity now
                    bgColor: getValue(bgColorInput, '#121212'), // Store hex color
                    bgColorOpacity: bgColorOpacityValue, // Store opacity separately
                    bgImageOpacity: bgImageOpacityValue, // Store image opacity separately
                    borderColor: getValue(borderColorInput, '#9147ff'), 
                    textColor: getValue(textColorInput, '#efeff1'),
                    usernameColor: getValue(usernameColorInput, '#9147ff'),
                    fontSize: getValue(fontSizeSlider, 14),
                    fontFamily: availableFonts[currentFontIndex]?.value || "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    chatWidth: getValue(chatWidthInput, 100),
                    chatHeight: getValue(chatHeightInput, 600),
                    maxMessages: getValue(maxMessagesInput, 50),
                    showTimestamps: getValue(showTimestampsInput, true),
                    overrideUsernameColors: getValue(overrideUsernameColorsInput, false),
                    borderRadius: config.borderRadius || '8px', // Use current config's value before update
                    boxShadow: config.boxShadow || 'none', // Use current config's value before update
                    theme: currentThemeValue, 
                    lastChannel: channel || config.lastChannel || '',
                    popup: {
                        direction: document.querySelector('input[name="popup-direction"]:checked')?.value || 'from-bottom',
                        duration: getValue(document.getElementById('popup-duration'), 5),
                        maxMessages: getValue(document.getElementById('popup-max-messages'), 3)
                    }
                };
                
                // Update the main config object
                config = newConfig;
                
                // Get scene ID and save to localStorage (without image)
                const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
                localStorage.setItem(`twitch-chat-overlay-config-${sceneId}`, JSON.stringify(config));
                console.log('Saved config to localStorage:', config);
                
                // --- Re-apply styles using the config AND the active theme's image ---
                
                // First, remove all theme classes
                document.documentElement.classList.remove(
                    'light-theme', 
                    'natural-theme', 
                    'transparent-theme', 
                    'pink-theme', 
                    'cyberpunk-theme'
                );
                
                // Add standard theme class if needed
                if (config.theme !== 'default' && !config.theme.startsWith('generated-')) {
                    document.documentElement.classList.add(config.theme);
                }
                
                // Apply CSS variables from the saved config
                // Apply color and opacity separately
                document.documentElement.style.setProperty('--chat-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--chat-bg-opacity', config.bgColorOpacity);
                document.documentElement.style.setProperty('--popup-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--popup-bg-opacity', config.bgColorOpacity);
                
                // Apply image opacity
                document.documentElement.style.setProperty('--chat-bg-image-opacity', config.bgImageOpacity);
                document.documentElement.style.setProperty('--popup-bg-image-opacity', config.bgImageOpacity);

                document.documentElement.style.setProperty('--chat-border-color', config.borderColor);
                document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                document.documentElement.style.setProperty('--username-color', config.usernameColor);
                document.documentElement.style.setProperty('--font-size', `${config.fontSize}px`);
                document.documentElement.style.setProperty('--font-family', config.fontFamily);
                document.documentElement.style.setProperty('--chat-width', `${config.chatWidth}%`);
                document.documentElement.style.setProperty('--chat-height', `${config.chatHeight}px`);
                
                // Use the actual CSS value for border radius
                const borderRadiusValue = window.getBorderRadiusValue(config.borderRadius);
                document.documentElement.style.setProperty('--chat-border-radius', borderRadiusValue);
                
                // Apply box shadow using the preset value if set
                if (config.boxShadow) {
                    const boxShadowValue = window.getBoxShadowValue(config.boxShadow);
                    document.documentElement.style.setProperty('--chat-box-shadow', boxShadowValue);
                }

                // Apply the background image retrieved EARLIER from the active theme object
                 if (currentBgImage) {
                    document.documentElement.style.setProperty('--chat-bg-image', `url("${currentBgImage}")`); 
                    document.documentElement.style.setProperty('--popup-bg-image', `url("${currentBgImage}")`); 
                 } else {
                    document.documentElement.style.setProperty('--chat-bg-image', 'none');
                    document.documentElement.style.setProperty('--popup-bg-image', 'none');
                }
                
                // Apply username color override setting
                if (config.overrideUsernameColors) {
                    document.documentElement.classList.add('override-username-colors');
                } else {
                    document.documentElement.classList.remove('override-username-colors');
                }
                
                // Hide config panel
                closeConfigPanel();
                
                // Show success message
                addSystemMessage('Settings saved successfully');
                
            } catch (error) {
                console.error('Error saving settings:', error);
                // Check specifically for QuotaExceededError
                if (error.name === 'QuotaExceededError') {
                     addSystemMessage('❌ Error saving settings: Storage quota exceeded. Could not save configuration.');
                } else {
                addSystemMessage('Error saving settings. Please try again.');
            }
        }
        }
        
        // Load saved config on page load
        function loadSavedConfig() {
            console.log('Loading saved config');
            try {
                // NOTE: theme-carousel.js should have already run and loaded generatedThemes into window.availableThemes
                
                // Get scene ID from URL parameter, default to 'default' if not specified
                const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
                
                // Use scene-specific storage key
                const savedConfig = localStorage.getItem(`twitch-chat-overlay-config-${sceneId}`);
                console.log(`Loading config for scene: ${sceneId}`);
                
                if (savedConfig) {
                    try {
                        const parsedConfig = JSON.parse(savedConfig);
                        console.log('Loaded config:', parsedConfig);
                        console.log('[loadSavedConfig] Parsed config from localStorage:', JSON.stringify(parsedConfig)); // LOG 0 - Added
                        
                        // Find the full theme object for the saved theme value
                        // window.availableThemes includes defaults + saved generated themes
                        const savedThemeValue = parsedConfig.theme || 'default';
                        const currentFullTheme = window.availableThemes?.find(t => t.value === savedThemeValue) || window.availableThemes?.[0];
                        const themeBgImage = currentFullTheme?.backgroundImage || null;
                        
                        // Create new config object by merging defaults with saved settings
                        config = {
                            // Display mode
                            chatMode: parsedConfig.chatMode || 'window',
                            
                            // Window mode settings
                            // bgColor: parsedConfig.bgColor || 'rgba(18, 18, 18, 0.8)', // Removed - handle separately
                            bgColor: parsedConfig.bgColor || '#121212', // Load hex color
                            bgColorOpacity: parsedConfig.bgColorOpacity !== undefined ? parsedConfig.bgColorOpacity : 0.85, // Load opacity
                            bgImageOpacity: parsedConfig.bgImageOpacity !== undefined ? parsedConfig.bgImageOpacity : 0.55, // Load image opacity
                            borderColor: parsedConfig.borderColor === 'transparent' ? 'transparent' : (parsedConfig.borderColor || '#9147ff'),
                            textColor: parsedConfig.textColor || '#efeff1',
                            usernameColor: parsedConfig.usernameColor || '#9147ff',
                            fontSize: parsedConfig.fontSize || 14,
                            fontFamily: parsedConfig.fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif",
                            chatWidth: parsedConfig.chatWidth || 100,
                            chatHeight: parsedConfig.chatHeight || 600,
                            maxMessages: parsedConfig.maxMessages || 50,
                            showTimestamps: parsedConfig.showTimestamps !== undefined ? parsedConfig.showTimestamps : true,
                            overrideUsernameColors: parsedConfig.overrideUsernameColors || false,
                             // Use the actual CSS value for border radius, converting if necessary
                             borderRadius: window.getBorderRadiusValue(parsedConfig.borderRadius || '8px'),
                             boxShadow: parsedConfig.boxShadow || 'soft', // Store preset name
                            theme: savedThemeValue,
                            // backgroundImage is NOT loaded from config, but retrieved from the theme object above
                            lastChannel: parsedConfig.lastChannel || '',
                            
                            // Popup mode settings
                            popup: {
                                direction: parsedConfig.popup?.direction || 'from-bottom',
                                duration: parsedConfig.popup?.duration || 5,
                                maxMessages: parsedConfig.popup?.maxMessages || 3
                            }
                        };
                        
                        // Apply config settings to the UI
                        // Check if color override is active
                        if (overrideUsernameColorsInput) {
                            overrideUsernameColorsInput.checked = config.overrideUsernameColors;
                        }
                        
                        if (config.overrideUsernameColors) {
                            document.documentElement.classList.add('override-username-colors');
                        } else {
                            document.documentElement.classList.remove('override-username-colors');
                        }
                        
                        // Set color CSS variables directly
                        // Apply color and opacity separately
                        document.documentElement.style.setProperty('--chat-bg-color', config.bgColor);
                        document.documentElement.style.setProperty('--chat-bg-opacity', config.bgColorOpacity);
                        document.documentElement.style.setProperty('--popup-bg-color', config.bgColor);
                        document.documentElement.style.setProperty('--popup-bg-opacity', config.bgColorOpacity);

                        // Apply image opacity
                        document.documentElement.style.setProperty('--chat-bg-image-opacity', config.bgImageOpacity);
                        document.documentElement.style.setProperty('--popup-bg-image-opacity', config.bgImageOpacity);

                        document.documentElement.style.setProperty('--chat-border-color', config.borderColor);
                        document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                        document.documentElement.style.setProperty('--username-color', config.usernameColor);
                        document.documentElement.style.setProperty('--popup-border-color', config.borderColor);
                        document.documentElement.style.setProperty('--popup-text-color', config.textColor);
                        document.documentElement.style.setProperty('--popup-username-color', config.usernameColor);
                        
                        // Apply background image retrieved from the full theme object
                        if (themeBgImage) {
                            document.documentElement.style.setProperty('--chat-bg-image', `url("${themeBgImage}")`); 
                            document.documentElement.style.setProperty('--popup-bg-image', `url("${themeBgImage}")`); 
                        } else {
                            document.documentElement.style.setProperty('--chat-bg-image', 'none');
                            document.documentElement.style.setProperty('--popup-bg-image', 'none');
                        }
                        
                        // Special handling for transparent borders
                        if (config.borderColor === 'transparent' || config.theme === 'transparent-theme') {
                            document.documentElement.style.setProperty('--chat-border-color', 'transparent');
                            document.documentElement.style.setProperty('--popup-border-color', 'transparent');
                        }
                        
                        // Set font and size
                        document.documentElement.style.setProperty('--font-size', `${config.fontSize}px`);
                        document.documentElement.style.setProperty('--font-family', config.fontFamily);
                        document.documentElement.style.setProperty('--chat-width', `${config.chatWidth}%`);
                        document.documentElement.style.setProperty('--chat-height', `${config.chatHeight}px`);
                        
                        // Apply border radius and box shadow
                         // Use the actual CSS value stored in config
                        document.documentElement.style.setProperty('--chat-border-radius', config.borderRadius);
                        if (config.boxShadow) {
                            const boxShadowValue = window.getBoxShadowValue(config.boxShadow); // Convert preset name to CSS
                            document.documentElement.style.setProperty('--chat-box-shadow', boxShadowValue);
                        }
                        
                        // If we have a generated theme, update buttons to show active border radius and box shadow
                        if (config.theme.startsWith('generated-')) {
                             // Find and highlight the matching border radius button based on the CSS value
                             highlightBorderRadiusButton(config.borderRadius);
                             
                             // Find and highlight the matching box shadow button based on the preset name
                             highlightBoxShadowButton(config.boxShadow);
                            } else {
                              // For standard themes, apply the theme class
                            if (config.theme !== 'default') {
                                // First remove all theme classes
                                document.documentElement.classList.remove(
                                    'light-theme', 
                                    'natural-theme', 
                                    'transparent-theme', 
                                    'pink-theme', 
                                    'cyberpunk-theme'
                                );
                                // Add the selected theme class
                                document.documentElement.classList.add(config.theme);
                            }
                        }
                        
                        // Update form fields and visual settings
                        console.log(`[loadSavedConfig] Config before updating panel:`, JSON.stringify(config)); // LOG 1
                        updateConfigPanelFromConfig(); // This will use the loaded config object

                        // Update opacity sliders and their display values - ** This is now done IN updateConfigPanelFromConfig **
                        /*
                        if (bgOpacityInput) {
                            bgOpacityInput.value = Math.round(config.bgColorOpacity * 100);
                        }
                        if (bgOpacityValue) {
                            bgOpacityValue.textContent = `${Math.round(config.bgColorOpacity * 100)}%`;
                        }
                        if (bgImageOpacityInput) {
                            bgImageOpacityInput.value = Math.round(config.bgImageOpacity * 100);
                        }
                        if (bgImageOpacityValue) {
                            bgImageOpacityValue.textContent = `${Math.round(config.bgImageOpacity * 100)}%`;
                        }
                        */
                        
                        // Make sure the radio button for this mode is selected
                        const modeInput = document.querySelector(`input[name="chat-mode"][value="${config.chatMode}"]`);
                        if (modeInput) {
                            modeInput.checked = true;
                        }
                        
                        // Show or hide popup settings based on mode
                        const popupSettings = document.querySelectorAll('.popup-setting');
                        const windowOnlySettings = document.querySelectorAll('.window-only-setting');
                        
                        if (config.chatMode === 'popup') {
                            popupSettings.forEach(el => el.style.display = 'flex');
                            windowOnlySettings.forEach(el => el.style.display = 'none');
                        } else {
                            popupSettings.forEach(el => el.style.display = 'none');
                            windowOnlySettings.forEach(el => el.style.display = 'flex');
                        }
                        
                        // Initialize chat mode
                        setTimeout(() => {
                            switchChatMode(config.chatMode);
                        }, 100);
                        
                        // If the channel was previously saved, auto-connect
                        if (config.lastChannel && channelInput) {
                            channelInput.value = config.lastChannel;
                            
                            // Auto-connect after a short delay
                            setTimeout(() => {
                                connectToChat();
                            }, 1000);
                        }
                        
                        // DISPATCH configLoaded EVENT - REMOVE THIS LINE LATER
                        // document.dispatchEvent(new CustomEvent('configLoaded', { detail: { config: config } }));

                    } catch (e) {
                        console.error('Error parsing saved config:', e);
                        // In case of error, fall back to default settings
                        applyDefaultSettings();
                    }
                } else {
                    // If no saved config, initialize with defaults
                    applyDefaultSettings();
                }
                
                addSystemMessage('Welcome to Twitch Chat Overlay');
                
                // Only show the connect message if we don't have a saved channel
                if (!config.lastChannel) {
                    addSystemMessage('Enter a channel name to connect');
                } else {
                    addSystemMessage(`Automatically connecting to ${config.lastChannel}...`);
                }
                
            } catch (error) {
                console.error('Error in loadSavedConfig:', error);
                addSystemMessage('Error loading saved settings. Default settings applied.');
                applyDefaultSettings();
            }
        }
        
        // Apply default settings when no saved config or on error
        function applyDefaultSettings() {
            // If no saved config, initialize the theme preview and set default mode
            updateThemePreview(availableThemes[currentThemeIndex]);
            switchChatMode('window');
            
            // Hide popup settings by default
            const popupSettings = document.querySelectorAll('.popup-setting');
            popupSettings.forEach(el => el.style.display = 'none');
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
             updatePreviewFromCurrentSettings();
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
             highlightBoxShadowButton(preset); // Highlight based on preset name
             updatePreviewFromCurrentSettings();
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
        
        function updateConfigPanelFromConfig() {
            // Set basic input values
            bgColorInput.value = config.bgColor || '#121212';
            borderColorInput.value = config.borderColor || '#9147ff';
            textColorInput.value = config.textColor || '#efeff1';
            usernameColorInput.value = config.usernameColor || '#9147ff';
            fontSizeSlider.value = config.fontSize || 14;
            fontSizeValue.textContent = `${config.fontSize || 14}px`;
            chatWidthInput.value = config.chatWidth || 100;
            chatWidthValue.textContent = `${config.chatWidth || 100}%`;
            chatHeightInput.value = config.chatHeight || 600;
            chatHeightValue.textContent = `${config.chatHeight || 600}px`;
            maxMessagesInput.value = config.maxMessages || 50;
            showTimestampsInput.checked = config.showTimestamps !== undefined ? config.showTimestamps : true;
            overrideUsernameColorsInput.checked = config.overrideUsernameColors || false;
            channelInput.value = config.lastChannel || '';

            // Set opacity sliders and values
             if (bgOpacityInput) {
                // Set BOTH slider position and text display
                const bgColorOpacityPercent = Math.round((config.bgColorOpacity !== undefined ? config.bgColorOpacity : 0.85) * 100);
                console.log(`[updateConfigPanel] Setting bgOpacityInput.value to: ${bgColorOpacityPercent}, based on config.bgColorOpacity: ${config.bgColorOpacity}`); // LOG 2
                bgOpacityInput.value = bgColorOpacityPercent;
                if (bgOpacityValue) { 
                    bgOpacityValue.textContent = `${bgColorOpacityPercent}%`;
                }
             }
              if (bgImageOpacityInput) {
                // Set BOTH slider position and text display
                const bgImageOpacityPercent = Math.round((config.bgImageOpacity !== undefined ? config.bgImageOpacity : 0.55) * 100);
                bgImageOpacityInput.value = bgImageOpacityPercent;
                if (bgImageOpacityValue) {
                    bgImageOpacityValue.textContent = `${bgImageOpacityPercent}%`;
                }
             }

            // Set chat mode radio buttons
            const modeInput = document.querySelector(`input[name="chat-mode"][value="${config.chatMode}"]`);
            if (modeInput) {
                modeInput.checked = true;
            }

            // Set popup settings
            if (config.chatMode === 'popup' && config.popup) {
                const directionInput = document.querySelector(`input[name="popup-direction"][value="${config.popup.direction}"]`);
                if (directionInput) {
                    directionInput.checked = true;
                }
                const durationInput = document.getElementById('popup-duration');
                if (durationInput) {
                    durationInput.value = config.popup.duration;
                }
                const durationValue = document.getElementById('popup-duration-value');
                if (durationValue) {
                    durationValue.textContent = `${config.popup.duration}s`;
                }
                const maxMessagesInputPopup = document.getElementById('popup-max-messages');
                if (maxMessagesInputPopup) {
                    maxMessagesInputPopup.value = config.popup.maxMessages;
                }
            }

            // Show/hide popup settings
            const popupSettings = document.querySelectorAll('.popup-setting');
            const windowOnlySettings = document.querySelectorAll('.window-only-setting');
            if (config.chatMode === 'popup') {
                popupSettings.forEach(el => el.style.display = 'flex');
                windowOnlySettings.forEach(el => el.style.display = 'none');
            } else {
                popupSettings.forEach(el => el.style.display = 'none');
                windowOnlySettings.forEach(el => el.style.display = 'flex');
            }

            // Update font display
            const fontIndex = availableFonts.findIndex(font => font.value === config.fontFamily);
            if (fontIndex !== -1) {
                currentFontIndex = fontIndex;
                updateFontDisplay();
            }

            // Update theme display
            const themeIndex = window.availableThemes.findIndex(theme => theme.value === config.theme);
            if (themeIndex !== -1) {
                currentThemeIndex = themeIndex;
                updateThemeDisplay(); // This applies the theme AND updates the preview
            }

            // Highlight active color buttons
            highlightActiveColorButtons();

             // Highlight active border radius/box shadow buttons
             highlightBorderRadiusButton(window.getBorderRadiusValue(config.borderRadius)); // Use CSS value
             highlightBoxShadowButton(config.boxShadow); // Use preset name

            // Update color preview (might be redundant after updateThemeDisplay, but safe)
            updateColorPreviews();
            updatePreviewFromCurrentSettings();
        }

        // ... (rest of event listeners: disconnect, reset, save, enter key) ...
        
        // Initialize the application
        updateFontDisplay();  // Helpers are defined before this now
        updateThemeDisplay(); // Helpers are defined before this now
        loadSavedConfig();    // Helpers are defined before this now
        
        // Disconnect button
        disconnectBtn.addEventListener('click', () => {
             // ... (implementation exists) ...
        });
        
        // Reset to defaults button
        resetConfigBtn.addEventListener('click', () => {
             // ... (implementation exists) ...
        });
        
        // Save button handler
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', function(e) {
                console.log('Save button clicked');
                if (e) e.preventDefault();
                saveConfiguration();
                return false; // Prevent default form submission if applicable
            });
        }
        
        // Add generate theme button click handler
        // This is now handled by theme-generator.js
        // if (generateThemeBtn) { ... } // Removed original listener
        
        // Add prompt input enter key handler
        // This is now handled by theme-generator.js
        // if (themePromptInput) { ... } // Removed original listener

    } // End of initApp
})(); // Ensure closing IIFE is correct
