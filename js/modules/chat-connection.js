/**
 * Chat Connection Module
 * Handles WebSocket connection to Twitch IRC and message parsing
 */

export class ChatConnection {
    constructor(configManager, chatRenderer, badgeManager) {
        this.configManager = configManager;
        this.chatRenderer = chatRenderer;
        this.badgeManager = badgeManager;
        this.socket = null;
        this.channel = '';
        this.currentBroadcasterId = null;
        this.isConnecting = false;
        this.isExplicitDisconnect = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.MAX_RECONNECT_ATTEMPTS = 5;
        this.INITIAL_RECONNECT_DELAY = 1000;
        this.MAX_RECONNECT_DELAY = 30000;
        this.statusIndicator = document.getElementById('status-indicator');
        this.onConnectionChangeCallback = null;
    }

    /**
     * Set callback for connection state changes
     */
    onConnectionChange(callback) {
        this.onConnectionChangeCallback = callback;
    }

    /**
     * Connect to Twitch chat
     */
    async connect(channelName) {
        if (this.isConnecting) return;
        this.isConnecting = true;

        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.warn("[connectToChat] Socket already open. Closing before reconnecting.");
            this.isExplicitDisconnect = true;
            this.socket.close();
            this.socket = null;
            this.isExplicitDisconnect = false;
        }

        // Ensure any existing socket is closed before creating a new one
        if (this.socket) this.socket.close();

        this.channel = channelName.trim().toLowerCase();
        if (!this.channel) {
            this.chatRenderer.addSystemMessage('Please enter a valid channel name');
            this.isConnecting = false;
            return;
        }

        this.currentBroadcasterId = null; // Reset broadcaster ID on new connection

        this.chatRenderer.addSystemMessage(`Connecting to ${this.channel}'s chat...`, true);
        this.socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        window.socket = this.socket; // Debugging access

        this.socket.onopen = () => this.handleSocketOpen();
        this.socket.onclose = (event) => this.handleSocketClose(event);
        this.socket.onerror = (error) => this.handleSocketError(error);
        this.socket.onmessage = (event) => this.handleSocketMessage(event);
    }

    /**
     * Handle WebSocket open event
     */
    async handleSocketOpen() {
        // Use timeout to ensure socket is ready before sending commands
        setTimeout(async () => {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                console.warn("[socket.onopen timeout] Socket closed before sending commands.");
                this.isConnecting = false;
                return;
            }

            this.socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
            this.socket.send(`PASS SCHMOOPIIE`); // Use anonymous PASS
            this.socket.send(`NICK justinfan${Math.floor(Math.random() * 999999)}`);
            this.socket.send(`JOIN #${this.channel}`);

            this.updateStatus(true);
            this.configManager.updateConfig('lastChannel', this.channel);
            this.configManager.saveLastChannelOnly(this.channel, UIHelpers.getUrlParameter('scene') || 'default');

            if (this.onConnectionChangeCallback) {
                this.onConnectionChangeCallback(true, this.channel);
            }

            this.chatRenderer.addSystemMessage(
                this.reconnectAttempts > 0 ? `Reconnected to ${this.channel}'s chat.` : `Connected to ${this.channel}'s chat`,
                true
            );
            this.reconnectAttempts = 0; // Reset on successful connection
            this.isConnecting = false;

            // Fetch global badges on successful connection
            await this.badgeManager.fetchGlobalBadges();
            // Channel badges will be fetched on ROOMSTATE or first message with room-id
        }, 50); // Small delay can sometimes help ensure readiness
    }

    /**
     * Handle WebSocket close event
     */
    handleSocketClose(event) {
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
        this.isConnecting = false;
        const lastConnectedChannel = this.channel; // Store before clearing
        this.socket = null;
        this.channel = '';
        this.currentBroadcasterId = null;

        if (this.onConnectionChangeCallback) {
            this.onConnectionChangeCallback(false, '');
        }

        if (!this.isExplicitDisconnect) {
            this.chatRenderer.addSystemMessage('Connection lost. Attempting to reconnect...');
            this.scheduleReconnect(lastConnectedChannel); // Attempt reconnect
        } else {
            this.chatRenderer.addSystemMessage('Disconnected from chat.');
            this.updateStatus(false);
            this.isExplicitDisconnect = false; // Reset flag
        }
    }

    /**
     * Handle WebSocket error event
     */
    handleSocketError(error) {
        console.error('WebSocket Error:', error);
        this.chatRenderer.addSystemMessage('Error connecting to chat. Check console for details.');
        this.isConnecting = false;
        // Let socket.onclose handle potential reconnection logic
    }

    /**
     * Handle WebSocket message event
     */
    handleSocketMessage(event) {
        const messages = event.data.split('\r\n');
        messages.forEach(message => {
            if (!message) return;

            if (message.includes('PING')) { // Handle PING/PONG keepalive
                this.socket?.send('PONG :tmi.twitch.tv');
                return;
            }

            const tags = this.parseIRCTags(message);

            // Handle ROOMSTATE for broadcaster_id and fetching channel badges
            if (message.includes('ROOMSTATE')) {
                if (tags['room-id'] && tags['room-id'] !== this.currentBroadcasterId) {
                    this.currentBroadcasterId = tags['room-id'];
                    console.log(`Switched to room/broadcaster ID: ${this.currentBroadcasterId}`);
                    this.chatRenderer.setCurrentBroadcasterId(this.currentBroadcasterId);
                    this.badgeManager.fetchChannelBadges(this.currentBroadcasterId); // Fetch badges for the new room
                }
                return; // ROOMSTATE messages don't need further processing as chat messages
            }

            if (message.includes('PRIVMSG')) { // Handle chat messages
                this.handlePrivMsg(message, tags);
            }
        });
    }

    /**
     * Parse IRC v3 tags
     */
    parseIRCTags(message) {
        const tags = {};
        if (message.startsWith('@')) {
            try {
                const tagPart = message.slice(1, message.indexOf(' '));
                tagPart.split(';').forEach(tag => {
                    if (tag?.includes('=')) {
                        const [key, value] = tag.split('=');
                        if (key) tags[key] = value || '';
                    }
                });
            } catch (err) {
                console.error('Error parsing IRC tags:', err);
            }
        }
        return tags;
    }

    /**
     * Handle PRIVMSG (chat message)
     */
    handlePrivMsg(message, tags) {
        // Extract username (prefer display-name tag)
        let username = tags['display-name'] || message.match(/:(.*?)!/)?.[1] || 'Anonymous';

        // Extract message content
        let messageContent = '';
        try {
            const msgParts = message.split('PRIVMSG #');
            if (msgParts.length > 1) {
                const colonIndex = msgParts[1].indexOf(' :');
                if (colonIndex !== -1) messageContent = msgParts[1].substring(colonIndex + 2);
            }
        } catch (err) {
            console.error('Error extracting message content:', err);
        }

        // Parse emotes from tags
        let emotes = null;
        if (tags.emotes) {
            try {
                emotes = {};
                tags.emotes.split('/').forEach(group => {
                    if (!group?.includes(':')) return;
                    const [emoteId, positions] = group.split(':');
                    if (emoteId && positions) emotes[emoteId] = positions.split(',').filter(pos => pos?.includes('-'));
                });
            } catch (err) {
                console.error('Error parsing emotes:', err, tags.emotes);
            }
        }

        // If broadcasterId hasn't been set yet (e.g. from ROOMSTATE), try to get it from PRIVMSG tags
        if (!this.currentBroadcasterId && tags['room-id']) {
            this.currentBroadcasterId = tags['room-id'];
            console.log(`Got broadcaster ID from PRIVMSG: ${this.currentBroadcasterId}`);
            this.chatRenderer.setCurrentBroadcasterId(this.currentBroadcasterId);
            this.badgeManager.fetchChannelBadges(this.currentBroadcasterId);
        }

        this.chatRenderer.addChatMessage({
            username,
            message: messageContent,
            color: tags.color || null,
            emotes,
            tags
        });
    }

    /**
     * Disconnect from chat
     */
    disconnect() {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            this.isExplicitDisconnect = true;
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
            this.reconnectAttempts = 0;
            this.socket.close();
        } else {
            this.updateStatus(false);
            this.isExplicitDisconnect = false;
        }
    }

    /**
     * Schedule a reconnection attempt
     */
    scheduleReconnect(channelToReconnect) {
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            this.chatRenderer.addSystemMessage(`Failed to reconnect after ${this.MAX_RECONNECT_ATTEMPTS} attempts. Please try again manually.`);
            this.reconnectAttempts = 0;
            this.updateStatus(false);
            return;
        }

        const delay = Math.min(
            this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
            this.MAX_RECONNECT_DELAY
        );

        this.reconnectAttempts++;
        console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

        this.reconnectTimer = setTimeout(() => {
            if (!this.isExplicitDisconnect && channelToReconnect) {
                console.log(`Attempting to reconnect to ${channelToReconnect}...`);
                this.connect(channelToReconnect);
            }
        }, delay);
    }

    /**
     * Update status indicator
     */
    updateStatus(connected) {
        if (!this.statusIndicator) return;
        this.statusIndicator.className = connected ? 'connected' : 'disconnected';
        this.statusIndicator.title = connected ? `Connected to ${this.channel}'s chat` : 'Disconnected';
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * Get current channel
     */
    getCurrentChannel() {
        return this.channel;
    }
}

// Import UIHelpers for getUrlParameter
import { UIHelpers } from './ui-helpers.js';
