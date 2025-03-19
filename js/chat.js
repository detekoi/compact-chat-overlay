document.addEventListener('DOMContentLoaded', function() {
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
        const statusIndicator = document.getElementById('status-indicator');
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');
        const channelInput = document.getElementById('channel-input');
        const settingsBtn = document.getElementById('settings-btn');
        const configPanel = document.getElementById('config-panel');
        const closeConfigBtn = document.getElementById('close-config');
        const saveConfigBtn = document.getElementById('save-config');
        const cancelConfigBtn = document.getElementById('cancel-config');
        const resetConfigBtn = document.getElementById('reset-config');
        const fontSizeSlider = document.getElementById('font-size-slider');
        const fontSizeValue = document.getElementById('font-size-value');
        const bgColorInput = document.getElementById('bg-color');
        const bgOpacityInput = document.getElementById('bg-opacity');
        const bgOpacityValue = document.getElementById('bg-opacity-value');
        const borderColorInput = document.getElementById('border-color');
        const textColorInput = document.getElementById('text-color');
        const usernameColorInput = document.getElementById('username-color');
        const themeColorPreviews = document.getElementById('theme-color-previews');
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
            { name: 'Medieval Sharp', value: "'Medieval Sharp', cursive", description: 'Evokes a medieval/fantasy atmosphere with calligraphic details.' },
            { name: 'Press Start 2P', value: "'Press Start 2P', cursive", description: 'Pixelated retro gaming font that resembles 8-bit text.' },
            { name: 'Jacquard 12', value: "'Jacquard 12', monospace", description: 'Clean monospaced font inspired by classic computer terminals.' }
        ];
        
        // Theme selection
        let currentThemeIndex = 0;
        const availableThemes = [
            { name: 'Default', value: 'default', bgColor: 'rgba(18, 18, 18, 0.8)', borderColor: '#9147ff', textColor: '#efeff1', usernameColor: '#9147ff' },
            { name: 'Transparent', value: 'transparent-theme', bgColor: 'rgba(0, 0, 0, 0)', borderColor: 'rgba(255, 255, 255, 0.1)', textColor: '#ffffff', usernameColor: '#9147ff' },
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
            if (!data.username || !data.message) return;
            
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            
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
            
            chatMessages.appendChild(messageElement);
            
            // Auto-scroll and limit messages
            limitMessages();
            scrollToBottom();
            
            // Extra handling for popup mode
            if (config.chatMode === 'popup') {
                // Add any popup-specific classes
                messageElement.classList.add('popup-message');
                messageElement.classList.add(`popup-${config.popup.direction}`);
                
                // Set the auto-remove timer
                setTimeout(() => {
                    messageElement.classList.add('removing');
                    setTimeout(() => {
                        if (messageElement.parentNode) {
                            messageElement.parentNode.removeChild(messageElement);
                        }
                    }, 300); // Fade-out animation duration
                }, config.popup.duration * 1000);
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
            document.getElementById('channel-form').style.display = 'none';
            addSystemMessage(`Connecting to ${channel}'s chat...`);
            
            // Connect to Twitch IRC via WebSocket
            socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            
            socket.onopen = function() {
                socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
                socket.send(`PASS SCHMOOPIIE`);
                socket.send(`NICK justinfan${Math.floor(Math.random() * 999999)}`);
                socket.send(`JOIN #${channel}`);
                
                // Update connection status
                updateStatus(true);
                
                // Save the channel name in config
                config.lastChannel = channel;
                
                // Show channel actions
                document.getElementById('channel-actions').style.display = 'flex';
                disconnectBtn.textContent = `Disconnect from ${channel}`;
                
                // Add connected message
                addSystemMessage(`Connected to ${channel}'s chat`);
            };
            
            socket.onclose = function() {
                updateStatus(false);
                addSystemMessage('Disconnected from chat');
            };
            
            socket.onerror = function() {
                updateStatus(false);
                addSystemMessage('Error connecting to chat');
                document.getElementById('channel-form').style.display = 'block';
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
        
        // Connect button
        connectBtn.addEventListener('click', connectToChat);
        
        // Channel input connect on Enter
        channelInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                connectToChat();
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
            // Update the config's textColor immediately when the input changes
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
        
        // Open settings panel
        settingsBtn.addEventListener('click', () => {
            configPanel.classList.add('visible');
            
            // Update form fields to match current config
            updateConfigPanelFromConfig();
        });
        
        // Close settings panel
        closeConfigBtn.addEventListener('click', () => {
            configPanel.classList.remove('visible');
        });
        
        // Update color preview swatches
        function updateColorPreviews() {
            // Create swatches to show all theme colors together
            const previewHtml = `
                <div class="color-preview" style="background-color: ${bgColorInput.value}; opacity: ${parseInt(bgOpacityInput.value) / 100}; border: 2px solid ${borderColorInput.value};">
                    <span style="color: ${usernameColorInput.value};">Username</span>
                    <span style="color: ${textColorInput.value};">Chat message</span>
                </div>
            `;
            
            themeColorPreviews.innerHTML = previewHtml;
        }
        
        // Toggle between window and popup modes
        function switchChatMode(mode) {
            // This function handles the visual switching between modes
            config.chatMode = mode;
            
            // Update the chat container class
            chatContainer.classList.remove('window-mode', 'popup-mode');
            chatContainer.classList.add(`${mode}-mode`);
            
            // Clear existing messages when switching modes
            chatMessages.innerHTML = '';
            
            // Re-add some system messages explaining the current mode
            if (mode === 'popup') {
                addSystemMessage(`Switched to popup mode. Messages will appear temporarily from the ${config.popup.direction.replace('from-', '')}.`);
            } else {
                addSystemMessage('Switched to window mode. Messages will appear in a scrollable window.');
            }
            
            // Add a dummy message to demonstrate the mode
            addChatMessage({
                username: 'ExampleUser',
                message: 'This is a sample message to demonstrate the current chat mode.',
                color: config.usernameColor
            });
        }
        
        // Switch themes with the carousel
        function applyTheme(themeName) {
            // First remove all theme classes
            document.documentElement.classList.remove(
                'light-theme', 
                'natural-theme', 
                'transparent-theme', 
                'pink-theme', 
                'cyberpunk-theme'
            );
            
            // Then apply the selected theme if it's not default
            if (themeName !== 'default') {
                document.documentElement.classList.add(themeName);
            }
            
            // Also apply the preview
            updateThemePreview(availableThemes[currentThemeIndex]);
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
            
            // Apply the current theme
            applyTheme(availableThemes[currentThemeIndex].value);
            
            // Update theme preview
            updateThemePreview(availableThemes[currentThemeIndex]);
        }
        
        // Update theme preview with current theme
        function updateThemePreview(theme, useCustom = false) {
            // Get the preview element
            const themePreview = document.getElementById('theme-preview');
            if (!themePreview) return;
            
            // First remove all theme classes
            themePreview.classList.remove(
                'light-theme', 
                'natural-theme', 
                'transparent-theme', 
                'pink-theme', 
                'cyberpunk-theme'
            );
            
            // Apply either the theme class or custom colors
            if (theme.value !== 'default' && !useCustom) {
                // Apply predefined theme
                themePreview.classList.add(theme.value);
                themePreview.style.backgroundColor = ''; // Reset inline styles
                themePreview.style.borderColor = '';
                themePreview.style.color = '';
            } else {
                // Apply custom colors from inputs
                themePreview.style.backgroundColor = bgColorInput.value;
                themePreview.style.opacity = parseInt(bgOpacityInput.value) / 100;
                themePreview.style.borderColor = borderColorInput.value;
                themePreview.style.color = textColorInput.value;
                
                // Set username color too
                const username = themePreview.querySelector('.preview-username');
                if (username) {
                    username.style.color = usernameColorInput.value;
                }
            }
            
            // Update the HTML example
            themePreview.innerHTML = `
                <div>
                    <span class="preview-username">Username:</span> 
                    <span class="preview-message">Chat message</span>
                </div>
                <div class="preview-timestamp">${config.showTimestamps ? '12:34 ' : ''}${timestamp} Username: Chat message</span>
                </div>
            `;
            
            // Apply the current font family
            const fontFamily = availableFonts[currentFontIndex].value;
            document.documentElement.style.setProperty('--font-family', fontFamily);
            
            // Also set it directly on the theme preview element itself to be sure
            themePreview.style.fontFamily = fontFamily;
            
            // And directly on the inner content
            const previewContent = themePreview.querySelector('div > div');
            if (previewContent) {
                previewContent.style.fontFamily = fontFamily;
            }
        }
        
        // Update the preview whenever colors or settings change
        function updatePreviewFromCurrentSettings() {
            // Always use custom settings for this update
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
        
        // Popup mode settings
        // Chat mode toggle
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
        saveConfigBtn.addEventListener('click', () => {
            // Update config object
            const r = parseInt(bgColorInput.value.slice(1, 3), 16);
            const g = parseInt(bgColorInput.value.slice(3, 5), 16);
            const b = parseInt(bgColorInput.value.slice(5, 7), 16);
            const opacity = bgOpacityInput.value / 100;
            
            config = {
                chatMode: document.querySelector('input[name="chat-mode"]:checked').value,
                
                // Window mode settings
                bgColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
                borderColor: borderColorInput.value,
                textColor: textColorInput.value,
                usernameColor: usernameColorInput.value,
                fontSize: parseInt(fontSizeInput.value),
                fontFamily: availableFonts[currentFontIndex].value,
                chatWidth: parseInt(chatWidthInput.value),
                chatHeight: parseInt(chatHeightInput.value),
                maxMessages: parseInt(maxMessagesInput.value),
                showTimestamps: showTimestampsInput.checked,
                overrideUsernameColors: overrideUsernameColorsInput.checked,
                theme: availableThemes[currentThemeIndex].value, // Get theme from carousel
                lastChannel: channel, // Save the last channel
                
                // Popup mode settings
                popup: {
                    direction: document.querySelector('input[name="popup-direction"]:checked').value,
                    duration: parseInt(document.getElementById('popup-duration').value),
                    maxMessages: parseInt(document.getElementById('popup-max-messages').value)
                }
            };
            
            // Apply theme
            // First remove all theme classes
            document.documentElement.classList.remove(
                'light-theme', 
                'natural-theme', 
                'transparent-theme', 
                'pink-theme', 
                'cyberpunk-theme'
            );
            
            // Then apply the selected theme if it's not default
            if (config.theme !== 'default') {
                document.documentElement.classList.add(config.theme);
            }
            
            // Update CSS variables if not using theme
            if (config.theme === 'default') {
                document.documentElement.style.setProperty('--chat-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--chat-border-color', config.borderColor);
                document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                document.documentElement.style.setProperty('--username-color', config.usernameColor);
            }
            
            document.documentElement.style.setProperty('--font-size', `${config.fontSize}px`);
            document.documentElement.style.setProperty('--font-family', config.fontFamily);
            document.documentElement.style.setProperty('--chat-width', `${config.chatWidth}%`);
            document.documentElement.style.setProperty('--chat-height', `${config.chatHeight}px`);
            
            // Get scene ID from URL parameter
            const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
            
            // Save to localStorage with scene-specific key
            localStorage.setItem(`twitch-chat-overlay-config-${sceneId}`, JSON.stringify(config));
            
            // Hide config panel
            configPanel.classList.remove('visible');
            
            addSystemMessage('Settings saved');
        });
        
        // Cancel button - close panel without saving
        cancelConfigBtn.addEventListener('click', () => {
            // Restore values from current config
            updateConfigPanelFromConfig();
            
            // Hide config panel
            configPanel.classList.remove('visible');
            
            addSystemMessage('Settings changes canceled');
        });
        
        // Helper function to update config panel from current config
        function updateConfigPanelFromConfig() {
            // Handle color setting
            const rgbaMatch = config.bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
            if (rgbaMatch) {
                const [, r, g, b, a] = rgbaMatch;
                const hexColor = '#' + parseInt(r).toString(16).padStart(2, '0') + 
                                parseInt(g).toString(16).padStart(2, '0') + 
                                parseInt(b).toString(16).padStart(2, '0');
                bgColorInput.value = hexColor;
                bgOpacityInput.value = parseFloat(a) * 100;
            }
            
            // Update form fields for window mode
            borderColorInput.value = config.borderColor;
            textColorInput.value = config.textColor;
            usernameColorInput.value = config.usernameColor;
            fontSizeInput.value = config.fontSize;
            fontSizeValue.textContent = `${config.fontSize}px`;
            
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
            maxMessagesInput.value = config.maxMessages;
            showTimestampsInput.checked = config.showTimestamps;
            overrideUsernameColorsInput.checked = config.overrideUsernameColors;
            
            // Update popup mode controls
            const chatModeInput = document.querySelector(`input[name="chat-mode"][value="${config.chatMode}"]`);
            if (chatModeInput) chatModeInput.checked = true;
            
            // Handle popup direction (safely check if property and element exist)
            if (config.popup && config.popup.direction) {
                const popupDirectionInput = document.querySelector(`input[name="popup-direction"][value="${config.popup.direction}"]`);
                if (popupDirectionInput) popupDirectionInput.checked = true;
            }
            
            // Safely update other popup settings
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
                // Show popup settings, hide window-only settings
                popupSettings.forEach(el => el.style.display = 'flex');
                windowOnlySettings.forEach(el => el.style.display = 'none');
            } else {
                // Hide popup settings, show window-only settings
                popupSettings.forEach(el => el.style.display = 'none');
                windowOnlySettings.forEach(el => el.style.display = 'flex');
            }
            
            // Update theme carousel
            const themeIndex = availableThemes.findIndex(theme => theme.value === (config.theme || 'default'));
            currentThemeIndex = themeIndex >= 0 ? themeIndex : 0;
            currentThemeDisplay.textContent = availableThemes[currentThemeIndex].name;
            
            // Apply visual preview
            document.documentElement.style.setProperty('--font-size', `${config.fontSize}px`);
            document.documentElement.style.setProperty('--font-family', config.fontFamily);
            document.documentElement.style.setProperty('--chat-width', `${config.chatWidth}%`);
            document.documentElement.style.setProperty('--chat-height', `${config.chatHeight}px`);
            
            // Apply theme
            // First remove all theme classes
            document.documentElement.classList.remove(
                'light-theme', 
                'natural-theme', 
                'transparent-theme', 
                'pink-theme', 
                'cyberpunk-theme'
            );
            
            // Then apply the selected theme if it's not default
            if (config.theme !== 'default') {
                document.documentElement.classList.add(config.theme);
            } else {
                // Update CSS variables for both window and popup mode when using default theme
                document.documentElement.style.setProperty('--chat-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--chat-border-color', config.borderColor);
                document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                document.documentElement.style.setProperty('--username-color', config.usernameColor);
                
                // Also update popup-specific variables to match window styles for default theme
                document.documentElement.style.setProperty('--popup-bg-color', config.bgColor);
                document.documentElement.style.setProperty('--popup-border-color', config.borderColor);
                document.documentElement.style.setProperty('--popup-text-color', config.textColor);
                document.documentElement.style.setProperty('--popup-username-color', config.usernameColor);
            }
            
            // Apply the current chat mode
            switchChatMode(config.chatMode);
            
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
        }
        
        // Disconnect button in settings
        disconnectBtn.addEventListener('click', () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
                
                // Show the channel form again
                document.getElementById('channel-form').style.display = 'block';
                channelInput.value = channel;
                
                // Clear the chat messages area
                chatMessages.innerHTML = '';
                
                // Add system message
                addSystemMessage(`Disconnected from ${channel}'s chat`);
                addSystemMessage('Enter a channel name to connect');
                
                // Close the settings panel
                configPanel.classList.remove('visible');
            }
        });
        
        let tempConfig = null; // Store original config when using reset
        
        // Reset to defaults
        resetConfigBtn.addEventListener('click', () => {
            // Store the current config first so we can restore it if Cancel is clicked
            if (!tempConfig) {
                tempConfig = JSON.parse(JSON.stringify(config));
            }
            
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
                chatMode: 'window', // Add default chat mode
                popup: {
                    direction: 'from-bottom',
                    duration: 5,
                    maxMessages: 3
                }
            };
            
            // Update form display only - don't commit changes yet
            const rgbaMatch = defaultConfig.bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
            if (rgbaMatch) {
                const [, r, g, b, a] = rgbaMatch;
                const hexColor = '#' + parseInt(r).toString(16).padStart(2, '0') + 
                                parseInt(g).toString(16).padStart(2, '0') + 
                                parseInt(b).toString(16).padStart(2, '0');
                bgColorInput.value = hexColor;
                bgOpacityInput.value = parseFloat(a) * 100;
            }
            
            borderColorInput.value = defaultConfig.borderColor;
            textColorInput.value = defaultConfig.textColor;
            usernameColorInput.value = defaultConfig.usernameColor;
            fontSizeInput.value = defaultConfig.fontSize;
            fontSizeValue.textContent = `${defaultConfig.fontSize}px`;
            
            // Update font carousel
            if (defaultConfig.fontFamily) {
                const fontIndex = availableFonts.findIndex(font => font.value === defaultConfig.fontFamily);
                if (fontIndex >= 0) {
                    currentFontIndex = fontIndex;
                    currentFontDisplay.textContent = availableFonts[currentFontIndex].name;
                }
            }
            
            chatWidthInput.value = defaultConfig.chatWidth;
            chatWidthValue.textContent = `${defaultConfig.chatWidth}%`;
            chatHeightInput.value = defaultConfig.chatHeight;
            chatHeightValue.textContent = `${defaultConfig.chatHeight}px`;
            maxMessagesInput.value = defaultConfig.maxMessages;
            showTimestampsInput.checked = defaultConfig.showTimestamps;
            overrideUsernameColorsInput.checked = defaultConfig.overrideUsernameColors;
            
            // Update chat mode to default window mode
            const chatModeInput = document.querySelector(`input[name="chat-mode"][value="${defaultConfig.chatMode}"]`);
            if (chatModeInput) chatModeInput.checked = true;
            
            // Update popup settings
            const popupDirectionInput = document.querySelector(`input[name="popup-direction"][value="${defaultConfig.popup.direction}"]`);
            if (popupDirectionInput) popupDirectionInput.checked = true;
            
            const popupDurationEl = document.getElementById('popup-duration');
            if (popupDurationEl) popupDurationEl.value = defaultConfig.popup.duration;
            
            const popupDurationValueEl = document.getElementById('popup-duration-value');
            if (popupDurationValueEl) popupDurationValueEl.textContent = `${defaultConfig.popup.duration}s`;
            
            const popupMaxMessagesEl = document.getElementById('popup-max-messages');
            if (popupMaxMessagesEl) popupMaxMessagesEl.value = defaultConfig.popup.maxMessages;
            
            // Show/hide appropriate settings based on default chat mode
            const popupSettings = document.querySelectorAll('.popup-setting');
            const windowOnlySettings = document.querySelectorAll('.window-only-setting');
            
            if (defaultConfig.chatMode === 'popup') {
                // Show popup settings, hide window-only settings
                popupSettings.forEach(el => el.style.display = 'flex');
                windowOnlySettings.forEach(el => el.style.display = 'none');
            } else {
                // Hide popup settings, show window-only settings
                popupSettings.forEach(el => el.style.display = 'none');
                windowOnlySettings.forEach(el => el.style.display = 'flex');
            }
            
            // Update theme to default
            currentThemeIndex = availableThemes.findIndex(theme => theme.value === 'default');
            currentThemeDisplay.textContent = availableThemes[currentThemeIndex].name;
            
            // Preview changes
            updateBgColor();
            document.documentElement.style.setProperty('--chat-border-color', defaultConfig.borderColor);
            document.documentElement.style.setProperty('--chat-text-color', defaultConfig.textColor);
            document.documentElement.style.setProperty('--username-color', defaultConfig.usernameColor);
            document.documentElement.style.setProperty('--font-size', `${defaultConfig.fontSize}px`);
            document.documentElement.style.setProperty('--font-family', defaultConfig.fontFamily);
            document.documentElement.style.setProperty('--chat-width', `${defaultConfig.chatWidth}%`);
            document.documentElement.style.setProperty('--chat-height', `${defaultConfig.chatHeight}px`);
            
            // Apply theme and update preview
            applyTheme(defaultConfig.theme);
            
            // Apply chat mode
            switchChatMode(defaultConfig.chatMode);
            
            // Update theme index to match default theme
            currentThemeIndex = availableThemes.findIndex(theme => theme.value === 'default');
            
            // Update preview to show the default theme
            updateThemePreview(availableThemes[currentThemeIndex]);
            
            addSystemMessage('Settings reset to default (Click Save to apply or Cancel to revert)');
        });
        
        // Cancel should restore previous settings
        cancelConfigBtn.addEventListener('click', () => {
            // Whether Reset was clicked or not, revert to last saved config
            // Get instance ID from URL parameter
            const instanceId = getUrlParameter('instance') || 'default';
            const savedConfig = localStorage.getItem(`twitch-chat-overlay-config-${instanceId}`);
            
            if (savedConfig) {
                try {
                    const parsedConfig = JSON.parse(savedConfig);
                    config = {...config, ...parsedConfig};
                    
                    // Update UI to reflect saved settings
                    updateConfigPanelFromConfig();
                    
                    // Apply theme
                    const themeIndex = availableThemes.findIndex(theme => theme.value === (config.theme || 'default'));
                    currentThemeIndex = themeIndex >= 0 ? themeIndex : 0;
                    
                    // Apply the saved theme and colors to the actual chat
                    applyTheme(config.theme);
                    
                    // Update CSS variables directly
                    document.documentElement.style.setProperty('--chat-bg-color', config.bgColor);
                    document.documentElement.style.setProperty('--chat-border-color', config.borderColor);
                    document.documentElement.style.setProperty('--chat-text-color', config.textColor);
                    document.documentElement.style.setProperty('--username-color', config.usernameColor);
                    document.documentElement.style.setProperty('--font-size', `${config.fontSize}px`);
                    document.documentElement.style.setProperty('--chat-width', `${config.chatWidth}%`);
                    document.documentElement.style.setProperty('--chat-height', `${config.chatHeight}px`);
                    
                    // Set override username colors
                    if (config.overrideUsernameColors) {
                        document.documentElement.classList.add('override-username-colors');
                    } else {
                        document.documentElement.classList.remove('override-username-colors');
                    }
                    
                    // Reset tempConfig
                    tempConfig = null;
                    
                    // Make sure to switch to the correct chat mode
                    switchChatMode(config.chatMode);
                    
                    // Update preview to reflect restored settings
                    updatePreviewFromCurrentSettings();
                    
                } catch (e) {
                    console.error('Error restoring saved config:', e);
                }
            } else if (tempConfig) {
                // Fallback to tempConfig if available
                config = JSON.parse(JSON.stringify(tempConfig));
                tempConfig = null;
                updateConfigPanelFromConfig();
                applyTheme(config.theme);
                
                // Make sure to switch to the correct chat mode
                switchChatMode(config.chatMode);
                updatePreviewFromCurrentSettings();
            }
            
            // Hide config panel
            configPanel.classList.remove('visible');
            
            addSystemMessage('Settings changes canceled');
        });
        
        // Helper function to get URL parameters
        function getUrlParameter(name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            const results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        }
        
        // Load saved config on page load
        window.addEventListener('DOMContentLoaded', () => {
            // Get scene ID from URL parameter, default to 'default' if not specified
            const sceneId = getUrlParameter('scene') || getUrlParameter('instance') || 'default';
            
            // Use scene-specific storage key
            const savedConfig = localStorage.getItem(`twitch-chat-overlay-config-${sceneId}`);
            
            if (savedConfig) {
                try {
                    const parsedConfig = JSON.parse(savedConfig);
                    config = {...config, ...parsedConfig};
                    
                    // Check if color override is active
                    overrideUsernameColorsInput.checked = config.overrideUsernameColors;
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
                    
                    // Update form fields and visual settings
                    updateConfigPanelFromConfig();
                    
                    // Initialize popup mode
                    switchChatMode(config.chatMode || 'window');
                    
                    // If the channel was previously saved, auto-connect
                    if (config.lastChannel) {
                        channelInput.value = config.lastChannel;
                        
                        // Auto-connect after a short delay to ensure everything is loaded
                        setTimeout(() => {
                            connectToChat();
                        }, 500);
                    }
                    
                } catch (e) {
                    console.error('Error loading saved config:', e);
                }
            } else {
                // If no saved config, initialize the theme preview and set default mode
                updateThemePreview(availableThemes[currentThemeIndex]);
                switchChatMode('window');
            }
            
            // Show or hide popup settings based on initial mode
            const popupSettings = document.querySelectorAll('.popup-setting');
            if (config.chatMode === 'popup') {
                popupSettings.forEach(el => el.style.display = 'flex');
            } else {
                popupSettings.forEach(el => el.style.display = 'none');
            }
            
            addSystemMessage('Welcome to Twitch Chat Overlay');
            
            // Only show the connect message if we don't have a saved channel
            if (!config.lastChannel) {
                addSystemMessage('Enter a channel name to connect');
            } else {
                addSystemMessage(`Automatically connecting to ${config.lastChannel}...`);
            }
        });
});