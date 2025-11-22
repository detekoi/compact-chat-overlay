# Chat.js Refactoring Documentation

## Overview

The monolithic `chat.js` file (2,113 lines) has been refactored into a modular architecture to improve maintainability, testability, and code organization.

## Architecture

### Before
- **Single file**: `js/chat.js` (111 KB, 2,113 lines)
- All functionality mixed together
- Difficult to maintain and test
- Hard to understand dependencies

### After
- **Main entry point**: `js/chat.js` (58 KB, ~1,094 lines) - 48% reduction
- **Modules** in `js/modules/`:
  - `ui-helpers.js` - Utility functions
  - `scroll-manager.js` - Scroll behavior
  - `badge-manager.js` - Twitch badge handling
  - `chat-renderer.js` - Message rendering
  - `config-manager.js` - Configuration management
  - `chat-connection.js` - WebSocket connections
- **Backup**: `js/chat.js.backup` (original file preserved)

## Module Descriptions

### 1. UI Helpers (`ui-helpers.js`)
**Purpose**: Provides utility functions for color conversion and CSS value mapping.

**Key Functions**:
- `hexToRgba(hex, opacity)` - Converts hex colors to RGBA
- `getBorderRadiusValue(value)` - Maps preset names to CSS values
- `getBoxShadowValue(preset)` - Maps shadow presets to CSS
- `getTextShadowValue(preset)` - Maps text shadow presets to CSS
- `generateColorFromName(name)` - Generates consistent colors from usernames
- `highlightBorderRadiusButton()`, `highlightBoxShadowButton()`, `highlightTextShadowButton()` - UI state management
- `getUrlParameter(name)` - Parses URL query parameters
- `fixCssVariables()` - Ensures CSS variables contain valid values

**Exports**: `UIHelpers` class (all methods are static)

### 2. Scroll Manager (`scroll-manager.js`)
**Purpose**: Manages auto-scroll behavior and scroll position.

**Key Features**:
- Auto-follow mode (stick to bottom)
- User scroll detection
- Programmatic scroll handling
- Bottom sentinel management
- Resize observation

**Exports**: `ScrollManager` class

**Constructor**: `new ScrollManager(scrollArea, chatMessages)`

**Methods**:
- `setScrollTop(element, value)` - Programmatically set scroll position
- `isUserScrolledToBottom(element)` - Check if at bottom
- `stickToBottomSoon()` - Force scroll to bottom on next frame
- `scrollToBottom()` - Scroll to bottom if auto-follow enabled
- `ensureSentinelLast()` - Keep sentinel element at end

### 3. Badge Manager (`badge-manager.js`)
**Purpose**: Handles fetching, caching, and rendering of Twitch badges.

**Key Features**:
- Global badge fetching
- Channel-specific badge fetching
- LocalStorage caching with TTL
- Duplicate fetch prevention
- Badge HTML generation

**Exports**: `BadgeManager` class

**Constructor**: `new BadgeManager(config)`

**Methods**:
- `fetchGlobalBadges(updatePreviewCallback)` - Fetch global Twitch badges
- `fetchChannelBadges(broadcasterId)` - Fetch channel-specific badges
- `getBadgeInfo(setId, versionId, broadcasterId)` - Get badge metadata
- `generateBadgeHTML(badgeString, broadcasterId)` - Generate badge HTML

### 4. Chat Renderer (`chat-renderer.js`)
**Purpose**: Renders chat messages and system messages to the DOM.

**Key Features**:
- Chat message rendering
- System message rendering
- Emote parsing and display
- Badge integration
- Popup message handling
- Message limiting

**Exports**: `ChatRenderer` class

**Constructor**: `new ChatRenderer(config, scrollManager, badgeManager)`

**Methods**:
- `addChatMessage(data)` - Add user chat message
- `addSystemMessage(message, autoRemove)` - Add system message
- `parseEmotes(message, emotes)` - Parse Twitch emotes
- `checkSingleEmote(message)` - Check if message is single emote
- `limitMessages()` - Enforce max message limit
- `clearMessages()` - Clear all messages
- `setCurrentBroadcasterId(id)` - Set broadcaster ID for badges

### 5. Config Manager (`config-manager.js`)
**Purpose**: Manages application configuration, persistence, and CSS application.

**Key Features**:
- Configuration loading/saving
- LocalStorage persistence
- CSS variable application
- Default configuration
- Scene-based configuration

**Exports**: `ConfigManager` class

**Constructor**: `new ConfigManager()`

**Methods**:
- `getDefaultConfig()` - Get default configuration object
- `applyConfiguration(cfg)` - Apply config to CSS variables and DOM
- `loadSavedConfig(sceneName)` - Load config from localStorage
- `saveConfig(sceneName)` - Save config to localStorage
- `saveLastChannelOnly(channel, sceneName)` - Save only last channel
- `updateConfig(key, value)` - Update single config value
- `getConfig(key)` - Get config value(s)
- `resetToDefaults()` - Reset to default configuration

**Properties**:
- `config` - Current configuration object
- `lastAppliedThemeValue` - Last applied theme
- `currentFontIndex` - Current font index

### 6. Chat Connection (`chat-connection.js`)
**Purpose**: Manages WebSocket connection to Twitch IRC.

**Key Features**:
- Twitch IRC connection
- Message parsing (IRC v3 tags)
- Automatic reconnection with exponential backoff
- PING/PONG handling
- Badge fetching triggers

**Exports**: `ChatConnection` class

**Constructor**: `new ChatConnection(configManager, chatRenderer, badgeManager)`

**Methods**:
- `connect(channelName)` - Connect to Twitch channel
- `disconnect()` - Disconnect from chat
- `isConnected()` - Check connection status
- `getCurrentChannel()` - Get current channel name
- `onConnectionChange(callback)` - Set connection state callback
- `scheduleReconnect(channel)` - Schedule reconnection attempt

**Internal Methods**:
- `handleSocketOpen()` - WebSocket open event
- `handleSocketClose(event)` - WebSocket close event
- `handleSocketError(error)` - WebSocket error event
- `handleSocketMessage(event)` - WebSocket message event
- `parseIRCTags(message)` - Parse IRC v3 tags
- `handlePrivMsg(message, tags)` - Handle PRIVMSG

## Main Entry Point (`chat.js`)

The refactored `chat.js` now serves as the orchestration layer:

### Responsibilities
1. **Module Initialization** - Creates instances of all module classes
2. **DOM References** - Maintains references to HTML elements
3. **Event Handlers** - Sets up UI event listeners
4. **Theme Management** - Handles theme switching (interacts with `theme-carousel.js`)
5. **Settings Panel** - Manages configuration UI

### What Stayed in chat.js
- Theme-related functions (`applyTheme`, `updateThemePreview`, `switchChatMode`)
- Font display management (`updateFontDisplay`)
- Settings panel logic (open, close, save, cancel, reset)
- UI event handlers (color pickers, sliders, presets, radio buttons)
- Global function exposure for `theme-carousel.js` compatibility

### Module Initialization Order
```javascript
const configManager = new ConfigManager();
const scrollManager = new ScrollManager(scrollArea, chatMessages);
const badgeManager = new BadgeManager(configManager.config);
const chatRenderer = new ChatRenderer(configManager.config, scrollManager, badgeManager);
const chatConnection = new ChatConnection(configManager, chatRenderer, badgeManager);
```

## Data Flow

### Configuration Loading
1. `ConfigManager` loads saved config from localStorage
2. `ConfigManager.applyConfiguration()` sets CSS variables
3. UI controls are updated to match loaded config

### Chat Connection
1. User connects via UI
2. `ChatConnection.connect(channel)` initiates WebSocket
3. On connection, `BadgeManager` fetches global badges
4. On ROOMSTATE, `BadgeManager` fetches channel badges
5. Messages trigger `ChatRenderer.addChatMessage()`

### Message Rendering
1. `ChatConnection` receives PRIVMSG
2. Parses IRC tags and emotes
3. Calls `ChatRenderer.addChatMessage(data)`
4. `ChatRenderer` fetches badges via `BadgeManager`
5. `ChatRenderer` renders message with `ScrollManager` coordination

### Configuration Saving
1. User saves settings
2. Main `chat.js` collects values from UI
3. Updates `ConfigManager.config`
4. Calls `ConfigManager.applyConfiguration()` for CSS
5. Calls `ConfigManager.saveConfig()` for persistence

## Benefits

### Code Organization
- ✅ Clear separation of concerns
- ✅ Single Responsibility Principle
- ✅ Easier to understand and navigate

### Maintainability
- ✅ Changes isolated to specific modules
- ✅ Reduced risk of breaking unrelated features
- ✅ Easier debugging (clearer stack traces)

### Testability
- ✅ Modules can be tested in isolation
- ✅ Mock dependencies easily
- ✅ Unit tests for individual components

### Performance
- ✅ Tree-shaking possible with ES6 modules
- ✅ Better browser caching
- ✅ Potential for lazy loading

### Developer Experience
- ✅ 48% reduction in main file size
- ✅ Logical code organization
- ✅ Clear module boundaries
- ✅ Easier onboarding for new developers

## Migration Notes

### HTML Changes
Changed from:
```html
<script src="js/chat.js"></script>
```

To:
```html
<script type="module" src="js/chat.js"></script>
```

The `type="module"` attribute is **required** for ES6 imports.

### Backwards Compatibility
- All global functions preserved (`window.applyTheme`, `window.getBorderRadiusValue`, etc.)
- External dependencies (`theme-carousel.js`, `theme-generator.js`) work unchanged
- Same configuration format in localStorage
- No changes to HTML structure or CSS

### Files Changed
- `chat.html` - Added `type="module"` to script tag
- `js/chat.js` - Refactored to use modules (original backed up as `chat.js.backup`)

### Files Added
- `js/modules/ui-helpers.js`
- `js/modules/scroll-manager.js`
- `js/modules/badge-manager.js`
- `js/modules/chat-renderer.js`
- `js/modules/config-manager.js`
- `js/modules/chat-connection.js`

## Future Improvements

### Potential Next Steps
1. **TypeScript Migration** - Add type safety
2. **Unit Tests** - Test each module independently
3. **Event System** - Implement pub/sub for module communication
4. **Further Decomposition** - Extract theme management to module
5. **Configuration Validation** - Add schema validation
6. **Error Boundaries** - Improved error handling and recovery
7. **Performance Monitoring** - Add metrics for render performance

### Module Opportunities
- **Theme Manager** - Extract theme logic (currently coupled with `theme-carousel.js`)
- **Event Manager** - Centralize event handling
- **Storage Manager** - Abstract localStorage operations
- **Error Handler** - Centralized error logging and recovery

## Testing

### Manual Testing Checklist
- [ ] Connect to Twitch channel
- [ ] Send/receive messages
- [ ] Emotes display correctly
- [ ] Badges display correctly
- [ ] Theme switching works
- [ ] Font changing works
- [ ] Settings save/load properly
- [ ] Window/Popup mode switching
- [ ] Auto-scroll behavior
- [ ] Message limiting
- [ ] Reconnection on disconnect
- [ ] URL parameters (`?scene=name`)

### Browser Compatibility
ES6 modules require:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

## Rollback Plan

If issues arise, restore original chat.js:
```bash
mv js/chat.js.backup js/chat.js
```

And revert chat.html:
```html
<script src="js/chat.js"></script>
```

## Conclusion

This refactoring significantly improves the codebase structure while maintaining full backwards compatibility. The modular architecture provides a solid foundation for future development and makes the code easier to understand, test, and maintain.
