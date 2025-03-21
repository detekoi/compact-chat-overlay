# CLAUDE.md Guidelines

## Project Overview
Compact Chat Overlay is a lightweight, customizable Twitch chat overlay for streamers.
Built with pure HTML, CSS, and JavaScript without external dependencies.

## Development Commands
- **Testing**: Open HTML files directly in browser (`chat.html`, `chat-scene-creator.html`)
- **Validation**: Validate HTML with W3C Validator (https://validator.w3.org/)
- **Preview**: Use standard browser with dimensions: 320×600px for OBS compatibility
- **Linting**: No formal linting tool - follow code style guidelines below

## Code Style Guidelines

### HTML/CSS
- 4-space indentation
- BEM-like class naming (e.g., `chat-message`, `settings-btn`)
- CSS variables for theming/customization
- Semantic HTML elements
- Proper @font-face declarations for fonts in assets/fonts

### JavaScript
- Use const/let (never var)
- camelCase for variables/functions
- Group related functionality into dedicated functions
- Descriptive variable names
- localStorage for settings persistence
- ES6+ features (arrow functions, template literals)
- Add console.logs for debugging (remove in production)

### Error Handling
- Try/catch blocks for operations that might fail
- Descriptive error messages in catch blocks
- Graceful reconnect logic for network disconnections
- User-friendly error messages

### Documentation
- Document complex logic with comments
- Update README.md for user-facing features
- Document new fonts in assets/fonts
- Keep feature documentation in sync with code changes