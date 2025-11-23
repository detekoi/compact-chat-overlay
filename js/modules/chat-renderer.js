/**
 * Chat Renderer Module
 * Handles rendering of chat messages and system messages to the DOM
 */

import { UIHelpers } from './ui-helpers.js';

export class ChatRenderer {
    constructor(config, scrollManager, badgeManager) {
        this.config = config;
        this.scrollManager = scrollManager;
        this.badgeManager = badgeManager;
        this.chatMessages = document.getElementById('chat-messages');
        this.currentBroadcasterId = null;
    }

    /**
     * Set the current broadcaster ID
     */
    setCurrentBroadcasterId(broadcasterId) {
        this.currentBroadcasterId = broadcasterId;
    }

    /**
     * Add a system message to the chat
     */
    addSystemMessage(message, autoRemove = false) {
        if (!this.chatMessages) {
            console.error("Chat messages container not found for system message.");
            return;
        }

        const shouldScroll = this.config.chatMode === 'window' && this.scrollManager.autoFollow;
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message system-message';

        let timestamp = '';
        if (this.config.showTimestamps) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            timestamp = `${hours}:${minutes} `;
        }

        messageElement.innerHTML = `<span class="timestamp">${timestamp}</span><span class="message-content">${message}</span>`;
        this.chatMessages.appendChild(messageElement);

        // Keep sentinel as the last element
        this.scrollManager.ensureSentinelLast();

        if (this.config.chatMode === 'window') {
            this.limitMessages();
        }

        if (shouldScroll) {
            this.scrollManager.scrollToBottom();
        }

        // Auto-remove temporary messages after 3 seconds
        if (autoRemove) {
            setTimeout(() => {
                if (messageElement && messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 3000);
        }
    }

    /**
     * Add a user message to the chat
     */
    addChatMessage(data) {
        try {
            if (!data.username || !data.message) return;

            let targetContainer;
            let currentScrollArea;

            if (this.config.chatMode === 'popup') {
                targetContainer = document.getElementById('popup-messages');
                if (!targetContainer) { console.error('Popup messages container not found'); return; }
            } else { // window mode
                targetContainer = this.chatMessages;
                currentScrollArea = this.scrollManager.scrollArea;
                if (!targetContainer) { console.error('Chat messages container not found'); return; }
                if (!currentScrollArea) { console.error('Chat scroll area not found'); }
            }
            if (!targetContainer) { console.error('Target container could not be determined or found.'); return; }

            const shouldScroll = this.config.chatMode === 'window' && this.scrollManager.autoFollow;
            const messageElement = document.createElement('div');

            if (this.config.chatMode === 'popup') {
                messageElement.className = 'popup-message';
                messageElement.classList.add(this.config.popup?.direction || 'from-bottom');
            } else {
                messageElement.className = 'chat-message';
            }

            let timestamp = '';
            if (this.config.showTimestamps) {
                const now = new Date();
                timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} `;
            }

            let userColor = data.color || UIHelpers.generateColorFromName(data.username);
            if (this.config.overrideUsernameColors) {
                userColor = this.config.usernameColor;
            }

            let message = this.parseEmotes(data.message, data.emotes);

            // Check if message contains only a single emote (for enlargement feature)
            const isSingleEmote = this.checkSingleEmote(message);

            // Process URLs only if message does not contain emotes
            if (!message.includes('<img class="emote"')) {
                message = message.replace(/(\bhttps?:\/\/[^\s<]+)/g, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
            }

            // Badge HTML
            const badgesHtml = data.tags?.badges
                ? this.badgeManager.generateBadgeHTML(data.tags.badges, this.currentBroadcasterId)
                : '';

            messageElement.innerHTML = `
                <span class="timestamp">${timestamp}</span>
                ${badgesHtml}
                <span class="username" style="color: ${userColor}">${data.username}:</span>
                <span class="message-content">${message}</span>`;

            // Apply single-emote class if detected
            if (isSingleEmote) {
                messageElement.classList.add('single-emote-message');
            }

            targetContainer.appendChild(messageElement);

            // After message added, listen for image loads to adjust scroll if needed
            if (this.config.chatMode !== 'popup' && currentScrollArea && this.scrollManager.isUserScrolledToBottom(currentScrollArea)) {
                const imgs = messageElement.querySelectorAll('img');
                imgs.forEach(img => {
                    if (!img.complete) {
                        img.addEventListener('load', () => this.scrollManager.stickToBottomSoon(), { once: true });
                        img.addEventListener('error', () => this.scrollManager.stickToBottomSoon(), { once: true });
                    }
                });
            }

            if (this.config.chatMode !== 'popup') {
                // Keep sentinel as the last element
                this.scrollManager.ensureSentinelLast();
            }

            if (this.config.chatMode === 'popup') {
                this.handlePopupMessage(messageElement, targetContainer);
            } else { // Window mode
                this.limitMessages();
                if (shouldScroll && currentScrollArea) {
                    this.scrollManager.scrollToBottom();
                }
            }
        } catch (error) {
            console.error('Error adding chat message:', error);
        }
    }

    /**
     * Parse and replace emotes in message
     */
    parseEmotes(message, emotes) {
        if (!emotes || typeof emotes !== 'object') {
            return message;
        }

        const emotePositions = [];
        try {
            for (const emoteId in emotes) {
                if (!emotes.hasOwnProperty(emoteId)) continue;
                const emotePositionArray = emotes[emoteId];
                if (!Array.isArray(emotePositionArray)) continue;

                for (const position of emotePositionArray) {
                    if (!position?.includes('-')) continue;
                    const [startStr, endStr] = position.split('-');
                    const start = parseInt(startStr, 10);
                    const end = parseInt(endStr, 10);
                    if (isNaN(start) || isNaN(end) || start < 0 || end < 0 || start > end || end >= message.length) continue;
                    emotePositions.push({ start, end, id: emoteId });
                }
            }
        } catch (err) { console.error('Error processing emotes:', err); }

        emotePositions.sort((a, b) => b.start - a.start); // Process from end

        for (const emote of emotePositions) {
            try {
                const emoteCode = message.substring(emote.start, emote.end + 1);
                const emoteBaseUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark`;
                const emoteHtml = `<img class="emote" src="${emoteBaseUrl}/3.0"
                    onerror="this.onerror=function(){this.src='${emoteBaseUrl}/1.0';}; this.src='${emoteBaseUrl}/2.0';"
                    alt="${emoteCode.replace(/"/g, '&quot;')}"
                    title="${emoteCode.replace(/"/g, '&quot;')}" />`;
                message = message.substring(0, emote.start) + emoteHtml + message.substring(emote.end + 1);
            } catch (err) { console.error('Error replacing emote:', err); }
        }

        return message;
    }

    /**
     * Check if message contains only a single emote
     */
    checkSingleEmote(message) {
        if (!this.config.enlargeSingleEmotes || !message.includes('<img class="emote"')) {
            return false;
        }

        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = message;
        const emotes = tempDiv.querySelectorAll('img.emote');
        // Remove all whitespace and check if only one emote exists
        const textContent = tempDiv.textContent.trim();
        return emotes.length === 1 && textContent === '';
    }

    /**
     * Handle popup message animation and removal
     */
    handlePopupMessage(messageElement, targetContainer) {
        void messageElement.offsetWidth; // Force reflow for transition
        messageElement.classList.add('visible');

        // Limit popup messages
        const popupMsgs = Array.from(targetContainer.querySelectorAll('.popup-message'));
        const maxMessages = this.config.popup?.maxMessages;
        if (popupMsgs.length > maxMessages && maxMessages > 0) {
            try {
                const removeCount = popupMsgs.length - maxMessages;
                for (let i = 0; i < removeCount; i++) {
                    popupMsgs[i]?.parentNode?.removeChild(popupMsgs[i]);
                }
            } catch (err) { console.error('Error removing excess popup messages:', err); }
        }

        // Auto-remove timer
        const duration = (this.config.popup?.duration || 5) * 1000;
        if (duration > 0 && duration < 60000) { // Validate duration
            setTimeout(() => {
                messageElement.classList.remove('visible'); // Start slide-out
                requestAnimationFrame(() => { // Ensure transition starts
                    void messageElement.offsetWidth; // Force reflow
                    messageElement.classList.add('removing');
                    setTimeout(() => { // Remove after transition
                        messageElement.parentNode?.removeChild(messageElement);
                    }, 300); // Match CSS transition duration
                });
            }, duration);
        }
    }

    /**
     * Limit the number of messages displayed in window mode
     */
    limitMessages() {
        if (!this.chatMessages) return;
        const max = this.config.maxMessages || 50;

        const scroller = this.scrollManager.scrollArea;
        const wasAtBottom = this.scrollManager.isUserScrolledToBottom(scroller);
        let distanceFromBottom = 0;
        if (scroller) {
            distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
        }

        // Remove oldest messages but never remove the sentinel
        const sentinel = this.scrollManager.bottomSentinel;
        const targetCount = max + (sentinel ? 1 : 0);
        while (this.chatMessages.children.length > targetCount) {
            const firstChild = this.chatMessages.firstChild;
            if (firstChild === sentinel) break;
            this.chatMessages.removeChild(firstChild);
        }

        // Keep sentinel last
        this.scrollManager.ensureSentinelLast();

        // Restore scroll on next frame after layout settles
        if (scroller) {
            requestAnimationFrame(() => {
                if (wasAtBottom && this.scrollManager.autoFollow) {
                    this.scrollManager.setScrollTop(scroller, scroller.scrollHeight);
                } else {
                    this.scrollManager.setScrollTop(scroller, Math.max(0, scroller.scrollHeight - scroller.clientHeight - distanceFromBottom));
                }
            });
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        if (this.chatMessages) {
            while (this.chatMessages.firstChild) {
                this.chatMessages.removeChild(this.chatMessages.firstChild);
            }
            this.scrollManager.ensureSentinelLast();
        }
    }
}
