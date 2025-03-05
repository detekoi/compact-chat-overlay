# CLAUDE.md Guidelines

## Project Overview
Compact Chat Overlay is a lightweight, customizable Twitch chat overlay for streamers.
Built with pure HTML, CSS, and JavaScript without external dependencies.

## Development Commands
- **Testing**: Open `chat.html` directly in browser
- **Preview**: Preview layout with browser dev tools mobile view
- **Deploy**: Upload files to web hosting or use as local OBS browser source

## Code Style Guidelines

### HTML/CSS
- Use consistent 4-space indentation
- Follow BEM-like class naming convention (e.g., `chat-message`, `settings-btn`)
- Prioritize CSS variables for theming and customization
- Use semantic HTML elements where appropriate

### JavaScript
- Prefer const/let over var
- Use camelCase for variable and function names
- Group related functionality into dedicated functions
- Add helpful console logs when debugging (remove in production)
- Use descriptive variable names that indicate purpose
- Store user settings in localStorage for persistence

### Error Handling
- Add descriptive error messages in catch blocks
- Use try/catch blocks for operations that might fail
- Gracefully handle network disconnections

### Documentation
- Include comments for complex logic
- Document user-facing features in README.md