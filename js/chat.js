// Wait for DOM ready to run this code
(function () {
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
            textShadow: 'none', // Added textShadow
            popup: {
                direction: 'from-bottom',
                duration: 5, // seconds
                maxMessages: 3
            },
            theme: 'default',
            lastChannel: '',
            // Badge Configuration
            showBadges: true,
            badgeEndpointUrlGlobal: 'https://us-central1-chat-themer.cloudfunctions.net/getGlobalBadges',
            badgeEndpointUrlChannel: 'https://us-central1-chat-themer.cloudfunctions.net/getChannelBadges',
            badgeCacheGlobalTTL: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
            badgeCacheChannelTTL: 1 * 60 * 60 * 1000, // 1 hour in milliseconds
            badgeFallbackHide: true, // Always hide if service fails or badge not found
            // Emote Settings
            enlargeSingleEmotes: false, // Enlarge messages that contain only a single emote
            // bgColorOpacity and bgImageOpacity are derived/set later
        };

        // DOM elements
        const chatContainer = document.getElementById('chat-container');
        const chatWrapper = document.getElementById('chat-wrapper');
        const popupContainer = document.getElementById('popup-container');
        const chatMessages = document.getElementById('chat-messages');
        const scrollArea = document.getElementById('chat-scroll-area');
        // Auto-follow state: keep pinned to bottom unless user scrolls up
        let autoFollow = true;
        let isProgrammaticScroll = false;
        function setScrollTop(element, value) {
            if (!element) return;
            isProgrammaticScroll = true;
            element.scrollTop = value;
            requestAnimationFrame(() => { isProgrammaticScroll = false; });
        }

        if (scrollArea) {
            const onUserScroll = () => {
                if (isProgrammaticScroll) return;
                const atBottom = isUserScrolledToBottom(scrollArea);
                autoFollow = atBottom;
            };
            scrollArea.addEventListener('scroll', onUserScroll, { passive: true });
            scrollArea.addEventListener('wheel', onUserScroll, { passive: true });
            scrollArea.addEventListener('touchmove', onUserScroll, { passive: true });
            scrollArea.addEventListener('touchstart', () => { if (!isProgrammaticScroll) autoFollow = false; }, { passive: true });
            scrollArea.addEventListener('keydown', (e) => {
                if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) { if (!isProgrammaticScroll) autoFollow = false; }
            });
        }
        // Create a bottom sentinel to anchor scroll-to-bottom reliably
        let bottomSentinel = document.getElementById('chat-bottom-sentinel');
        if (!bottomSentinel && chatMessages) {
            bottomSentinel = document.createElement('div');
            bottomSentinel.id = 'chat-bottom-sentinel';
            bottomSentinel.style.cssText = 'height:1px;width:100%; overflow-anchor: auto;';
            chatMessages.appendChild(bottomSentinel);
        }
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
        const textShadowPresets = document.getElementById('text-shadow-presets'); // Added for text shadow
        const prevFontBtn = document.getElementById('prev-font');
        const nextFontBtn = document.getElementById('next-font');
        const currentFontDisplay = document.getElementById('current-font');
        const themePreview = document.getElementById('theme-preview');
        const channelForm = document.getElementById('channel-form');

        // Badge Configuration DOM Elements
        const showBadgesToggle = document.getElementById('show-badges-toggle');

        // Emote Configuration DOM Elements
        const enlargeSingleEmotesToggle = document.getElementById('enlarge-single-emotes-toggle');

        // Connection and chat state
        let socket = null;
        let channel = '';
        let currentBroadcasterId = null; // Store current broadcaster_id
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

        // Badge Cache
        let globalBadges = null; // { data: {}, timestamp: 0 }
        let channelBadges = {}; // { broadcasterId: { data: {}, timestamp: 0 } }
        let badgeFetchPromises = {}; // To prevent duplicate fetches for the same channel

        // --- Badge Fetching Functions ---
        async function fetchWithCache(cacheKey, ttl, url, isJson = true) {
            const cachedItem = localStorage.getItem(cacheKey);
            if (cachedItem) {
                try {
                    const { data, timestamp } = JSON.parse(cachedItem);
                    if (Date.now() - timestamp < ttl) {
                        console.log(`Using cached data for ${cacheKey}`);
                        return data;
                    }
                } catch (e) {
                    console.error(`Error parsing cached ${cacheKey}:`, e);
                    localStorage.removeItem(cacheKey); // Remove corrupted item
                }
            }

            console.log(`Workspaceing data for ${cacheKey} from ${url}`);
            try {
                // Add a check for placeholder URLs before fetching
                if (!url || url.includes('YOUR_') || url.includes('PLACEHOLDER')) {
                    throw new Error(`Invalid or placeholder URL for ${cacheKey}: ${url}`);
                }
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${cacheKey}: ${response.status} ${response.statusText}`);
                }
                const data = isJson ? await response.json() : await response.text();
                localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
                return data;
            } catch (error) {
                console.error(`Error fetching ${cacheKey}:`, error);
                if (config.badgeFallbackHide) {
                    return null;
                }
                return null; // Return null on error, upstream will handle placeholder or message
            }
        }

        async function fetchGlobalBadges() {
            if (!config.showBadges || !config.badgeEndpointUrlGlobal || config.badgeEndpointUrlGlobal.includes('YOUR_GLOBAL_BADGE_PROXY_URL_HERE')) {
                console.warn('Global badge fetching disabled or URL not configured.');
                globalBadges = null;
                return;
            }
            try {
                const data = await fetchWithCache('twitchGlobalBadges', config.badgeCacheGlobalTTL, config.badgeEndpointUrlGlobal);
                globalBadges = data ? { data, timestamp: Date.now() } : null; // Store in memory for faster access
                console.log('Global badges fetched/loaded from cache:', globalBadges);
                updateThemePreview(); // Update preview in case badges are now available
            } catch (error) {
                console.error('Failed to initialize global badges:', error);
                globalBadges = null;
                // Always hide error messages for badge failures
            }
        }

        async function fetchChannelBadges(broadcasterId) {
            if (!config.showBadges || !broadcasterId || !config.badgeEndpointUrlChannel || config.badgeEndpointUrlChannel.includes('YOUR_CHANNEL_BADGE_PROXY_URL_HERE')) {
                console.warn('Channel badge fetching disabled, no broadcaster ID, or URL not configured.');
                channelBadges[broadcasterId] = null;
                return;
            }

            const cacheKey = `twitchChannelBadges_${broadcasterId}`;
            const channelApiUrl = `${config.badgeEndpointUrlChannel}?broadcaster_id=${broadcasterId}`;

            if (badgeFetchPromises[broadcasterId]) {
                console.log(`Channel badge fetch already in progress for ${broadcasterId}. Awaiting existing promise.`);
                return badgeFetchPromises[broadcasterId];
            }

            const fetchPromise = fetchWithCache(cacheKey, config.badgeCacheChannelTTL, channelApiUrl)
                .then(data => {
                    channelBadges[broadcasterId] = data ? { data, timestamp: Date.now() } : null;
                    console.log(`Channel badges for ${broadcasterId} fetched/loaded:`, channelBadges[broadcasterId]);
                })
                .catch(error => {
                    console.error(`Failed to initialize channel badges for ${broadcasterId}:`, error);
                    channelBadges[broadcasterId] = null;
                    // Always hide error messages for badge failures
                })
                .finally(() => {
                    delete badgeFetchPromises[broadcasterId];
                });

            badgeFetchPromises[broadcasterId] = fetchPromise;
            return fetchPromise;
        }


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
        window.getBorderRadiusValue = function (value) { // Make global
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
        window.getBoxShadowValue = function (preset) { // Make global
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

        /**
         * Get text shadow CSS value from preset name.
         */
        function getTextShadowValue(preset) {
            if (!preset) return 'none';
            const textShadowMap = {
                'none': 'none',
                'soft': '1px 1px 2px rgba(0, 0, 0, 0.4), 0 0 3px rgba(0, 0, 0, 0.2)',
                'sharp': '1px 1px 0 rgba(0, 0, 0, 0.7), 1px 1px 0 rgba(0, 0, 0, 0.5)',
                'outline': '1px 1px 0 rgba(0, 0, 0, 0.9), -1px -1px 0 rgba(0, 0, 0, 0.9), 1px -1px 0 rgba(0, 0, 0, 0.9), -1px 1px 0 rgba(0, 0, 0, 0.9), 0 0 4px rgba(0, 0, 0, 0.7)',
                'strong': '2px 2px 6px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 0, 0, 0.4)',
                'glow': '0 0 8px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 0, 0, 0.6), 0 0 24px rgba(0, 0, 0, 0.4)'
            };
            return textShadowMap[preset.toLowerCase()] || 'none';
        }

        /**
         * Highlight the active text shadow button based on preset name
         */
        function highlightTextShadowButton(presetName) {
            if (textShadowPresets) {
                const buttons = textShadowPresets.querySelectorAll('.preset-btn');
                buttons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === presetName);
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

        // Observe size changes to keep at bottom when appropriate
        if ('ResizeObserver' in window && scrollArea) {
            const resizeObserver = new ResizeObserver(() => {
                if (autoFollow) {
                    setScrollTop(scrollArea, scrollArea.scrollHeight);
                }
            });
            resizeObserver.observe(chatMessages);
        }

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

        // Force stick-to-bottom on next frame (used after async layout changes like images)
        function stickToBottomSoon() {
            if (!scrollArea) return;
            requestAnimationFrame(() => {
                if (autoFollow) {
                    setScrollTop(scrollArea, scrollArea.scrollHeight);
                }
            });
        }

        // Add a system message to the chat
        function addSystemMessage(message, autoRemove = false) {
            if (!chatMessages) {
                console.error("Chat messages container not found for system message.");
                return;
            }
            const shouldScroll = config.chatMode === 'window' && autoFollow;
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
            // Keep sentinel as the last element
            if (bottomSentinel && bottomSentinel.parentNode !== chatMessages) chatMessages.appendChild(bottomSentinel);

            if (config.chatMode === 'window') {
                limitMessages();
            }
            if (shouldScroll && scrollArea) {
                // Defer to next frame to ensure layout has updated
                requestAnimationFrame(() => {
                    setScrollTop(scrollArea, scrollArea.scrollHeight);
                });
            }

            // Auto-remove temporary messages after 3 seconds
            if (autoRemove) {
                setTimeout(() => {
                    if (messageElement && messageElement.parentNode) {
                        messageElement.remove();
                    }
                }, 3000);
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

                const shouldScroll = config.chatMode === 'window' && autoFollow;
                const messageElement = document.createElement('div');

                if (config.chatMode === 'popup') {
                    messageElement.className = 'popup-message';
                    messageElement.classList.add(config.popup?.direction || 'from-bottom');
                } else {
                    messageElement.className = 'chat-message';
                }

                // Add single-emote class if applicable (set later after detection)
                // This will be applied after isSingleEmote is determined

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
                            const emoteBaseUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark`;
                            const emoteHtml = `<img class="emote" src="${emoteBaseUrl}/3.0" 
                                onerror="this.onerror=function(){this.src='${emoteBaseUrl}/1.0';}; this.src='${emoteBaseUrl}/2.0';" 
                                alt="${emoteCode.replace(/"/g, '&quot;')}" 
                                title="${emoteCode.replace(/"/g, '&quot;')}" />`;
                            message = message.substring(0, emote.start) + emoteHtml + message.substring(emote.end + 1);
                        } catch (err) { console.error('Error replacing emote:', err); }
                    }
                }

                // Check if message contains only a single emote (for enlargement feature)
                let isSingleEmote = false;
                if (config.enlargeSingleEmotes && message.includes('<img class="emote"')) {
                    // Create a temporary div to parse the HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = message;
                    const emotes = tempDiv.querySelectorAll('img.emote');
                    // Remove all whitespace and check if only one emote exists
                    const textContent = tempDiv.textContent.trim();
                    isSingleEmote = emotes.length === 1 && textContent === '';
                }

                // Process URLs only if message does not contain emotes
                if (!message.includes('<img class="emote"')) {
                    message = message.replace(/(\bhttps?:\/\/[^\s<]+)/g, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
                }

                // Badge HTML
                let badgesHtml = '';
                if (config.showBadges && data.tags && data.tags.badges) {
                    const badgesContainer = document.createElement('span'); // Temporary container
                    badgesContainer.className = 'badges'; // Not strictly needed here, but for consistency
                    const badgeStrings = data.tags.badges.split(',');

                    badgeStrings.forEach(badgeStr => {
                        if (!badgeStr.includes('/')) return;
                        const [setId, versionId] = badgeStr.split('/');

                        let badgeInfo = null;
                        if (currentBroadcasterId && channelBadges[currentBroadcasterId]?.data?.[setId]?.[versionId]) {
                            badgeInfo = channelBadges[currentBroadcasterId].data[setId][versionId];
                        }
                        else if (globalBadges?.data?.[setId]?.[versionId]) {
                            badgeInfo = globalBadges.data[setId][versionId];
                        }

                        if (badgeInfo && badgeInfo.imageUrl) {
                            const badgeImg = document.createElement('img');
                            badgeImg.className = 'chat-badge';
                            // Try 4x first, fallback to 2x, then 1x
                            const fallback2x = badgeInfo.imageUrl2x || badgeInfo.imageUrl;
                            const fallback1x = badgeInfo.imageUrl;
                            badgeImg.src = badgeInfo.imageUrl4x || badgeInfo.imageUrl2x || badgeInfo.imageUrl;
                            badgeImg.onerror = function () {
                                this.onerror = function () { this.src = fallback1x; };
                                this.src = fallback2x;
                            };
                            badgeImg.alt = badgeInfo.title || setId;
                            badgeImg.title = badgeInfo.title || setId;
                            badgesContainer.appendChild(badgeImg);
                        }
                    });
                    if (badgesContainer.hasChildNodes()) {
                        badgesHtml = `<span class="badges">${badgesContainer.innerHTML}</span>`;
                    }
                }


                messageElement.innerHTML = `
                    <span class="timestamp">${timestamp}</span>
                    ${badgesHtml}
                    <span class="username" style="color: ${userColor}">${data.username}:</span>
                    <span class="message-content">${message}</span>`;

                // Apply single-emote class if detected
                if (isSingleEmote) {
                    messageElement.classList.add('single-emote-message');
                }

                targetContainer.appendChild(messageElement);
                // After message added, listen for image loads to adjust scroll if needed
                if (config.chatMode !== 'popup' && scrollArea && isUserScrolledToBottom(scrollArea)) {
                    const imgs = messageElement.querySelectorAll('img');
                    imgs.forEach(img => {
                        if (!img.complete) {
                            img.addEventListener('load', stickToBottomSoon, { once: true });
                            img.addEventListener('error', stickToBottomSoon, { once: true });
                        }
                    });
                }
                if (config.chatMode !== 'popup') {
                    // Keep sentinel as the last element
                    if (bottomSentinel && bottomSentinel.parentNode !== targetContainer) targetContainer.appendChild(bottomSentinel);
                }


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
                        requestAnimationFrame(() => {
                            setScrollTop(currentScrollArea, currentScrollArea.scrollHeight);
                        });
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
            currentBroadcasterId = null; // Reset broadcaster ID on new connection

            addSystemMessage(`Connecting to ${channel}'s chat...`, true);
            socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            window.socket = socket; // Debugging access

            socket.onopen = function () {
                // Use timeout to ensure socket is ready before sending commands
                setTimeout(async () => { // Added async here
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

                    addSystemMessage(reconnectAttempts > 0 ? `Reconnected to ${channel}'s chat.` : `Connected to ${channel}'s chat`, true);
                    reconnectAttempts = 0; // Reset on successful connection
                    isConnecting = false;

                    // Fetch global badges on successful connection
                    await fetchGlobalBadges();
                    // Channel badges will be fetched on ROOMSTATE or first message with room-id

                }, 50); // Small delay can sometimes help ensure readiness
            };

            socket.onclose = function (event) {
                console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
                isConnecting = false;
                const lastConnectedChannel = channel; // Store before clearing
                socket = null;
                channel = '';
                currentBroadcasterId = null;

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

            socket.onerror = function (error) {
                console.error('WebSocket Error:', error);
                addSystemMessage('Error connecting to chat. Check console for details.');
                isConnecting = false;
                // Let socket.onclose handle potential reconnection logic
            };

            socket.onmessage = function (event) {
                const messages = event.data.split('\r\n');
                messages.forEach(message => {
                    if (!message) return;

                    if (message.includes('PING')) { // Handle PING/PONG keepalive
                        socket?.send('PONG :tmi.twitch.tv');
                        return;
                    }

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

                    // Handle ROOMSTATE for broadcaster_id and fetching channel badges
                    if (message.includes('ROOMSTATE')) {
                        if (tags['room-id'] && tags['room-id'] !== currentBroadcasterId) {
                            currentBroadcasterId = tags['room-id'];
                            console.log(`Switched to room/broadcaster ID: ${currentBroadcasterId}`);
                            fetchChannelBadges(currentBroadcasterId); // Fetch badges for the new room
                        }
                        return; // ROOMSTATE messages don't need further processing as chat messages
                    }


                    if (message.includes('PRIVMSG')) { // Handle chat messages
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

                        // If broadcasterId hasn't been set yet (e.g. from ROOMSTATE), try to get it from PRIVMSG tags
                        if (!currentBroadcasterId && tags['room-id']) {
                            currentBroadcasterId = tags['room-id'];
                            console.log(`Got broadcaster ID from PRIVMSG: ${currentBroadcasterId}`);
                            fetchChannelBadges(currentBroadcasterId);
                        }

                        addChatMessage({ username, message: messageContent, color: tags.color || null, emotes, tags });
                    }
                });
            };
        }

        // Limit the number of messages displayed in window mode
        function limitMessages() {
            if (!chatMessages) return;
            const max = config.maxMessages || 50;

            const scroller = scrollArea;
            const wasAtBottom = isUserScrolledToBottom(scroller);
            let distanceFromBottom = 0;
            if (scroller) {
                distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
            }

            // Remove oldest messages but never remove the sentinel
            while (chatMessages.children.length > max + (bottomSentinel ? 1 : 0)) {
                const firstChild = chatMessages.firstChild;
                if (firstChild === bottomSentinel) break;
                chatMessages.removeChild(firstChild);
            }
            // Keep sentinel last
            if (bottomSentinel && bottomSentinel.parentNode !== chatMessages) chatMessages.appendChild(bottomSentinel);

            // Restore scroll on next frame after layout settles
            if (scroller) {
                requestAnimationFrame(() => {
                    if (wasAtBottom && autoFollow) {
                        setScrollTop(scroller, scroller.scrollHeight);
                    } else {
                        setScrollTop(scroller, Math.max(0, scroller.scrollHeight - scroller.clientHeight - distanceFromBottom));
                    }
                });
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
                            if (bgColorInput) bgColorInput.value = '#000000'; // Use black base for transparent
                            if (bgOpacityInput) bgOpacityInput.value = 0; // Set opacity to 0
                        } else {
                            if (bgColorInput) bgColorInput.value = color;
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
                    addChatMessage({ username: 'System', message: 'Chat mode switched.', color: config.usernameColor, tags: {} }); // Added empty tags
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
            config.textShadow = theme.textShadow || 'none'; // Added for text shadow
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
                if (currentFontDisplay) currentFontDisplay.textContent = 'Error';
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

            if (currentFontDisplay) currentFontDisplay.textContent = currentFont.name;
            config.fontFamily = currentFont.value; // Update config
            document.documentElement.style.setProperty('--font-family', config.fontFamily); // Apply visually

            // Load Google Font if applicable
            if (currentFont.isGoogleFont && currentFont.googleFontFamily && window.loadGoogleFont) {
                window.loadGoogleFont(currentFont.googleFontFamily);
            }

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

            // Listen for font updates from theme-carousel.js
            document.addEventListener('fonts-updated', () => {
                console.log('Fonts updated event received in chat.js');
                // Re-sync current font index based on current config
                const fontIndex = window.availableFonts?.findIndex(f => f.value === config.fontFamily) ?? -1;
                if (fontIndex !== -1) {
                    currentFontIndex = fontIndex;
                }
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
            const activeTextShadowBtn = textShadowPresets?.querySelector('.preset-btn.active'); // Get active text shadow
            const textShadowValue = activeTextShadowBtn?.dataset.value ?? config?.textShadow ?? 'none'; // Get text shadow value
            const textShadow = getTextShadowValue(textShadowValue); // Convert to CSS
            const bgImage = config?.bgImage || 'none';

            // --- Background Image Opacity Logic ---
            let currentPreviewOpacity = themePreview.style.getPropertyValue('--preview-bg-image-opacity');
            let bgImageOpacity;
            if (currentPreviewOpacity !== '' && !isNaN(parseFloat(currentPreviewOpacity))) {
                bgImageOpacity = parseFloat(currentPreviewOpacity);
            } else {
                const bgImageOpacityValueFromConfig = config?.bgImageOpacity;
                bgImageOpacity = bgImageOpacityValueFromConfig !== undefined && bgImageOpacityValueFromConfig !== null
                    ? bgImageOpacityValueFromConfig
                    : (bgImageOpacityInput ? parseInt(bgImageOpacityInput.value, 10) / 100.0 : 0.55);
            }
            themePreview.style.setProperty('--preview-bg-image-opacity', bgImageOpacity.toFixed(2));
            // --- End Background Image Opacity Logic ---

            const borderTransparentButton = document.querySelector('.color-btn[data-target="border"][data-color="transparent"]');
            const finalBorderColor = (borderTransparentButton?.classList.contains('active')) ? 'transparent' : borderColor;

            let finalBgColor;
            const bgTransparentButton = document.querySelector('.color-btn[data-target="bg"][data-color="transparent"]');
            if (bgTransparentButton?.classList.contains('active')) {
                finalBgColor = 'transparent';
            } else {
                try { finalBgColor = hexToRgba(bgColor, bgColorOpacity); }
                catch (e) {
                    console.error(`Error converting hex ${bgColor} for preview:`, e);
                    finalBgColor = `rgba(30, 30, 30, ${bgColorOpacity.toFixed(2)})`; // Fallback
                }
            }

            const previewStyle = themePreview.style;
            previewStyle.setProperty('--preview-bg-color', finalBgColor);
            previewStyle.setProperty('--preview-border-color', finalBorderColor);
            previewStyle.setProperty('--preview-text-color', textColor);
            previewStyle.setProperty('--preview-username-color', usernameColor);
            previewStyle.setProperty('--preview-timestamp-color', timestampColor);
            previewStyle.setProperty('--preview-font-family', fontFamily);
            previewStyle.fontFamily = fontFamily;
            previewStyle.setProperty('--preview-border-radius', borderRadius);
            previewStyle.setProperty('--preview-box-shadow', boxShadow);
            previewStyle.setProperty('--preview-text-shadow', textShadow); // Apply text shadow to preview
            previewStyle.setProperty('--preview-bg-image', bgImage === 'none' ? 'none' : `url("${bgImage}")`);

            const fontSize = fontSizeSlider?.value || config?.fontSize || 14;
            previewStyle.fontSize = `${fontSize}px`;

            const ts1 = showTimestamps ? '<span class="timestamp">12:34 </span>' : '';
            const ts2 = showTimestamps ? '<span class="timestamp">12:35 </span>' : '';

            let previewBadgesHtml = '';
            // Use the config from the UI toggle directly for the preview
            const shouldShowBadgesInPreview = showBadgesToggle?.checked ?? config.showBadges;

            if (shouldShowBadgesInPreview) {
                let firstGlobalBadgeInfo = null;
                if (globalBadges?.data) {
                    const firstSetId = Object.keys(globalBadges.data)[0];
                    if (firstSetId && globalBadges.data[firstSetId]) {
                        const firstVersionId = Object.keys(globalBadges.data[firstSetId])[0];
                        if (firstVersionId) {
                            firstGlobalBadgeInfo = globalBadges.data[firstSetId][firstVersionId];
                        }
                    }
                }
                if (firstGlobalBadgeInfo?.imageUrl) {
                    previewBadgesHtml = `<img class="chat-badge" src="${firstGlobalBadgeInfo.imageUrl}" alt="${firstGlobalBadgeInfo.title || 'badge'}" title="${firstGlobalBadgeInfo.title || 'badge'}" style="height: calc(var(--font-size) * 0.9); vertical-align: middle; margin-right: 3px;">`;
                } else {
                    // Use the badge fallback toggle from UI for preview
                    const hideFallbackInPreview = true; // Always hide badge failures
                    if (!hideFallbackInPreview) {
                        previewBadgesHtml = `<span class="chat-badge-placeholder" style="font-size:0.8em; opacity:0.7; margin-right:3px;">[B]</span>`;
                    }
                }
            }


            themePreview.innerHTML = `
                <div class="preview-chat-message">
                    ${ts1}${previewBadgesHtml}<span class="username" style="color: var(--preview-username-color);">Username:</span> <span>Example chat message</span>
                </div>
                <div class="preview-chat-message">
                    ${ts2}${previewBadgesHtml}<span class="username" style="color: var(--preview-username-color);">AnotherUser:</span> <span>This is how your chat will look</span>
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
                    if (config.popup) config.popup.direction = e.target.value;
                    if (config.chatMode === 'popup') {
                        const popupMessages = document.getElementById('popup-messages');
                        if (popupMessages && config.popup) {
                            const direction = config.popup.direction || 'from-bottom';
                            const position = { top: 'auto', bottom: '10px' };
                            if (['from-top', 'from-left', 'from-right'].includes(direction)) {
                                position.top = '10px'; position.bottom = 'auto';
                            }
                            popupMessages.removeAttribute('style');
                            popupMessages.style.top = position.top;
                            popupMessages.style.bottom = position.bottom;
                        }
                    }
                }
            });
        });

        // Listener for popup duration slider
        document.getElementById('popup-duration')?.addEventListener('input', (e) => {
            if (config.popup) config.popup.duration = parseInt(e.target.value);
            const valueDisplay = document.getElementById('popup-duration-value');
            if (valueDisplay && config.popup) valueDisplay.textContent = `${config.popup.duration}s`;
        });

        // Listener for popup max messages input
        document.getElementById('popup-max-messages')?.addEventListener('change', (e) => {
            if (config.popup) config.popup.maxMessages = parseInt(e.target.value);
        });

        /**
         * Save current settings from the panel to the config object and local storage.
         */
        function saveConfiguration() {
            try {
                const getValue = (element, defaultValue, isNumber = false, isBool = false, isOpacity = false) => {
                    if (!element) return defaultValue;
                    if (isBool) return element.checked;
                    let value = element.value;
                    if (isNumber) return parseInt(value, 10) || defaultValue;
                    if (isOpacity) return !isNaN(parseFloat(value)) ? parseFloat(value) / 100.0 : defaultValue;
                    return value || defaultValue;
                };
                const getColor = (inputElement, buttonSelector, defaultColor) => {
                    const targetType = buttonSelector.includes('bg') ? 'bg' : buttonSelector.includes('border') ? 'border' : buttonSelector.includes('text') ? 'text' : 'username';
                    const activeButton = document.querySelector(`${buttonSelector}.active`);
                    const activeColor = activeButton?.dataset.color;

                    if (targetType === 'bg') {
                        const hexFromInput = inputElement?.value;
                        const isTransparentActive = document.querySelector('.color-btn[data-target="bg"][data-color="transparent"]')?.classList.contains('active');
                        const currentOpacity = getOpacity(bgOpacityInput, -1);
                        if (isTransparentActive && currentOpacity === 0) return '#000000';
                        if (hexFromInput) return hexFromInput;
                        console.warn("[getColor/bg] Background color input was empty, falling back.");
                        return defaultColor;
                    } else {
                        if (activeButton) {
                            if (targetType === 'border' && activeColor === 'transparent') return 'transparent';
                            return activeColor;
                        }
                        return inputElement?.value || defaultColor;
                    }
                };
                const getOpacity = (element, defaultValue) => {
                    if (!element) return defaultValue;
                    const parsedValue = parseFloat(element.value);
                    return !isNaN(parsedValue) ? parsedValue / 100.0 : defaultValue;
                };

                const currentFontValue = window.availableFonts?.[currentFontIndex]?.value || config.fontFamily;
                const currentThemeValue = lastAppliedThemeValue;
                const bgImageOpacityValue = getOpacity(bgImageOpacityInput, config.bgImageOpacity ?? 0.55);
                const currentBgColorHex = getColor(bgColorInput, '.color-buttons [data-target="bg"]', config.bgColor || '#121212');
                const currentBgOpacity = getOpacity(bgOpacityInput, config.bgColorOpacity ?? 0.85);
                const currentFullTheme = window.availableThemes?.find(t => t.value === currentThemeValue) || {};

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
                    bgImage: currentFullTheme.backgroundImage || config.bgImage || null,
                    bgImageOpacity: bgImageOpacityValue,
                    borderRadius: borderRadiusPresets?.querySelector('.preset-btn.active')?.dataset.value || config.borderRadius,
                    boxShadow: boxShadowPresets?.querySelector('.preset-btn.active')?.dataset.value || config.boxShadow,
                    textShadow: textShadowPresets?.querySelector('.preset-btn.active')?.dataset.value || config.textShadow, // Added textShadow
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
                    lastChannel: config.lastChannel,
                    // Badge settings from UI
                    showBadges: getValue(showBadgesToggle, config.showBadges, false, true),
                    badgeEndpointUrlGlobal: config.badgeEndpointUrlGlobal,
                    badgeEndpointUrlChannel: config.badgeEndpointUrlChannel,
                    // TTLs are not user-configurable, so they retain their value from `config`
                    badgeCacheGlobalTTL: config.badgeCacheGlobalTTL,
                    badgeCacheChannelTTL: config.badgeCacheChannelTTL,
                    badgeFallbackHide: true, // Always hide badge failures
                    // Emote settings from UI
                    enlargeSingleEmotes: getValue(enlargeSingleEmotesToggle, config.enlargeSingleEmotes, false, true),
                };

                config = newConfig;
                applyConfiguration(config);

                const scene = getUrlParameter('scene') || 'default';
                localStorage.setItem(`chatConfig-${scene}`, JSON.stringify(config));
                closeConfigPanel(false);
                if (config.chatMode === 'popup') {
                    addChatMessage({ username: 'Test', message: 'Test message', color: config.usernameColor, tags: {} });
                }
                // After saving, if badge URLs changed or showBadges toggled, re-fetch badges
                fetchGlobalBadges();
                if (currentBroadcasterId) {
                    fetchChannelBadges(currentBroadcasterId);
                }


            } catch (error) {
                console.error("Error saving configuration:", error);
                addSystemMessage("Error saving settings. Check console.");
            }
        }

        // Apply default settings
        function applyDefaultSettings() {
            config = {
                chatMode: 'window', bgColor: '#121212', bgColorOpacity: 0.85,
                bgImage: null, bgImageOpacity: 0.55, borderColor: '#9147ff',
                textColor: '#efeff1', usernameColor: '#9147ff', fontSize: 14,
                fontFamily: "'Atkinson Hyperlegible', sans-serif",
                chatWidth: 95, chatHeight: 95, maxMessages: 50, showTimestamps: true,
                overrideUsernameColors: false, borderRadius: '8px', boxShadow: 'soft',
                textShadow: 'none', // Added textShadow 
                theme: 'default', lastChannel: '',
                popup: { direction: 'from-bottom', duration: 5, maxMessages: 3 },
                showBadges: true,
                badgeEndpointUrlGlobal: 'https://us-central1-chat-themer.cloudfunctions.net/getGlobalBadges',
                badgeEndpointUrlChannel: 'https://us-central1-chat-themer.cloudfunctions.net/getChannelBadges',
                badgeCacheGlobalTTL: 12 * 60 * 60 * 1000,
                badgeCacheChannelTTL: 1 * 60 * 60 * 1000,
                badgeFallbackHide: true, // Always hide badge failures
            };
        }

        // Apply border radius visually and update config
        function applyBorderRadius(value) {
            const cssValue = window.getBorderRadiusValue(value);
            if (!cssValue) return;
            document.documentElement.style.setProperty('--chat-border-radius', cssValue);
            config.borderRadius = value;
            highlightBorderRadiusButton(cssValue);
            updateThemePreview();
        }

        // Apply box shadow visually and update config
        function applyBoxShadow(preset) {
            const cssValue = window.getBoxShadowValue(preset);
            if (!cssValue) return;
            document.documentElement.style.setProperty('--chat-box-shadow', cssValue);
            config.boxShadow = preset;
            highlightBoxShadowButton(preset);
            updateThemePreview();
        }

        borderRadiusPresets?.querySelectorAll('.preset-btn')
            .forEach(btn => btn.addEventListener('click', () => applyBorderRadius(btn.dataset.value)));
        boxShadowPresets?.querySelectorAll('.preset-btn')
            .forEach(btn => btn.addEventListener('click', () => applyBoxShadow(btn.dataset.value)));

        // Apply text shadow visually and update config
        function applyTextShadow(preset) {
            const cssValue = getTextShadowValue(preset);
            if (!cssValue) return;
            document.documentElement.style.setProperty('--chat-text-shadow', cssValue);
            config.textShadow = preset;
            highlightTextShadowButton(preset);
            updateThemePreview();
        }

        textShadowPresets?.querySelectorAll('.preset-btn')
            .forEach(btn => btn.addEventListener('click', () => applyTextShadow(btn.dataset.value))); // Added for text shadow

        /**
         * Update all config panel controls to match the current config object.
         */
        function updateConfigPanelFromConfig() {
            if (!configPanel) return;

            const hexColor = config.bgColor || '#121212';
            const opacityPercent = Math.round((config.bgColorOpacity ?? 0.85) * 100);
            if (bgColorInput) bgColorInput.value = hexColor;
            if (bgOpacityInput && bgOpacityValue) {
                bgOpacityInput.value = opacityPercent;
                bgOpacityValue.textContent = `${opacityPercent}%`;
            }

            if (borderColorInput) borderColorInput.value = config.borderColor === 'transparent' ? '#000000' : config.borderColor;
            if (textColorInput) textColorInput.value = config.textColor || '#efeff1';
            if (usernameColorInput) usernameColorInput.value = config.usernameColor || '#9147ff';
            highlightActiveColorButtons();

            highlightBorderRadiusButton(getBorderRadiusValue(config.borderRadius));
            highlightBoxShadowButton(config.boxShadow);
            highlightTextShadowButton(config.textShadow); // Added for text shadow

            if (overrideUsernameColorsInput) overrideUsernameColorsInput.checked = config.overrideUsernameColors;
            if (fontSizeSlider) fontSizeSlider.value = config.fontSize;
            if (fontSizeValue) fontSizeValue.textContent = `${config.fontSize}px`;
            if (chatWidthInput) chatWidthInput.value = config.chatWidth;
            if (chatWidthValue) chatWidthValue.textContent = `${config.chatWidth}%`;
            if (chatHeightInput) chatHeightInput.value = config.chatHeight;
            if (chatHeightValue) chatHeightValue.textContent = `${config.chatHeight}%`;
            if (maxMessagesInput) maxMessagesInput.value = config.maxMessages;
            if (showTimestampsInput) showTimestampsInput.checked = config.showTimestamps;

            const fontIndex = window.availableFonts?.findIndex(f => f.value === config.fontFamily) ?? -1;
            currentFontIndex = (fontIndex !== -1) ? fontIndex : (window.availableFonts?.findIndex(f => f.value?.includes('Atkinson')) ?? 0);
            if (fontIndex === -1 && config.fontFamily !== window.availableFonts?.[currentFontIndex]?.value) {
                console.warn(`Font from config ("${config.fontFamily}") not found or mismatch, defaulting.`);
                config.fontFamily = window.availableFonts?.[currentFontIndex]?.value || "'Atkinson Hyperlegible', sans-serif";
            }
            updateFontDisplay();

            const themeIndex = window.availableThemes?.findIndex(t => t.value === config.theme) ?? -1;
            const currentThemeIdx = (themeIndex !== -1) ? themeIndex : (window.availableThemes?.findIndex(t => t.value === 'default') ?? 0);
            if (themeIndex === -1 && config.theme !== window.availableThemes?.[currentThemeIdx]?.value) {
                console.warn(`Theme from config ("${config.theme}") not found or mismatch, defaulting.`);
                config.theme = window.availableThemes?.[currentThemeIdx]?.value || 'default';
            }
            if (typeof window.updateThemeDetails === 'function') window.updateThemeDetails(window.availableThemes?.[currentThemeIdx]);
            if (typeof window.highlightActiveCard === 'function') window.highlightActiveCard(window.availableThemes?.[currentThemeIdx]?.value);

            if (channelInput) channelInput.value = config.lastChannel || '';
            const isConnected = socket && socket.readyState === WebSocket.OPEN;
            if (channelForm) channelForm.style.display = isConnected ? 'none' : 'flex';
            if (disconnectBtn) {
                disconnectBtn.style.display = isConnected ? 'block' : 'none';
                if (isConnected) disconnectBtn.textContent = `Disconnect from ${channel || config.lastChannel}`;
            }

            const currentMode = config.chatMode || 'window';
            document.querySelectorAll('input[name="chat-mode"]').forEach(radio => radio.checked = (radio.value === currentMode));
            updateModeSpecificSettingsVisibility(currentMode);

            const currentPopupDirection = config.popup?.direction || 'from-bottom';
            document.querySelectorAll('input[name="popup-direction"]').forEach(radio => radio.checked = (radio.value === currentPopupDirection));

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

            // Update Badge Configuration UI
            if (showBadgesToggle) showBadgesToggle.checked = config.showBadges;

            // Update Emote Configuration UI
            if (enlargeSingleEmotesToggle) enlargeSingleEmotesToggle.checked = config.enlargeSingleEmotes;

            updateThemePreview(); // Ensure preview is updated with all settings
        }

        loadSavedConfig();
        if (config.chatMode === 'popup') {
            addChatMessage({ username: 'Test', message: 'Test message', color: config.usernameColor, tags: {} });
        }

        document.addEventListener('theme-generated-and-added', (event) => {
            if (!(event.detail && event.detail.themeValue)) {
                console.warn("[Event Listener] Received theme-generated-and-added event without valid themeValue.");
            }
        });


        function applyConfiguration(cfg) {
            if (!cfg) { console.error("applyConfiguration called with invalid config"); return; }

            if (cfg.theme) lastAppliedThemeValue = cfg.theme;

            const baseBgColor = cfg.bgColor || '#121212';
            const bgOpacity = cfg.bgColorOpacity ?? 0.85;
            let finalRgbaColor;
            try { finalRgbaColor = hexToRgba(baseBgColor, bgOpacity); }
            catch (e) {
                console.error(`[applyConfiguration] Error converting hex ${baseBgColor} with opacity ${bgOpacity}:`, e);
                finalRgbaColor = `rgba(18, 18, 18, ${bgOpacity.toFixed(2)})`;
            }

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
            rootStyle.setProperty('--chat-text-shadow', getTextShadowValue(cfg.textShadow || 'none')); // Added textShadow

            const bgImageURL = cfg.bgImage && cfg.bgImage !== 'none' ? `url("${cfg.bgImage}")` : 'none';
            rootStyle.setProperty('--chat-bg-image', bgImageURL);
            rootStyle.setProperty('--chat-bg-image-opacity', cfg.bgImageOpacity ?? 0.55);

            rootStyle.setProperty('--popup-bg-color', finalRgbaColor);
            rootStyle.setProperty('--popup-border-color', cfg.borderColor || '#444444');
            rootStyle.setProperty('--popup-text-color', cfg.textColor || '#efeff1');
            rootStyle.setProperty('--popup-username-color', cfg.usernameColor || '#9147ff');
            rootStyle.setProperty('--popup-bg-image', bgImageURL);
            rootStyle.setProperty('--popup-bg-image-opacity', cfg.bgImageOpacity ?? 0.55);

            if (themePreview) themePreview.style.fontSize = `${cfg.fontSize || 14}px`;

            const rootClassList = document.documentElement.classList;
            const themeClasses = ['light-theme', 'natural-theme', 'transparent-theme', 'pink-theme', 'cyberpunk-theme'];
            Array.from(rootClassList).forEach(cls => {
                if (cls.endsWith('-theme') && !themeClasses.includes(cls)) {
                    themeClasses.push(cls);
                }
            });
            rootClassList.remove(...themeClasses);
            if (cfg.theme && cfg.theme !== 'default') rootClassList.add(cfg.theme);
            rootClassList.toggle('override-username-colors', !!cfg.overrideUsernameColors);

            rootClassList.toggle('hide-timestamps', !cfg.showTimestamps);
            switchChatMode(cfg.chatMode || 'window', true);

            updateColorPreviews();
        }

        if (showTimestampsInput) {
            if (!showTimestampsInput.dataset.listenerAttachedPreview) {
                showTimestampsInput.addEventListener('change', () => {
                    config.showTimestamps = showTimestampsInput.checked;
                    updateThemePreview();
                });
                showTimestampsInput.dataset.listenerAttachedPreview = 'true';
            }
        } else { console.warn("Show Timestamps checkbox element not found."); }

        function updateConnectionStateUI(isConnected) {
            const isPopupMode = config.chatMode === 'popup';
            if (initialConnectionPrompt) initialConnectionPrompt.style.display = isConnected ? 'none' : 'flex';
            if (popupContainer) popupContainer.style.display = isConnected && isPopupMode ? 'block' : 'none';
            if (chatWrapper) chatWrapper.style.display = isConnected && !isPopupMode ? 'block' : 'none';
            document.body.classList.toggle('disconnected', !isConnected);
            updateStatus(isConnected);
        }

        if (initialConnectBtn && initialChannelInput) {
            initialConnectBtn.addEventListener('click', () => {
                if (channelInput) channelInput.value = initialChannelInput.value;
                connectToChat();
            });
            initialChannelInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (channelInput) channelInput.value = initialChannelInput.value;
                    connectToChat();
                }
            });
            initialChannelInput.addEventListener('input', () => {
                if (channelInput) channelInput.value = initialChannelInput.value;
            });
        } else { console.error("Initial connection prompt elements not found."); }

        if (openSettingsFromPromptBtn && configPanel) {
            openSettingsFromPromptBtn.addEventListener('click', () => {
                if (initialChannelInput && channelInput) channelInput.value = initialChannelInput.value;
                openSettingsPanel();
            });
        }

        if (connectBtn && channelInput) {
            if (!connectBtn.dataset.listenerAttachedPanel) {
                connectBtn.addEventListener('click', connectToChat);
                connectBtn.dataset.listenerAttachedPanel = 'true';
            }
            channelInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); e.stopPropagation();
                    connectToChat();
                }
            });
            channelInput.addEventListener('input', () => {
                if (initialChannelInput) initialChannelInput.value = channelInput.value;
            });
        }

        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', disconnectChat);
        }

        function loadSavedConfig() {
            try {
                const sceneName = getUrlParameter('scene') || 'default';
                const savedConfig = localStorage.getItem(`chatConfig-${sceneName}`);
                if (savedConfig) {
                    const loadedConfig = JSON.parse(savedConfig);
                    const defaultConfigForMerge = {
                        showBadges: true,
                        badgeEndpointUrlGlobal: 'https://us-central1-chat-themer.cloudfunctions.net/getGlobalBadges',
                        badgeEndpointUrlChannel: 'https://us-central1-chat-themer.cloudfunctions.net/getChannelBadges',
                        badgeCacheGlobalTTL: 12 * 60 * 60 * 1000,
                        badgeCacheChannelTTL: 1 * 60 * 60 * 1000,
                        badgeFallbackHide: true, // Always hide badge failures
                        ...config
                    };
                    config = { ...defaultConfigForMerge, ...loadedConfig };
                }
                applyConfiguration(config);
                updateConfigPanelFromConfig();

                if (config.lastChannel) {
                    if (channelInput) channelInput.value = config.lastChannel;
                    if (initialChannelInput) initialChannelInput.value = config.lastChannel;
                    connectToChat();
                } else {
                    updateConnectionStateUI(false);
                    if (channelInput) channelInput.value = '';
                    if (initialChannelInput) initialChannelInput.value = '';
                }

            } catch (e) {
                console.error("Error loading or parsing configuration:", e);
                applyDefaultSettings();
                applyConfiguration(config);
                updateConfigPanelFromConfig();
                updateConnectionStateUI(false);
                if (channelInput) channelInput.value = '';
                if (initialChannelInput) initialChannelInput.value = '';
            }
        }

        function saveLastChannelOnly(channelToSave) {
            if (!channelToSave) {
                console.warn("[saveLastChannelOnly] Attempted to save empty channel.");
                return;
            }
            try {
                const scene = getUrlParameter('scene') || 'default';
                const configKey = `chatConfig-${scene}`;
                let currentFullConfig = {};
                try {
                    const saved = localStorage.getItem(configKey);
                    if (saved) currentFullConfig = JSON.parse(saved);
                } catch (parseError) { console.error("[saveLastChannelOnly] Error parsing existing config:", parseError); }

                currentFullConfig.lastChannel = channelToSave;
                localStorage.setItem(configKey, JSON.stringify(currentFullConfig));
                config.lastChannel = channelToSave;
            } catch (storageError) {
                console.error("[saveLastChannelOnly] Error saving lastChannel:", storageError);
            }
        }

        function disconnectChat() {
            if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
                isExplicitDisconnect = true;
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
                reconnectAttempts = 0;
                socket.close();
            } else {
                updateConnectionStateUI(false);
                if (disconnectBtn) disconnectBtn.style.display = 'none';
                if (channelForm) channelForm.style.display = 'flex';
                isExplicitDisconnect = false;
            }
        }

        function scheduleReconnect(channelToReconnect) {
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                addSystemMessage("Failed to reconnect after multiple attempts.");
                updateConnectionStateUI(false);
                reconnectAttempts = 0;
                if (initialChannelInput) initialChannelInput.value = channelToReconnect || config.lastChannel || '';
                return;
            }

            let delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
            delay = Math.min(delay, MAX_RECONNECT_DELAY);
            reconnectAttempts++;
            addSystemMessage(`Reconnecting in ${Math.round(delay / 1000)}s... (Attempt ${reconnectAttempts})`);

            if (channelInput) channelInput.value = channelToReconnect;
            if (initialChannelInput) initialChannelInput.value = channelToReconnect;

            clearTimeout(reconnectTimer);

            reconnectTimer = setTimeout(() => {
                if (channelInput && channelInput.value !== channelToReconnect) {
                    console.warn(`Channel input changed during reconnect delay. Using original: ${channelToReconnect}`);
                    channelInput.value = channelToReconnect;
                }
                if (initialChannelInput && initialChannelInput.value !== channelToReconnect) {
                    initialChannelInput.value = channelToReconnect;
                }
                connectToChat();
            }, delay);
        }
        // Add change listener for badge toggle to update theme preview
        if (showBadgesToggle) {
            showBadgesToggle.addEventListener('change', updateThemePreview);
        }

    } // End of initApp
})(); // End of IIFE