# Compact Chat Overlay

A lightweight, customizable Twitch chat overlay for streamers using OBS or other broadcasting software.

![Compact Chat Overlay Screenshot](preview.png)

[Click here for a live demo!](https://detekoi.github.io/compact-chat-overlay/)

## Features

- **Compact & Clean Interface**: Displays chat messages in a minimalist window that can be added as a browser source.
- **Native Twitch or Custom Colors**: Uses each chatter's original Twitch username colors.
- **Emote Support**: Displays Twitch emotes in chat.
- **Multiple Pre-designed Themes**: Choose from Dark, Light, Natural, Transparent, Pink, and Cyberpunk themes.
- **Live Theme Preview**: See changes in real-time before applying them.
- **Multiple Chat Scenes**: Create different overlay styles for different parts of your stream.
- **Customizable Appearance**:
  - Background color & opacity
  - Border color
  - Text color
  - Font size
  - Window width
  - Usernames - use original Twitch colors or pick a custom color
  - Show/hide timestamps
- **Simple Interface**: Clean design that integrates well with OBS and other broadcasting software.
- **Auto-Connect**: Remembers your channel and automatically connects on startup.
- **No Authentication Required**: Works anonymously without needing Twitch credentials.

## Getting Started

### Quick Start Guide

1. **Download** this repository or clone it to your computer.
2. **Open the Chat Scene Creator** by opening the `chat-scene-creator.html` file in your browser.
3. **Create your first chat scene** by clicking the "New Chat Scene" button.
4. **Give it a name** such as "Gaming", "Just Chatting", or "Stream Starting".
5. **Copy the generated URL** for adding to OBS.
6. **Add to OBS** following the provided instructions.

### Setting Up in OBS

1. In OBS Studio, right-click in the Sources panel and select **Add** → **Browser**.
2. Name your source (e.g., "Twitch Chat - Gaming").
3. Paste the URL copied from the Chat Scene Creator into the URL field.
4. **IF YOU CAN'T PASTE:** Uncheck "Local file" option even though you're using a local file.
5. Set Width: 320 and Height: 600 (recommended size).
6. Click "OK" to add the browser source.

### Using the Chat Scene Creator

The Chat Scene Creator makes it easy to manage multiple chat overlays:

![Chat Scene Creator Interface](preview.png)

1. **Create chat scenes** with descriptive names for different parts of your stream
2. **Customize settings** for each scene:
   - Default Twitch channel to connect to
   - Maximum message count
   - Timestamps display
3. **Get copy-ready URLs** for OBS with proper instance parameters
4. **Import/export** your scene configurations
5. **View step-by-step OBS setup instructions**

### Accessing Chat Settings

To adjust chat appearance settings (colors, themes, etc.) after adding to OBS:
1. Right-click the browser source in OBS and select **Interact**.
2. In the interaction window, hover over the chat to see the settings gear icon (⚙️).
3. Click the gear icon to access the settings panel.

## Configuring the Overlay

1. When first loaded, enter your Twitch channel name in the input field and click "Connect."
2. Access settings by hovering over the chat window and clicking the gear icon (⚙️).
3. Customize the appearance using the available options.
4. Click "Save Settings" to apply your changes.

**Important OBS Tip**: To access the settings while in OBS, right-click the browser source in your Sources list (or right-click directly on the overlay in the preview window) and select "Interact." This will open an interactive window where you can hover over the chat to reveal the settings gear icon.

## Settings Options

- **Theme Selection**: Choose from Dark, Light, Natural, Transparent, Pink, and Cyberpunk themes.
- **Live Theme Preview**: See a miniature preview of your chat with all settings applied.
- **Background**: Adjust color and opacity with easy-to-use preset buttons.
- **Border**: Change the border color using theme-specific presets.
- **Text**: Set the message text color.
- **Username Colors**: Choose whether to use Twitch's colors or your custom color.
- **Font Size**: Adjust the text size with a slider.
- **Width**: Change the width of the chat window.
- **Max Messages**: Control how many chat messages to show before removing older ones.
- **Show Timestamps**: Toggle message timestamps on/off.

## Advanced: Manual URL Parameters

If you prefer to manage your chat scenes manually, you can use URL parameters:

1. Add the `?instance=NAME` parameter to the URL:
   - Windows example: `file:///C:/path/to/index.html?instance=gaming`
   - macOS example: `file:///Users/username/path/to/index.html?instance=chatting`

2. Each instance maintains its own separate settings with unique styling.

3. Use descriptive instance names like:
   - `?instance=gaming` for your gaming scene
   - `?instance=talking` for your talking/webcam scene
   - `?instance=intro` for your stream intro scene

## Customization Tips

- Use the **Transparent** theme for a clean overlay on top of your gameplay or camera.
- The **Live Preview** in settings helps visualize changes before applying them.
- For better readability, keep font sizes between 12-16px.
- Position the chat overlay where it won't overlap with important game elements.
- The settings panel stays visible and usable even with transparent backgrounds.
- Try the **Cyberpunk** theme for a neon-style game streaming aesthetic.
- For retro games or cozy streams, the **Natural** theme offers earthy, warm tones.
- When using dark game footage, the **Light** theme can provide better contrast.

## Technical Details

- Built with pure HTML, CSS, and JavaScript.
- Uses WebSocket to connect to Twitch's IRC service.
- No external libraries or dependencies required.
- Settings are saved to your browser's localStorage.

## Issues & Limitations

- The overlay requires an internet connection to function.
- Very high chat volume might cause performance issues on older systems.
- Some custom/BTTV/FFZ emotes are not supported (only standard Twitch emotes).

## License

MIT License - Feel free to modify and use as needed.

## Acknowledgements

- Natural theme inspired by the visual style of Polar Bear Cafe anime
- Built for streamers who want a clean, customizable chat overlay
- Themed designs inspired by popular streaming aesthetics

## Support & Contributions

If you find this useful or have suggestions for improvements, feel free to:
- Star the repository
- Submit issues or pull requests
- Fork and customize it for your own needs