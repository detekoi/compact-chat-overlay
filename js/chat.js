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
        const prevThemeBtn = document.getElementById('prev-theme');
        const nextThemeBtn = document.getElementById('next-theme');
        const currentThemeDisplay = document.getElementById('current-theme');
        const themePreview = document.getElementById('theme-preview');
        
        // Connection Management Elements (inside config panel)
        const channelForm = document.getElementById('channel-form'); // Now refers to the one in the panel
        // channelInput and connectBtn are already defined and target the elements now in the panel
        
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
        let currentThemeIndex = 0;
        let lastAppliedThemeValue = 'default'; // NEW variable to track applied theme
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
            updatePreviewFromCurrentSettings();
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
            updatePreviewFromCurrentSettings();
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
                        // Form stays in the config panel now, just ensure it's visible if disconnected
                        channelForm.style.display = 'flex'; // Use flex for the form layout
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
                        // Form stays in the config panel now, just ensure it's visible if disconnected
                        channelForm.style.display = 'flex'; // Use flex for the form layout
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
            console.log(`Applying theme: ${themeName}`);
            
            // Ensure window.availableThemes is available
            if (!window.availableThemes || window.availableThemes.length === 0) {
                console.error('Available themes not initialized yet.');
                return;
            }
            
            // Find the theme object by name or value
            const theme = window.availableThemes.find(t => t.value === themeName || t.name === themeName);
            
            if (!theme) {
                console.warn(`Theme "${themeName}" not found. Applying default.`);
                // Fallback to default theme if not found
                const defaultTheme = window.availableThemes.find(t => t.value === 'default');
                if (defaultTheme) {
                    applyTheme(defaultTheme.value); // Recursively call with default theme
                }
                return;
            }
            
            console.log('Theme object found:', theme);
            
            // Update config object with theme settings
            config.theme = theme.value; // Store the theme value
            config.bgColor = theme.bgColor || '#121212'; // Default to dark if missing
            config.borderColor = theme.borderColor || '#9147ff'; // Default to Twitch purple
            config.textColor = theme.textColor || '#efeff1'; // Default to light text
            config.usernameColor = theme.usernameColor || '#9147ff'; // Default to Twitch purple
            config.borderRadius = theme.borderRadius || '8px'; // Default to subtle
            config.boxShadow = theme.boxShadow || 'none'; // Default to none
            
            // Handle opacity separately (comes from theme or slider)
            let themeOpacityValue = 0.85; // Default opacity
            if (typeof theme.bgColorOpacity !== 'undefined') {
                themeOpacityValue = theme.bgColorOpacity; // Use the theme's opacity (0-1 range)
                
                // Update the slider value and display
                const opacityPercent = Math.round(themeOpacityValue * 100);
                if (bgOpacityInput) bgOpacityInput.value = opacityPercent;
                if (bgOpacityValue) bgOpacityValue.textContent = `${opacityPercent}%`;
            }
            
            // Store the opacity value (0-1 range) in the config object
            config.bgColorOpacity = themeOpacityValue;
            
            // NEW: Update font family from theme
            if (theme.fontFamily) {
                config.fontFamily = theme.fontFamily;
                // Find the index of this font in the global list
                const fontIndex = window.availableFonts.findIndex(f => f.value === theme.fontFamily);
                if (fontIndex !== -1) {
                    currentFontIndex = fontIndex;
                } else {
                    // If theme font not in list, find default or set to 0
                    const defaultFontIndex = window.availableFonts.findIndex(f => f.value.includes('Atkinson'));
                    currentFontIndex = defaultFontIndex !== -1 ? defaultFontIndex : 0;
                    config.fontFamily = window.availableFonts[currentFontIndex].value;
                    console.warn(`Theme font "${theme.fontFamily}" not found in availableFonts. Using default.`);
                }
                updateFontDisplay(); // Update font selector UI
            } else {
                // If theme has no font, keep current font setting
                // Ensure config reflects the current selection
                config.fontFamily = window.availableFonts[currentFontIndex].value;
            }
            
            // Apply the theme's visual styles
            if (theme.value === 'transparent-theme') {
                // Force specific settings for transparent theme
                console.log("Applying forced transparent theme styles");
                config.bgColor = '#000000';
                config.bgColorOpacity = 0;
                config.borderColor = 'transparent';

                document.documentElement.style.setProperty('--chat-bg-color', '#000000');
                document.documentElement.style.setProperty('--chat-bg-opacity', 0);
                document.documentElement.style.setProperty('--chat-border-color', 'transparent');
                document.documentElement.style.setProperty('--popup-bg-color', '#000000');
                document.documentElement.style.setProperty('--popup-bg-opacity', 0);
                document.documentElement.style.setProperty('--popup-border-color', 'transparent');

                // Also update the text/username colors from the theme object if defined
                config.textColor = theme.textColor || '#ffffff'; // Default for transparent
                config.usernameColor = theme.usernameColor || '#9147ff';
                document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                document.documentElement.style.setProperty('--username-color', config.usernameColor);
                document.documentElement.style.setProperty('--popup-text-color', config.textColor);
                document.documentElement.style.setProperty('--popup-username-color', config.usernameColor);

                // Update opacity slider value
                if (bgOpacityInput) bgOpacityInput.value = 0;
                if (bgOpacityValue) bgOpacityValue.textContent = '0%';
            } else {
                // Apply styles normally for other themes
                document.documentElement.style.setProperty('--chat-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--chat-border-color', config.borderColor);
                document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                document.documentElement.style.setProperty('--username-color', config.usernameColor);
                document.documentElement.style.setProperty('--chat-bg-opacity', config.bgColorOpacity);
                document.documentElement.style.setProperty('--popup-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--popup-border-color', config.borderColor);
                document.documentElement.style.setProperty('--popup-text-color', config.textColor);
                document.documentElement.style.setProperty('--popup-username-color', config.usernameColor);
                document.documentElement.style.setProperty('--popup-bg-opacity', config.bgColorOpacity);

                // Update opacity slider from config (already done earlier, but safe to repeat)
                const opacityPercent = Math.round(config.bgColorOpacity * 100);
                if (bgOpacityInput) bgOpacityInput.value = opacityPercent;
                if (bgOpacityValue) bgOpacityValue.textContent = `${opacityPercent}%`;
            }

            // Apply font family
            document.documentElement.style.setProperty('--font-family', config.fontFamily);
            
            // Apply border radius (using preset name or value)
            applyBorderRadius(config.borderRadius);
            
            // Apply box shadow (using preset name or value)
            applyBoxShadow(config.boxShadow);
            
            // Update config panel display to reflect theme changes (if open)
            if (configPanel.style.display === 'block') {
                updateConfigPanelFromConfig();
            }
            
            // Update theme carousel display
            updateThemePreview(theme); // Update preview with selected theme
            
            // Store the last successfully applied theme value
            lastAppliedThemeValue = theme.value;
            
            console.log(`Theme "${theme.name}" applied successfully.`);
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
            
            // Update the theme preview to reflect the font change
            updatePreviewFromCurrentSettings();
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
        if (prevThemeBtn && !prevThemeBtn.dataset.listenerAttached) { 
            prevThemeBtn.addEventListener('click', () => {
                currentThemeIndex = (currentThemeIndex - 1 + window.availableThemes.length) % window.availableThemes.length;
                updateThemeDisplay();
            });
            prevThemeBtn.dataset.listenerAttached = 'true';
        }
        
        if (nextThemeBtn && !nextThemeBtn.dataset.listenerAttached) { 
            nextThemeBtn.addEventListener('click', () => {
                currentThemeIndex = (currentThemeIndex + 1) % window.availableThemes.length;
                updateThemeDisplay();
            });
            nextThemeBtn.dataset.listenerAttached = 'true';
        }
        
        // Initialize theme display
        function updateThemeDisplay() {
            const theme = window.availableThemes[currentThemeIndex];
            currentThemeDisplay.textContent = theme.name;
            lastAppliedThemeValue = theme.value; // UPDATE the tracked value

                // Apply the current theme using existing method
                applyTheme(theme.value); // applyTheme now handles all cases
                
                // Update theme preview
                updateThemePreview(theme);
        }
        window.updateThemeDisplay = updateThemeDisplay; // EXPOSE globally
        
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
            const fontFamily = window.availableFonts[currentFontIndex].value;
            const fontSize = fontSizeSlider.value;
            document.documentElement.style.setProperty('--font-family', fontFamily);
            themePreview.style.fontFamily = fontFamily;
            themePreview.style.fontSize = `${fontSize}px`;
        }
        
        // Update the preview whenever colors or settings change
        function updatePreviewFromCurrentSettings() {
            updateThemePreview(window.availableThemes[currentThemeIndex], true);
        }
        
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
                
                // Helper to get color (keep existing)
                const getColor = (inputElement, buttonSelector, defaultColor) => {
                    if (!inputElement) return defaultColor;

                    // Find the active button first
                    const activeButton = document.querySelector(`${buttonSelector}.active`);

                    if (activeButton) {
                        const activeColor = activeButton.dataset.color;
                        // Special handling for background transparent button
                        if (buttonSelector.includes('[data-target="bg"]') && activeColor === 'transparent') {
                            return '#000000'; // Return the actual hex color value for transparent bg
                        }
                        // Special handling for border transparent button
                        if (buttonSelector.includes('[data-target="border"]') && activeColor === 'transparent') {
                            return 'transparent'; // Keep 'transparent' string for border CSS
                        }
                        // Return the button's color if not a special case
                        return activeColor;
                    }

                    // If no button is active, fallback to input value (for custom colors) or default
                    return inputElement.value || defaultColor;
                };
                 
                 // Helper to get opacity (keep existing)
                 const getOpacity = (element, defaultValue) => {
                     if (!element) return defaultValue;
                     return parseFloat(element.value) / 100.0; // Convert percentage 0-100 to 0-1
                 };

                // --- Read current state from UI controls ---
                const currentFontValue = window.availableFonts[currentFontIndex]?.value || config.fontFamily;
                // const currentThemeValue = window.availableThemes[window.currentThemeIndex]?.value || config.theme; // Use VALUE, not ID - REMOVED
                const currentThemeValue = lastAppliedThemeValue; // USE tracked value instead of index
                // REVERTED: Read from active preset buttons to allow manual override
                const activeBorderRadiusBtn = borderRadiusPresets?.querySelector('.preset-btn.active');
                const borderRadiusValue = activeBorderRadiusBtn ? activeBorderRadiusBtn.dataset.value : config.borderRadius;
                const activeBoxShadowBtn = boxShadowPresets?.querySelector('.preset-btn.active');
                const boxShadowValue = activeBoxShadowBtn ? activeBoxShadowBtn.dataset.value : config.boxShadow;
                const bgImageOpacityValue = getOpacity(bgImageOpacityInput, 0.55);
                // const bgColorValue = getColor(bgColorInput, '.color-buttons [data-target="bg"]', '#121212'); // Will be handled below
                // const bgColorOpacityValue = getOpacity(bgOpacityInput, 0.85); // Will be handled below

                // Find the full theme object matching the current theme value
                const currentFullTheme = window.availableThemes?.find(t => t.value === currentThemeValue) || {};
                // Ensure we have the correct theme object if the value is transparent
                if (currentThemeValue === 'transparent-theme' && !currentFullTheme.value) {
                    const transparentThemeObj = window.availableThemes?.find(t => t.value === 'transparent-theme');
                    if (transparentThemeObj) Object.assign(currentFullTheme, transparentThemeObj);
                }

                // --- Create new config object from UI values AND theme ---
                const newConfig = {
                    theme: currentThemeValue, // Reads from lastAppliedThemeValue
                    // Prioritize theme font, else keep existing config font
                    fontFamily: currentFullTheme.fontFamily || config.fontFamily, 
                    fontSize: getValue(fontSizeSlider, 14, true), // Reads from slider

                    // PRIORITIZE THEME COLORS if theme is not default, otherwise read from UI/inputs via helpers
                    bgColor: (currentThemeValue !== 'default' && currentFullTheme.bgColor !== undefined) 
                        ? currentFullTheme.bgColor 
                        : getColor(bgColorInput, '.color-buttons [data-target="bg"]', '#121212'),
                    bgColorOpacity: (currentThemeValue !== 'default' && currentFullTheme.bgColorOpacity !== undefined) 
                        ? currentFullTheme.bgColorOpacity 
                        : getOpacity(bgOpacityInput, 0.85),
                    // Border color needs special 'transparent' handling from helper OR theme
                    borderColor: (currentThemeValue !== 'default' && currentFullTheme.borderColor !== undefined)
                        ? currentFullTheme.borderColor // Theme provides value (could be 'transparent')
                        : getColor(borderColorInput, '.color-buttons [data-target="border"]', '#9147ff'), // Helper handles 'transparent' button case
                    textColor: (currentThemeValue !== 'default' && currentFullTheme.textColor !== undefined) 
                        ? currentFullTheme.textColor 
                        : getColor(textColorInput, '.color-buttons [data-target="text"]', '#efeff1'),
                    usernameColor: (currentThemeValue !== 'default' && currentFullTheme.usernameColor !== undefined) 
                        ? currentFullTheme.usernameColor 
                        : getColor(usernameColorInput, '.color-buttons [data-target="username"]', '#9147ff'),
                    
                    // Explicit override for transparent theme to ensure correct values are saved
                    ...(currentThemeValue === 'transparent-theme' ? {
                        bgColor: '#000000',
                        bgColorOpacity: 0,
                        borderColor: 'transparent'
                        // textColor/usernameColor will correctly come from the theme object via the logic above
                    } : {}),

                    overrideUsernameColors: getValue(overrideUsernameColorsInput, false, false, true),
                    // Use theme image if defined, otherwise null
                    bgImage: currentFullTheme.backgroundImage || null, 
                    // Image opacity always read from slider
                    bgImageOpacity: bgImageOpacityValue, 
                    
                    // Appearance settings read from active buttons (allows user override of theme defaults)
                    borderRadius: borderRadiusValue, 
                    boxShadow: boxShadowValue, 
                    
                    // Rest of the settings from UI controls
                    chatMode: document.querySelector('input[name="chat-mode"]:checked')?.value || 'window',
                    chatWidth: getValue(chatWidthInput, 100, true),
                    chatHeight: getValue(chatHeightInput, 600, true),
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

                const scene = getUrlParameter('scene') || 'default';
                localStorage.setItem(`chatConfig_${scene}`, JSON.stringify(config));
                console.log(`Configuration saved for scene '${scene}':`, config);
                
                closeConfigPanel(false); // Close without reverting
                addSystemMessage("Settings saved successfully."); // Optional feedback
                
            } catch (error) {
                console.error("Error saving configuration:", error);
                 addSystemMessage("Error saving settings. Check console for details.");
            }
        }
        
        // Load saved config on page load
        function loadSavedConfig() {
            console.log('Loading saved config');
            try {
                // NOTE: theme-carousel.js should have already run and loaded generatedThemes into window.availableThemes
                
                // Get scene ID from URL parameter, default to 'default' if not specified
                const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
                
                // Use scene-specific storage key - CORRECTED KEY
                const savedConfig = localStorage.getItem(`chatConfig_${sceneId}`); // Use the same key format as saving
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
                        // Correctly define the variable holding the theme's background image URL
                        const themeBgImage = currentFullTheme?.backgroundImage || null;
                        
                        // Create new config object by merging defaults with saved settings
                        config = {
                            // Display mode
                            chatMode: parsedConfig.chatMode || 'window',
                            
                            // Window mode settings
                            bgColor: parsedConfig.bgColor || '#121212', // Load hex color
                            bgColorOpacity: parsedConfig.bgColorOpacity !== undefined ? parsedConfig.bgColorOpacity : 0.85, // Load opacity
                            // Correctly load bgImage from parsed config, fallback to theme default
                            bgImage: parsedConfig.bgImage !== undefined ? parsedConfig.bgImage : themeBgImage,
                            bgImageOpacity: parsedConfig.bgImageOpacity !== undefined ? parsedConfig.bgImageOpacity : 0.55, // Load image opacity
                            borderColor: parsedConfig.borderColor === 'transparent' ? 'transparent' : (parsedConfig.borderColor || '#9147ff'),
                            textColor: parsedConfig.textColor || '#efeff1',
                            usernameColor: parsedConfig.usernameColor || '#9147ff',
                            fontSize: parsedConfig.fontSize || 14,
                            fontFamily: parsedConfig.fontFamily || "'Atkinson Hyperlegible', sans-serif",
                            chatWidth: parsedConfig.chatWidth || 100,
                            chatHeight: parsedConfig.chatHeight || 600,
                            maxMessages: parsedConfig.maxMessages || 50,
                            showTimestamps: parsedConfig.showTimestamps !== undefined ? parsedConfig.showTimestamps : true,
                            overrideUsernameColors: parsedConfig.overrideUsernameColors || false,
                             // Use the actual CSS value for border radius, converting if necessary
                             borderRadius: window.getBorderRadiusValue(parsedConfig.borderRadius || '8px'),
                             boxShadow: parsedConfig.boxShadow || 'soft', // Store preset name
                            theme: savedThemeValue,
                            lastChannel: parsedConfig.lastChannel || '',
                            
                            // Popup mode settings
                            popup: {
                                direction: parsedConfig.popup?.direction || 'from-bottom',
                                duration: parsedConfig.popup?.duration || 5,
                                maxMessages: parsedConfig.popup?.maxMessages || 3
                            }
                        };
                        
                        // --- Apply the loaded configuration visually using the central function ---
                        console.log("[loadSavedConfig] Applying loaded configuration visually...");
                        applyConfiguration(config); // <<< CHANGE: Call applyConfiguration here
                        console.log("[loadSavedConfig] Visual application complete.");


                        // Hide config panel (should already be hidden, but safe)
                        closeConfigPanel();

                        // Update the panel controls to match loaded state (important for initial load)
                        updateConfigPanelFromConfig();

                        // Apply initial chat mode (switchChatMode is called within applyConfiguration now)
                        // switchChatMode(config.chatMode); // <<< CHANGE: Removed, called by applyConfiguration
                        
                        // If the channel was previously saved, auto-connect
                        if (config.lastChannel && channelInput) {
                            channelInput.value = config.lastChannel;
                            channel = config.lastChannel;
                            // Auto-connect after a short delay
                            setTimeout(() => {
                                connectToChat();
                            }, 1000);
                        } else {
                             // If no channel saved, ensure connect form is visible IN THE PANEL
                             // and disconnect button is hidden
                              if (channelForm) channelForm.style.display = 'flex';
                              if (disconnectBtn) disconnectBtn.style.display = 'none';
                        }

                    } catch (e) {
                        console.error('Error parsing or applying saved config:', e);
                        // In case of error, fall back to default settings
                        applyDefaultSettings(); // Apply default styles
                        updateConfigPanelFromConfig(); // Update panel to show defaults
                    }
                } else {
                    // If no saved config, initialize with defaults
                    applyDefaultSettings(); // Apply default styles
                    updateConfigPanelFromConfig(); // Update panel to show defaults
                }
                
                // Add initial system messages only after config is loaded/defaults applied
                addSystemMessage('Welcome to Twitch Chat Overlay');
                if (!config.lastChannel) {
                    addSystemMessage('Enter a channel name to connect');
                }
                
            } catch (error) {
                console.error('Error in loadSavedConfig outer try:', error);
                addSystemMessage('Error loading saved settings. Default settings applied.');
                applyDefaultSettings(); // Apply default styles
                updateConfigPanelFromConfig(); // Update panel to show defaults
            }
        }
        
        // Apply default settings when no saved config or on error
        function applyDefaultSettings() {
            console.log("Applying default settings...");
            // Reset config object to defaults (adjust defaults as needed)
            config = {
                chatMode: 'window',
                bgColor: '#121212',
                bgColorOpacity: 0.85,
                bgImage: null,
                bgImageOpacity: 0.55,
                borderColor: '#9147ff',
                textColor: '#efeff1',
                usernameColor: '#9147ff',
                fontSize: 14,
                fontFamily: "'Atkinson Hyperlegible', sans-serif", // <<< CHANGE DEFAULT
                chatWidth: 100,
                chatHeight: 600,
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
        
        /**
         * Update all config panel controls to match the current config object.
         * Called after reverting or applying a theme.
         */
        function updateConfigPanelFromConfig() {
            console.log("Updating config panel from current config:", config);
            
            // Ensure window.availableThemes and window.availableFonts are ready
            if (!window.availableThemes || !window.availableFonts) {
                console.warn("Themes or fonts not ready, delaying config panel update.");
                // Optionally, retry after a short delay or wait for an event
                // setTimeout(updateConfigPanelFromConfig, 100); 
                return;
            }

            // Update Display Mode radios
            const chatModeRadios = document.querySelectorAll('input[name="chat-mode"]');
            chatModeRadios.forEach(radio => {
                radio.checked = (radio.value === config.chatMode);
            });
            switchChatMode(config.chatMode, false); // Update visibility without saving
            
            // Update Popup settings (only if in popup mode)
            const popupDirectionRadios = document.querySelectorAll('input[name="popup-direction"]');
            popupDirectionRadios.forEach(radio => {
                radio.checked = (radio.value === config.popup.direction);
            });
            if (document.getElementById('popup-duration')) {
                document.getElementById('popup-duration').value = config.popup.duration;
                document.getElementById('popup-duration-value').textContent = `${config.popup.duration}s`;
            }
            if (document.getElementById('popup-max-messages')) {
                document.getElementById('popup-max-messages').value = config.popup.maxMessages;
            }
            
            // Update Colors
            if (bgColorInput && config.bgColor) {
                // Extract color part from rgba string if necessary
                let hexColor = config.bgColor;
                if (config.bgColor.startsWith('rgba')) {
                    try {
                        // Basic conversion: assumes format rgba(r, g, b, a)
                        const parts = config.bgColor.match(/\d+/g);
                        if (parts && parts.length >= 3) {
                            hexColor = `#${parseInt(parts[0]).toString(16).padStart(2, '0')}${parseInt(parts[1]).toString(16).padStart(2, '0')}${parseInt(parts[2]).toString(16).padStart(2, '0')}`;
                        }
                    } catch (e) {
                        console.warn("Could not parse rgba for hex input:", config.bgColor);
                        hexColor = '#121212'; // Fallback
                    }
                }
                // bgColorInput.value = hexColor;
            }
            
            if (bgOpacityInput && bgOpacityValue) {
                const currentOpacity = window.getCurrentBgOpacity ? window.getCurrentBgOpacity() : 85; // Get from module
                bgOpacityInput.value = currentOpacity;
                bgOpacityValue.textContent = `${currentOpacity}%`;
            }
            
            // borderColorInput.value = config.borderColor || '#9147ff';
            // textColorInput.value = config.textColor || '#efeff1';
            // usernameColorInput.value = config.usernameColor || '#9147ff';
            highlightActiveColorButtons(); // Highlight buttons based on current config
            
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
            chatHeightValue.textContent = `${config.chatHeight}px`;
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
            updateThemePreview(window.availableThemes[currentThemeIndex]); // Update preview
            
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
            
            console.log("Config panel updated.");
        }

        // ... (rest of event listeners: disconnect, reset, save, enter key) ...
        
        // Initialize the application
        updateFontDisplay();  // Helpers are defined before this now
        updateThemeDisplay(); // Helpers are defined before this now
        loadSavedConfig();    // Helpers are defined before this now
        
        // Ensure channel form is visible and disconnect button is hidden initially
        if (channelForm) channelForm.style.display = 'flex';
        if (disconnectBtn) disconnectBtn.style.display = 'none';
        
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

            // --- Apply Core CSS Variables ---
            document.documentElement.style.setProperty('--chat-bg-color', cfg.bgColor || '#1e1e1e');
            document.documentElement.style.setProperty('--chat-bg-opacity', cfg.bgColorOpacity !== undefined ? cfg.bgColorOpacity : 0.85);
            document.documentElement.style.setProperty('--chat-border-color', cfg.borderColor || '#444444');
            document.documentElement.style.setProperty('--chat-text-color', cfg.textColor || '#efeff1');
            document.documentElement.style.setProperty('--username-color', cfg.usernameColor || '#9147ff');
            document.documentElement.style.setProperty('--timestamp-color', cfg.timestampColor || '#adadb8'); // Add if you have this var
            document.documentElement.style.setProperty('--font-size', `${cfg.fontSize || 14}px`);
            document.documentElement.style.setProperty('--font-family', cfg.fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif");
            document.documentElement.style.setProperty('--chat-width', `${cfg.chatWidth || 100}%`);
            document.documentElement.style.setProperty('--chat-height', `${cfg.chatHeight || 600}px`);
            document.documentElement.style.setProperty('--chat-border-radius', window.getBorderRadiusValue(cfg.borderRadius || '8px'));
            document.documentElement.style.setProperty('--chat-box-shadow', window.getBoxShadowValue(cfg.boxShadow || 'none'));
            // document.documentElement.style.setProperty('--override-username-colors', cfg.overrideUsernameColors ? 1 : 0); // Better handled by class

             // Background Image
             const bgImageURL = cfg.bgImage && cfg.bgImage !== 'none' ? `url("${cfg.bgImage}")` : 'none';
             document.documentElement.style.setProperty('--chat-bg-image', bgImageURL);
             document.documentElement.style.setProperty('--chat-bg-image-opacity', cfg.bgImageOpacity !== undefined ? cfg.bgImageOpacity : 0.55);

             // Popup styles (mirror chat styles)
             document.documentElement.style.setProperty('--popup-bg-color', cfg.bgColor || '#1e1e1e');
             document.documentElement.style.setProperty('--popup-bg-opacity', cfg.bgColorOpacity !== undefined ? cfg.bgColorOpacity : 0.85);
             document.documentElement.style.setProperty('--popup-border-color', cfg.borderColor || '#444444'); // Ensure this is set
             document.documentElement.style.setProperty('--popup-text-color', cfg.textColor || '#efeff1');
             document.documentElement.style.setProperty('--popup-username-color', cfg.usernameColor || '#9147ff');
             document.documentElement.style.setProperty('--popup-bg-image', bgImageURL);
             document.documentElement.style.setProperty('--popup-bg-image-opacity', cfg.bgImageOpacity !== undefined ? cfg.bgImageOpacity : 0.55);

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
            switchChatMode(cfg.chatMode || 'window'); // <<< Moved mode switch here
            console.log("[applyConfiguration] Mode switch complete.");

            // Ensure visual previews reflect the applied config
            updateColorPreviews(); // Update color button highlights
            updatePreviewFromCurrentSettings(); // Update the main theme preview box

            console.log("Configuration applied.");
        }

    } // End of initApp
})(); // Ensure closing IIFE is correct
