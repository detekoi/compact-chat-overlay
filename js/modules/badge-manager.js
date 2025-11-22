/**
 * Badge Manager Module
 * Handles fetching, caching, and management of Twitch badges (global and channel-specific)
 */

export class BadgeManager {
    constructor(config) {
        this.config = config;
        this.globalBadges = null; // { data: {}, timestamp: 0 }
        this.channelBadges = {}; // { broadcasterId: { data: {}, timestamp: 0 } }
        this.badgeFetchPromises = {}; // To prevent duplicate fetches for the same channel
    }

    /**
     * Fetch data with caching support
     */
    async fetchWithCache(cacheKey, ttl, url, isJson = true) {
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
            try {
                const { data, timestamp } = JSON.parse(cachedItem);
                if (Date.now() - timestamp < ttl) {
                    console.log(`Using cached data for ${cacheKey}`);
                    return data;
                }
            } catch (e) {
                console.error(`Error parsing cached ${cacheKey}:`, e);
                localStorage.removeItem(cacheKey); // Remove corrupted item
            }
        }

        console.log(`Fetching data for ${cacheKey} from ${url}`);
        try {
            // Add a check for placeholder URLs before fetching
            if (!url || url.includes('YOUR_') || url.includes('PLACEHOLDER')) {
                throw new Error(`Invalid or placeholder URL for ${cacheKey}: ${url}`);
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${cacheKey}: ${response.status} ${response.statusText}`);
            }
            const data = isJson ? await response.json() : await response.text();
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
            return data;
        } catch (error) {
            console.error(`Error fetching ${cacheKey}:`, error);
            if (this.config.badgeFallbackHide) {
                return null;
            }
            return null; // Return null on error, upstream will handle placeholder or message
        }
    }

    /**
     * Fetch global badges
     */
    async fetchGlobalBadges(updatePreviewCallback = null) {
        if (!this.config.showBadges || !this.config.badgeEndpointUrlGlobal || this.config.badgeEndpointUrlGlobal.includes('YOUR_GLOBAL_BADGE_PROXY_URL_HERE')) {
            console.warn('Global badge fetching disabled or URL not configured.');
            this.globalBadges = null;
            return;
        }
        try {
            const data = await this.fetchWithCache('twitchGlobalBadges', this.config.badgeCacheGlobalTTL, this.config.badgeEndpointUrlGlobal);
            this.globalBadges = data ? { data, timestamp: Date.now() } : null; // Store in memory for faster access
            console.log('Global badges fetched/loaded from cache:', this.globalBadges);
            if (updatePreviewCallback) {
                updatePreviewCallback(); // Update preview in case badges are now available
            }
        } catch (error) {
            console.error('Failed to initialize global badges:', error);
            this.globalBadges = null;
            // Always hide error messages for badge failures
        }
    }

    /**
     * Fetch channel-specific badges
     */
    async fetchChannelBadges(broadcasterId) {
        if (!this.config.showBadges || !broadcasterId || !this.config.badgeEndpointUrlChannel || this.config.badgeEndpointUrlChannel.includes('YOUR_CHANNEL_BADGE_PROXY_URL_HERE')) {
            console.warn('Channel badge fetching disabled, no broadcaster ID, or URL not configured.');
            this.channelBadges[broadcasterId] = null;
            return;
        }

        const cacheKey = `twitchChannelBadges_${broadcasterId}`;
        const channelApiUrl = `${this.config.badgeEndpointUrlChannel}?broadcaster_id=${broadcasterId}`;

        if (this.badgeFetchPromises[broadcasterId]) {
            console.log(`Channel badge fetch already in progress for ${broadcasterId}. Awaiting existing promise.`);
            return this.badgeFetchPromises[broadcasterId];
        }

        const fetchPromise = this.fetchWithCache(cacheKey, this.config.badgeCacheChannelTTL, channelApiUrl)
            .then(data => {
                this.channelBadges[broadcasterId] = data ? { data, timestamp: Date.now() } : null;
                console.log(`Channel badges for ${broadcasterId} fetched/loaded:`, this.channelBadges[broadcasterId]);
            })
            .catch(error => {
                console.error(`Failed to initialize channel badges for ${broadcasterId}:`, error);
                this.channelBadges[broadcasterId] = null;
                // Always hide error messages for badge failures
            })
            .finally(() => {
                delete this.badgeFetchPromises[broadcasterId];
            });

        this.badgeFetchPromises[broadcasterId] = fetchPromise;
        return fetchPromise;
    }

    /**
     * Get badge info for a specific badge set and version
     */
    getBadgeInfo(setId, versionId, broadcasterId) {
        // Try channel badges first if broadcaster ID is available
        if (broadcasterId && this.channelBadges[broadcasterId]?.data?.[setId]?.[versionId]) {
            return this.channelBadges[broadcasterId].data[setId][versionId];
        }
        // Fall back to global badges
        if (this.globalBadges?.data?.[setId]?.[versionId]) {
            return this.globalBadges.data[setId][versionId];
        }
        return null;
    }

    /**
     * Generate badge HTML for a message
     */
    generateBadgeHTML(badgeString, broadcasterId) {
        if (!this.config.showBadges || !badgeString) return '';

        const badgesContainer = document.createElement('span');
        badgesContainer.className = 'badges';
        const badgeStrings = badgeString.split(',');

        badgeStrings.forEach(badgeStr => {
            if (!badgeStr.includes('/')) return;
            const [setId, versionId] = badgeStr.split('/');

            const badgeInfo = this.getBadgeInfo(setId, versionId, broadcasterId);

            if (badgeInfo && badgeInfo.imageUrl) {
                const badgeImg = document.createElement('img');
                badgeImg.className = 'chat-badge';
                // Try 4x first, fallback to 2x, then 1x
                const fallback2x = badgeInfo.imageUrl2x || badgeInfo.imageUrl;
                const fallback1x = badgeInfo.imageUrl;
                badgeImg.src = badgeInfo.imageUrl4x || badgeInfo.imageUrl2x || badgeInfo.imageUrl;
                badgeImg.onerror = function () {
                    this.onerror = function () { this.src = fallback1x; };
                    this.src = fallback2x;
                };
                badgeImg.alt = badgeInfo.title || setId;
                badgeImg.title = badgeInfo.title || setId;
                badgesContainer.appendChild(badgeImg);
            }
        });

        if (badgesContainer.hasChildNodes()) {
            return `<span class="badges">${badgesContainer.innerHTML}</span>`;
        }
        return '';
    }
}
