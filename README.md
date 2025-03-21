# Compact Chat Overlay

A lightweight, customizable Twitch chat overlay for streamers using OBS or other broadcasting software.

![Compact Chat Overlay Screenshot](assets/images/screenshots/preview.png)

## ✨ NEW: Custom Generated Themes!

**Create personalized chat themes with a single prompt!** Simply describe a game, aesthetic, or mood, and the AI will generate a unique chat theme with perfectly matched colors and fonts.

- Type "Minecraft," "Lady Gaga Monster era," or "Cozy forest vibes"
- Get instant, custom-tailored themes in seconds
- Perfectly coordinated colors and fonts

## Try It Now

**[➡️ Online Version](https://detekoi.github.io/compact-chat-overlay/)**

Create and manage multiple chat scenes for your stream in seconds!

## Features

- **AI Theme Generator**: Create unique, perfectly coordinated themes with a simple text prompt about any game or aesthetic!
- **Two Display Modes**: Choose between traditional Window mode or Toast Popup mode for chat messages.
- **Compact & Clean Interface**: Displays chat messages in a minimalist window that can be added as a browser source.
- **Native Twitch or Custom Colors**: Uses each chatter's original Twitch username colors.
- **Emote Support**: Displays Twitch emotes in chat.
- **Multiple Pre-designed Themes**: Choose from Dark, Light, Natural, Transparent, Pink, and Cyberpunk themes.
- **Live Theme Preview**: See changes in real-time before applying them.
- **Multiple Chat Scenes**: Create different overlay styles for different parts of your stream.
- **Font Customization**: Choose from multiple font options including gaming-style pixel fonts, accessible fonts, and variable fonts.
- **Customizable Appearance**:
  - Background color & opacity
  - Border color
  - Text color
  - Font selection and size
  - Window width and height
  - Usernames - use original Twitch colors or pick a custom color
  - Show/hide timestamps
- **Simple Interface**: Clean design that integrates well with OBS and other broadcasting software.
- **Auto-Connect**: Remembers your channel and automatically connects on startup.
- **No Authentication Required**: Works anonymously without needing Twitch credentials.

## Getting Started

### Quick Start Guide (Recommended Method)

1. **Visit the online version** at [detekoi.github.io/compact-chat-overlay](https://detekoi.github.io/compact-chat-overlay/)
2. **Use the Chat Scene Creator** to easily set up and manage your chat scenes.
3. **Create your first chat scene** by clicking the "New Chat Scene" button.
4. **Give it a name** such as "Gaming", "Just Chatting", or "Stream Starting."
5. **Copy the generated URL** for adding to OBS.
6. **Add to OBS** following the provided instructions.

### Alternative: Local Installation

If you prefer to run everything locally:

1. **Download** this repository or clone it to your computer.
2. **Open the index.html file** in your browser.
3. **Select "Chat Scene Creator"** from the landing page.
4. Follow the same steps as above to create and manage chat scenes.

### Setting Up in OBS

1. In OBS Studio, right-click in the Sources panel and select **Add** → **Browser**.
2. Name your source (e.g., "Twitch Chat - Gaming").
3. Paste the URL copied from the Chat Scene Creator into the URL field.
4. **IF YOU CAN'T PASTE:** Uncheck "Local file" option even though you're using a local file.
5. Set Width: 320 and Height: 600 (recommended size).
6. Click "OK" to add the browser source.

### Setting Up in StreamElements OBS.Live

1. In StreamElements OBS.Live, navigate to the **Overlay Editor**.
2. Click the **+ Add Widget** button and select **Static/Custom** → **Custom Widget**.
3. Name your widget (e.g., "Twitch Chat Overlay").
4. In the Custom Widget settings, select the **Settings** tab.
5. Find the **Custom URL** option and paste your chat overlay URL.
6. Set the Width to 320 and Height to 600 (recommended size).
7. Click **Done** to add the browser source to your overlay.

### Setting Up in Streamlabs Desktop

1. In Streamlabs Desktop, click the **+** button in the **Sources** panel.
2. Select **Browser Source** from the list of available sources.
3. Name your source (e.g., "Twitch Chat Overlay").
4. In the Browser Source Properties:
   - Paste the URL from the Chat Scene Creator in the **URL** field.
   - Set Width to 320 and Height to 600 (recommended size).
   - Ensure "Shutdown source when not visible" is unchecked.
   - Leave other settings at their defaults.
5. Click **Add Source** to create the browser source.

### Using the Chat Scene Creator

The Chat Scene Creator makes it easy to manage multiple chat overlays:

![Chat Scene Creator Interface](assets/images/screenshots/scenecreator.png)

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
2. In the interaction window:
   - **Window Mode**: Hover over the chat to see the settings gear icon (⚙️) in the top-right corner.
   - **Popup Mode**: Hover over the top-right area to reveal the settings gear icon (⚙️).
3. Click the gear icon to access the settings panel.

## Configuring the Overlay

1. When first loaded, enter your Twitch channel name in the input field and click "Connect."
2. Access settings by hovering over the chat window and clicking the gear icon (⚙️).
3. Customize the appearance using the available options.
4. Click "Save Settings" to apply your changes.

**Important OBS Tip**: To access the settings while in OBS, right-click the browser source in your Sources list (or right-click directly on the overlay in the preview window) and select "Interact." This will open an interactive window where you can hover over the chat to reveal the settings gear icon.

## Settings Options

- **AI Theme Generator**: Create a completely custom theme by entering a prompt describing any game, mood, or aesthetic.
  - Example prompts: "Minecraft dungeons", "80s synthwave", "pastel kawaii", "dark fantasy RPG"
  - AI automatically generates coordinated colors and selects a complementary font
  - Generated themes appear at the top of your themes list for easy access
- **Display Mode**: Choose between Window mode (traditional chat window) or Popup mode (toast notifications).
- **Theme Selection**: Choose from Dark (neutral gray border), Light (subtle light border), Natural, Transparent (borderless), Pink, and Cyberpunk themes.
- **Live Theme Preview**: See a miniature preview of your chat with all settings applied.
- **Background**: Adjust color and opacity with easy-to-use preset buttons.
- **Border**: Change the border color using theme-specific presets or choose "None" for borderless display.
- **Text**: Set the message text color.
- **Username Colors**: Choose whether to use Twitch's colors or your custom color.
- **Font**: Select from various fonts including:
  - Default (system sans-serif)
  - Atkinson Hyperlegible (accessible font designed for high legibility)
  - Press Start 2P (pixelated retro gaming font)
  - Jacquard (medieval-style pixel font)
  - Medieval (fantasy-style serif font)
  - Tektur (modern geometric design)
  - System fonts (Arial, Times, Courier New)
- **Font Size**: Adjust the text size with a slider.
- **Width**: Change the width of the chat window.
- **Height**: Change the height of the chat window.
- **Max Messages**: Control how many chat messages to show before removing older ones.
- **Show Timestamps**: Toggle message timestamps on/off.

### Popup Mode Settings

When using Popup mode, additional options become available:

- **Animation Direction**: Choose how messages animate in (From Top, From Bottom, From Left, From Right).
- **Duration**: Control how long each message stays visible (2-10 seconds).
- **Max Messages**: Set how many popup messages can be visible simultaneously.

## Advanced: Manual URL Parameters

If you prefer to manage your chat scenes manually, you can use URL parameters:

1. Add the `?scene=NAME` parameter to the URL:
   - Windows example: `file:///C:/path/to/chat.html?scene=gaming`
   - macOS example: `file:///Users/username/path/to/chat.html?scene=chatting`

2. Each scene maintains its own separate settings with unique styling.

3. Use descriptive scene names like:
   - `?scene=gaming` for your gaming scene.
   - `?scene=talking` for your talking/webcam scene.
   - `?scene=intro` for your stream intro scene.

## Customization Tips

### AI Theme Generator Tips
- **Be specific with your prompts**: The more detailed your description, the better the theme will match your vision.
- **Game-inspired themes**: Try entering game titles like "Stardew Valley," "Elden Ring," or "Valorant".
- **Aesthetic-based themes**: Try prompts like "vaporwave," "cottagecore," "cyberpunk noir," or "lofi coffee shop".
- **Seasonal themes**: Create themes for holidays with prompts like "Halloween spooky," "winter wonderland," or "summer beach vibes".
- **Community themes**: Create themes that match your community's inside jokes or channel memes.
- **Experiment with variations**: If you like a generated theme but want tweaks, try adding adjectives like "darker," "pastel," or "vibrant" to your prompt.

### Window Mode Tips
- Use the **Light** theme for an airy, bright overlay on top of your gameplay or camera.
- The **Live Preview** in settings helps visualize changes before applying them.
- For better readability, keep font sizes between 12-16px.
- Position the chat overlay where it won't overlap with important game elements.
- Try the **Cyberpunk** theme for a neon-style game streaming aesthetic.
- For retro games or cozy streams, the **Natural** theme offers earthy, warm tones.
- For dark gameplay, the **Transparent** theme is unobtrusive and helps chat messages stand out.

### Font Selection Tips
- For **retro or pixel art games**, try the "Press Start 2P" font.
- For **medieval or fantasy pixel games**, try the "Jacquard" font.
- For **maximum readability**, use "Atkinson Hyperlegible" which is designed for accessibility.
- For **fantasy/RPG streams**, the "Medieval" font adds thematic styling.
- For **modern/tech streams**, the "Tektur" font provides a clean geometric look.
- Use **system fonts** (Arial, Times, Courier) for maximum performance and compatibility.

### Popup Mode Tips
- Use popup mode for a more dynamic, attention-grabbing chat experience.
- Choose **From Bottom** animation for a natural chat appearance similar to mobile notifications.
- **From Right** animation works well for right-side gameplay UI layouts.
- Consider shortening the duration (3-4 seconds) during high chat activity streams.
- Set a lower max messages count (2-3) to prevent screen clutter.
- Match the animation direction with your stream layout (e.g., choose From Left if your camera is on the right).

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

## Support & Contributions

If you find this useful or have suggestions for improvements, feel free to:
- Star the repository.
- Submit issues or pull requests.
- Fork and customize it for your own needs.

## Disclaimer

This project is not affiliated with, endorsed by, or in any way officially connected to Twitch Interactive, Inc. or any of its subsidiaries or affiliates. The official Twitch website can be found at https://www.twitch.tv. Twitch and the Twitch logo are trademarks of Twitch Interactive, Inc. While this tool is designed to work with Twitch streams, any similarity to Twitch's brand colors or visual elements is incidental and does not imply any official connection or endorsement.