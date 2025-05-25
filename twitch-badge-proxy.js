// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { createClient } = require('redis');
const functions = require('@google-cloud/functions-framework');

// --- Configuration (User needs to update placeholders) ---
// Replace YOUR_PROJECT_ID with your actual Google Cloud Project ID
const TWITCH_CLIENT_ID_SECRET_NAME = 'projects/YOUR_PROJECT_ID/secrets/TWITCH_CLIENT_ID/versions/latest';
const TWITCH_CLIENT_SECRET_SECRET_NAME = 'projects/YOUR_PROJECT_ID/secrets/TWITCH_CLIENT_SECRET/versions/latest';
const INTERNAL_REFRESH_TOKEN_SECRET_NAME = 'projects/YOUR_PROJECT_ID/secrets/INTERNAL_REFRESH_TOKEN/versions/latest'; // For refreshGlobalCache endpoint

// Replace with your Memorystore for Redis instance details
const REDIS_HOST = 'YOUR_REDIS_HOST'; // e.g., '10.0.0.3'
const REDIS_PORT = 6379; // Default Redis port

const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';
const TWITCH_OAUTH_URL = 'https://id.twitch.tv/oauth2/token';

// Cache Keys
const TWITCH_APP_ACCESS_TOKEN_KEY = 'twitch_app_access_token';
const GLOBAL_BADGES_KEY = 'twitch_global_badges';
const CHANNEL_BADGES_KEY_PREFIX = 'twitch_channel_badges:'; // Appended with broadcaster_id

// Cache TTLs (in seconds)
const APP_TOKEN_TTL = 50 * 24 * 60 * 60; // 50 days (Twitch app access tokens are long-lived)
const GLOBAL_BADGES_TTL = 12 * 60 * 60; // 12 hours
const CHANNEL_BADGES_TTL = 1 * 60 * 60; // 1 hour

// --- Initialize Clients ---
const secretManagerClient = new SecretManagerServiceClient();
const redisClient = createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
});

// --- Redis Connection Handling ---
redisClient.on('error', (err) => console.error('Redis Client Error', err));
// Connect to Redis at the start. For 2nd Gen GCF, top-level connections persist.
redisClient.connect().catch(console.error);


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
        try {
            const cachedToken = await redisClient.get(TWITCH_APP_ACCESS_TOKEN_KEY);
            if (cachedToken) {
                console.log('Using cached Twitch app access token.');
                return cachedToken;
            }
        } catch (err) {
            console.warn('Redis GET error for app access token:', err);
            // Proceed to fetch a new token if Redis read fails
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
        const effectiveTtl = expires_in ? Math.min(expires_in - 300, APP_TOKEN_TTL) : APP_TOKEN_TTL; // Subtract 5 mins as buffer

        await redisClient.set(TWITCH_APP_ACCESS_TOKEN_KEY, access_token, {
            EX: effectiveTtl,
        });
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
                title: version.title,
                // Potentially include other URLs if needed:
                // imageUrl2x: version.image_url_2x,
                // imageUrl4x: version.image_url_4x,
            };
        });
    });
    return transformed;
}

// --- Cloud Function: Get Global Badges ---
functions.http('getGlobalBadges', async (req, res) => {
    // --- CORS Headers (User should restrict this in API Gateway or Cloud Function settings) ---
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        // Handle preflight requests
        res.status(204).send('');
        return;
    }

    // --- API Key Check (Placeholder - User should implement robust validation, e.g., via API Gateway) ---
    // This is a basic check. For production, use API Gateway for proper API key validation.
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        console.warn('Missing x-api-key header');
        // return res.status(401).send('API Key required.'); // Consider if this is needed if API Gateway handles it
    }
    // else {
    //    console.log('Received API Key:', apiKey); // For debugging, remove in production
    //    // Add actual key validation logic here if not handled by API Gateway
    // }

    try {
        // Check Redis for cached global badges
        const cachedBadges = await redisClient.get(GLOBAL_BADGES_KEY);
        if (cachedBadges) {
            console.log('Returning cached global badges.');
            res.status(200).json(JSON.parse(cachedBadges));
            return;
        }

        console.log('Fetching global badges from Twitch API...');
        const accessToken = await getTwitchAppAccessToken();
        const clientId = await getSecret(TWITCH_CLIENT_ID_SECRET_NAME); // Twitch API requires Client-ID header

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

        await redisClient.set(GLOBAL_BADGES_KEY, JSON.stringify(transformedData), {
            EX: GLOBAL_BADGES_TTL,
        });
        console.log('Successfully fetched and cached global badges.');

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
    // --- CORS Headers ---
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // --- API Key Check (Placeholder) ---
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        console.warn('Missing x-api-key header for channel badges');
        // return res.status(401).send('API Key required.');
    }

    const broadcasterId = req.query.broadcaster_id;
    if (!broadcasterId) {
        return res.status(400).send('Missing required query parameter: broadcaster_id');
    }

    const cacheKey = `${CHANNEL_BADGES_KEY_PREFIX}${broadcasterId}`;

    try {
        // Check Redis for cached channel badges
        const cachedBadges = await redisClient.get(cacheKey);
        if (cachedBadges) {
            console.log(`Returning cached channel badges for broadcaster: ${broadcasterId}`);
            res.status(200).json(JSON.parse(cachedBadges));
            return;
        }

        console.log(`Fetching channel badges from Twitch API for broadcaster: ${broadcasterId}...`);
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

        await redisClient.set(cacheKey, JSON.stringify(transformedData), {
            EX: CHANNEL_BADGES_TTL,
        });
        console.log(`Successfully fetched and cached channel badges for broadcaster: ${broadcasterId}`);

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

    // --- Security Check ---
    // Prefer X-CloudScheduler header for requests from Cloud Scheduler
    // For other callers, use a secret token.
    const cloudSchedulerHeader = req.headers['x-cloudscheduler'];
    const internalTokenHeader = req.headers['x-internal-refresh-token'];
    let authorized = false;

    if (cloudSchedulerHeader === 'true') {
        authorized = true;
        console.log('Authorized refreshGlobalCache call from Cloud Scheduler.');
    } else if (internalTokenHeader) {
        try {
            const expectedToken = await getSecret(INTERNAL_REFRESH_TOKEN_SECRET_NAME);
            if (internalTokenHeader === expectedToken) {
                authorized = true;
                console.log('Authorized refreshGlobalCache call with internal token.');
            } else {
                console.warn('Invalid internal refresh token received.');
            }
        } catch (secretError) {
            console.error('Error fetching internal refresh token for validation:', secretError);
            return res.status(500).send('Internal error during authorization.');
        }
    }

    if (!authorized) {
        console.warn('Unauthorized attempt to refresh global cache.');
        return res.status(403).send('Forbidden: Missing or invalid authorization.');
    }

    try {
        console.log('Force refreshing Twitch app access token...');
        // Force refresh token by deleting it from cache first or by passing a flag to getTwitchAppAccessToken
        // For simplicity, we'll use the flag approach if getTwitchAppAccessToken supports it.
        // Current implementation of getTwitchAppAccessToken fetches new if forceRefresh = true
        await getTwitchAppAccessToken(true); // true to force refresh

        console.log('Force re-fetching global badges from Twitch API...');
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

        await redisClient.set(GLOBAL_BADGES_KEY, JSON.stringify(transformedData), {
            EX: GLOBAL_BADGES_TTL,
        });
        console.log('Successfully force-refreshed and cached global badges.');

        res.status(200).send('Global cache refreshed successfully.');
    } catch (error) {
        console.error('Error in refreshGlobalCache:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error during cache refresh.');
        }
    }
});

// Note: No explicit redisClient.quit() is generally needed in GCF 2nd Gen,
// as connections are reused across invocations.
// If issues arise or for 1st Gen, you might need to manage connections more explicitly.
// However, for long-lived GCF instances, the top-level `redisClient.connect()` is preferred.
```
