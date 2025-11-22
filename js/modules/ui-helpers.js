/**
 * UI Helper Functions Module
 * Provides utility functions for color conversion, CSS value mapping, and URL parameter parsing
 */

export class UIHelpers {
    /**
     * Converts a hex color string and an opacity value (0-1) to an rgba string.
     */
    static hexToRgba(hex, opacity) {
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

    /**
     * Get border radius CSS value from preset name or direct value
     */
    static getBorderRadiusValue(value) {
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
    static getBoxShadowValue(preset) {
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
     * Get text shadow CSS value from preset name.
     */
    static getTextShadowValue(preset) {
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
     * Fix any CSS variables that contain preset names instead of actual CSS values.
     */
    static fixCssVariables() {
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
     * Highlight the active border radius button based on CSS value
     */
    static highlightBorderRadiusButton(cssValue, borderRadiusPresets) {
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
    static highlightBoxShadowButton(presetName, boxShadowPresets) {
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
     * Highlight the active text shadow button based on preset name
     */
    static highlightTextShadowButton(presetName, textShadowPresets) {
        if (textShadowPresets) {
            const buttons = textShadowPresets.querySelectorAll('.preset-btn');
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === presetName);
            });
        }
    }

    /**
     * Helper function to get URL parameters
     */
    static getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    /**
     * Generate a visually distinct color from a username string
     */
    static generateColorFromName(name) {
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
}

// Make functions globally available for backwards compatibility
window.getBorderRadiusValue = UIHelpers.getBorderRadiusValue;
window.getBoxShadowValue = UIHelpers.getBoxShadowValue;
