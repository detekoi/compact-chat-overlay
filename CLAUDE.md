# CLAUDE.md Guidelines

## Project Overview
Compact Chat Overlay is a lightweight, customizable Twitch chat overlay for streamers.
Built with pure HTML, CSS, and JavaScript without external dependencies.

## Development Commands
- **Testing**: Open HTML files directly in browser (e.g., `chat.html`, `chat-scene-creator.html`)
- **Preview**: Preview in browser with dimensions 320×600px for OBS compatibility
- **Validation**: Validate HTML with W3C Validator (https://validator.w3.org/)
- **Storage Cleanup**: Run storage cleanup scripts when developing storage features

## Code Style Guidelines

### HTML/CSS
- Use consistent 4-space indentation
- Follow BEM-like class naming convention (e.g., `chat-message`, `settings-btn`)
- Prioritize CSS variables for theming and customization
- Use semantic HTML elements where appropriate
- Use proper @font-face declarations for custom fonts in assets/fonts directory

### JavaScript
- Prefer const/let over var
- Use camelCase for variable and function names
- Group related functionality into dedicated functions or classes
- Add helpful console logs when debugging (remove in production)
- Use descriptive variable names that indicate purpose
- Store user settings in localStorage for persistence
- Use modern ES6+ features (arrow functions, template literals, etc.)
- Structure complex functionality in class-based format when appropriate

### Error Handling
- Add descriptive error messages in catch blocks
- Use try/catch blocks for operations that might fail (WebSocket, localStorage)
- Gracefully handle network disconnections with reconnect logic
- Display user-friendly error messages for common issues
- Add timeout/retry logic for external API calls

### Documentation
- Include comments for complex logic
- Document user-facing features in README.md
- Keep documentation in sync with code changes
- Document any new fonts added to assets/fonts directory
- Include attribution for third-party resources