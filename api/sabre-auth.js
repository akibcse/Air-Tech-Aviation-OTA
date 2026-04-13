/**
 * Sabre OAuth2 Authentication Module
 * -----------------------------------
 * Implements client-credentials flow for Sabre REST APIs.
 * Tokens are cached in-memory and auto-refreshed before expiry.
 *
 * Environment variables required:
 *   SABRE_CLIENT_ID      – Sabre API client ID
 *   SABRE_CLIENT_SECRET   – Sabre API client secret
 *   SABRE_ENVIRONMENT     – "cert" (default) or "prod"
 */

const axios = require('axios');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SABRE_HOSTS = {
    cert: 'https://api.cert.platform.sabre.com',
    prod: 'https://api.platform.sabre.com',
};

const TOKEN_PATH = '/v2/auth/token';

// Refresh the token 60 seconds before it actually expires
const EXPIRY_BUFFER_MS = 60 * 1000;

// ---------------------------------------------------------------------------
// In-memory token cache
// ---------------------------------------------------------------------------

let cachedToken = null;   // { accessToken, expiresAt }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the Sabre base URL based on the configured environment.
 */
function getBaseUrl() {
    const env = (process.env.SABRE_ENVIRONMENT || 'cert').toLowerCase();
    return SABRE_HOSTS[env] || SABRE_HOSTS.cert;
}

/**
 * Build the Base64-encoded `clientId:clientSecret` string required by Sabre.
 *  – V2 (default): base64( base64(clientId) + ':' + base64(clientSecret) )
 *  – V1 (fallback): base64( clientId + ':' + clientSecret )
 */
function buildBasicAuthHeader(version = 'V2') {
    const clientId = process.env.SABRE_CLIENT_ID;
    const clientSecret = process.env.SABRE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing SABRE_CLIENT_ID or SABRE_CLIENT_SECRET environment variables');
    }

    let combined;
    if (version === 'V2') {
        // Sabre V2 auth: double-encode
        const encodedId = Buffer.from(clientId).toString('base64');
        const encodedSecret = Buffer.from(clientSecret).toString('base64');
        combined = Buffer.from(`${encodedId}:${encodedSecret}`).toString('base64');
    } else {
        // V1 auth: single-encode
        combined = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    }

    return `Basic ${combined}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a valid Sabre access token.
 * Uses a cached token if it has not expired (with buffer); otherwise fetches a
 * fresh one from the Sabre auth endpoint.
 *
 * @returns {Promise<string>} Bearer access token
 */
async function getToken() {
    // Return cached token if still valid
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.accessToken;
    }

    const staticToken = process.env.SABRE_TOKEN;
    const hasOauthCreds = Boolean(process.env.SABRE_CLIENT_ID && process.env.SABRE_CLIENT_SECRET);

    if (!hasOauthCreds && staticToken) {
        console.log('[SabreAuth] OAuth creds missing, using static SABRE_TOKEN from environment');
        cachedToken = {
            accessToken: staticToken,
            expiresAt: Date.now() + (3600 * 1000) - EXPIRY_BUFFER_MS,
        };
        return cachedToken.accessToken;
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${TOKEN_PATH}`;

    console.log(`[SabreAuth] Requesting new token from ${url}`);

    // Try V2 encoding first, then fall back to V1 encoding
    const authStrategies = [
        { name: 'V2', header: buildBasicAuthHeader('V2') },
        { name: 'V1', header: buildBasicAuthHeader('V1') },
    ];

    let lastError = null;

    for (const strategy of authStrategies) {
        try {
            console.log(`[SabreAuth] Trying ${strategy.name} encoding...`);
            const response = await axios.post(url, 'grant_type=client_credentials', {
                headers: {
                    'Authorization': strategy.header,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 15000,
            });

            const { access_token, expires_in } = response.data;

            if (!access_token) {
                throw new Error('No access_token in Sabre auth response');
            }

            // Cache the token
            cachedToken = {
                accessToken: access_token,
                expiresAt: Date.now() + (expires_in * 1000) - EXPIRY_BUFFER_MS,
            };

            console.log(`[SabreAuth] Token obtained via ${strategy.name} – expires in ${expires_in}s`);
            return cachedToken.accessToken;
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.error_description || error.message;
            console.warn(`[SabreAuth] ${strategy.name} failed (HTTP ${status || 'N/A'}): ${message}`);
            lastError = error;
        }
    }

    if (staticToken) {
        console.warn('[SabreAuth] OAuth flow failed, falling back to static SABRE_TOKEN');
        cachedToken = {
            accessToken: staticToken,
            expiresAt: Date.now() + (3600 * 1000) - EXPIRY_BUFFER_MS,
        };
        return cachedToken.accessToken;
    }

    // All strategies failed and no fallback token available
    cachedToken = null;
    const message = lastError?.response?.data?.error_description || lastError?.message;
    console.error(`[SabreAuth] All auth strategies failed: ${message}`);
    throw new Error(`Sabre authentication failed: ${message}`);
}

/**
 * Clears the cached token – useful for testing or forced re-auth.
 */
function clearTokenCache() {
    cachedToken = null;
}

module.exports = {
    getToken,
    getBaseUrl,
    clearTokenCache,
};
