// twitch-badge-proxy.js

const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Firestore, Timestamp } = require('@google-cloud/firestore'); // Added Firestore
const functions = require('@google-cloud/functions-framework');

// --- Configuration ---
const PROJECT_ID = process.env.PROJECT_ID || 'chat-themer';
const TWITCH_CLIENT_ID_SECRET_NAME = process.env.TWITCH_CLIENT_ID_SECRET_NAME || `projects/${PROJECT_ID}/secrets/TWITCH_CLIENT_ID/versions/latest`;
const TWITCH_CLIENT_SECRET_SECRET_NAME = process.env.TWITCH_CLIENT_SECRET_SECRET_NAME || `projects/${PROJECT_ID}/secrets/TWITCH_CLIENT_SECRET/versions/latest`;
const INTERNAL_REFRESH_TOKEN_SECRET_NAME = process.env.INTERNAL_REFRESH_TOKEN_SECRET_NAME || `projects/${PROJECT_ID}/secrets/INTERNAL_REFRESH_TOKEN/versions/latest`;

// Firestore Configuration
const FIRESTORE_COLLECTION_NAME = process.env.FIRESTORE_CACHE_COLLECTION || 'twitchBadgeCache';

const TWITCH_API_BASE_URL = process.env.TWITCH_API_BASE_URL || 'https://api.twitch.tv/helix';
const TWITCH_OAUTH_URL = process.env.TWITCH_OAUTH_URL || 'https://id.twitch.tv/oauth2/token';

// Cache Document IDs in Firestore
const TWITCH_APP_ACCESS_TOKEN_DOC_ID = 'twitch_app_access_token';
const GLOBAL_BADGES_DOC_ID = 'twitch_global_badges';
const CHANNEL_BADGES_DOC_ID_PREFIX = 'channelBadge_'; // Firestore safe prefix

// Cache TTLs (in seconds)
const APP_TOKEN_TTL_SECONDS = parseInt(process.env.APP_TOKEN_TTL) || 50 * 24 * 60 * 60; // 50 days
const GLOBAL_BADGES_TTL_SECONDS = parseInt(process.env.GLOBAL_BADGES_TTL) || 12 * 60 * 60; // 12 hours
const CHANNEL_BADGES_TTL_SECONDS = parseInt(process.env.CHANNEL_BADGES_TTL) || 1 * 60 * 60; // 1 hour

// --- Initialize Clients ---
const secretManagerClient = new SecretManagerServiceClient();
const firestore = new Firestore(); // Initialize Firestore

// --- Firestore Cache Helper Functions ---

/**
 * Gets an item from Firestore cache.
 * @param {string} docId The document ID to fetch.
 * @returns {Promise<any|null>} The cached data or null if not found or expired.
 */
async function getFromCache(docId) {
    try {
        const docRef = firestore.collection(FIRESTORE_COLLECTION_NAME).doc(docId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const cacheEntry = docSnap.data();
            if (cacheEntry.expiresAt && cacheEntry.expiresAt.toMillis() > Date.now()) {
                console.log(`Using cached data for Firestore doc: ${docId}`);
                return JSON.parse(cacheEntry.data); // Assuming data is stored as JSON string
            } else {
                console.log(`Cache expired or missing expiresAt for Firestore doc: ${docId}`);
                // Optionally delete expired doc
                await docRef.delete().catch(err => console.warn(`Failed to delete expired doc ${docId}:`, err));
            }
        }
    } catch (err) {
        console.warn(`Firestore GET error for doc ${docId}:`, err);
    }
    return null;
}

/**
 * Sets an item in Firestore cache.
 * @param {string} docId The document ID to set.
 * @param {any} value The value to cache (will be JSON stringified).
 * @param {number} ttlSeconds Time to live in seconds.
 */
async function setInCache(docId, value, ttlSeconds) {
    try {
        const docRef = firestore.collection(FIRESTORE_COLLECTION_NAME).doc(docId);
        const expiresAt = Timestamp.fromMillis(Date.now() + ttlSeconds * 1000);
        await docRef.set({
            data: JSON.stringify(value),
            expiresAt: expiresAt,
        });
        console.log(`Successfully cached data for Firestore doc: ${docId} with TTL: ${ttlSeconds}s`);
    } catch (err) {
        console.error(`Firestore SET error for doc ${docId}:`, err);
    }
}


// --- Helper Function: Get Secret ---
async function getSecret(secretName) {
    try {
        const [version] = await secretManagerClient.accessSecretVersion({
            name: secretName,
        });
        const payload = version.payload.data.toString('utf8');
        return payload;
    } catch (error) {
        console.error(`Error fetching secret ${secretName}:`, error);
        throw new Error(`Failed to retrieve secret: ${secretName}`);
    }
}

// --- Helper Function: Get Twitch App Access Token ---
async function getTwitchAppAccessToken(forceRefresh = false) {
    if (!forceRefresh) {
        const cachedTokenData = await getFromCache(TWITCH_APP_ACCESS_TOKEN_DOC_ID);
        if (cachedTokenData && cachedTokenData.token) {
            return cachedTokenData.token;
        }
    }

    console.log('Fetching new Twitch app access token...');
    try {
        const clientId = await getSecret(TWITCH_CLIENT_ID_SECRET_NAME);
        const clientSecret = await getSecret(TWITCH_CLIENT_SECRET_SECRET_NAME);

        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'client_credentials');

        const response = await axios.post(TWITCH_OAUTH_URL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, expires_in } = response.data;

        if (!access_token) {
            throw new Error('No access_token in Twitch OAuth response');
        }

        // Use Twitch's expires_in if available, otherwise use our default TTL
        const effectiveTtlSeconds = expires_in ? Math.min(expires_in - 300, APP_TOKEN_TTL_SECONDS) : APP_TOKEN_TTL_SECONDS; // Subtract 5 mins as buffer

        await setInCache(TWITCH_APP_ACCESS_TOKEN_DOC_ID, { token: access_token }, effectiveTtlSeconds);
        console.log('Successfully fetched and cached new Twitch app access token.');
        return access_token;
    } catch (error) {
        console.error('Error getting Twitch app access token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get Twitch app access token.');
    }
}

// --- Helper Function: Transform Badge Data ---
function transformBadgeData(twitchApiResponse) {
    if (!twitchApiResponse || !Array.isArray(twitchApiResponse.data)) {
        return {};
    }

    const transformed = {};
    twitchApiResponse.data.forEach(badgeSet => {
        transformed[badgeSet.set_id] = {};
        badgeSet.versions.forEach(version => {
            transformed[badgeSet.set_id][version.id] = {
                imageUrl: version.image_url_1x,
                imageUrl2x: version.image_url_2x,
                imageUrl4x: version.image_url_4x,
                title: version.title,
            };
        });
    });
    return transformed;
}

// --- Cloud Function: Get Global Badges ---
functions.http('getGlobalBadges', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const apiKey = req.headers['x-api-key'];
    // API Key check placeholder - implement robust validation if needed

    try {
        const cachedBadges = await getFromCache(GLOBAL_BADGES_DOC_ID);
        if (cachedBadges) {
            console.log('Returning cached global badges from Firestore.');
            res.status(200).json(cachedBadges);
            return;
        }

        console.log('Fetching global badges from Twitch API...');
        const accessToken = await getTwitchAppAccessToken();
        const clientId = await getSecret(TWITCH_CLIENT_ID_SECRET_NAME);

        const response = await axios.get(`${TWITCH_API_BASE_URL}/chat/badges/global`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-ID': clientId,
            },
        });

        if (response.status !== 200 || !response.data) {
            console.error('Twitch API error for global badges:', response.status, response.data);
            res.status(502).send('Failed to fetch global badges from Twitch.');
            return;
        }

        const transformedData = transformBadgeData(response.data);

        await setInCache(GLOBAL_BADGES_DOC_ID, transformedData, GLOBAL_BADGES_TTL_SECONDS);
        console.log('Successfully fetched and cached global badges to Firestore.');

        res.status(200).json(transformedData);
    } catch (error) {
        console.error('Error in getGlobalBadges:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error.');
        }
    }
});

// --- Cloud Function: Get Channel Badges ---
functions.http('getChannelBadges', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    
    // API Key check placeholder

    const broadcasterId = req.query.broadcaster_id;
    if (!broadcasterId) {
        return res.status(400).send('Missing required query parameter: broadcaster_id');
    }

    const cacheDocId = `${CHANNEL_BADGES_DOC_ID_PREFIX}${broadcasterId}`;

    try {
        const cachedBadges = await getFromCache(cacheDocId);
        if (cachedBadges) {
            console.log(`Returning cached channel badges for broadcaster ${broadcasterId} from Firestore.`);
            res.status(200).json(cachedBadges);
            return;
        }

        console.log(`Workspaceing channel badges from Twitch API for broadcaster: ${broadcasterId}...`);
        const accessToken = await getTwitchAppAccessToken();
        const clientId = await getSecret(TWITCH_CLIENT_ID_SECRET_NAME);

        const response = await axios.get(`${TWITCH_API_BASE_URL}/chat/badges`, {
            params: { broadcaster_id: broadcasterId },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-ID': clientId,
            },
        });

        if (response.status !== 200 || !response.data) {
            console.error(`Twitch API error for channel badges (${broadcasterId}):`, response.status, response.data);
            res.status(502).send('Failed to fetch channel badges from Twitch.');
            return;
        }

        const transformedData = transformBadgeData(response.data);

        await setInCache(cacheDocId, transformedData, CHANNEL_BADGES_TTL_SECONDS);
        console.log(`Successfully fetched and cached channel badges for broadcaster ${broadcasterId} to Firestore.`);

        res.status(200).json(transformedData);
    } catch (error) {
        console.error(`Error in getChannelBadges for ${broadcasterId}:`, error.message);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error.');
        }
    }
});

// --- Cloud Function: Refresh Global Cache (Admin) ---
functions.http('refreshGlobalCache', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*'); // Adjust for actual needs
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-internal-refresh-token, X-CloudScheduler');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // --- Security Check (simplified for brevity, ensure robust auth for admin functions) ---
    const cloudSchedulerHeader = req.headers['x-cloudscheduler'];
    const internalTokenHeader = req.headers['x-internal-refresh-token'];
    let authorized = false;

    if (cloudSchedulerHeader === 'true') {
        authorized = true;
    } else if (internalTokenHeader) {
        try {
            const expectedToken = await getSecret(INTERNAL_REFRESH_TOKEN_SECRET_NAME);
            if (internalTokenHeader === expectedToken) authorized = true;
        } catch (secretError) {
            console.error('Error fetching internal refresh token for validation:', secretError);
            // Do not authorize if secret fetching fails
        }
    }

    if (!authorized) {
        console.warn('Unauthorized attempt to refresh global cache.');
        return res.status(403).send('Forbidden: Missing or invalid authorization.');
    }

    try {
        console.log('Force refreshing Twitch app access token (will use Firestore)...');
        await getTwitchAppAccessToken(true); // true to force refresh

        console.log('Force re-fetching global badges from Twitch API (will cache to Firestore)...');
        const accessToken = await getTwitchAppAccessToken(); // Get the newly refreshed token
        const clientId = await getSecret(TWITCH_CLIENT_ID_SECRET_NAME);

        const response = await axios.get(`${TWITCH_API_BASE_URL}/chat/badges/global`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-ID': clientId,
            },
        });

        if (response.status !== 200 || !response.data) {
            console.error('Twitch API error during forced global badges refresh:', response.status, response.data);
            res.status(502).send('Failed to fetch global badges from Twitch during refresh.');
            return;
        }

        const transformedData = transformBadgeData(response.data);
        await setInCache(GLOBAL_BADGES_DOC_ID, transformedData, GLOBAL_BADGES_TTL_SECONDS);
        console.log('Successfully force-refreshed and cached global badges to Firestore.');

        res.status(200).send('Global cache refreshed successfully (Firestore).');
    } catch (error) {
        console.error('Error in refreshGlobalCache:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error during cache refresh.');
        }
    }
});