/**
 * Pronoun Manager Module
 * Handles fetching and caching of pronouns from Alejo's API (https://pr.alejo.io/)
 */

export class PronounManager {
    constructor() {
        this.pronounsMap = new Map(); // pronoun_id -> display_string (e.g. "hehim" -> "He/Him")
        this.userPronounsCache = new Map(); // username -> pronoun_id
        this.pendingRequests = new Map(); // username -> Promise
        this.hasLoadedDefinitions = false;
        this.BASE_URL = 'https://pronouns.alejo.io/api';
    }

    /**
     * Load pronoun definitions (mapping IDs to display strings)
     */
    async loadDefinitions() {
        if (this.hasLoadedDefinitions) return;

        try {
            const response = await fetch(`${this.BASE_URL}/pronouns`);
            if (!response.ok) throw new Error(`Failed to load pronouns: ${response.status}`);

            const data = await response.json();
            // Data format: array of { name: "hehim", display: "He/Him" }
            if (Array.isArray(data)) {
                data.forEach(p => {
                    this.pronounsMap.set(p.name, p.display);
                });
                this.hasLoadedDefinitions = true;
                console.log('[PronounManager] Loaded definitions:', this.pronounsMap.size);
            }
        } catch (error) {
            console.warn('[PronounManager] Error loading definitions:', error);
        }
    }

    /**
     * Get pronoun display string for a user
     * Returns null if not found or not yet loaded
     * Triggers fetch if not in cache
     */
    async getUserPronoun(username) {
        if (!username) return null;
        const lowerUser = username.toLowerCase();

        // 1. Check cache
        if (this.userPronounsCache.has(lowerUser)) {
            const pronounId = this.userPronounsCache.get(lowerUser);
            return this.pronounsMap.get(pronounId) || null;
        }

        // 2. If already fetching, return the existing promise
        if (this.pendingRequests.has(lowerUser)) {
            return this.pendingRequests.get(lowerUser);
        }

        // 3. Trigger fetch
        const fetchPromise = (async () => {
            try {
                const response = await fetch(`${this.BASE_URL}/users/${lowerUser}`);
                if (response.ok) {
                    const rawData = await response.json();
                    const data = Array.isArray(rawData) ? rawData[0] : rawData;

                    if (data && data.pronoun_id) {
                        this.userPronounsCache.set(lowerUser, data.pronoun_id);
                        if (!this.hasLoadedDefinitions) {
                            await this.loadDefinitions();
                        }
                        return this.pronounsMap.get(data.pronoun_id) || data.pronoun_id;
                    } else {
                        this.userPronounsCache.set(lowerUser, null);
                        return null;
                    }
                } else if (response.status === 404) {
                    this.userPronounsCache.set(lowerUser, null);
                    return null;
                }
            } catch (error) {
                console.warn(`[PronounManager] Error fetching for ${lowerUser}:`, error);
                return null;
            } finally {
                this.pendingRequests.delete(lowerUser);
            }
            return null;
        })();

        this.pendingRequests.set(lowerUser, fetchPromise);
        return fetchPromise;
    }

    /**
     * Get display text synchronously if available
     */
    getPronounDisplay(username) {
        if (!username) return null;
        const lowerUser = username.toLowerCase();
        const pid = this.userPronounsCache.get(lowerUser);
        return pid ? (this.pronounsMap.get(pid) || pid) : null;
    }
}
