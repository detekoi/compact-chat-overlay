# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Compact Chat Overlay is a lightweight, customizable Twitch chat overlay for streamers built with vanilla HTML, CSS, and JavaScript.

## Development Commands
- **Test**: Open HTML files directly in browser (`chat.html`, `chat-scene-creator.html`)
- **Preview**: Test in browser with dimensions 320×600px for OBS compatibility
- **Validate**: Use W3C Validator (https://validator.w3.org/)
- **Storage**: Run `js/utils/storage-cleanup.js` when working with localStorage features

## Code Style Guidelines
- **HTML/CSS**: 4-space indentation, BEM-style classes, CSS variables for theming, semantic elements
- **JavaScript**: 
  - camelCase for variables/functions
  - ES6+ features (arrow functions, destructuring, template literals)
  - Group related code into classes/modules
  - Use localStorage for persistent settings
  - Descriptive variable names that indicate purpose
- **Error Handling**: Try/catch for WebSocket and localStorage operations, add reconnect logic
- **Documentation**: Comment complex logic, update README.md with user-facing changes