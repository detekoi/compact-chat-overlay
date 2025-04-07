# Compact Chat Overlay

A lightweight, customizable Twitch chat overlay for streamers using OBS or other broadcasting software.

![Initial Connection Screen](assets/images/screenshots/initialization.png)
![Chat Interface](assets/images/screenshots/chat.png)
![AI Theme Generator](assets/images/screenshots/themegenerator.png)

## ✨ NEW: AI Theme Generation with Background Images!

**Create fully personalized chat themes with matching background images!** Our latest update makes creating unique chat themes even more powerful:

- **AI-Generated Backgrounds**: Get unique background images that perfectly match your theme's aesthetic
- **Theme Carousel**: Easily browse through all available themes with a visual preview carousel
- **Enhanced Visual Editor**: Precise controls for opacity, border radius, and box shadows
- **Initial Connection Guide**: Streamlined first-time setup with a helpful connection prompt
- **Accessibility Options**: Disable background images for high contrast and better readability

Simply describe any game, aesthetic, or mood (like "Minecraft," "cyberpunk night city," or "cozy forest vibes"), and the AI will generate a complete theme with perfectly matched colors, fonts, and background image!

## Try It Now

**[➡️ Online Version](https://detekoi.github.io/compact-chat-overlay/)**

Create and manage multiple chat scenes for your stream in seconds!

## Features

- **AI Theme Generator**: Create unique, perfectly coordinated themes with background images from a simple text prompt
- **Theme Carousel**: Visually browse through themes with intuitive navigation controls
- **Two Display Modes**: Choose between traditional Window mode or Toast Popup mode for chat messages.
- **Initial Connection Prompt**: User-friendly setup guide for first-time users
- **Compact & Clean Interface**: Displays chat messages in a minimalist window that can be added as a browser source.
- **Native Twitch or Custom Colors**: Uses each chatter's original Twitch username colors.
- **Emote Support**: Displays Twitch emotes in chat.
- **Multiple Pre-designed Themes**: Choose from Dark, Light, Natural, Transparent, Pink, and Cyberpunk themes.
- **Live Theme Preview**: See changes in real-time before applying them.
- **Multiple Chat Scenes**: Create different overlay styles for different parts of your stream.
- **Font Customization**: Choose from multiple font options including gaming-style pixel fonts, accessible fonts, and variable fonts.
- **Customizable Appearance**:
  - Background color & opacity with precise percentage control
  - Optional background images that match your theme with adjustable opacity
  - Border color with expanded preset options
  - Text color with new theme-specific options
  - Border radius presets (Sharp, Subtle, Rounded, Pill)
  - Box shadow presets (None, Soft, Simple 3D, Intense 3D, Sharp)
  - Font selection and size
  - Window width and height
  - Usernames - use original Twitch colors or pick a custom color
  - Show/hide timestamps
- **Accessibility Options**: Disable background images for high contrast and better readability
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

![Chat Scene Creator](assets/images/screenshots/scenecreator.png)

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
1. Access the interaction window in one of two ways:
   - Right-click the browser source in OBS and select **Interact**
   - Click the **Interact** button below the preview panel in OBS
2. In the interaction window:
   - **Window Mode**: Hover over the chat to see the settings gear icon (⚙️) in the top-right corner.
   - **Popup Mode**: Hover over the top-right area to reveal the settings gear icon (⚙️).
3. Click the gear icon to access the settings panel.

## Configuring the Overlay

1. When first loaded, you'll see a connection prompt where you can enter your Twitch channel name.
2. Enter your channel name and click "Connect" to start displaying chat.
3. Access settings by hovering over the chat window and clicking the gear icon (⚙️).
4. Customize the appearance using the available options.
5. Click "Save Settings" to apply your changes.

**Important OBS Tip**: To access the settings while in OBS, you can either right-click the browser source in your Sources list and select "Interact", or use the "Interact" button located below the preview panel. This will open an interactive window where you can hover over the chat to reveal the settings gear icon.

## Settings Options

### Theme Carousel
Browse through available themes with a visual interface:
- Use the **◀** and **▶** buttons to cycle through themes
- See theme names displayed clearly
- Preview each theme in real-time before applying
- Quickly find themes with background images that match your stream's style

### AI Theme Generator
Create a completely custom theme by entering a prompt describing any game, mood, or aesthetic using Google Gemini 2.0 Flash Image Generation.
- Example prompts: "Minecraft dungeons", "80s synthwave", "pastel kawaii", "dark fantasy RPG"
- AI automatically generates coordinated colors, fonts, and background images
- Background images are optimized for chat overlay usage
- Option to disable background image generation for accessibility or performance
- Generated themes appear at the top of your themes list for easy access

### Display Mode
Choose between Window mode (traditional chat window) or Popup mode (toast notifications).

### Theme Selection
Choose from expanded theme options:
- **Default Dark**: Classic dark theme with neutral gray border
- **Default Light**: Bright theme with subtle light border
- **Natural**: Earthy, warm tones for cozy streams
- **Transparent Dark**: Borderless display for minimal interference
- **Sakura Pink**: Vibrant pink accents for a playful look
- **Cyberpunk Night**: Bold neon colors with a futuristic feel

### Color Options
- **Background Color**: Adjust color with easy presets (Dark, Light, Natural, None, Pink, Cyber) and precise opacity control (0-100%)
- **Background Image**: Control background image opacity separately from background color
- **Border**: Change border color using theme-specific presets (Dark, Light, Wood, Rose, Mint, None)
- **Text**: Set message text color with expanded preset options (Light, Dark, Brown, Berry, Teal)
- **Username Colors**: Choose whether to use Twitch's colors or your custom color presets (Purple.tv, Forest, Amber, Magenta, Neon)

### Border & Effect Options
- **Corner Roundness**: Choose from Sharp (0px), Subtle (8px), Rounded (16px), or Pill (24px) corner styles
- **Shadow**: Add depth with None, Soft, Simple 3D, Intense 3D, or Sharp shadow presets

### Font Options
Select from various fonts including:
- Default (system sans-serif)
- Atkinson Hyperlegible (accessible font designed for high legibility)
- Press Start 2P (pixelated retro gaming font)
- Jacquard (medieval-style pixel font)
- Medieval (fantasy-style serif font)
- Tektur (modern geometric design)
- System fonts (Arial, Times, Courier New)

### Size & Display Options
- **Font Size**: Adjust the text size with a slider.
- **Width**: Change the width of the chat window.
- **Height**: Change the height of the chat window.
- **Max Messages**: Control how many chat messages to show before removing older ones.
- **Show Timestamps**: Toggle message timestamps on/off.

### Popup Mode Settings
When using Popup mode, additional options become available:
- **Animation Direction**: Choose how messages animate in (From Top, Bottom, Left, Right)
- **Duration**: Control how long each message stays visible (2-10 seconds)
- **Max Messages**: Set how many popup messages can be visible simultaneously

## Advanced: Manual URL Parameters

If you prefer to manage your chat scenes manually, you can use URL parameters:

1. Add the `?scene=NAME` parameter to the URL:
   - Windows example: `file:///C:/path/to/chat.html?scene=gaming`
   - macOS example: `file:///Users/username/path/to/chat.html?scene=chatting`