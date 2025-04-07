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
        // Initial Connection Prompt Elements
        const initialConnectionPrompt = document.getElementById('initial-connection-prompt');
        const initialChannelInput = document.getElementById('initial-channel-input');
        const initialConnectBtn = document.getElementById('initial-connect-btn');
        const openSettingsFromPromptBtn = document.getElementById('open-settings-from-prompt');

        // --- HELPER FUNCTIONS (Defined Early) ---

        /**
         * Converts a hex color string and an opacity value (0-1) to an rgba string.
         */
        function hexToRgba(hex, opacity) {
            if (typeof hex === 'string' && hex.trim().toLowerCase().startsWith('rgba')) {
                console.warn(`[hexToRgba] Received rgba value "${hex}" instead of hex. Returning directly.`);
                return hex; // Input is already rgba
            }

            if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
                console.warn(`Invalid hex format provided to hexToRgba: ${hex}`);
                return `rgba(0, 0, 0, ${opacity})`; // Default black if hex invalid
            }

            let r = 0, g = 0, b = 0;
            if (hex.length === 4) { // 3 digit hex
                r = parseInt(hex[1] + hex[1], 16);
                g = parseInt(hex[2] + hex[2], 16);
                b = parseInt(hex[3] + hex[3], 16);
            } else if (hex.length === 7) { // 6 digit hex
                r = parseInt(hex[1] + hex[2], 16);
                g = parseInt(hex[3] + hex[4], 16);
                b = parseInt(hex[5] + hex[6], 16);
            } else {
                 console.warn(`Invalid hex format provided to hexToRgba: ${hex}`);
                 return `rgba(0, 0, 0, ${opacity})`;
             }

            opacity = Math.max(0, Math.min(1, opacity)); // Ensure opacity is within bounds
            return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`;
        }

        // Default configuration
        let config = {
            chatMode: 'window',
            bgColor: 'rgba(18, 18, 18, 0.8)', // Includes default opacity
            borderColor: '#9147ff',
            textColor: '#efeff1',
            usernameColor: '#9147ff',
            fontSize: 14,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            chatWidth: 95,
            chatHeight: 95,
            maxMessages: 50,
            showTimestamps: true,
            overrideUsernameColors: false,
            borderRadius: '8px',
            boxShadow: 'none',
            popup: {
                direction: 'from-bottom',
                duration: 5, // seconds
                maxMessages: 3
            },
            theme: 'default',
            lastChannel: ''
            // bgColorOpacity and bgImageOpacity are derived/set later
        };

        // DOM elements
        const chatContainer = document.getElementById('chat-container');
        const chatWrapper = document.getElementById('chat-wrapper');
        const popupContainer = document.getElementById('popup-container');
        const chatMessages = document.getElementById('chat-messages');
        const scrollArea = document.getElementById('chat-scroll-area');
        let statusIndicator;
        if (!document.getElementById('status-indicator')) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'status-indicator';
            statusIndicator.className = 'disconnected';
            statusIndicator.title = 'Disconnected';
            document.getElementById('chat-container')?.appendChild(statusIndicator); // Added safety check
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
        const bgOpacityValue = document.getElementById('bg-opacity-value');
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
        const borderRadiusPresets = document.getElementById('border-radius-presets');
        const boxShadowPresets = document.getElementById('box-shadow-presets');
        const prevFontBtn = document.getElementById('prev-font');
        const nextFontBtn = document.getElementById('next-font');
        const currentFontDisplay = document.getElementById('current-font');
        const themePreview = document.getElementById('theme-preview');
        const channelForm = document.getElementById('channel-form');

        // Connection and chat state
        let socket = null;
        let channel = '';
        let isConnecting = false; // Flag to prevent multiple connection attempts

        // Reconnection state
        let isExplicitDisconnect = false;
        let reconnectAttempts = 0;
        let reconnectTimer = null;
        const MAX_RECONNECT_ATTEMPTS = 5;
        const INITIAL_RECONNECT_DELAY = 1000;
        const MAX_RECONNECT_DELAY = 30000;

        // Store config state when panel opens
        let initialConfigBeforeEdit = null;

        // Font selection
        let currentFontIndex = 0;
        // availableFonts is expected to be defined globally in theme-carousel.js

        // Theme selection
        let lastAppliedThemeValue = 'default'; // Track theme for saving
        // availableThemes is expected to be managed globally by theme-carousel.js

        // --- HELPER FUNCTIONS ---

        /**
         * Fix any CSS variables that contain preset names instead of actual CSS values.
         */
        function fixCssVariables() {
            const borderRadius = document.documentElement.style.getPropertyValue('--chat-border-radius').trim();
            const boxShadow = document.documentElement.style.getPropertyValue('--chat-box-shadow').trim();

            if (borderRadius) {
                const borderRadiusMap = {
                    'None': '0px', 'none': '0px',
                    'Subtle': '8px', 'subtle': '8px',
                    'Rounded': '16px', 'rounded': '16px',
                    'Pill': '24px', 'pill': '24px'
                };
                if (borderRadiusMap[borderRadius]) {
                    const cssValue = borderRadiusMap[borderRadius];
                    if (borderRadius !== cssValue) {
                        document.documentElement.style.setProperty('--chat-border-radius', cssValue);
                    }
                }
            }

            if (boxShadow) {
                const boxShadowMap = {
                    'None': 'none', 'none': 'none',
                    'Soft': 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px', 'soft': 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
                    'Simple 3D': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px', 'simple 3d': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px', 'simple3d': 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px',
                    'Intense 3D': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px', 'intense 3d': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px', 'intense3d': 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px',
                    'Sharp': '8px 8px 0px 0px rgba(0, 0, 0, 0.9)', 'sharp': '8px 8px 0px 0px rgba(0, 0, 0, 0.9)'
                };
                if (boxShadowMap[boxShadow]) {
                    const cssValue = boxShadowMap[boxShadow];
                    if (boxShadow !== cssValue) {
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
                'Pill': '24px', 'pill': '24px',
                'Sharp': '0px', 'sharp': '0px'
            };
            if (borderRadiusMap[value]) return borderRadiusMap[value];
            if (typeof value === 'string' && value.endsWith('px')) return value;
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
            if (boxShadowMap[presetLower]) return boxShadowMap[presetLower];
            if (preset === 'none' || preset.includes('rgba') || preset.includes('px')) return preset;
            return 'none';
        }

        /**
         * Highlight the active border radius button based on CSS value
         */
        function highlightBorderRadiusButton(cssValue) {
             if (borderRadiusPresets) {
                const buttons = borderRadiusPresets.querySelectorAll('.preset-btn');
                buttons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === cssValue);
                });
            }
        }

        /**
         * Highlight the active box shadow button based on preset name
         */
        function highlightBoxShadowButton(presetName) {
             if (boxShadowPresets) {
                const normalizedPreset = typeof presetName === 'string'
                    ? presetName.toLowerCase().replace(/\s+/g, '')
                    : 'none';
                const buttons = boxShadowPresets.querySelectorAll('.preset-btn');
                buttons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === normalizedPreset);
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

        // Add a MutationObserver to fix any incorrect CSS variable values immediately
        const cssVarObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'style') {
                    fixCssVariables();
                }
            });
        });
        cssVarObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style']
        });

        // Show status indicators and messages
        function updateStatus(connected) {
            if (!statusIndicator) return; // Safety check
            statusIndicator.className = connected ? 'connected' : 'disconnected';
            statusIndicator.title = connected ? `Connected to ${channel}'s chat` : 'Disconnected';
        }

        /**
         * Check if the user is scrolled near the bottom of an element.
         */
        function isUserScrolledToBottom(element) {
            if (!element) return false;
            const tolerance = 5; // Pixels
            return element.scrollHeight - element.clientHeight <= element.scrollTop + tolerance;
        }

        // Add a system message to the chat
        function addSystemMessage(message) {
            if (!chatMessages) {
                console.error("Chat messages container not found for system message.");
                return;
            }
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
            chatMessages.appendChild(messageElement);

            if (config.chatMode === 'window') {
                limitMessages();
            }
            if (shouldScroll && scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }

        // Add a user message to the chat
        function addChatMessage(data) {
            try {
                if (!data.username || !data.message) return;

                let targetContainer;
                let currentScrollArea;

                if (config.chatMode === 'popup') {
                    targetContainer = document.getElementById('popup-messages');
                    if (!targetContainer) { console.error('Popup messages container not found'); return; }
                } else { // window mode
                    targetContainer = chatMessages;
                    currentScrollArea = scrollArea;
                    if (!targetContainer) { console.error('Chat messages container not found'); return; }
                    if (!currentScrollArea) { console.error('Chat scroll area not found'); }
                }
                if (!targetContainer) { console.error('Target container could not be determined or found.'); return; }

                const shouldScroll = config.chatMode === 'window' && isUserScrolledToBottom(currentScrollArea);
                const messageElement = document.createElement('div');

                if (config.chatMode === 'popup') {
                    messageElement.className = 'popup-message';
                    messageElement.classList.add(config.popup?.direction || 'from-bottom');
                } else {
                    messageElement.className = 'chat-message';
                }

                let timestamp = '';
                if (config.showTimestamps) {
                    const now = new Date();
                    timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} `;
                }

                let userColor = data.color || generateColorFromName(data.username);
                if (config.overrideUsernameColors) {
                    userColor = config.usernameColor;
                }

                let message = data.message;

                // Parse emotes
                if (data.emotes && typeof data.emotes === 'object') {
                    const emotePositions = [];
                    try {
                        for (const emoteId in data.emotes) {
                            if (!data.emotes.hasOwnProperty(emoteId)) continue;
                            const emotePositionArray = data.emotes[emoteId];
                            if (!Array.isArray(emotePositionArray)) continue;

                            for (const position of emotePositionArray) {
                                if (!position?.includes('-')) continue;
                                const [startStr, endStr] = position.split('-');
                                const start = parseInt(startStr, 10);
                                const end = parseInt(endStr, 10);
                                if (isNaN(start) || isNaN(end) || start < 0 || end < 0 || start > end || end >= data.message.length) continue;
                                emotePositions.push({ start, end, id: emoteId });
                            }
                        }
                    } catch (err) { console.error('Error processing emotes:', err); }

                    emotePositions.sort((a, b) => b.start - a.start); // Process from end

                    for (const emote of emotePositions) {
                        try {
                            const emoteCode = message.substring(emote.start, emote.end + 1);
                            const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`;
                            const emoteHtml = `<img class="emote" src="${emoteUrl}" alt="${emoteCode.replace(/"/g, '&quot;')}" title="${emoteCode.replace(/"/g, '&quot;')}" />`;
                            message = message.substring(0, emote.start) + emoteHtml + message.substring(emote.end + 1);
                        } catch (err) { console.error('Error replacing emote:', err); }
                    }
                }

                // Process URLs only if message does not contain emotes
                if (!message.includes('<img class="emote"')) {
                    message = message.replace(/(\bhttps?:\/\/[^\s<]+)/g, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
                }

                messageElement.innerHTML = `
                    <span class="timestamp">${timestamp}</span>
                    <span class="username" style="color: ${userColor}">${data.username}:</span>
                    <span class="message-content">${message}</span>`;
                targetContainer.appendChild(messageElement);

                if (config.chatMode === 'popup') {
                    void messageElement.offsetWidth; // Force reflow for transition
                    messageElement.classList.add('visible');

                    // Limit popup messages
                    const popupMsgs = Array.from(targetContainer.querySelectorAll('.popup-message'));
                    const maxMessages = config.popup?.maxMessages;
                    if (popupMsgs.length > maxMessages && maxMessages > 0) {
                        try {
                            const removeCount = popupMsgs.length - maxMessages;
                            for (let i = 0; i < removeCount; i++) {
                                popupMsgs[i]?.parentNode?.removeChild(popupMsgs[i]);
                            }
                        } catch (err) { console.error('Error removing excess popup messages:', err); }
                    }

                    // Auto-remove timer
                    const duration = (config.popup?.duration || 5) * 1000;
                    if (duration > 0 && duration < 60000) { // Validate duration
                        setTimeout(() => {
                            messageElement.classList.remove('visible'); // Start slide-out
                            requestAnimationFrame(() => { // Ensure transition starts
                                void messageElement.offsetWidth; // Force reflow
                                messageElement.classList.add('removing');
                                setTimeout(() => { // Remove after transition
                                    messageElement.parentNode?.removeChild(messageElement);
                                }, 300); // Match CSS transition duration
                            });
                        }, duration);
                    }
                } else { // Window mode
                    limitMessages();
                    if (shouldScroll && currentScrollArea) {
                        currentScrollArea.scrollTop = currentScrollArea.scrollHeight;
                    }
                }
            } catch (error) {
                console.error('Error adding chat message:', error);
            }
        }

        // Connect to Twitch chat
        function connectToChat() {
            if (isConnecting) return;
            isConnecting = true;

            clearTimeout(reconnectTimer);
            reconnectTimer = null;

            if (socket && socket.readyState === WebSocket.OPEN) {
                console.warn("[connectToChat] Socket already open. Closing before reconnecting.");
                isExplicitDisconnect = true;
                socket.close();
                socket = null;
                isExplicitDisconnect = false;
            }
            // Ensure any existing socket is closed before creating a new one
            if (socket) socket.close();

            let channelToConnect = channelInput?.value.trim().toLowerCase();
            if (!channelToConnect && initialConnectionPrompt?.style.display !== 'none' && initialChannelInput?.value) {
                 channelToConnect = initialChannelInput.value.trim().toLowerCase();
                 if (channelInput) channelInput.value = channelToConnect; // Sync back
            }

            channel = channelToConnect;
            if (!channel) {
                if (initialConnectionPrompt?.style.display !== 'none') {
                     console.error('Please enter a channel name in the prompt.');
                     initialChannelInput?.focus();
                } else {
                     addSystemMessage('Please enter a valid channel name in the settings panel');
                }
                isConnecting = false; // Reset flag if no channel
                return;
            }

            addSystemMessage(`Connecting to ${channel}'s chat...`);
            socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            window.socket = socket; // Debugging access

            socket.onopen = function() {
                // Use timeout to ensure socket is ready before sending commands
                setTimeout(() => {
                    if (!socket || socket.readyState !== WebSocket.OPEN) {
                        console.warn("[socket.onopen timeout] Socket closed before sending commands.");
                        isConnecting = false;
                        return;
                    }
                    socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
                    socket.send(`PASS SCHMOOPIIE`); // Use anonymous PASS
                    socket.send(`NICK justinfan${Math.floor(Math.random() * 999999)}`);
                    socket.send(`JOIN #${channel}`);

                    updateConnectionStateUI(true);
                    config.lastChannel = channel;
                    saveLastChannelOnly(channel);

                    if (channelForm) channelForm.style.display = 'none';
                    if (disconnectBtn) {
                        disconnectBtn.textContent = `Disconnect from ${channel}`;
                        disconnectBtn.style.display = 'block';
                    }

                    addSystemMessage(reconnectAttempts > 0 ? `Reconnected to ${channel}'s chat.` : `Connected to ${channel}'s chat`);
                    reconnectAttempts = 0; // Reset on successful connection
                    isConnecting = false;
                }, 50); // Small delay can sometimes help ensure readiness
            };

            socket.onclose = function(event) {
                console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
                isConnecting = false;
                const lastConnectedChannel = channel; // Store before clearing
                socket = null;
                channel = '';

                // Reset relevant UI elements in the settings panel
                if (disconnectBtn) {
                    disconnectBtn.style.display = 'none';
                    disconnectBtn.textContent = 'Disconnect';
                }
                if (channelForm) channelForm.style.display = 'flex';

                if (!isExplicitDisconnect) {
                    addSystemMessage('Connection lost. Attempting to reconnect...');
                    scheduleReconnect(lastConnectedChannel); // Attempt reconnect
                } else {
                    addSystemMessage('Disconnected from chat.');
                    updateConnectionStateUI(false); // Show initial prompt
                    isExplicitDisconnect = false; // Reset flag
                    // Sync channel input state
                    if (initialChannelInput) initialChannelInput.value = channelInput?.value || config.lastChannel || '';
                }
            };

            socket.onerror = function(error) {
                console.error('WebSocket Error:', error);
                addSystemMessage('Error connecting to chat. Check console for details.');
                isConnecting = false;
                // Let socket.onclose handle potential reconnection logic
            };

            socket.onmessage = function(event) {
                const messages = event.data.split('\r\n');
                messages.forEach(message => {
                    if (!message) return;

                    if (message.includes('PING')) { // Handle PING/PONG keepalive
                        socket?.send('PONG :tmi.twitch.tv');
                        return;
                    }

                    if (message.includes('PRIVMSG')) { // Handle chat messages
                        let tags = {};
                        if (message.startsWith('@')) { // Parse IRCv3 tags
                            try {
                                const tagPart = message.slice(1, message.indexOf(' '));
                                tagPart.split(';').forEach(tag => {
                                    if (tag?.includes('=')) {
                                        const [key, value] = tag.split('=');
                                        if (key) tags[key] = value || '';
                                    }
                                });
                            } catch (err) { console.error('Error parsing IRC tags:', err); }
                        }

                        // Extract username (prefer display-name tag)
                        let username = tags['display-name'] || message.match(/:(.*?)!/)?.[1] || 'Anonymous';

                        // Extract message content
                        let messageContent = '';
                        try {
                            const msgParts = message.split('PRIVMSG #');
                            if (msgParts.length > 1) {
                                const colonIndex = msgParts[1].indexOf(' :');
                                if (colonIndex !== -1) messageContent = msgParts[1].substring(colonIndex + 2);
                            }
                        } catch (err) { console.error('Error extracting message content:', err); }

                        // Parse emotes from tags
                        let emotes = null;
                        if (tags.emotes) {
                            try {
                                emotes = {};
                                tags.emotes.split('/').forEach(group => {
                                    if (!group?.includes(':')) return;
                                    const [emoteId, positions] = group.split(':');
                                    if (emoteId && positions) emotes[emoteId] = positions.split(',').filter(pos => pos?.includes('-'));
                                });
                            } catch (err) { console.error('Error parsing emotes:', err, tags.emotes); }
                        }

                        addChatMessage({ username, message: messageContent, color: tags.color || null, emotes });
                    }
                });
            };
        }

        // Limit the number of messages displayed in window mode
        function limitMessages() {
            if (!chatMessages) return;
            const max = config.maxMessages || 50;
            const isAtBottom = Math.abs((chatMessages.scrollHeight - chatMessages.scrollTop) - chatMessages.clientHeight) < 5;
            while (chatMessages.children.length > max) {
                chatMessages.removeChild(chatMessages.firstChild);
            }
            if (isAtBottom) { // Maintain scroll position if user was at the bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        // Generate a visually distinct color from a username string
        function generateColorFromName(name) {
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
                hash = hash & hash; // Convert to 32bit integer
            }
            const h = Math.abs(hash) % 360;         // Hue (0-359)
            const s = 70 + (Math.abs(hash) % 31); // Saturation (70-100)
            const l = 45 + (Math.abs(hash) % 26); // Lightness (45-70) - Adjusted for better readability
            return `hsl(${h}, ${s}%, ${l}%)`;
        }

        // Connect on Enter key in channel input
        if (channelInput) {
            channelInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') connectToChat();
            });
        }

        // Background color + opacity handling
        function updateBgColor() {
            if (!bgColorInput || !bgOpacityInput) return; // Safety check
            const hexColor = bgColorInput.value;
            const opacity = parseInt(bgOpacityInput.value) / 100;
            const rgbaColorForCSS = hexToRgba(hexColor, opacity);
            document.documentElement.style.setProperty('--chat-bg-color', rgbaColorForCSS);
            document.documentElement.style.setProperty('--popup-bg-color', rgbaColorForCSS); // Sync popup
            if (bgOpacityValue) bgOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
            updateThemePreview();
        }
        bgColorInput?.addEventListener('input', updateBgColor);
        bgOpacityInput?.addEventListener('input', updateBgColor);

        // Background image opacity handling
        const bgImageOpacityInput = document.getElementById('bg-image-opacity');
        const bgImageOpacityValue = document.getElementById('bg-image-opacity-value');
        function updateBgImageOpacity() {
            if (!bgImageOpacityInput) return;
            const opacity = parseInt(bgImageOpacityInput.value) / 100;
            document.documentElement.style.setProperty('--chat-bg-image-opacity', opacity);
            document.documentElement.style.setProperty('--popup-bg-image-opacity', opacity); // Sync popup
            if (bgImageOpacityValue) bgImageOpacityValue.textContent = `${bgImageOpacityInput.value}%`;
            updateThemePreview();
        }
        if (bgImageOpacityInput) bgImageOpacityInput.addEventListener('input', updateBgImageOpacity);

        // Color preset button click handlers
        document.querySelectorAll('.color-btn').forEach(button => {
            const color = button.getAttribute('data-color');
            if (color) button.style.backgroundColor = color; // Set button background

            // Add border for light/transparent buttons
            if (color === 'transparent' || ['#ffffff', '#ffdeec', '#f5f2e6'].includes(color)) {
                button.style.border = '1px solid #888';
            }
            // Set contrasting text color for button label
            if (['#000000', '#121212', '#1a1a1a', '#0c0c28', '#4e3629'].includes(color)) {
                button.style.color = 'white';
            } else {
                button.style.color = 'black';
            }

            button.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                const target = e.target.getAttribute('data-target');
                if (!target || !color) return;

                // Update active state for siblings
                document.querySelectorAll(`.color-btn[data-target="${target}"]`).forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                // Apply color based on target type
                switch (target) {
                    case 'bg':
                        if (color === 'transparent') {
                            if(bgColorInput) bgColorInput.value = '#000000'; // Use black base for transparent
                            if (bgOpacityInput) bgOpacityInput.value = 0; // Set opacity to 0
                        } else {
                            if(bgColorInput) bgColorInput.value = color;
                            // Optionally reset opacity to default? For now, let it keep current value.
                        }
                        updateBgColor(); // Update visual background
                        break;
                    case 'border':
                        if (color === 'transparent') {
                            document.documentElement.style.setProperty('--chat-border-color', 'transparent');
                            document.documentElement.style.setProperty('--popup-border-color', 'transparent');
                        } else {
                            if (borderColorInput) borderColorInput.value = color;
                            document.documentElement.style.setProperty('--chat-border-color', color);
                            document.documentElement.style.setProperty('--popup-border-color', color);
                        }
                        break;
                    case 'text':
                        if (textColorInput) textColorInput.value = color;
                        document.documentElement.style.setProperty('--chat-text-color', color);
                        document.documentElement.style.setProperty('--popup-text-color', color);
                        break;
                    case 'username':
                        if (usernameColorInput) usernameColorInput.value = color;
                        document.documentElement.style.setProperty('--username-color', color);
                        document.documentElement.style.setProperty('--popup-username-color', color);
                        break;
                }
                updateColorPreviews(); // Update highlights and preview
            });
        });

        // Update colors directly from input fields
        borderColorInput?.addEventListener('input', () => {
            const value = borderColorInput.value;
            const finalColor = value === 'transparent' ? 'transparent' : value; // Allow 'transparent' keyword
            document.documentElement.style.setProperty('--chat-border-color', finalColor);
            document.documentElement.style.setProperty('--popup-border-color', finalColor);
            updateColorPreviews();
            updateThemePreview();
        });
        textColorInput?.addEventListener('input', () => {
            document.documentElement.style.setProperty('--chat-text-color', textColorInput.value);
            document.documentElement.style.setProperty('--popup-text-color', textColorInput.value);
            updateColorPreviews();
            updateThemePreview();
        });
        usernameColorInput?.addEventListener('input', () => {
            document.documentElement.style.setProperty('--username-color', usernameColorInput.value);
            document.documentElement.style.setProperty('--popup-username-color', usernameColorInput.value);
            updateColorPreviews();
            updateThemePreview();
        });

        // Font size slider
        fontSizeSlider?.addEventListener('input', () => {
            const value = fontSizeSlider.value;
            if (fontSizeValue) fontSizeValue.textContent = `${value}px`;
            document.documentElement.style.setProperty('--font-size', `${value}px`);
            config.fontSize = parseInt(value, 10);
            updateThemePreview(); // Update preview immediately
        });

        // Chat width slider
        chatWidthInput?.addEventListener('input', () => {
            const value = chatWidthInput.value;
            if (chatWidthValue) chatWidthValue.textContent = `${value}%`;
            document.documentElement.style.setProperty('--chat-width', `${value}%`);
        });

        // Chat height slider
        chatHeightInput?.addEventListener('input', () => {
            const value = chatHeightInput.value;
            if (chatHeightValue) chatHeightValue.textContent = `${value}%`;
            document.documentElement.style.setProperty('--chat-height', `${value}%`);
        });

        // Open settings panel function
        function openSettingsPanel() {
            if (!configPanel) return;
            initialConfigBeforeEdit = null; // Clear previous state
            try {
                 initialConfigBeforeEdit = JSON.parse(JSON.stringify(config)); // Store current state
            } catch (error) {
                 console.error("Error storing config state for revert:", error);
                 addSystemMessage("Error: Could not store settings state for revert.");
            }

            // Update connection controls visibility inside panel
            const isConnected = socket && socket.readyState === WebSocket.OPEN;
            if (channelForm) channelForm.style.display = isConnected ? 'none' : 'flex';
            if (disconnectBtn) {
                disconnectBtn.style.display = isConnected ? 'block' : 'none';
                if (isConnected) disconnectBtn.textContent = `Disconnect from ${channel}`;
            }

            updateConfigPanelFromConfig(); // Populate controls
            configPanel.classList.add('visible');
            configPanel.style.display = 'block'; // Ensure it's visible
        }

        // Settings button listeners (ensure only attached once)
        if (settingsBtn && !settingsBtn.dataset.listenerAttached) {
            settingsBtn.addEventListener('click', (e) => { e?.preventDefault(); openSettingsPanel(); });
            settingsBtn.dataset.listenerAttached = 'true';
        }
        const popupSettingsBtn = document.getElementById('popup-settings-btn');
        if (popupSettingsBtn && !popupSettingsBtn.dataset.listenerAttached) {
            popupSettingsBtn.addEventListener('click', (e) => { e?.preventDefault(); e?.stopPropagation(); openSettingsPanel(); });
            popupSettingsBtn.dataset.listenerAttached = 'true';
        }

        // Save Button
        if (saveConfigBtn && !saveConfigBtn.dataset.listenerAttached) {
            saveConfigBtn.addEventListener('click', (e) => { e?.preventDefault(); saveConfiguration(); });
            saveConfigBtn.dataset.listenerAttached = 'true';
        }

        // Cancel Button
        if (cancelConfigBtn && !cancelConfigBtn.dataset.listenerAttached) {
            cancelConfigBtn.addEventListener('click', () => closeConfigPanel(true)); // Close and REVERT
            cancelConfigBtn.dataset.listenerAttached = 'true';
        }

        // Reset Button
        if (resetConfigBtn && !resetConfigBtn.dataset.listenerAttached) {
             resetConfigBtn.addEventListener('click', () => {
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
                try {
                    config = JSON.parse(JSON.stringify(initialConfigBeforeEdit)); // Restore object
                    applyConfiguration(config); // Apply restored visuals
                    updateConfigPanelFromConfig(); // Update controls to match
                } catch (error) {
                     console.error("Error during revert:", error);
                     addSystemMessage("Error: Could not revert settings.");
                }
            }
            initialConfigBeforeEdit = null; // Clear stored state
            if (configPanel) {
                configPanel.classList.remove('visible');
                configPanel.style.display = 'none';
            }
        }

        // Update theme preview and color button highlights
        function updateColorPreviews() {
            highlightActiveColorButtons();
            updateThemePreview();
        }

        // Helper function to highlight the active color buttons based on current values
        function highlightActiveColorButtons() {
            // Background color
            const bgColorValue = bgColorInput?.value || '#121212';
            const bgOpacityValue = bgOpacityInput ? parseInt(bgOpacityInput.value) : 85;
            document.querySelectorAll('.color-btn[data-target="bg"]').forEach(btn => {
                const btnColor = btn.getAttribute('data-color');
                let isActive = (btnColor === 'transparent')
                    ? (bgColorValue === '#000000' && bgOpacityValue === 0)
                    : (btnColor === bgColorValue && bgOpacityValue > 0);
                btn.classList.toggle('active', isActive);
            });

            // Border color
            const currentBorderCSS = document.documentElement.style.getPropertyValue('--chat-border-color').trim();
            const borderColorInputValue = borderColorInput?.value || '#9147ff';
            document.querySelectorAll('.color-btn[data-target="border"]').forEach(btn => {
                const btnColor = btn.getAttribute('data-color');
                let isActive = (btnColor === 'transparent')
                    ? (currentBorderCSS === 'transparent')
                    : (currentBorderCSS !== 'transparent' && btnColor === borderColorInputValue);
                btn.classList.toggle('active', isActive);
            });

            // Text color
            const textColorValue = textColorInput?.value || '#efeff1';
            document.querySelectorAll('.color-btn[data-target="text"]')
                    .forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-color') === textColorValue));

            // Username color
            const usernameColorValue = usernameColorInput?.value || '#9147ff';
            document.querySelectorAll('.color-btn[data-target="username"]')
                    .forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-color') === usernameColorValue));
        }

        // Toggle between window and popup modes
        function switchChatMode(mode, applyVisualsOnly = false) { // Flag determines if system messages/dummy content is added
            try {
                config.chatMode = mode;

                if (!popupContainer || !chatContainer || !chatWrapper) {
                    console.error('Required chat containers not found in DOM');
                    return;
                }

                const popupMessages = document.getElementById('popup-messages');
                if (popupMessages) popupMessages.innerHTML = ''; // Always clear popup messages

                const isPopup = (mode === 'popup');
                popupContainer.style.display = isPopup ? 'block' : 'none';
                chatWrapper.style.display = isPopup ? 'none' : 'block';
                document.body.classList.toggle('popup-mode', isPopup);
                document.body.classList.toggle('window-mode', !isPopup);

                // Update chat window content only if not just applying visuals
                if (!applyVisualsOnly && chatMessages) {
                    chatMessages.innerHTML = ''; // Clear window chat
                    addSystemMessage(isPopup ? `Switched to popup mode.` : 'Switched to window mode.');
                    addChatMessage({ username: 'System', message: 'Chat mode switched.', color: config.usernameColor });
                }

                // Update popup message container position based on config
                if (isPopup && popupMessages && config.popup) {
                    const direction = config.popup.direction || 'from-bottom';
                    const position = { top: 'auto', bottom: '10px' }; // Default bottom
                    if (['from-top', 'from-left', 'from-right'].includes(direction)) {
                        position.top = '10px'; position.bottom = 'auto';
                    }
                    popupMessages.removeAttribute('style'); // Clear first
                    popupMessages.style.top = position.top;
                    popupMessages.style.bottom = position.bottom;
                }

                updateModeSpecificSettingsVisibility(mode);

            } catch (error) {
                console.error('Error switching chat mode:', error);
                addSystemMessage('Error switching chat mode.');
            }
        }

        // Helper function to show/hide mode-specific settings in the panel
        function updateModeSpecificSettingsVisibility(mode) {
            const isPopup = mode === 'popup';
            document.querySelectorAll('.popup-setting').forEach(el => el.style.display = isPopup ? 'flex' : 'none');
            document.querySelectorAll('.window-only-setting').forEach(el => el.style.display = isPopup ? 'none' : 'flex');
        }

        // Apply a selected theme
        function applyTheme(themeName) {
            if (!window.availableThemes?.length) {
                console.error('Available themes not initialized yet.');
                return;
            }
            let theme = window.availableThemes.find(t => t.value === themeName || t.name === themeName);
            if (!theme) {
                console.warn(`Theme "${themeName}" not found. Applying default.`);
                theme = window.availableThemes.find(t => t.value === 'default') || window.availableThemes[0]; // Fallback to default or first
                if (!theme) return; // Cannot proceed if no themes exist
            }

            // Parse theme background color and opacity, providing defaults
            let themeBgHex = '#121212';
            let themeBgOpacity = 0.85;
            if (theme.bgColor && typeof theme.bgColor === 'string') {
                const bgColorLower = theme.bgColor.trim().toLowerCase();
                if (bgColorLower.startsWith('rgba')) {
                    try { // Extract RGBA values
                        const parts = bgColorLower.substring(5, bgColorLower.indexOf(')')).split(',');
                        if (parts.length === 4) {
                            const r = parseInt(parts[0].trim(), 10);
                            const g = parseInt(parts[1].trim(), 10);
                            const b = parseInt(parts[2].trim(), 10);
                            const a = parseFloat(parts[3].trim());
                            themeBgHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
                            themeBgOpacity = !isNaN(a) ? Math.max(0, Math.min(1, a)) : 0.85;
                        } else { console.warn(`[applyTheme] Could not parse rgba: ${theme.bgColor}.`); }
                    } catch (e) { console.error(`[applyTheme] Error parsing rgba string "${theme.bgColor}":`, e); }
                } else if (bgColorLower.startsWith('#')) { // Handle hex
                    themeBgHex = theme.bgColor;
                    themeBgOpacity = theme.bgColorOpacity ?? 0.85; // Use theme opacity or default
                } else { console.warn(`[applyTheme] Unknown bgColor format: ${theme.bgColor}.`); }
            } else { themeBgOpacity = theme.bgColorOpacity ?? 0.85; } // Use theme opacity if only that is provided

            // Update config object with theme base settings
            config.theme = theme.value;
            config.bgColor = themeBgHex;
            config.bgColorOpacity = themeBgOpacity;
            config.borderColor = theme.borderColor === 'transparent' ? 'transparent' : (theme.borderColor || '#9147ff');
            config.textColor = theme.textColor || '#efeff1';
            config.usernameColor = theme.usernameColor || '#9147ff';
            config.borderRadius = theme.borderRadius || theme.borderRadiusValue || '8px';
            config.boxShadow = theme.boxShadow || theme.boxShadowValue || 'none';
            config.bgImage = theme.backgroundImage || null;
            config.bgImageOpacity = theme.bgImageOpacity ?? 0.55;

            // Update font family from theme
            if (theme.fontFamily) {
                let fontIndex = window.availableFonts?.findIndex(f => {
                   const themeFont = typeof theme.fontFamily === 'string' ? theme.fontFamily.trim() : '';
                   return (f.name?.trim().toLowerCase() === themeFont.toLowerCase()) || (f.value?.trim() === themeFont);
                }) ?? -1;

                if (fontIndex === -1) { // Fallback if font not found
                    console.warn(`[applyTheme] Theme font "${theme.fontFamily}" not found. Using default.`);
                    fontIndex = window.availableFonts?.findIndex(f => f.value?.includes('Atkinson')) ?? 0;
                }
                currentFontIndex = fontIndex;
                config.fontFamily = window.availableFonts[currentFontIndex]?.value || "'Atkinson Hyperlegible', sans-serif";
                updateFontDisplay(); // Update UI immediately
            } else { // If theme doesn't specify font, keep current or default
                config.fontFamily = window.availableFonts?.[currentFontIndex]?.value || "'Atkinson Hyperlegible', sans-serif";
            }

            // Apply the merged configuration visually
            applyConfiguration(config);

            // Update UI controls in the panel to reflect the applied theme
            if (bgColorInput) bgColorInput.value = config.bgColor; // Set hex value
            if (bgOpacityInput && bgOpacityValue) {
                 const opacityPercent = Math.round(config.bgColorOpacity * 100);
                 bgOpacityInput.value = opacityPercent;
                 bgOpacityValue.textContent = `${opacityPercent}%`;
            }
            if (borderColorInput) borderColorInput.value = config.borderColor === 'transparent' ? '#000000' : config.borderColor; // Input needs a color
            if (textColorInput) textColorInput.value = config.textColor;
            if (usernameColorInput) usernameColorInput.value = config.usernameColor;
            if (bgImageOpacityInput && bgImageOpacityValue) {
                 const imageOpacityPercent = Math.round(config.bgImageOpacity * 100);
                 bgImageOpacityInput.value = imageOpacityPercent;
                 bgImageOpacityValue.textContent = `${imageOpacityPercent}%`;
            }

            // Update preset button highlights
            highlightBorderRadiusButton(getBorderRadiusValue(config.borderRadius));
            highlightBoxShadowButton(config.boxShadow); // Use preset name for highlight lookup
            highlightActiveColorButtons(); // Update color button highlights

            updateThemePreview(); // Refresh preview
            lastAppliedThemeValue = theme.value; // Track last applied theme
        }
        window.applyTheme = applyTheme; // Expose globally

        // Update font display in settings panel
        function updateFontDisplay() {
            if (!window.availableFonts?.length) {
                console.error('Available fonts not initialized yet.');
                if(currentFontDisplay) currentFontDisplay.textContent = 'Error';
                return;
            }
            // Ensure index is valid
            if (currentFontIndex < 0 || currentFontIndex >= window.availableFonts.length) {
                console.warn(`Invalid currentFontIndex (${currentFontIndex}), resetting to 0.`);
                currentFontIndex = 0;
            }
            const currentFont = window.availableFonts[currentFontIndex];
            if (!currentFont) { // Safety check if index somehow still invalid
                console.error(`Could not find font at index ${currentFontIndex}`);
                if (currentFontDisplay) currentFontDisplay.textContent = 'Error';
                return;
            }

            if(currentFontDisplay) currentFontDisplay.textContent = currentFont.name;
            config.fontFamily = currentFont.value; // Update config
            document.documentElement.style.setProperty('--font-family', config.fontFamily); // Apply visually
            updateThemePreview(); // Refresh preview
        }

        // Font selection carousel listeners
        if (prevFontBtn && !prevFontBtn.dataset.listenerAttached) {
            prevFontBtn.addEventListener('click', () => {
                currentFontIndex = (currentFontIndex - 1 + (window.availableFonts?.length || 1)) % (window.availableFonts?.length || 1);
                updateFontDisplay();
            });
            prevFontBtn.dataset.listenerAttached = 'true';
        }
        if (nextFontBtn && !nextFontBtn.dataset.listenerAttached) {
            nextFontBtn.addEventListener('click', () => {
                currentFontIndex = (currentFontIndex + 1) % (window.availableFonts?.length || 1);
                updateFontDisplay();
            });
            nextFontBtn.dataset.listenerAttached = 'true';
        }

        /**
         * Update the theme preview display based on current controls/config.
         */
        function updateThemePreview() {
            if (!themePreview) return; // Element must exist

            // Gather current values from controls or config defaults
            const showTimestamps = showTimestampsInput?.checked ?? config?.showTimestamps ?? true;
            const bgColor = bgColorInput?.value || '#1e1e1e';
            const bgColorOpacity = (bgOpacityInput ? parseInt(bgOpacityInput.value) : (config?.bgColorOpacity ?? 0.85) * 100) / 100.0; // Prioritize slider, then config, then default
            const borderColor = borderColorInput?.value || '#444444';
            const textColor = textColorInput?.value || '#efeff1';
            const usernameColor = usernameColorInput?.value || '#9147ff';
            const timestampColor = config?.timestampColor || '#adadb8'; // Assuming this might be configurable later
            const fontFamily = window.availableFonts?.[currentFontIndex]?.value || config?.fontFamily || "'Atkinson Hyperlegible', sans-serif";
            const activeBorderRadiusBtn = borderRadiusPresets?.querySelector('.preset-btn.active');
            const borderRadiusValue = activeBorderRadiusBtn?.dataset.value ?? config?.borderRadius ?? '8px';
            const borderRadius = getBorderRadiusValue(borderRadiusValue);
            const activeBoxShadowBtn = boxShadowPresets?.querySelector('.preset-btn.active');
            const boxShadowValue = activeBoxShadowBtn?.dataset.value ?? config?.boxShadow ?? 'none';
            const boxShadow = getBoxShadowValue(boxShadowValue);
            const bgImage = config?.bgImage || 'none';
            const bgImageOpacity = (bgImageOpacityInput ? parseInt(bgImageOpacityInput.value) : (config?.bgImageOpacity ?? 0.55) * 100) / 100.0;

            // Determine final border color (handling 'transparent')
            const borderTransparentButton = document.querySelector('.color-btn[data-target="border"][data-color="transparent"]');
            const finalBorderColor = (borderTransparentButton?.classList.contains('active')) ? 'transparent' : borderColor;

            // Determine final background color (handling 'transparent' button + opacity)
            let finalBgColor;
            const bgTransparentButton = document.querySelector('.color-btn[data-target="bg"][data-color="transparent"]');
            if (bgTransparentButton?.classList.contains('active')) {
                 finalBgColor = 'transparent'; // If button active, force transparent regardless of opacity slider
            } else {
                 try { finalBgColor = hexToRgba(bgColor, bgColorOpacity); }
                 catch (e) {
                     console.error(`Error converting hex ${bgColor} for preview:`, e);
                     finalBgColor = `rgba(30, 30, 30, ${bgColorOpacity.toFixed(2)})`; // Fallback
                 }
            }

            // Set preview-specific CSS variables on the preview element
            const previewStyle = themePreview.style;
            previewStyle.setProperty('--preview-bg-color', finalBgColor);
            previewStyle.setProperty('--preview-border-color', finalBorderColor);
            previewStyle.setProperty('--preview-text-color', textColor);
            previewStyle.setProperty('--preview-username-color', usernameColor);
            previewStyle.setProperty('--preview-timestamp-color', timestampColor);
            previewStyle.setProperty('--preview-font-family', fontFamily);
            previewStyle.fontFamily = fontFamily; // Apply directly too
            previewStyle.setProperty('--preview-border-radius', borderRadius);
            previewStyle.setProperty('--preview-box-shadow', boxShadow);
            previewStyle.setProperty('--preview-bg-image', bgImage === 'none' ? 'none' : `url("${bgImage}")`);
            previewStyle.setProperty('--preview-bg-image-opacity', bgImageOpacity.toFixed(2));

            // Update the preview content HTML
            const ts1 = showTimestamps ? '<span class="timestamp">12:34 </span>' : '';
            const ts2 = showTimestamps ? '<span class="timestamp">12:35 </span>' : '';
            themePreview.innerHTML = `
                <div class="preview-chat-message">
                    ${ts1}<span class="username" style="color: var(--preview-username-color);">Username:</span> <span>Example chat message</span>
                </div>
                <div class="preview-chat-message">
                    ${ts2}<span class="username" style="color: var(--preview-username-color);">AnotherUser:</span> <span>This is how your chat will look</span>
                </div>
            `.trim();
        }
        window.updateThemePreview = updateThemePreview; // Expose globally

        // Event listeners for theme changes (from carousel or generator)
        document.addEventListener('theme-changed', () => updateThemePreview());
        document.addEventListener('theme-carousel-ready', () => updateThemePreview());
        updateColorPreviews(); // Initial preview update on load

        // Listener for username color override toggle
        overrideUsernameColorsInput?.addEventListener('change', () => {
            const isChecked = overrideUsernameColorsInput.checked;
            config.overrideUsernameColors = isChecked;
            document.documentElement.classList.toggle('override-username-colors', isChecked);
            updateThemePreview(); // Refresh preview
        });

        // Listener for chat mode radio buttons
        document.querySelectorAll('input[name="chat-mode"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    switchChatMode(e.target.value, false); // Apply fully (with messages)
                    updateModeSpecificSettingsVisibility(e.target.value);
                }
            });
        });

        // Listener for popup animation direction
        document.querySelectorAll('input[name="popup-direction"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if(config.popup) config.popup.direction = e.target.value;
                    // Immediately update popup position if in popup mode
                    if (config.chatMode === 'popup') {
                        const popupMessages = document.getElementById('popup-messages');
                        if (popupMessages && config.popup) {
                            const direction = config.popup.direction || 'from-bottom';
                            const position = { top: 'auto', bottom: '10px' }; // Default bottom
                            if (['from-top', 'from-left', 'from-right'].includes(direction)) {
                                position.top = '10px'; position.bottom = 'auto';
                            }
                            popupMessages.removeAttribute('style'); // Clear first
                            popupMessages.style.top = position.top;
                            popupMessages.style.bottom = position.bottom;
                        }
                    }
                }
            });
        });

        // Listener for popup duration slider
        document.getElementById('popup-duration')?.addEventListener('input', (e) => {
            if(config.popup) config.popup.duration = parseInt(e.target.value);
            const valueDisplay = document.getElementById('popup-duration-value');
            if(valueDisplay && config.popup) valueDisplay.textContent = `${config.popup.duration}s`;
        });

        // Listener for popup max messages input
        document.getElementById('popup-max-messages')?.addEventListener('change', (e) => {
            if(config.popup) config.popup.maxMessages = parseInt(e.target.value);
        });

        /**
         * Save current settings from the panel to the config object and local storage.
         */
        function saveConfiguration() {
            try {
                // Helper to get form values safely
                const getValue = (element, defaultValue, isNumber = false, isBool = false, isOpacity = false) => {
                    if (!element) return defaultValue;
                    if (isBool) return element.checked;
                    let value = element.value;
                    if (isNumber) return parseInt(value, 10) || defaultValue;
                    if (isOpacity) return !isNaN(parseFloat(value)) ? parseFloat(value) / 100.0 : defaultValue;
                    return value || defaultValue;
                };
                // Helper to get color, considering active buttons and inputs
                const getColor = (inputElement, buttonSelector, defaultColor) => {
                    const targetType = buttonSelector.includes('bg') ? 'bg' : buttonSelector.includes('border') ? 'border' : buttonSelector.includes('text') ? 'text' : 'username';
                    const activeButton = document.querySelector(`${buttonSelector}.active`);
                    const activeColor = activeButton?.dataset.color;

                    if (targetType === 'bg') {
                        const hexFromInput = inputElement?.value;
                        const isTransparentActive = document.querySelector('.color-btn[data-target="bg"][data-color="transparent"]')?.classList.contains('active');
                        const currentOpacity = getOpacity(bgOpacityInput, -1); // Get current opacity
                        // If transparent button is active AND opacity slider is 0, save as black hex
                        if (isTransparentActive && currentOpacity === 0) return '#000000';
                        // Otherwise, trust the hex value in the input field
                        if (hexFromInput) return hexFromInput;
                        console.warn("[getColor/bg] Background color input was empty, falling back.");
                        return defaultColor; // Fallback
                    } else { // Border, Text, Username
                        if (activeButton) {
                            // Handle transparent border button specifically
                            if (targetType === 'border' && activeColor === 'transparent') return 'transparent';
                            return activeColor; // Use active button color
                        }
                        // Fallback to input value or default if no button is active
                        return inputElement?.value || defaultColor;
                    }
                };
                // Helper to get opacity (0-1 range) from slider
                const getOpacity = (element, defaultValue) => {
                    if (!element) return defaultValue;
                    const parsedValue = parseFloat(element.value);
                    return !isNaN(parsedValue) ? parsedValue / 100.0 : defaultValue;
                };

                // Read current state from UI controls
                const currentFontValue = window.availableFonts?.[currentFontIndex]?.value || config.fontFamily;
                const currentThemeValue = lastAppliedThemeValue; // Use tracked value
                const bgImageOpacityValue = getOpacity(bgImageOpacityInput, config.bgImageOpacity ?? 0.55);
                const currentBgColorHex = getColor(bgColorInput, '.color-buttons [data-target="bg"]', config.bgColor || '#121212');
                const currentBgOpacity = getOpacity(bgOpacityInput, config.bgColorOpacity ?? 0.85);
                const currentFullTheme = window.availableThemes?.find(t => t.value === currentThemeValue) || {}; // Find matching theme object

                // Create new config object from UI values, preserving lastChannel
                const newConfig = {
                    theme: currentThemeValue,
                    fontFamily: currentFontValue,
                    fontSize: getValue(fontSizeSlider, config.fontSize || 14, true),
                    bgColor: currentBgColorHex,
                    bgColorOpacity: currentBgOpacity,
                    borderColor: getColor(borderColorInput, '.color-buttons [data-target="border"]', config.borderColor || '#444444'),
                    textColor: getColor(textColorInput, '.color-buttons [data-target="text"]', config.textColor || '#efeff1'),
                    usernameColor: getColor(usernameColorInput, '.color-buttons [data-target="username"]', config.usernameColor || '#9147ff'),
                    overrideUsernameColors: getValue(overrideUsernameColorsInput, config.overrideUsernameColors || false, false, true),
                    bgImage: currentFullTheme.backgroundImage || config.bgImage || null, // Prioritize theme's image if set
                    bgImageOpacity: bgImageOpacityValue,
                    borderRadius: borderRadiusPresets?.querySelector('.preset-btn.active')?.dataset.value || config.borderRadius,
                    boxShadow: boxShadowPresets?.querySelector('.preset-btn.active')?.dataset.value || config.boxShadow,
                    chatMode: document.querySelector('input[name="chat-mode"]:checked')?.value || config.chatMode || 'window',
                    chatWidth: getValue(chatWidthInput, config.chatWidth || 95, true),
                    chatHeight: getValue(chatHeightInput, config.chatHeight || 95, true),
                    maxMessages: getValue(maxMessagesInput, config.maxMessages || 50, true),
                    showTimestamps: getValue(showTimestampsInput, config.showTimestamps ?? true, false, true),
                    popup: {
                        direction: document.querySelector('input[name="popup-direction"]:checked')?.value || config.popup?.direction || 'from-bottom',
                        duration: getValue(document.getElementById('popup-duration'), config.popup?.duration || 5, true),
                        maxMessages: getValue(document.getElementById('popup-max-messages'), config.popup?.maxMessages || 3, true)
                    },
                    lastChannel: config.lastChannel // Preserve last connected channel
                };

                // Apply & Save
                config = newConfig; // Update global config state
                applyConfiguration(config); // Apply the new config visually

                const scene = getUrlParameter('scene') || 'default';
                localStorage.setItem(`chatConfig-${scene}`, JSON.stringify(config)); // Save to localStorage
                closeConfigPanel(false); // Close panel without reverting

            } catch (error) {
                console.error("Error saving configuration:", error);
                 addSystemMessage("Error saving settings. Check console.");
            }
        }

        // Apply default settings
        function applyDefaultSettings() {
            // Reset config object to initial defaults
            config = {
                chatMode: 'window', bgColor: '#121212', bgColorOpacity: 0.85,
                bgImage: null, bgImageOpacity: 0.55, borderColor: '#9147ff',
                textColor: '#efeff1', usernameColor: '#9147ff', fontSize: 14,
                fontFamily: "'Atkinson Hyperlegible', sans-serif", // Updated default font
                chatWidth: 95, chatHeight: 95, maxMessages: 50, showTimestamps: true,
                overrideUsernameColors: false, borderRadius: '8px', boxShadow: 'soft', // Use preset name
                theme: 'default', lastChannel: '',
                popup: { direction: 'from-bottom', duration: 5, maxMessages: 3 }
            };
             // applyConfiguration(config); // This will be called by the reset button handler after this function
        }

        // Apply border radius visually and update config
        function applyBorderRadius(value) {
             const cssValue = window.getBorderRadiusValue(value); // Get CSS value ('8px')
             if (!cssValue) return;
             document.documentElement.style.setProperty('--chat-border-radius', cssValue);
             config.borderRadius = value; // Store the original value/preset name in config
             highlightBorderRadiusButton(cssValue); // Highlight based on CSS value
             updateThemePreview();
        }

        // Apply box shadow visually and update config
        function applyBoxShadow(preset) {
             const cssValue = window.getBoxShadowValue(preset); // Get CSS value ('rgba(...)')
             if (!cssValue) return;
             document.documentElement.style.setProperty('--chat-box-shadow', cssValue);
             config.boxShadow = preset; // Store the preset name in config
             highlightBoxShadowButton(preset); // Highlight based on preset name
             updateThemePreview();
        }

        // Add listeners to preset buttons (if they exist)
        borderRadiusPresets?.querySelectorAll('.preset-btn')
            .forEach(btn => btn.addEventListener('click', () => applyBorderRadius(btn.dataset.value)));
        boxShadowPresets?.querySelectorAll('.preset-btn')
            .forEach(btn => btn.addEventListener('click', () => applyBoxShadow(btn.dataset.value)));

        /**
         * Update all config panel controls to match the current config object.
         */
        function updateConfigPanelFromConfig() {
            if (!configPanel) return; // Don't run if panel doesn't exist

            // Background Color & Opacity
            const hexColor = config.bgColor || '#121212';
            const opacityPercent = Math.round((config.bgColorOpacity ?? 0.85) * 100);
            if (bgColorInput) bgColorInput.value = hexColor;
            if (bgOpacityInput && bgOpacityValue) {
                bgOpacityInput.value = opacityPercent;
                bgOpacityValue.textContent = `${opacityPercent}%`;
            }

            // Other Colors
            if(borderColorInput) borderColorInput.value = config.borderColor === 'transparent' ? '#000000' : config.borderColor; // Input needs a value
            if(textColorInput) textColorInput.value = config.textColor || '#efeff1';
            if(usernameColorInput) usernameColorInput.value = config.usernameColor || '#9147ff';
            highlightActiveColorButtons(); // Update button highlights

            // Appearance Presets
            highlightBorderRadiusButton(getBorderRadiusValue(config.borderRadius));
            highlightBoxShadowButton(config.boxShadow); // Highlight based on stored preset name

            // Settings Toggles/Inputs
            if(overrideUsernameColorsInput) overrideUsernameColorsInput.checked = config.overrideUsernameColors;
            if(fontSizeSlider) fontSizeSlider.value = config.fontSize;
            if(fontSizeValue) fontSizeValue.textContent = `${config.fontSize}px`;
            if(chatWidthInput) chatWidthInput.value = config.chatWidth;
            if(chatWidthValue) chatWidthValue.textContent = `${config.chatWidth}%`;
            if(chatHeightInput) chatHeightInput.value = config.chatHeight;
            if(chatHeightValue) chatHeightValue.textContent = `${config.chatHeight}%`;
            if(maxMessagesInput) maxMessagesInput.value = config.maxMessages;
            if(showTimestampsInput) showTimestampsInput.checked = config.showTimestamps;

            // Font Selection
            const fontIndex = window.availableFonts?.findIndex(f => f.value === config.fontFamily) ?? -1;
            currentFontIndex = (fontIndex !== -1) ? fontIndex : (window.availableFonts?.findIndex(f => f.value?.includes('Atkinson')) ?? 0);
            if (fontIndex === -1 && config.fontFamily !== window.availableFonts?.[currentFontIndex]?.value) {
                 console.warn(`Font from config ("${config.fontFamily}") not found or mismatch, defaulting.`);
                 config.fontFamily = window.availableFonts?.[currentFontIndex]?.value || "'Atkinson Hyperlegible', sans-serif"; // Ensure config matches default
            }
            updateFontDisplay(); // Update dropdown display

            // Theme Carousel
            const themeIndex = window.availableThemes?.findIndex(t => t.value === config.theme) ?? -1;
            const currentThemeIdx = (themeIndex !== -1) ? themeIndex : (window.availableThemes?.findIndex(t => t.value === 'default') ?? 0);
            if (themeIndex === -1 && config.theme !== window.availableThemes?.[currentThemeIdx]?.value) {
                console.warn(`Theme from config ("${config.theme}") not found or mismatch, defaulting.`);
                config.theme = window.availableThemes?.[currentThemeIdx]?.value || 'default'; // Ensure config matches default
            }
            // Update theme carousel display (assuming global functions exist)
            if (typeof window.updateThemeDetails === 'function') window.updateThemeDetails(window.availableThemes?.[currentThemeIdx]);
            if (typeof window.highlightActiveCard === 'function') window.highlightActiveCard(window.availableThemes?.[currentThemeIdx]?.value);
            // updateThemePreview(); // updateFontDisplay already calls this

            // Connection Status UI within Panel
            if(channelInput) channelInput.value = config.lastChannel || '';
            const isConnected = socket && socket.readyState === WebSocket.OPEN;
            if (channelForm) channelForm.style.display = isConnected ? 'none' : 'flex';
            if (disconnectBtn) {
                disconnectBtn.style.display = isConnected ? 'block' : 'none';
                if (isConnected) disconnectBtn.textContent = `Disconnect from ${channel || config.lastChannel}`;
            }

            // Chat Mode Radio Buttons
            const currentMode = config.chatMode || 'window';
            document.querySelectorAll('input[name="chat-mode"]').forEach(radio => radio.checked = (radio.value === currentMode));
            updateModeSpecificSettingsVisibility(currentMode);

            // Popup Direction Radio Buttons
            const currentPopupDirection = config.popup?.direction || 'from-bottom';
            document.querySelectorAll('input[name="popup-direction"]').forEach(radio => radio.checked = (radio.value === currentPopupDirection));

            // Popup Duration/Max Messages Inputs
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
        }

        // Initialize the application
        // updateFontDisplay(); // Called by loadSavedConfig -> applyConfiguration -> updateConfigPanelFromConfig
        loadSavedConfig(); // Load, apply, and update panel

        // Listen for newly generated themes (from theme-generator.js)
        document.addEventListener('theme-generated-and-added', (event) => {
            if (!(event.detail && event.detail.themeValue)) {
                console.warn("[Event Listener] Received theme-generated-and-added event without valid themeValue.");
            }
            // Theme application/scrolling is handled by theme-generator.js
        });

        // Ensure initial visibility of connection form if not auto-connecting
        // (Handled within loadSavedConfig's connection logic)

        // Disconnect button listener (already attached in panel setup)

        // --- Core Application Logic ---

        /**
         * Apply a full configuration object to the chat overlay UI.
         * This is the central function for visually updating the overlay based on `config`.
         */
        function applyConfiguration(cfg) {
            if (!cfg) { console.error("applyConfiguration called with invalid config"); return; }

            // Track the theme value being applied
            if (cfg.theme) lastAppliedThemeValue = cfg.theme;

            // Determine final background RGBA color
            const baseBgColor = cfg.bgColor || '#121212';
            const bgOpacity = cfg.bgColorOpacity ?? 0.85;
            let finalRgbaColor;
            try { finalRgbaColor = hexToRgba(baseBgColor, bgOpacity); }
            catch (e) {
                 console.error(`[applyConfiguration] Error converting hex ${baseBgColor} with opacity ${bgOpacity}:`, e);
                 finalRgbaColor = `rgba(18, 18, 18, ${bgOpacity.toFixed(2)})`; // Fallback
            }

            // Apply Core CSS Variables to :root
            const rootStyle = document.documentElement.style;
            rootStyle.setProperty('--chat-bg-color', finalRgbaColor);
            rootStyle.setProperty('--chat-border-color', cfg.borderColor || '#444444');
            rootStyle.setProperty('--chat-text-color', cfg.textColor || '#efeff1');
            rootStyle.setProperty('--username-color', cfg.usernameColor || '#9147ff');
            rootStyle.setProperty('--timestamp-color', cfg.timestampColor || '#adadb8');
            rootStyle.setProperty('--font-size', `${cfg.fontSize || 14}px`);
            rootStyle.setProperty('--font-family', cfg.fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif");
            rootStyle.setProperty('--chat-width', `${cfg.chatWidth || 95}%`);
            rootStyle.setProperty('--chat-height', `${cfg.chatHeight || 95}%`);
            rootStyle.setProperty('--chat-border-radius', window.getBorderRadiusValue(cfg.borderRadius || '8px'));
            rootStyle.setProperty('--chat-box-shadow', window.getBoxShadowValue(cfg.boxShadow || 'none'));

            // Background Image CSS Variables
            const bgImageURL = cfg.bgImage && cfg.bgImage !== 'none' ? `url("${cfg.bgImage}")` : 'none';
            rootStyle.setProperty('--chat-bg-image', bgImageURL);
            rootStyle.setProperty('--chat-bg-image-opacity', cfg.bgImageOpacity ?? 0.55);

            // Popup styles (mirror chat styles)
            rootStyle.setProperty('--popup-bg-color', finalRgbaColor);
            rootStyle.setProperty('--popup-border-color', cfg.borderColor || '#444444');
            rootStyle.setProperty('--popup-text-color', cfg.textColor || '#efeff1');
            rootStyle.setProperty('--popup-username-color', cfg.usernameColor || '#9147ff');
            rootStyle.setProperty('--popup-bg-image', bgImageURL);
            rootStyle.setProperty('--popup-bg-image-opacity', cfg.bgImageOpacity ?? 0.55);

            // Apply Font Size directly to Theme Preview element
            if (themePreview) themePreview.style.fontSize = `${cfg.fontSize || 14}px`;

            // Apply Theme Class & Override Class to <html> element
            const rootClassList = document.documentElement.classList;
            // Remove existing theme classes first
            const themeClasses = ['light-theme', 'natural-theme', 'transparent-theme', 'pink-theme', 'cyberpunk-theme'];
            // Add any dynamically generated theme classes (ending in -theme) to the removal list
            Array.from(rootClassList).forEach(cls => {
                if (cls.endsWith('-theme') && !themeClasses.includes(cls)) {
                    themeClasses.push(cls);
                }
            });
            rootClassList.remove(...themeClasses);
            // Add current theme class if it's not 'default'
            if (cfg.theme && cfg.theme !== 'default') rootClassList.add(cfg.theme);
            // Toggle username color override class
            rootClassList.toggle('override-username-colors', !!cfg.overrideUsernameColors);

            // Update Global UI State based on config
            rootClassList.toggle('hide-timestamps', !cfg.showTimestamps); // Toggle timestamp visibility class
            switchChatMode(cfg.chatMode || 'window', true); // Update display mode (visuals only)

            // Ensure Previews are Updated
            updateColorPreviews(); // Updates button highlights & calls updateThemePreview
        }

        // Listener for timestamp toggle (directly updates preview)
        if (showTimestampsInput) {
            if (!showTimestampsInput.dataset.listenerAttachedPreview) {
                showTimestampsInput.addEventListener('change', () => {
                    // Update config immediately if other parts of the app need the live value
                    config.showTimestamps = showTimestampsInput.checked;
                    updateThemePreview(); // Update preview when toggled
                });
                showTimestampsInput.dataset.listenerAttachedPreview = 'true';
            }
        } else { console.warn("Show Timestamps checkbox element not found."); }

        /**
         * Updates the main UI visibility based on connection status and chat mode.
         */
        function updateConnectionStateUI(isConnected) {
            const isPopupMode = config.chatMode === 'popup';
            // Toggle initial prompt visibility
            if (initialConnectionPrompt) initialConnectionPrompt.style.display = isConnected ? 'none' : 'flex';
            // Toggle main containers based on connection AND mode
            if (popupContainer) popupContainer.style.display = isConnected && isPopupMode ? 'block' : 'none';
            if (chatWrapper) chatWrapper.style.display = isConnected && !isPopupMode ? 'block' : 'none';
            // Toggle body class for global styling hooks
            document.body.classList.toggle('disconnected', !isConnected);
            // Update small status indicator dot
            updateStatus(isConnected);
        }

        // Initial Connection Prompt Listeners
        if (initialConnectBtn && initialChannelInput) {
            initialConnectBtn.addEventListener('click', () => {
                if (channelInput) channelInput.value = initialChannelInput.value; // Sync value
                connectToChat();
            });
            initialChannelInput.addEventListener('keypress', (e) => { // Enter key listener
                if (e.key === 'Enter') {
                    if (channelInput) channelInput.value = initialChannelInput.value; // Sync value
                    connectToChat();
                }
            });
            initialChannelInput.addEventListener('input', () => { // Sync prompt -> settings input live
                 if (channelInput) channelInput.value = initialChannelInput.value;
            });
        } else { console.error("Initial connection prompt elements not found."); }

        // "Open Settings" button from initial prompt
        if (openSettingsFromPromptBtn && configPanel) {
             openSettingsFromPromptBtn.addEventListener('click', () => {
                 if (initialChannelInput && channelInput) channelInput.value = initialChannelInput.value; // Sync channel before opening
                 openSettingsPanel();
             });
         }

        // Settings Panel Listeners (Connect Button)
        if (connectBtn && channelInput) { // Ensure both exist
            if (!connectBtn.dataset.listenerAttachedPanel) { // Prevent multiple listeners
                connectBtn.addEventListener('click', connectToChat);
                connectBtn.dataset.listenerAttachedPanel = 'true';
            }
            // Enter key listener for the panel input
             channelInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); e.stopPropagation(); // Prevent form submission/bubbling
                    connectToChat();
                }
             });
             // Sync settings input -> prompt input live
             channelInput.addEventListener('input', () => {
                if (initialChannelInput) initialChannelInput.value = channelInput.value;
             });
        }

        // Settings Panel Listener (Disconnect Button)
        if (disconnectBtn) { // Listener attached in setup, using disconnectChat
             disconnectBtn.addEventListener('click', disconnectChat);
        }

        // Load saved config or apply defaults on initial load
        function loadSavedConfig() {
            try {
                const sceneName = getUrlParameter('scene') || 'default';
                const savedConfig = localStorage.getItem(`chatConfig-${sceneName}`);
                if (savedConfig) {
                    const loadedConfig = JSON.parse(savedConfig);
                    // Merge defaults with loaded config to ensure all keys exist
                    config = { ...config, ...loadedConfig };
                } else {
                    // No saved config, apply defaults (config object is already default)
                    // applyDefaultSettings(); // No need, config already holds defaults initially
                }

                // Apply the final configuration (loaded or default)
                applyConfiguration(config);
                // Update the panel controls to reflect the applied state
                updateConfigPanelFromConfig();

                 // Initial Connection Attempt Logic
                 if (config.lastChannel) {
                     // Pre-fill inputs
                     if (channelInput) channelInput.value = config.lastChannel;
                     if (initialChannelInput) initialChannelInput.value = config.lastChannel;
                     connectToChat(); // Attempt auto-connection
                 } else {
                     // No last channel, ensure UI shows disconnected state (prompt)
                     updateConnectionStateUI(false);
                     if (channelInput) channelInput.value = '';
                     if (initialChannelInput) initialChannelInput.value = '';
                 }

            } catch (e) {
                console.error("Error loading or parsing configuration:", e);
                applyDefaultSettings(); // Fallback to defaults on error
                applyConfiguration(config); // Apply them
                updateConfigPanelFromConfig(); // Update panel
                updateConnectionStateUI(false); // Show prompt
                 if (channelInput) channelInput.value = '';
                 if (initialChannelInput) initialChannelInput.value = '';
            }
        }

        /**
         * Saves only the lastChannel property to localStorage, preserving other settings.
         * Called on successful connection.
         */
        function saveLastChannelOnly(channelToSave) {
            if (!channelToSave) {
                console.warn("[saveLastChannelOnly] Attempted to save empty channel.");
                return;
            }
            try {
                const scene = getUrlParameter('scene') || 'default';
                const configKey = `chatConfig-${scene}`;
                let currentFullConfig = {};
                try { // Load existing config safely
                    const saved = localStorage.getItem(configKey);
                    if (saved) currentFullConfig = JSON.parse(saved);
                } catch (parseError) { console.error("[saveLastChannelOnly] Error parsing existing config:", parseError); }

                // Update only the lastChannel property
                currentFullConfig.lastChannel = channelToSave;
                // Save the modified config back
                localStorage.setItem(configKey, JSON.stringify(currentFullConfig));
                // Also update the global config object in memory
                config.lastChannel = channelToSave;
            } catch (storageError) {
                console.error("[saveLastChannelOnly] Error saving lastChannel:", storageError);
            }
        }

        // Function to handle explicit user disconnection via button
        function disconnectChat() {
            if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
                isExplicitDisconnect = true; // Set flag *before* closing
                clearTimeout(reconnectTimer); // Cancel any pending reconnects
                reconnectTimer = null;
                reconnectAttempts = 0;
                socket.close(); // Triggers socket.onclose for UI updates
            } else {
                 // If socket wasn't open, ensure UI is in disconnected state anyway
                 updateConnectionStateUI(false);
                 if (disconnectBtn) disconnectBtn.style.display = 'none';
                 if (channelForm) channelForm.style.display = 'flex';
                 isExplicitDisconnect = false; // Reset flag just in case
            }
        }

        // Function to schedule reconnection attempts with exponential backoff
        function scheduleReconnect(channelToReconnect) {
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                addSystemMessage("Failed to reconnect after multiple attempts.");
                updateConnectionStateUI(false); // Show connection prompt
                reconnectAttempts = 0; // Reset for future manual connections
                 // Pre-fill prompt with the channel we failed to connect to
                 if (initialChannelInput) initialChannelInput.value = channelToReconnect || config.lastChannel || '';
                return;
            }

            // Calculate delay: initial * 2^attempts, capped at max
            let delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
            delay = Math.min(delay, MAX_RECONNECT_DELAY);
            reconnectAttempts++;
            addSystemMessage(`Reconnecting in ${Math.round(delay / 1000)}s... (Attempt ${reconnectAttempts})`);

             // Pre-fill channel inputs before the timer starts
             if (channelInput) channelInput.value = channelToReconnect;
             if (initialChannelInput) initialChannelInput.value = channelToReconnect;

            // Clear previous timer just in case
            clearTimeout(reconnectTimer);

            reconnectTimer = setTimeout(() => {
                // Re-verify inputs haven't been manually changed during delay; use original channel for this attempt
                 if (channelInput && channelInput.value !== channelToReconnect) {
                    console.warn(`Channel input changed during reconnect delay. Using original: ${channelToReconnect}`);
                    channelInput.value = channelToReconnect;
                 }
                 if (initialChannelInput && initialChannelInput.value !== channelToReconnect) {
                     initialChannelInput.value = channelToReconnect;
                 }
                connectToChat(); // Attempt connection
            }, delay);
        }

    } // End of initApp
})(); // End of IIFE