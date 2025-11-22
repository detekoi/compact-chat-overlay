/**
 * Scroll Manager Module
 * Handles auto-scroll behavior and scroll position management for the chat
 */

export class ScrollManager {
    constructor(scrollArea, chatMessages) {
        this.scrollArea = scrollArea;
        this.chatMessages = chatMessages;
        this.autoFollow = true;
        this.isProgrammaticScroll = false;
        this.bottomSentinel = null;

        this.initializeBottomSentinel();
        this.setupScrollListeners();
        this.setupResizeObserver();
    }

    /**
     * Create a bottom sentinel to anchor scroll-to-bottom reliably
     */
    initializeBottomSentinel() {
        this.bottomSentinel = document.getElementById('chat-bottom-sentinel');
        if (!this.bottomSentinel && this.chatMessages) {
            this.bottomSentinel = document.createElement('div');
            this.bottomSentinel.id = 'chat-bottom-sentinel';
            this.bottomSentinel.style.cssText = 'height:1px;width:100%; overflow-anchor: auto;';
            this.chatMessages.appendChild(this.bottomSentinel);
        }
    }

    /**
     * Set scroll position programmatically
     */
    setScrollTop(element, value) {
        if (!element) return;
        this.isProgrammaticScroll = true;
        element.scrollTop = value;
        requestAnimationFrame(() => { this.isProgrammaticScroll = false; });
    }

    /**
     * Check if the user is scrolled near the bottom of an element.
     */
    isUserScrolledToBottom(element) {
        if (!element) return false;
        const tolerance = 5; // Pixels
        return element.scrollHeight - element.clientHeight <= element.scrollTop + tolerance;
    }

    /**
     * Force stick-to-bottom on next frame (used after async layout changes like images)
     */
    stickToBottomSoon() {
        if (!this.scrollArea) return;
        requestAnimationFrame(() => {
            if (this.autoFollow) {
                this.setScrollTop(this.scrollArea, this.scrollArea.scrollHeight);
            }
        });
    }

    /**
     * Setup scroll event listeners
     */
    setupScrollListeners() {
        if (!this.scrollArea) return;

        const onUserScroll = () => {
            if (this.isProgrammaticScroll) return;
            const atBottom = this.isUserScrolledToBottom(this.scrollArea);
            this.autoFollow = atBottom;
        };

        this.scrollArea.addEventListener('scroll', onUserScroll, { passive: true });
        this.scrollArea.addEventListener('wheel', onUserScroll, { passive: true });
        this.scrollArea.addEventListener('touchmove', onUserScroll, { passive: true });
        this.scrollArea.addEventListener('touchstart', () => {
            if (!this.isProgrammaticScroll) this.autoFollow = false;
        }, { passive: true });
        this.scrollArea.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) {
                if (!this.isProgrammaticScroll) this.autoFollow = false;
            }
        });
    }

    /**
     * Setup ResizeObserver to keep at bottom when appropriate
     */
    setupResizeObserver() {
        if ('ResizeObserver' in window && this.scrollArea && this.chatMessages) {
            const resizeObserver = new ResizeObserver(() => {
                if (this.autoFollow) {
                    this.setScrollTop(this.scrollArea, this.scrollArea.scrollHeight);
                }
            });
            resizeObserver.observe(this.chatMessages);
        }
    }

    /**
     * Scroll to bottom if auto-follow is enabled
     */
    scrollToBottom() {
        if (this.autoFollow && this.scrollArea) {
            requestAnimationFrame(() => {
                this.setScrollTop(this.scrollArea, this.scrollArea.scrollHeight);
            });
        }
    }

    /**
     * Ensure sentinel is the last element
     */
    ensureSentinelLast() {
        if (this.bottomSentinel && this.bottomSentinel.parentNode !== this.chatMessages) {
            this.chatMessages.appendChild(this.bottomSentinel);
        }
    }
}
