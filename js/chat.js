// ES6 Module Imports
import { UIHelpers } from './modules/ui-helpers.js';
import { ScrollManager } from './modules/scroll-manager.js';
import { BadgeManager } from './modules/badge-manager.js';
import { ConfigManager } from './modules/config-manager.js';
import { ChatRenderer } from './modules/chat-renderer.js';
import { ChatConnection } from './modules/chat-connection.js';

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

        // DOM elements
        const chatContainer = document.getElementById('chat-container');
        const chatWrapper = document.getElementById('chat-wrapper');
        const popupContainer = document.getElementById('popup-container');
        const chatMessages = document.getElementById('chat-messages');
        const scrollArea = document.getElementById('chat-scroll-area');
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
        const textShadowPresets = document.getElementById('text-shadow-presets');
        const prevFontBtn = document.getElementById('prev-font');
        const nextFontBtn = document.getElementById('next-font');
        const currentFontDisplay = document.getElementById('current-font');
        const themePreview = document.getElementById('theme-preview');
        const channelForm = document.getElementById('channel-form');
        const showBadgesToggle = document.getElementById('show-badges-toggle');
        const enlargeSingleEmotesToggle = document.getElementById('enlarge-single-emotes-toggle');
        const bgImageOpacityInput = document.getElementById('bg-image-opacity');
        const bgImageOpacityValue = document.getElementById('bg-image-opacity-value');

        // Store config state when panel opens
        let initialConfigBeforeEdit = null;

        // Font selection
        let currentFontIndex = 0;

        // Theme selection
        let lastAppliedThemeValue = 'default';

        // Initialize modules
        const configManager = new ConfigManager();
        const scrollManager = new ScrollManager(scrollArea, chatMessages);
        const badgeManager = new BadgeManager(configManager.config);
        const chatRenderer = new ChatRenderer(configManager.config, scrollManager, badgeManager);
        const chatConnection = new ChatConnection(configManager, chatRenderer, badgeManager);

        // Wire up switchChatMode callback to ConfigManager (defined later)
        // This will be set after switchChatMode function is defined

        // Update connection state UI handler
        chatConnection.onConnectionChange((isConnected, channelName) => {
            updateConnectionStateUI(isConnected);
            if (disconnectBtn) {
                disconnectBtn.style.display = isConnected ? 'block' : 'none';
                if (isConnected) disconnectBtn.textContent = `Disconnect from ${channelName}`;
            }
            if (channelForm) channelForm.style.display = isConnected ? 'none' : 'flex';
        });

        // --- THEME-RELATED FUNCTIONS ---

        /**
         * Apply a selected theme
         */
        function applyTheme(themeName) {
            if (!window.availableThemes?.length) {
                console.error('Available themes not initialized yet.');
                return;
            }
            let theme = window.availableThemes.find(t => t.value === themeName || t.name === themeName);
            if (!theme) {
                console.warn(`Theme "${themeName}" not found. Applying default.`);
                theme = window.availableThemes.find(t => t.value === 'default') || window.availableThemes[0];
                if (!theme) return;
            }

            // Parse theme background color and opacity
            let themeBgHex = '#121212';
            let themeBgOpacity = 0.85;
            if (theme.bgColor && typeof theme.bgColor === 'string') {
                const bgColorLower = theme.bgColor.trim().toLowerCase();
                if (bgColorLower.startsWith('rgba')) {
                    try {
                        const parts = bgColorLower.substring(5, bgColorLower.indexOf(')')).split(',');
                        if (parts.length === 4) {
                            const r = parseInt(parts[0].trim(), 10);
                            const g = parseInt(parts[1].trim(), 10);
                            const b = parseInt(parts[2].trim(), 10);
                            const a = parseFloat(parts[3].trim());
                            themeBgHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
                            themeBgOpacity = !isNaN(a) ? Math.max(0, Math.min(1, a)) : 0.85;
                        }
                    } catch (e) {
                        console.error(`[applyTheme] Error parsing rgba string "${theme.bgColor}":`, e);
                    }
                } else if (bgColorLower.startsWith('#')) {
                    themeBgHex = theme.bgColor;
                    themeBgOpacity = theme.bgColorOpacity ?? 0.85;
                }
            } else {
                themeBgOpacity = theme.bgColorOpacity ?? 0.85;
            }

            // Update config with theme settings
            configManager.updateConfig('theme', theme.value);
            configManager.updateConfig('bgColor', themeBgHex);
            configManager.updateConfig('bgColorOpacity', themeBgOpacity);
            configManager.updateConfig('borderColor', theme.borderColor === 'transparent' ? 'transparent' : (theme.borderColor || '#9147ff'));
            configManager.updateConfig('textColor', theme.textColor || '#efeff1');
            configManager.updateConfig('usernameColor', theme.usernameColor || '#9147ff');
            configManager.updateConfig('borderRadius', theme.borderRadius || theme.borderRadiusValue || '8px');
            configManager.updateConfig('boxShadow', theme.boxShadow || theme.boxShadowValue || 'none');
            configManager.updateConfig('textShadow', theme.textShadow || 'none');
            configManager.updateConfig('bgImage', theme.backgroundImage || null);
            configManager.updateConfig('bgImageOpacity', theme.bgImageOpacity ?? 0.55);

            // Update font family from theme
            if (theme.fontFamily) {
                let fontIndex = window.availableFonts?.findIndex(f => {
                    const themeFont = typeof theme.fontFamily === 'string' ? theme.fontFamily.trim() : '';
                    return (f.name?.trim().toLowerCase() === themeFont.toLowerCase()) || (f.value?.trim() === themeFont);
                }) ?? -1;

                if (fontIndex === -1) {
                    console.warn(`[applyTheme] Theme font "${theme.fontFamily}" not found. Using default.`);
                    fontIndex = window.availableFonts?.findIndex(f => f.value?.includes('Atkinson')) ?? 0;
                }
                currentFontIndex = fontIndex;
                configManager.updateConfig('fontFamily', window.availableFonts[currentFontIndex]?.value || "'Atkinson Hyperlegible', sans-serif");
                updateFontDisplay();
            } else {
                configManager.updateConfig('fontFamily', window.availableFonts?.[currentFontIndex]?.value || "'Atkinson Hyperlegible', sans-serif");
            }

            // Apply the merged configuration visually
            configManager.applyConfiguration(configManager.config);

            // Update badge manager config reference
            badgeManager.config = configManager.config;
            chatRenderer.config = configManager.config;

            // Update UI controls
            if (bgColorInput) bgColorInput.value = configManager.config.bgColor;
            if (bgOpacityInput && bgOpacityValue) {
                const opacityPercent = Math.round(configManager.config.bgColorOpacity * 100);
                bgOpacityInput.value = opacityPercent;
                bgOpacityValue.textContent = `${opacityPercent}%`;
            }
            if (borderColorInput) borderColorInput.value = configManager.config.borderColor === 'transparent' ? '#000000' : configManager.config.borderColor;
            if (textColorInput) textColorInput.value = configManager.config.textColor;
            if (usernameColorInput) usernameColorInput.value = configManager.config.usernameColor;
            if (bgImageOpacityInput && bgImageOpacityValue) {
                const imageOpacityPercent = Math.round(configManager.config.bgImageOpacity * 100);
                bgImageOpacityInput.value = imageOpacityPercent;
                bgImageOpacityValue.textContent = `${imageOpacityPercent}%`;
            }

            // Update preset button highlights
            UIHelpers.highlightBorderRadiusButton(UIHelpers.getBorderRadiusValue(configManager.config.borderRadius), borderRadiusPresets);
            UIHelpers.highlightBoxShadowButton(configManager.config.boxShadow, boxShadowPresets);
            UIHelpers.highlightTextShadowButton(configManager.config.textShadow, textShadowPresets);
            highlightActiveColorButtons();

            updateThemePreview();
            lastAppliedThemeValue = theme.value;
        }
        window.applyTheme = applyTheme; // Expose globally for theme-carousel.js

        /**
         * Update font display in settings panel
         */
        function updateFontDisplay() {
            if (!window.availableFonts?.length) {
                console.error('Available fonts not initialized yet.');
                if (currentFontDisplay) currentFontDisplay.textContent = 'Error';
                return;
            }
            if (currentFontIndex < 0 || currentFontIndex >= window.availableFonts.length) {
                console.warn(`Invalid currentFontIndex (${currentFontIndex}), resetting to 0.`);
                currentFontIndex = 0;
            }
            const currentFont = window.availableFonts[currentFontIndex];
            if (!currentFont) {
                console.error(`Could not find font at index ${currentFontIndex}`);
                if (currentFontDisplay) currentFontDisplay.textContent = 'Error';
                return;
            }

            if (currentFontDisplay) currentFontDisplay.textContent = currentFont.name;
            configManager.updateConfig('fontFamily', currentFont.value);
            document.documentElement.style.setProperty('--font-family', currentFont.value);

            // Load Google Font if applicable
            if (currentFont.isGoogleFont && currentFont.googleFontFamily && window.loadGoogleFont) {
                window.loadGoogleFont(currentFont.googleFontFamily);
            }

            updateThemePreview();
        }

        /**
         * Toggle between window and popup modes
         */
        function switchChatMode(mode, applyVisualsOnly = false) {
            try {
                configManager.updateConfig('chatMode', mode);

                if (!popupContainer || !chatContainer || !chatWrapper) {
                    console.error('Required chat containers not found in DOM');
                    return;
                }

                const popupMessages = document.getElementById('popup-messages');
                if (popupMessages) popupMessages.innerHTML = '';

                const isPopup = (mode === 'popup');
                popupContainer.style.display = isPopup ? 'block' : 'none';
                chatWrapper.style.display = isPopup ? 'none' : 'block';
                document.body.classList.toggle('popup-mode', isPopup);
                document.body.classList.toggle('window-mode', !isPopup);

                if (!applyVisualsOnly && chatMessages) {
                    chatMessages.innerHTML = '';
                    chatRenderer.addSystemMessage(isPopup ? 'Switched to popup mode.' : 'Switched to window mode.');
                    chatRenderer.addChatMessage({ username: 'System', message: 'Chat mode switched.', color: configManager.config.usernameColor, tags: {} });
                }

                if (isPopup && popupMessages && configManager.config.popup) {
                    const direction = configManager.config.popup.direction || 'from-bottom';
                    const position = { top: 'auto', bottom: '10px' };
                    if (['from-top', 'from-left', 'from-right'].includes(direction)) {
                        position.top = '10px'; position.bottom = 'auto';
                    }
                    popupMessages.removeAttribute('style');
                    popupMessages.style.top = position.top;
                    popupMessages.style.bottom = position.bottom;
                }

                updateModeSpecificSettingsVisibility(mode);

            } catch (error) {
                console.error('Error switching chat mode:', error);
                chatRenderer.addSystemMessage('Error switching chat mode.');
            }
        }

        /**
         * Helper function to show/hide mode-specific settings
         */
        function updateModeSpecificSettingsVisibility(mode) {
            const isPopup = mode === 'popup';
            document.querySelectorAll('.popup-setting').forEach(el => el.style.display = isPopup ? 'flex' : 'none');
            document.querySelectorAll('.window-only-setting').forEach(el => el.style.display = isPopup ? 'none' : 'flex');
        }

        // Register switchChatMode callback with ConfigManager
        configManager.setSwitchChatModeCallback(switchChatMode);

        /**
         * Update the theme preview display
         */
        function updateThemePreview() {
            if (!themePreview) return;

            const showTimestamps = showTimestampsInput?.checked ?? configManager.config?.showTimestamps ?? true;
            const bgColor = bgColorInput?.value || '#1e1e1e';
            const bgColorOpacity = (bgOpacityInput ? parseInt(bgOpacityInput.value) : (configManager.config?.bgColorOpacity ?? 0.85) * 100) / 100.0;
            const borderColor = borderColorInput?.value || '#444444';
            const textColor = textColorInput?.value || '#efeff1';
            const usernameColor = usernameColorInput?.value || '#9147ff';
            const timestampColor = configManager.config?.timestampColor || '#adadb8';
            const fontFamily = window.availableFonts?.[currentFontIndex]?.value || configManager.config?.fontFamily || "'Atkinson Hyperlegible', sans-serif";
            const activeBorderRadiusBtn = borderRadiusPresets?.querySelector('.preset-btn.active');
            const borderRadiusValue = activeBorderRadiusBtn?.dataset.value ?? configManager.config?.borderRadius ?? '8px';
            const borderRadius = UIHelpers.getBorderRadiusValue(borderRadiusValue);
            const activeBoxShadowBtn = boxShadowPresets?.querySelector('.preset-btn.active');
            const boxShadowValue = activeBoxShadowBtn?.dataset.value ?? configManager.config?.boxShadow ?? 'none';
            const boxShadow = UIHelpers.getBoxShadowValue(boxShadowValue);
            const activeTextShadowBtn = textShadowPresets?.querySelector('.preset-btn.active');
            const textShadowValue = activeTextShadowBtn?.dataset.value ?? configManager.config?.textShadow ?? 'none';
            const textShadow = UIHelpers.getTextShadowValue(textShadowValue);
            const bgImage = configManager.config?.bgImage || 'none';

            // Update chat wrapper background image
            if (chatWrapper) {
                const bgImageValue = bgImage === 'none' ? 'none' : (bgImage.startsWith('url') ? bgImage : `url("${bgImage}")`);
                document.documentElement.style.setProperty('--chat-bg-image', bgImageValue);
                document.documentElement.style.setProperty('--popup-bg-image', bgImageValue);
            }

            // Background image opacity logic
            let currentPreviewOpacity = themePreview.style.getPropertyValue('--preview-bg-image-opacity');
            let bgImageOpacity;
            if (currentPreviewOpacity !== '' && !isNaN(parseFloat(currentPreviewOpacity))) {
                bgImageOpacity = parseFloat(currentPreviewOpacity);
            } else {
                const bgImageOpacityValueFromConfig = configManager.config?.bgImageOpacity;
                bgImageOpacity = bgImageOpacityValueFromConfig !== undefined && bgImageOpacityValueFromConfig !== null
                    ? bgImageOpacityValueFromConfig
                    : (bgImageOpacityInput ? parseInt(bgImageOpacityInput.value, 10) / 100.0 : 0.55);
            }
            themePreview.style.setProperty('--preview-bg-image-opacity', bgImageOpacity.toFixed(2));

            const borderTransparentButton = document.querySelector('.color-btn[data-target="border"][data-color="transparent"]');
            const finalBorderColor = (borderTransparentButton?.classList.contains('active')) ? 'transparent' : borderColor;

            let finalBgColor;
            const bgTransparentButton = document.querySelector('.color-btn[data-target="bg"][data-color="transparent"]');
            if (bgTransparentButton?.classList.contains('active')) {
                finalBgColor = 'transparent';
            } else {
                try {
                    finalBgColor = UIHelpers.hexToRgba(bgColor, bgColorOpacity);
                } catch (e) {
                    console.error(`Error converting hex ${bgColor} for preview:`, e);
                    finalBgColor = `rgba(30, 30, 30, ${bgColorOpacity.toFixed(2)})`;
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
            previewStyle.setProperty('--preview-text-shadow', textShadow);
            previewStyle.setProperty('--preview-bg-image', bgImage === 'none' ? 'none' : `url("${bgImage}")`);

            const fontSize = fontSizeSlider?.value || configManager.config?.fontSize || 14;
            previewStyle.fontSize = `${fontSize}px`;

            const ts1 = showTimestamps ? '<span class="timestamp">12:34 </span>' : '';
            const ts2 = showTimestamps ? '<span class="timestamp">12:35 </span>' : '';

            let previewBadgesHtml = '';
            const shouldShowBadgesInPreview = showBadgesToggle?.checked ?? configManager.config.showBadges;

            if (shouldShowBadgesInPreview) {
                let firstGlobalBadgeInfo = null;
                if (badgeManager.globalBadges?.data) {
                    const firstSetId = Object.keys(badgeManager.globalBadges.data)[0];
                    if (firstSetId && badgeManager.globalBadges.data[firstSetId]) {
                        const firstVersionId = Object.keys(badgeManager.globalBadges.data[firstSetId])[0];
                        if (firstVersionId) {
                            firstGlobalBadgeInfo = badgeManager.globalBadges.data[firstSetId][firstVersionId];
                        }
                    }
                }
                if (firstGlobalBadgeInfo?.imageUrl) {
                    previewBadgesHtml = `<img class="chat-badge" src="${firstGlobalBadgeInfo.imageUrl}" alt="${firstGlobalBadgeInfo.title || 'badge'}" title="${firstGlobalBadgeInfo.title || 'badge'}" style="height: calc(var(--font-size) * 0.9); vertical-align: middle; margin-right: 3px;">`;
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
        window.updateThemePreview = updateThemePreview; // Expose globally for theme-carousel.js

        /**
         * Update color previews and highlights
         */
        function updateColorPreviews() {
            highlightActiveColorButtons();
            updateThemePreview();
        }

        /**
         * Highlight active color buttons
         */
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

        // --- UI EVENT HANDLERS ---

        // Background color + opacity handling
        function updateBgColor() {
            if (!bgColorInput || !bgOpacityInput) return;
            const hexColor = bgColorInput.value;
            const opacity = parseInt(bgOpacityInput.value) / 100;
            const rgbaColorForCSS = UIHelpers.hexToRgba(hexColor, opacity);
            document.documentElement.style.setProperty('--chat-bg-color', rgbaColorForCSS);
            document.documentElement.style.setProperty('--popup-bg-color', rgbaColorForCSS);
            if (bgOpacityValue) bgOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
            updateThemePreview();
        }
        bgColorInput?.addEventListener('input', updateBgColor);
        bgOpacityInput?.addEventListener('input', updateBgColor);

        // Background image opacity handling
        function updateBgImageOpacity() {
            if (!bgImageOpacityInput) return;
            const opacity = parseInt(bgImageOpacityInput.value) / 100;
            document.documentElement.style.setProperty('--chat-bg-image-opacity', opacity);
            document.documentElement.style.setProperty('--popup-bg-image-opacity', opacity);
            if (bgImageOpacityValue) bgImageOpacityValue.textContent = `${bgImageOpacityInput.value}%`;
            updateThemePreview();
        }
        if (bgImageOpacityInput) bgImageOpacityInput.addEventListener('input', updateBgImageOpacity);

        // Color preset button click handlers
        document.querySelectorAll('.color-btn').forEach(button => {
            const color = button.getAttribute('data-color');
            if (color) button.style.backgroundColor = color;

            if (color === 'transparent' || ['#ffffff', '#ffdeec', '#f5f2e6'].includes(color)) {
                button.style.border = '1px solid #888';
            }
            if (['#000000', '#121212', '#1a1a1a', '#0c0c28', '#4e3629'].includes(color)) {
                button.style.color = 'white';
            } else {
                button.style.color = 'black';
            }

            button.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                const target = e.target.getAttribute('data-target');
                if (!target || !color) return;

                document.querySelectorAll(`.color-btn[data-target="${target}"]`).forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                switch (target) {
                    case 'bg':
                        if (color === 'transparent') {
                            if (bgColorInput) bgColorInput.value = '#000000';
                            if (bgOpacityInput) bgOpacityInput.value = 0;
                        } else {
                            if (bgColorInput) bgColorInput.value = color;
                        }
                        updateBgColor();
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
                updateColorPreviews();
            });
        });

        // Update colors directly from input fields
        borderColorInput?.addEventListener('input', () => {
            const value = borderColorInput.value;
            const finalColor = value === 'transparent' ? 'transparent' : value;
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
            configManager.updateConfig('fontSize', parseInt(value, 10));
            updateThemePreview();
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

        // Font selection carousel
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

            document.addEventListener('fonts-updated', () => {
                console.log('Fonts updated event received in chat.js');
                const fontIndex = window.availableFonts?.findIndex(f => f.value === configManager.config.fontFamily) ?? -1;
                if (fontIndex !== -1) {
                    currentFontIndex = fontIndex;
                }
                updateFontDisplay();
            });
            nextFontBtn.dataset.listenerAttached = 'true';
        }

        // Border radius presets
        function applyBorderRadius(value) {
            const cssValue = UIHelpers.getBorderRadiusValue(value);
            if (!cssValue) return;
            document.documentElement.style.setProperty('--chat-border-radius', cssValue);
            configManager.updateConfig('borderRadius', value);
            UIHelpers.highlightBorderRadiusButton(cssValue, borderRadiusPresets);
            updateThemePreview();
        }
        borderRadiusPresets?.querySelectorAll('.preset-btn')
            .forEach(btn => btn.addEventListener('click', () => applyBorderRadius(btn.dataset.value)));

        // Box shadow presets
        function applyBoxShadow(preset) {
            const cssValue = UIHelpers.getBoxShadowValue(preset);
            if (!cssValue) return;
            document.documentElement.style.setProperty('--chat-box-shadow', cssValue);
            configManager.updateConfig('boxShadow', preset);
            UIHelpers.highlightBoxShadowButton(preset, boxShadowPresets);
            updateThemePreview();
        }
        boxShadowPresets?.querySelectorAll('.preset-btn')
            .forEach(btn => btn.addEventListener('click', () => applyBoxShadow(btn.dataset.value)));

        // Text shadow presets
        function applyTextShadow(preset) {
            const cssValue = UIHelpers.getTextShadowValue(preset);
            if (!cssValue) return;
            document.documentElement.style.setProperty('--chat-text-shadow', cssValue);
            configManager.updateConfig('textShadow', preset);
            UIHelpers.highlightTextShadowButton(preset, textShadowPresets);
            updateThemePreview();
        }
        textShadowPresets?.querySelectorAll('.preset-btn')
            .forEach(btn => btn.addEventListener('click', () => applyTextShadow(btn.dataset.value)));

        // Chat mode radio buttons
        document.querySelectorAll('input[name="chat-mode"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    switchChatMode(e.target.value, false);
                    updateModeSpecificSettingsVisibility(e.target.value);
                }
            });
        });

        // Popup animation direction
        document.querySelectorAll('input[name="popup-direction"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (configManager.config.popup) configManager.updateConfig('popup', { ...configManager.config.popup, direction: e.target.value });
                    if (configManager.config.chatMode === 'popup') {
                        const popupMessages = document.getElementById('popup-messages');
                        if (popupMessages && configManager.config.popup) {
                            const direction = configManager.config.popup.direction || 'from-bottom';
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

        // Popup duration slider
        document.getElementById('popup-duration')?.addEventListener('input', (e) => {
            if (configManager.config.popup) {
                configManager.updateConfig('popup', { ...configManager.config.popup, duration: parseInt(e.target.value) });
            }
            const valueDisplay = document.getElementById('popup-duration-value');
            if (valueDisplay && configManager.config.popup) valueDisplay.textContent = `${configManager.config.popup.duration}s`;
        });

        // Popup max messages input
        document.getElementById('popup-max-messages')?.addEventListener('change', (e) => {
            if (configManager.config.popup) {
                configManager.updateConfig('popup', { ...configManager.config.popup, maxMessages: parseInt(e.target.value) });
            }
        });

        // Username color override toggle
        overrideUsernameColorsInput?.addEventListener('change', () => {
            const isChecked = overrideUsernameColorsInput.checked;
            configManager.updateConfig('overrideUsernameColors', isChecked);
            chatRenderer.config = configManager.config;
            document.documentElement.classList.toggle('override-username-colors', isChecked);
            updateThemePreview();
        });

        // Badge toggle
        if (showBadgesToggle) {
            showBadgesToggle.addEventListener('change', updateThemePreview);
        }

        // --- SETTINGS PANEL HANDLERS ---

        /**
         * Open settings panel
         */
        function openSettingsPanel() {
            if (!configPanel) return;
            initialConfigBeforeEdit = null;
            try {
                initialConfigBeforeEdit = JSON.parse(JSON.stringify(configManager.config));
            } catch (error) {
                console.error("Error storing config state for revert:", error);
                chatRenderer.addSystemMessage("Error: Could not store settings state for revert.");
            }

            const isConnected = chatConnection.isConnected();
            if (channelForm) channelForm.style.display = isConnected ? 'none' : 'flex';
            if (disconnectBtn) {
                disconnectBtn.style.display = isConnected ? 'block' : 'none';
                if (isConnected) disconnectBtn.textContent = `Disconnect from ${chatConnection.getCurrentChannel()}`;
            }

            updateConfigPanelFromConfig();
            configPanel.classList.add('visible');
            configPanel.style.display = 'block';
        }

        /**
         * Close settings panel
         */
        function closeConfigPanel(shouldRevert = false) {
            if (shouldRevert && initialConfigBeforeEdit) {
                try {
                    configManager.config = JSON.parse(JSON.stringify(initialConfigBeforeEdit));
                    configManager.applyConfiguration(configManager.config);
                    badgeManager.config = configManager.config;
                    chatRenderer.config = configManager.config;
                    updateConfigPanelFromConfig();
                } catch (error) {
                    console.error("Error during revert:", error);
                    chatRenderer.addSystemMessage("Error: Could not revert settings.");
                }
            }
            initialConfigBeforeEdit = null;
            if (configPanel) {
                configPanel.classList.remove('visible');
                configPanel.style.display = 'none';
            }
        }

        /**
         * Save configuration
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

                const currentFontValue = window.availableFonts?.[currentFontIndex]?.value || configManager.config.fontFamily;
                const currentThemeValue = lastAppliedThemeValue;
                const bgImageOpacityValue = getOpacity(bgImageOpacityInput, configManager.config.bgImageOpacity ?? 0.55);
                const currentBgColorHex = getColor(bgColorInput, '.color-buttons [data-target="bg"]', configManager.config.bgColor || '#121212');
                const currentBgOpacity = getOpacity(bgOpacityInput, configManager.config.bgColorOpacity ?? 0.85);
                const currentFullTheme = window.availableThemes?.find(t => t.value === currentThemeValue) || {};

                const newConfig = {
                    theme: currentThemeValue,
                    fontFamily: currentFontValue,
                    fontSize: getValue(fontSizeSlider, configManager.config.fontSize || 14, true),
                    bgColor: currentBgColorHex,
                    bgColorOpacity: currentBgOpacity,
                    borderColor: getColor(borderColorInput, '.color-buttons [data-target="border"]', configManager.config.borderColor || '#444444'),
                    textColor: getColor(textColorInput, '.color-buttons [data-target="text"]', configManager.config.textColor || '#efeff1'),
                    usernameColor: getColor(usernameColorInput, '.color-buttons [data-target="username"]', configManager.config.usernameColor || '#9147ff'),
                    overrideUsernameColors: getValue(overrideUsernameColorsInput, configManager.config.overrideUsernameColors || false, false, true),
                    bgImage: currentFullTheme.backgroundImage || configManager.config.bgImage || null,
                    bgImageOpacity: bgImageOpacityValue,
                    borderRadius: borderRadiusPresets?.querySelector('.preset-btn.active')?.dataset.value || configManager.config.borderRadius,
                    boxShadow: boxShadowPresets?.querySelector('.preset-btn.active')?.dataset.value || configManager.config.boxShadow,
                    textShadow: textShadowPresets?.querySelector('.preset-btn.active')?.dataset.value || configManager.config.textShadow,
                    chatMode: document.querySelector('input[name="chat-mode"]:checked')?.value || configManager.config.chatMode || 'window',
                    chatWidth: getValue(chatWidthInput, configManager.config.chatWidth || 95, true),
                    chatHeight: getValue(chatHeightInput, configManager.config.chatHeight || 95, true),
                    maxMessages: getValue(maxMessagesInput, configManager.config.maxMessages || 50, true),
                    showTimestamps: getValue(showTimestampsInput, configManager.config.showTimestamps ?? true, false, true),
                    popup: {
                        direction: document.querySelector('input[name="popup-direction"]:checked')?.value || configManager.config.popup?.direction || 'from-bottom',
                        duration: getValue(document.getElementById('popup-duration'), configManager.config.popup?.duration || 5, true),
                        maxMessages: getValue(document.getElementById('popup-max-messages'), configManager.config.popup?.maxMessages || 3, true)
                    },
                    lastChannel: configManager.config.lastChannel,
                    showBadges: getValue(showBadgesToggle, configManager.config.showBadges, false, true),
                    badgeEndpointUrlGlobal: configManager.config.badgeEndpointUrlGlobal,
                    badgeEndpointUrlChannel: configManager.config.badgeEndpointUrlChannel,
                    badgeCacheGlobalTTL: configManager.config.badgeCacheGlobalTTL,
                    badgeCacheChannelTTL: configManager.config.badgeCacheChannelTTL,
                    badgeFallbackHide: true,
                    enlargeSingleEmotes: getValue(enlargeSingleEmotesToggle, configManager.config.enlargeSingleEmotes, false, true),
                };

                configManager.config = newConfig;
                configManager.applyConfiguration(configManager.config);
                badgeManager.config = configManager.config;
                chatRenderer.config = configManager.config;

                const scene = UIHelpers.getUrlParameter('scene') || 'default';
                configManager.saveConfig(scene);
                closeConfigPanel(false);

                if (configManager.config.chatMode === 'popup') {
                    chatRenderer.addChatMessage({ username: 'Test', message: 'Test message', color: configManager.config.usernameColor, tags: {} });
                }

                // Re-fetch badges if settings changed
                badgeManager.fetchGlobalBadges(updateThemePreview);
                if (chatConnection.currentBroadcasterId) {
                    badgeManager.fetchChannelBadges(chatConnection.currentBroadcasterId);
                }

            } catch (error) {
                console.error("Error saving configuration:", error);
                chatRenderer.addSystemMessage("Error saving settings. Check console.");
            }
        }

        /**
         * Apply default settings
         */
        function applyDefaultSettings() {
            configManager.resetToDefaults();
            badgeManager.config = configManager.config;
            chatRenderer.config = configManager.config;
        }

        /**
         * Update config panel controls from config
         */
        function updateConfigPanelFromConfig() {
            if (!configPanel) return;

            const hexColor = configManager.config.bgColor || '#121212';
            const opacityPercent = Math.round((configManager.config.bgColorOpacity ?? 0.85) * 100);
            if (bgColorInput) bgColorInput.value = hexColor;
            if (bgOpacityInput && bgOpacityValue) {
                bgOpacityInput.value = opacityPercent;
                bgOpacityValue.textContent = `${opacityPercent}%`;
            }

            if (borderColorInput) borderColorInput.value = configManager.config.borderColor === 'transparent' ? '#000000' : configManager.config.borderColor;
            if (textColorInput) textColorInput.value = configManager.config.textColor || '#efeff1';
            if (usernameColorInput) usernameColorInput.value = configManager.config.usernameColor || '#9147ff';
            highlightActiveColorButtons();

            UIHelpers.highlightBorderRadiusButton(UIHelpers.getBorderRadiusValue(configManager.config.borderRadius), borderRadiusPresets);
            UIHelpers.highlightBoxShadowButton(configManager.config.boxShadow, boxShadowPresets);
            UIHelpers.highlightTextShadowButton(configManager.config.textShadow, textShadowPresets);

            if (overrideUsernameColorsInput) overrideUsernameColorsInput.checked = configManager.config.overrideUsernameColors;
            if (fontSizeSlider) fontSizeSlider.value = configManager.config.fontSize;
            if (fontSizeValue) fontSizeValue.textContent = `${configManager.config.fontSize}px`;
            if (chatWidthInput) chatWidthInput.value = configManager.config.chatWidth;
            if (chatWidthValue) chatWidthValue.textContent = `${configManager.config.chatWidth}%`;
            if (chatHeightInput) chatHeightInput.value = configManager.config.chatHeight;
            if (chatHeightValue) chatHeightValue.textContent = `${configManager.config.chatHeight}%`;
            if (maxMessagesInput) maxMessagesInput.value = configManager.config.maxMessages;
            if (showTimestampsInput) showTimestampsInput.checked = configManager.config.showTimestamps;

            const fontIndex = window.availableFonts?.findIndex(f => f.value === configManager.config.fontFamily) ?? -1;
            currentFontIndex = (fontIndex !== -1) ? fontIndex : (window.availableFonts?.findIndex(f => f.value?.includes('Atkinson')) ?? 0);
            updateFontDisplay();

            const themeIndex = window.availableThemes?.findIndex(t => t.value === configManager.config.theme) ?? -1;
            const currentThemeIdx = (themeIndex !== -1) ? themeIndex : (window.availableThemes?.findIndex(t => t.value === 'default') ?? 0);
            const currentTheme = window.availableThemes?.[currentThemeIdx];
            if (currentTheme) {
                if (typeof window.updateThemeDetails === 'function') window.updateThemeDetails(currentTheme);
                if (typeof window.highlightActiveCard === 'function') window.highlightActiveCard(currentTheme.value);
            }

            if (channelInput) channelInput.value = configManager.config.lastChannel || '';
            const isConnected = chatConnection.isConnected();
            if (channelForm) channelForm.style.display = isConnected ? 'none' : 'flex';
            if (disconnectBtn) {
                disconnectBtn.style.display = isConnected ? 'block' : 'none';
                if (isConnected) disconnectBtn.textContent = `Disconnect from ${chatConnection.getCurrentChannel() || configManager.config.lastChannel}`;
            }

            const currentMode = configManager.config.chatMode || 'window';
            document.querySelectorAll('input[name="chat-mode"]').forEach(radio => radio.checked = (radio.value === currentMode));
            updateModeSpecificSettingsVisibility(currentMode);

            const currentPopupDirection = configManager.config.popup?.direction || 'from-bottom';
            document.querySelectorAll('input[name="popup-direction"]').forEach(radio => radio.checked = (radio.value === currentPopupDirection));

            const popupDurationInput = document.getElementById('popup-duration');
            const popupDurationValue = document.getElementById('popup-duration-value');
            const popupMaxMessagesInput = document.getElementById('popup-max-messages');
            if (popupDurationInput && popupDurationValue) {
                const duration = configManager.config.popup?.duration || 5;
                popupDurationInput.value = duration;
                popupDurationValue.textContent = `${duration}s`;
            }
            if (popupMaxMessagesInput) {
                popupMaxMessagesInput.value = configManager.config.popup?.maxMessages || 3;
            }

            if (showBadgesToggle) showBadgesToggle.checked = configManager.config.showBadges;
            if (enlargeSingleEmotesToggle) enlargeSingleEmotesToggle.checked = configManager.config.enlargeSingleEmotes;

            updateThemePreview();
        }

        /**
         * Update connection state UI
         */
        function updateConnectionStateUI(isConnected) {
            const isPopupMode = configManager.config.chatMode === 'popup';
            if (initialConnectionPrompt) initialConnectionPrompt.style.display = isConnected ? 'none' : 'flex';
            if (popupContainer) popupContainer.style.display = isConnected && isPopupMode ? 'block' : 'none';
            if (chatWrapper) chatWrapper.style.display = isConnected && !isPopupMode ? 'block' : 'none';
            document.body.classList.toggle('disconnected', !isConnected);
        }

        // Settings button listeners
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
            cancelConfigBtn.addEventListener('click', () => closeConfigPanel(true));
            cancelConfigBtn.dataset.listenerAttached = 'true';
        }

        // Reset Button
        if (resetConfigBtn && !resetConfigBtn.dataset.listenerAttached) {
            resetConfigBtn.addEventListener('click', () => {
                applyDefaultSettings();
                configManager.applyConfiguration(configManager.config);
                updateConfigPanelFromConfig();
                chatRenderer.addSystemMessage("Settings reset to default.");
            });
            resetConfigBtn.dataset.listenerAttached = 'true';
        }

        // --- CONNECTION HANDLERS ---

        /**
         * Connect to chat
         */
        function connectToChat() {
            const channelName = channelInput?.value || initialChannelInput?.value || '';
            if (!channelName) {
                chatRenderer.addSystemMessage('Please enter a channel name');
                return;
            }
            chatConnection.connect(channelName);
        }

        /**
         * Disconnect from chat
         */
        function disconnectChat() {
            chatConnection.disconnect();
        }

        // Initial connection prompt handlers
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
        }

        if (openSettingsFromPromptBtn && configPanel) {
            openSettingsFromPromptBtn.addEventListener('click', () => {
                if (initialChannelInput && channelInput) channelInput.value = initialChannelInput.value;
                openSettingsPanel();
            });
        }

        // Connect button in settings panel
        if (connectBtn && channelInput) {
            if (!connectBtn.dataset.listenerAttachedPanel) {
                connectBtn.addEventListener('click', connectToChat);
                connectBtn.dataset.listenerAttachedPanel = 'true';
            }
            channelInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
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

        // --- INITIALIZATION ---

        // Load saved config and apply
        const sceneName = UIHelpers.getUrlParameter('scene') || 'default';
        configManager.loadSavedConfig(sceneName);
        configManager.applyConfiguration(configManager.config);
        badgeManager.config = configManager.config;
        chatRenderer.config = configManager.config;

        // Fix CSS variables
        UIHelpers.fixCssVariables();

        updateConfigPanelFromConfig();

        // Auto-connect if last channel is saved
        if (configManager.config.lastChannel) {
            if (channelInput) channelInput.value = configManager.config.lastChannel;
            if (initialChannelInput) initialChannelInput.value = configManager.config.lastChannel;
            connectToChat();
        } else {
            updateConnectionStateUI(false);
            if (channelInput) channelInput.value = '';
            if (initialChannelInput) initialChannelInput.value = '';
        }

        // Apply chat mode
        if (configManager.config.chatMode === 'popup') {
            switchChatMode('popup', true);
            chatRenderer.addChatMessage({ username: 'Test', message: 'Test message', color: configManager.config.usernameColor, tags: {} });
        }

        // Event listeners for theme changes
        document.addEventListener('theme-changed', () => updateThemePreview());
        document.addEventListener('theme-carousel-ready', () => updateThemePreview());
        document.addEventListener('theme-generated-and-added', (event) => {
            if (!(event.detail && event.detail.themeValue)) {
                console.warn("[Event Listener] Received theme-generated-and-added event without valid themeValue.");
                return;
            }
            applyTheme(event.detail.themeValue);
        });

        updateColorPreviews();
    }
})();
