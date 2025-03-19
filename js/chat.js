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
        
        // Config and state variables
        let config = {
            // Display mode
            chatMode: 'window', // 'window' or 'popup'
            
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
            
            // Popup mode settings
            popup: {
                direction: 'from-bottom', // 'from-bottom', 'from-top', 'from-right', 'from-left'
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
        // bg-opacity-value doesn't exist in the HTML, so let's create it
        let bgOpacityValue = document.createElement('span');
        bgOpacityValue.id = 'bg-opacity-value';
        bgOpacityValue.textContent = `${bgOpacityInput.value}%`;
        bgOpacityInput.parentNode.appendChild(bgOpacityValue);
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
        
        // Font selection carousel
        const prevFontBtn = document.getElementById('prev-font');
        const nextFontBtn = document.getElementById('next-font');
        const currentFontDisplay = document.getElementById('current-font');
        
        // Theme carousel
        const prevThemeBtn = document.getElementById('prev-theme');
        const nextThemeBtn = document.getElementById('next-theme');
        const currentThemeDisplay = document.getElementById('current-theme');
        const themePreview = document.getElementById('theme-preview');
        
        // Connection and chat state
        let socket = null;
        let channel = '';
        
        // Font selection
        let currentFontIndex = 0;
        const availableFonts = [
            { name: 'System UI', value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
            { name: 'Atkinson Hyperlegible', value: "'Atkinson Hyperlegible', sans-serif", description: 'Designed for high legibility and reading clarity, especially at small sizes.' },
            { name: 'Tektur', value: "'Tektur', sans-serif", description: 'Modern and slightly angular typeface with a technical/sci-fi aesthetic.' },
            { name: 'Medieval Sharp', value: "'MedievalSharp', cursive", description: 'Evokes a medieval/fantasy atmosphere with calligraphic details.' },
            { name: 'Press Start 2P', value: "'Press Start 2P', cursive", description: 'Pixelated retro gaming font that resembles 8-bit text.' },
            { name: 'Jacquard 12', value: "'Jacquard', monospace", description: 'Clean monospaced font inspired by classic computer terminals.' }
        ];
        
        // Theme selection
        let currentThemeIndex = 0;
        const availableThemes = [
            { name: 'Default', value: 'default', bgColor: 'rgba(18, 18, 18, 0.8)', borderColor: '#9147ff', textColor: '#efeff1', usernameColor: '#9147ff' },
            { name: 'Transparent', value: 'transparent-theme', bgColor: 'rgba(0, 0, 0, 0)', borderColor: 'transparent', textColor: '#ffffff', usernameColor: '#9147ff' },
            { name: 'Light', value: 'light-theme', bgColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#9147ff', textColor: '#0e0e10', usernameColor: '#9147ff' },
            { name: 'Natural', value: 'natural-theme', bgColor: 'rgba(61, 43, 31, 0.85)', borderColor: '#d4ad76', textColor: '#eee2d3', usernameColor: '#98bf64' },
            { name: 'Cyberpunk', value: 'cyberpunk-theme', bgColor: 'rgba(13, 12, 25, 0.85)', borderColor: '#f637ec', textColor: '#9effff', usernameColor: '#f637ec' },
            { name: 'Pink', value: 'pink-theme', bgColor: 'rgba(70, 25, 70, 0.85)', borderColor: '#ff8ad8', textColor: '#feebf9', usernameColor: '#ff8ad8' }
        ];
        
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
                if (data.emotes) {
                    const emotePositions = [];
                    
                    // Build a list of all emote positions
                    for (const emoteId in data.emotes) {
                        const emotePositionArray = data.emotes[emoteId];
                        
                        for (const position of emotePositionArray) {
                            const [start, end] = position.split('-').map(Number);
                            emotePositions.push({
                                start,
                                end,
                                id: emoteId
                            });
                        }
                    }
                    
                    // Sort emote positions from end to start to avoid position shifts
                    emotePositions.sort((a, b) => b.start - a.start);
                    
                    // Replace each emote with an img tag
                    for (const emote of emotePositions) {
                        const emoteCode = message.substring(emote.start, emote.end + 1);
                        const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`;
                        
                        // Create the replacement HTML
                        const emoteHtml = `<img class="emote" src="${emoteUrl}" alt="${emoteCode}" title="${emoteCode}" />`;
                        
                        // Replace the emote in the message
                        message = message.substring(0, emote.start) + emoteHtml + message.substring(emote.end + 1);
                    }
                }
                
                // Replace URLs with clickable links (if any exist)
                message = message.replace(
                    /(https?:\/\/[^\s]+)/g, 
                    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
                );
                
                // Add badges if available
                let badgesHtml = '';
                if (data.badges) {
                    for (const badge in data.badges) {
                        const version = data.badges[badge];
                        
                        // Special handling for subscriber badges
                        if (badge === 'subscriber') {
                            badgesHtml += `<img class="badge" src="https://static-cdn.jtvnw.net/badges/v1/${badge}/1" alt="${badge}" title="${badge}" /> `;
                        } else {
                            badgesHtml += `<img class="badge" src="https://static-cdn.jtvnw.net/badges/v1/${badge}/${version}/1" alt="${badge}" title="${badge}" /> `;
                        }
                    }
                }
                
                // Assemble the chat message
                messageElement.innerHTML = `
                    <span class="timestamp">${timestamp}</span>
                    <span class="badges">${badgesHtml}</span>
                    <span class="username" style="color: ${userColor}">${data.username}:</span>
                    <span class="message-content">${message}</span>
                `;
                
                // Add to appropriate container
                targetContainer.appendChild(messageElement);
                
                if (config.chatMode === 'window') {
                    // Auto-scroll and limit messages for window mode
                    limitMessages();
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
                        // Parse tags if present (IRCv3)
                        let tags = {};
                        if (message.startsWith('@')) {
                            const tagPart = message.slice(1, message.indexOf(' '));
                            tagPart.split(';').forEach(tag => {
                                const [key, value] = tag.split('=');
                                tags[key] = value;
                            });
                        }
                        
                        // Extract username from message
                        const usernameMatch = message.match(/:(.*?)!/);
                        const username = usernameMatch ? usernameMatch[1] : 'Anonymous';
                        
                        // Extract message content
                        const messageMatch = message.match(/PRIVMSG #\w+ :(.*)/);
                        const messageContent = messageMatch ? messageMatch[1] : '';
                        
                        // Parse emotes
                        let emotes = null;
                        if (tags.emotes) {
                            emotes = {};
                            const emoteGroups = tags.emotes.split('/');
                            emoteGroups.forEach(group => {
                                if (!group) return;
                                const [emoteId, positions] = group.split(':');
                                emotes[emoteId] = positions.split(',');
                            });
                        }
                        
                        // Parse badges
                        let badges = null;
                        if (tags.badges) {
                            badges = {};
                            const badgeParts = tags.badges.split(',');
                            badgeParts.forEach(part => {
                                if (!part) return;
                                const [badge, version] = part.split('/');
                                badges[badge] = version;
                            });
                        }
                        
                        // Add the chat message
                        addChatMessage({
                            username,
                            message: messageContent,
                            color: tags.color || null,
                            emotes,
                            badges
                        });
                    }
                });
            };
        }
        
        // Limit the number of messages based on settings
        function limitMessages() {
            while (chatMessages.children.length > config.maxMessages) {
                chatMessages.removeChild(chatMessages.firstChild);
            }
        }
        
        // Scroll chat to bottom
        function scrollToBottom() {
            if (config.chatMode === 'window') {
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
            const hexColor = bgColorInput.value;
            const opacity = parseInt(bgOpacityInput.value) / 100;
            
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            
            const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            document.documentElement.style.setProperty('--chat-bg-color', rgbaColor);
            document.documentElement.style.setProperty('--popup-bg-color', rgbaColor);
        }
        
        bgColorInput.addEventListener('input', updateBgColor);
        
        bgOpacityInput.addEventListener('input', () => {
            bgOpacityValue.textContent = `${bgOpacityInput.value}%`;
            updateBgColor();
            updatePreviewFromCurrentSettings();
        });
        
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
                        borderColorInput.value = color;
                        document.documentElement.style.setProperty('--chat-border-color', 'transparent');
                        document.documentElement.style.setProperty('--popup-border-color', 'transparent');
                    } else {
                        borderColorInput.value = color;
                        document.documentElement.style.setProperty('--chat-border-color', color);
                        document.documentElement.style.setProperty('--popup-border-color', color);
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
            document.documentElement.style.setProperty('--chat-border-color', borderColorInput.value);
            document.documentElement.style.setProperty('--popup-border-color', borderColorInput.value);
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
                    panel.classList.add('visible');
                    panel.style.display = 'block';
                    updateConfigPanelFromConfig();
                }
                
                return false;
            };
            
            popupSettingsBtn.style.cursor = 'pointer';
            popupSettingsBtn.style.opacity = '0.9';  // Make it more visible
        }
        
        // Close settings panel function
        function closeConfigPanel() {
            configPanel.classList.remove('visible');
            configPanel.style.display = 'none';
        }
        
        // Close button click handler
        cancelConfigBtn.addEventListener('click', closeConfigPanel);
        
        // Update color preview swatches
        function updateColorPreviews() {
            // Get all color preview elements
            const bgColorPreview = document.getElementById('bg-color-preview');
            const borderColorPreview = document.getElementById('border-color-preview');
            const textColorPreview = document.getElementById('text-color-preview');
            const usernameColorPreview = document.getElementById('username-color-preview');
            
            // Update the color previews with their respective colors
            if (bgColorPreview) {
                const bgColor = bgColorInput.value || '#121212';
                const opacity = parseInt(bgOpacityInput.value || 80) / 100;
                const rgbaMatch = bgColor.match(/#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i);
                
                if (rgbaMatch) {
                    const [, r, g, b] = rgbaMatch;
                    const r_int = parseInt(r, 16);
                    const g_int = parseInt(g, 16);
                    const b_int = parseInt(b, 16);
                    bgColorPreview.style.backgroundColor = `rgba(${r_int}, ${g_int}, ${b_int}, ${opacity})`;
                } else {
                    bgColorPreview.style.backgroundColor = bgColor;
                    bgColorPreview.style.opacity = opacity;
                }
            }
            
            if (borderColorPreview) {
                borderColorPreview.style.backgroundColor = borderColorInput.value || '#9147ff';
            }
            
            if (textColorPreview) {
                textColorPreview.style.backgroundColor = textColorInput.value || '#efeff1';
            }
            
            if (usernameColorPreview) {
                usernameColorPreview.style.backgroundColor = usernameColorInput.value || '#9147ff';
            }
            
            // Also update the main theme preview to keep everything in sync
            updatePreviewFromCurrentSettings();
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
                    
                    // Reset all position properties
                    popupMessages.style.top = '';
                    popupMessages.style.bottom = '';
                    popupMessages.style.left = '';
                    popupMessages.style.right = '';
                    popupMessages.style.transform = '';
                    
                    // Set position based on direction
                    switch(direction) {
                        case 'from-top':
                            popupMessages.style.top = '10px';
                            popupMessages.style.left = '0';
                            break;
                        case 'from-bottom':
                            popupMessages.style.bottom = '10px';
                            popupMessages.style.left = '0';
                            break;
                        case 'from-left':
                            popupMessages.style.left = '10px';
                            popupMessages.style.top = '50%';
                            popupMessages.style.transform = 'translateY(-50%)';
                            break;
                        case 'from-right':
                            popupMessages.style.right = '10px';
                            popupMessages.style.top = '50%';
                            popupMessages.style.transform = 'translateY(-50%)';
                            break;
                        default:
                            // Default to bottom if direction is invalid
                            popupMessages.style.bottom = '10px';
                            popupMessages.style.left = '0';
                    }
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
                
                // Only update config if we explicitly want to - this prevents
                // unwanted config overrides during save operations
                if (config.theme === theme.value) {
                    config.bgColor = theme.bgColor;
                    config.borderColor = theme.borderColor;
                    config.textColor = theme.textColor;
                    config.usernameColor = theme.usernameColor;
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
                        
                        // Update opacity slider if it exists
                        if (bgOpacityInput) {
                            bgOpacityInput.value = parseFloat(a) * 100;
                            
                            // Update display value if it exists
                            const bgOpacityValue = document.getElementById('bg-opacity-value');
                            if (bgOpacityValue) {
                                bgOpacityValue.textContent = `${parseInt(parseFloat(a) * 100)}%`;
                            }
                        }
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
                
                // Update color previews
                updateColorPreviews();
                
            } catch (error) {
                console.error('Error applying theme:', error);
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
            
            // Apply the current theme
            applyTheme(theme.value);
            
            // Update theme preview
            updateThemePreview(theme);
        }
        
        // Update theme preview with current theme
        function updateThemePreview(theme, useCustom = false) {
            // Get the preview element
            const themePreview = document.getElementById('theme-preview');
            if (!themePreview) return;
            
            // Update the HTML example first so we can style its elements
            themePreview.innerHTML = `
                <div>
                    ${config.showTimestamps ? '<span class="timestamp">12:34</span> ' : ''}
                    <span class="preview-username">Username:</span> 
                    <span class="preview-message">Chat message</span>
                </div>
                <div class="preview-timestamp">
                    ${config.showTimestamps ? '<span class="timestamp">12:35</span> ' : ''}
                    <span class="preview-username" style="opacity: 0.9;">AnotherUser:</span> 
                    <span class="preview-message">Another example message</span>
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
                
                // Special handling for transparent border in themes
                if (theme.borderColor === 'transparent') {
                    themePreview.style.border = 'none';
                } else {
                    themePreview.style.border = `2px solid ${theme.borderColor}`;
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
                if (bgColor === '#00000000' || opacity === 0) {
                    themePreview.classList.add('transparent-theme');
                }
            }
            
            // Apply the current font family
            const fontFamily = availableFonts[currentFontIndex].value;
            document.documentElement.style.setProperty('--font-family', fontFamily);
            themePreview.style.fontFamily = fontFamily;
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
                    // Check for transparency special case
                    const borderButtons = document.querySelectorAll('.color-btn[data-target="border"]');
                    for (const btn of borderButtons) {
                        if (btn.classList.contains('active') && btn.getAttribute('data-color') === 'transparent') {
                            return 'transparent';
                        }
                    }
                    
                    // If the Transparent theme is currently selected, use transparent
                    if (availableThemes[currentThemeIndex].value === 'transparent-theme') {
                        return 'transparent';
                    }
                    
                    // Otherwise use the color input value
                    return borderColorInput.value || '#9147ff';
                };
                
                // Build color value with opacity
                const getRgbaColor = () => {
                    try {
                        const hexColor = bgColorInput.value || '#121212';
                        const opacity = parseInt(bgOpacityInput.value || 80) / 100;
                        
                        const r = parseInt(hexColor.slice(1, 3), 16);
                        const g = parseInt(hexColor.slice(3, 5), 16);
                        const b = parseInt(hexColor.slice(5, 7), 16);
                        
                        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                    } catch (e) {
                        console.error('Error parsing color:', e);
                        return 'rgba(18, 18, 18, 0.8)'; // Default fallback
                    }
                };
                
                // Create updated config object with all settings
                const newConfig = {
                    chatMode: chatModeRadio.value,
                    
                    // Window mode settings
                    bgColor: getRgbaColor(),
                    borderColor: getBorderColor(),
                    textColor: getValue(textColorInput, '#efeff1'),
                    usernameColor: getValue(usernameColorInput, '#9147ff'),
                    fontSize: getValue(fontSizeSlider, 14),
                    fontFamily: availableFonts[currentFontIndex]?.value || "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    chatWidth: getValue(chatWidthInput, 100),
                    chatHeight: getValue(chatHeightInput, 600),
                    maxMessages: getValue(maxMessagesInput, 50),
                    showTimestamps: getValue(showTimestampsInput, true),
                    overrideUsernameColors: getValue(overrideUsernameColorsInput, false),
                    theme: availableThemes[currentThemeIndex]?.value || 'default',
                    lastChannel: channel || config.lastChannel || '',
                    
                    // Popup mode settings
                    popup: {
                        direction: document.querySelector('input[name="popup-direction"]:checked')?.value || 'from-bottom',
                        duration: getValue(document.getElementById('popup-duration'), 5),
                        maxMessages: getValue(document.getElementById('popup-max-messages'), 3)
                    }
                };
                
                // Update the config
                config = newConfig;
                
                // Get scene ID from URL parameter
                const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
                
                // Save to localStorage with scene-specific key
                localStorage.setItem(`twitch-chat-overlay-config-${sceneId}`, JSON.stringify(config));
                console.log('Saved config to localStorage:', config);
                
                // First, remove all theme classes (important!)
                document.documentElement.classList.remove(
                    'light-theme', 
                    'natural-theme', 
                    'transparent-theme', 
                    'pink-theme', 
                    'cyberpunk-theme'
                );
                
                // Add the theme class if needed (but we'll still use custom colors)
                if (config.theme !== 'default') {
                    document.documentElement.classList.add(config.theme);
                }
                
                // Apply CSS variables directly rather than re-applying theme
                // This preserves custom colors that might differ from theme defaults
                document.documentElement.style.setProperty('--chat-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--chat-border-color', config.borderColor);
                document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                document.documentElement.style.setProperty('--username-color', config.usernameColor);
                
                // Mirror settings to popup variables
                document.documentElement.style.setProperty('--popup-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--popup-border-color', config.borderColor);
                document.documentElement.style.setProperty('--popup-text-color', config.textColor);
                document.documentElement.style.setProperty('--popup-username-color', config.usernameColor);
                
                // Double-check transparent border is applied correctly
                if (config.borderColor === 'transparent' || config.theme === 'transparent-theme') {
                    document.documentElement.style.setProperty('--chat-border-color', 'transparent');
                    document.documentElement.style.setProperty('--popup-border-color', 'transparent');
                }
                
                // Update CSS variables for fonts and dimensions
                document.documentElement.style.setProperty('--font-size', `${config.fontSize}px`);
                document.documentElement.style.setProperty('--font-family', config.fontFamily);
                document.documentElement.style.setProperty('--chat-width', `${config.chatWidth}%`);
                document.documentElement.style.setProperty('--chat-height', `${config.chatHeight}px`);
                
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
                addSystemMessage('Error saving settings. Please try again.');
            }
        }
        
        // Helper function to get URL parameters
        function getUrlParameter(name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            const results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        }
        
        // Load saved config on page load
        function loadSavedConfig() {
            console.log('Loading saved config');
            try {
                // Get scene ID from URL parameter, default to 'default' if not specified
                const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
                
                // Use scene-specific storage key
                const savedConfig = localStorage.getItem(`twitch-chat-overlay-config-${sceneId}`);
                console.log(`Loading config for scene: ${sceneId}`);
                
                if (savedConfig) {
                    try {
                        const parsedConfig = JSON.parse(savedConfig);
                        console.log('Loaded config:', parsedConfig);
                        
                        // Create new config object by merging defaults with saved settings
                        config = {
                            // Display mode
                            chatMode: parsedConfig.chatMode || 'window',
                            
                            // Window mode settings
                            bgColor: parsedConfig.bgColor || 'rgba(18, 18, 18, 0.8)',
                            borderColor: parsedConfig.borderColor || '#9147ff',
                            textColor: parsedConfig.textColor || '#efeff1',
                            usernameColor: parsedConfig.usernameColor || '#9147ff',
                            fontSize: parsedConfig.fontSize || 14,
                            fontFamily: parsedConfig.fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif",
                            chatWidth: parsedConfig.chatWidth || 100,
                            chatHeight: parsedConfig.chatHeight || 600,
                            maxMessages: parsedConfig.maxMessages || 50,
                            showTimestamps: parsedConfig.showTimestamps !== undefined ? parsedConfig.showTimestamps : true,
                            overrideUsernameColors: parsedConfig.overrideUsernameColors || false,
                            theme: parsedConfig.theme || 'default',
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
                        document.documentElement.style.setProperty('--chat-bg-color', config.bgColor);
                        document.documentElement.style.setProperty('--chat-border-color', config.borderColor);
                        document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                        document.documentElement.style.setProperty('--username-color', config.usernameColor);
                        document.documentElement.style.setProperty('--popup-bg-color', config.bgColor);
                        document.documentElement.style.setProperty('--popup-border-color', config.borderColor);
                        document.documentElement.style.setProperty('--popup-text-color', config.textColor);
                        document.documentElement.style.setProperty('--popup-username-color', config.usernameColor);
                        
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
                        
                        // Apply theme class if needed
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
                        
                        // Update form fields and visual settings
                        updateConfigPanelFromConfig();
                        
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
        
        // Update config panel from current config
        function updateConfigPanelFromConfig() {
            try {
                // Handle color setting
                const rgbaMatch = config.bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
                if (rgbaMatch) {
                    const [, r, g, b, a] = rgbaMatch;
                    const hexColor = '#' + parseInt(r).toString(16).padStart(2, '0') + 
                                    parseInt(g).toString(16).padStart(2, '0') + 
                                    parseInt(b).toString(16).padStart(2, '0');
                    bgColorInput.value = hexColor;
                    bgOpacityInput.value = parseFloat(a) * 100;
                    bgOpacityValue.textContent = `${Math.round(parseFloat(a) * 100)}%`;
                }
                
                // Update form fields
                borderColorInput.value = config.borderColor;
                
                // Mark the appropriate border color button as active
                const borderButtons = document.querySelectorAll('.color-btn[data-target="border"]');
                borderButtons.forEach(btn => {
                    const btnColor = btn.getAttribute('data-color');
                    if ((config.borderColor === 'transparent' && btnColor === 'transparent') || 
                        (config.borderColor !== 'transparent' && btnColor === config.borderColor)) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                textColorInput.value = config.textColor;
                usernameColorInput.value = config.usernameColor;
                fontSizeSlider.value = config.fontSize;
                fontSizeValue.textContent = `${config.fontSize}px`;
                
                // Update color previews
                updateColorPreviews();
                
                // Mark the appropriate border color button as active if using transparent
                if (config.borderColor === 'transparent') {
                    const borderButtons = document.querySelectorAll('.color-btn[data-target="border"]');
                    borderButtons.forEach(btn => {
                        if (btn.getAttribute('data-color') === 'transparent') {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                }
                
                // Update the font carousel to match the current config value
                if (config.fontFamily) {
                    // Find the matching font index
                    const fontIndex = availableFonts.findIndex(font => font.value === config.fontFamily);
                    if (fontIndex >= 0) {
                        currentFontIndex = fontIndex;
                        currentFontDisplay.textContent = availableFonts[currentFontIndex].name;
                    }
                }
                
                chatWidthInput.value = config.chatWidth;
                chatWidthValue.textContent = `${config.chatWidth}%`;
                chatHeightInput.value = config.chatHeight;
                chatHeightValue.textContent = `${config.chatHeight}px`;
                maxMessagesInput.value = config.maxMessages;
                showTimestampsInput.checked = config.showTimestamps;
                overrideUsernameColorsInput.checked = config.overrideUsernameColors;
                
                // Update chat mode inputs
                const chatModeInput = document.querySelector(`input[name="chat-mode"][value="${config.chatMode}"]`);
                if (chatModeInput) chatModeInput.checked = true;
                
                // Handle popup direction
                if (config.popup && config.popup.direction) {
                    const popupDirectionInput = document.querySelector(`input[name="popup-direction"][value="${config.popup.direction}"]`);
                    if (popupDirectionInput) popupDirectionInput.checked = true;
                }
                
                // Update other popup settings
                const popupDurationEl = document.getElementById('popup-duration');
                if (popupDurationEl && config.popup) popupDurationEl.value = config.popup.duration;
                
                const popupDurationValueEl = document.getElementById('popup-duration-value');
                if (popupDurationValueEl && config.popup) popupDurationValueEl.textContent = `${config.popup.duration}s`;
                
                const popupMaxMessagesEl = document.getElementById('popup-max-messages');
                if (popupMaxMessagesEl && config.popup) popupMaxMessagesEl.value = config.popup.maxMessages;
                
                // Show/hide mode-specific settings based on selected mode
                const popupSettings = document.querySelectorAll('.popup-setting');
                const windowOnlySettings = document.querySelectorAll('.window-only-setting');
                
                if (config.chatMode === 'popup') {
                    popupSettings.forEach(el => el.style.display = 'flex');
                    windowOnlySettings.forEach(el => el.style.display = 'none');
                } else {
                    popupSettings.forEach(el => el.style.display = 'none');
                    windowOnlySettings.forEach(el => el.style.display = 'flex');
                }
                
                // Update theme carousel
                const themeIndex = availableThemes.findIndex(theme => theme.value === (config.theme || 'default'));
                currentThemeIndex = themeIndex >= 0 ? themeIndex : 0;
                currentThemeDisplay.textContent = availableThemes[currentThemeIndex].name;
                
                // Update theme preview
                updateThemePreview(availableThemes[currentThemeIndex]);
                
                // Update channel actions visibility based on connection state
                const channelActions = document.getElementById('channel-actions');
                if (channelActions) {
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        channelActions.style.display = 'flex';
                        disconnectBtn.textContent = `Disconnect from ${channel}`;
                    } else {
                        channelActions.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error updating config panel:', error);
            }
        }
        
        // Disconnect button
        disconnectBtn.addEventListener('click', () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
                
                // Show the channel form again
                const channelForm = document.getElementById('channel-form');
                if (channelForm) {
                    channelForm.style.display = 'block';
                }
                
                if (channelInput) {
                    channelInput.value = channel;
                }
                
                // Clear the chat messages area
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                }
                
                // Add system message
                addSystemMessage(`Disconnected from ${channel}'s chat`);
                addSystemMessage('Enter a channel name to connect');
                
                // Close the settings panel
                closeConfigPanel();
                
                // Update channel actions visibility
                const channelActions = document.getElementById('channel-actions');
                if (channelActions) {
                    channelActions.style.display = 'none';
                }
            }
        });
        
        // Reset to defaults button
        resetConfigBtn.addEventListener('click', () => {
            const defaultConfig = {
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
                theme: 'default',
                overrideUsernameColors: false,
                chatMode: 'window',
                popup: {
                    direction: 'from-bottom',
                    duration: 5,
                    maxMessages: 3
                }
            };
            
            // Update the config with default values
            Object.assign(config, defaultConfig);
            
            // Apply default theme
            applyTheme('default');
            
            // Reset form values
            updateConfigPanelFromConfig();
            
            // Switch to default chat mode
            switchChatMode('window');
            
            addSystemMessage('Settings reset to default');
        });
        
        // Save button handler
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', function(e) {
                console.log('Save button clicked');
                if (e) e.preventDefault();
                saveConfiguration();
                return false;
            });
        }
        
        // Initialize the application
        updateFontDisplay();
        updateThemeDisplay();
        loadSavedConfig();
    }
})();