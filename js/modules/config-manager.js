/**
 * Configuration Manager Module
 * Handles loading, saving, and applying chat configuration
 */

import { UIHelpers } from './ui-helpers.js';

export class ConfigManager {
    constructor() {
        this.config = this.getDefaultConfig();
        this.lastAppliedThemeValue = 'default';
        this.currentFontIndex = 0;
    }

    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            chatMode: 'window',
            bgColor: 'rgba(18, 18, 18, 0.8)',
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
            textShadow: 'none',
            popup: {
                direction: 'from-bottom',
                duration: 5,
                maxMessages: 3
            },
            theme: 'default',
            lastChannel: '',
            showBadges: true,
            badgeEndpointUrlGlobal: 'https://us-central1-chat-themer.cloudfunctions.net/getGlobalBadges',
            badgeEndpointUrlChannel: 'https://us-central1-chat-themer.cloudfunctions.net/getChannelBadges',
            badgeCacheGlobalTTL: 12 * 60 * 60 * 1000,
            badgeCacheChannelTTL: 1 * 60 * 60 * 1000,
            badgeFallbackHide: true,
            enlargeSingleEmotes: false,
            bgColorOpacity: 0.8,
            bgImageOpacity: 0.55
        };
    }

    /**
     * Apply configuration to CSS variables and DOM
     */
    applyConfiguration(cfg) {
        if (!cfg) {
            console.error("applyConfiguration called with invalid config");
            return;
        }

        if (cfg.theme) this.lastAppliedThemeValue = cfg.theme;

        const baseBgColor = cfg.bgColor || '#121212';
        const bgOpacity = cfg.bgColorOpacity ?? 0.85;
        let finalRgbaColor;

        try {
            finalRgbaColor = UIHelpers.hexToRgba(baseBgColor, bgOpacity);
        } catch (e) {
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
        rootStyle.setProperty('--chat-border-radius', UIHelpers.getBorderRadiusValue(cfg.borderRadius || '8px'));
        rootStyle.setProperty('--chat-box-shadow', UIHelpers.getBoxShadowValue(cfg.boxShadow || 'none'));
        rootStyle.setProperty('--chat-text-shadow', UIHelpers.getTextShadowValue(cfg.textShadow || 'none'));

        const bgImageURL = cfg.bgImage && cfg.bgImage !== 'none' ? `url("${cfg.bgImage}")` : 'none';
        rootStyle.setProperty('--chat-bg-image', bgImageURL);
        rootStyle.setProperty('--chat-bg-image-opacity', cfg.bgImageOpacity ?? 0.55);

        // Set popup styles
        rootStyle.setProperty('--popup-bg-color', finalRgbaColor);
        rootStyle.setProperty('--popup-border-color', cfg.borderColor || '#444444');
        rootStyle.setProperty('--popup-text-color', cfg.textColor || '#efeff1');
        rootStyle.setProperty('--popup-username-color', cfg.usernameColor || '#9147ff');
        rootStyle.setProperty('--popup-bg-image', bgImageURL);
        rootStyle.setProperty('--popup-bg-image-opacity', cfg.bgImageOpacity ?? 0.55);

        const themePreview = document.getElementById('theme-preview');
        if (themePreview) themePreview.style.fontSize = `${cfg.fontSize || 14}px`;

        // Apply theme classes
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

        this.config = cfg;
    }

    /**
     * Load saved configuration from localStorage
     */
    loadSavedConfig(sceneName = 'default') {
        try {
            const savedConfig = localStorage.getItem(`chatConfig-${sceneName}`);
            if (savedConfig) {
                const loadedConfig = JSON.parse(savedConfig);
                const defaultConfigForMerge = this.getDefaultConfig();
                this.config = { ...defaultConfigForMerge, ...loadedConfig };
            }
            return this.config;
        } catch (e) {
            console.error("Error loading or parsing configuration:", e);
            this.config = this.getDefaultConfig();
            return this.config;
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfig(sceneName = 'default') {
        try {
            localStorage.setItem(`chatConfig-${sceneName}`, JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error("Error saving configuration:", error);
            return false;
        }
    }

    /**
     * Save only the last channel
     */
    saveLastChannelOnly(channelToSave, sceneName = 'default') {
        if (!channelToSave) {
            console.warn("[saveLastChannelOnly] Attempted to save empty channel.");
            return;
        }
        try {
            const configKey = `chatConfig-${sceneName}`;
            let currentFullConfig = {};
            try {
                const saved = localStorage.getItem(configKey);
                if (saved) currentFullConfig = JSON.parse(saved);
            } catch (parseError) {
                console.error("[saveLastChannelOnly] Error parsing existing config:", parseError);
            }

            currentFullConfig.lastChannel = channelToSave;
            localStorage.setItem(configKey, JSON.stringify(currentFullConfig));
            this.config.lastChannel = channelToSave;
        } catch (storageError) {
            console.error("[saveLastChannelOnly] Error saving lastChannel:", storageError);
        }
    }

    /**
     * Update a single config value
     */
    updateConfig(key, value) {
        this.config[key] = value;
    }

    /**
     * Get config value
     */
    getConfig(key) {
        return key ? this.config[key] : this.config;
    }

    /**
     * Reset to default configuration
     */
    resetToDefaults() {
        this.config = this.getDefaultConfig();
        this.applyConfiguration(this.config);
    }
}
