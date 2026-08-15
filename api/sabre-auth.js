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
let lastFailure = null;   // { message, expiresAt }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the Sabre base URL based on the configured environment.
 */
function getBaseUrl() {
    const env = (process.env.SABRE_ENVIRONMENT || 'cert').trim().toLowerCase();
    return SABRE_HOSTS[env] || SABRE_HOSTS.cert;
}

/**
 * Build the Base64-encoded `clientId:clientSecret` string required by Sabre.
 *  – V2 (default): base64( base64(clientId) + ':' + base64(clientSecret) )
 *  – V1 (fallback): base64( clientId + ':' + clientSecret )
 */
function buildBasicAuthHeader(version = 'V2') {
    const clientId = (process.env.SABRE_CLIENT_ID || '').trim();
    const clientSecret = (process.env.SABRE_CLIENT_SECRET || '').trim();

    if (!clientId || !clientSecret) {
        throw new Error('Missing SABRE_CLIENT_ID or SABRE_CLIENT_SECRET environment variables');
    }

    let combined;
    if (version === 'V2') {
        const encodedId = Buffer.from(clientId).toString('base64');
        const encodedSecret = Buffer.from(clientSecret).toString('base64');
        combined = Buffer.from(`${encodedId}:${encodedSecret}`).toString('base64');
    } else {
        combined = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    }

    return `Basic ${combined}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a valid Sabre access token.
 *
 * @returns {Promise<string>} Bearer access token
 */
async function getToken() {
    // Return cached token if still valid
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.accessToken;
    }

    // Fast reject if last auth attempt failed within 15 seconds to prevent log flooding
    if (lastFailure && Date.now() < lastFailure.expiresAt) {
        throw new Error(`Sabre authentication failed (cached): ${lastFailure.message}`);
    }

    const clientId = (process.env.SABRE_CLIENT_ID || '').trim();
    const clientSecret = (process.env.SABRE_CLIENT_SECRET || '').trim();
    const staticToken = (process.env.SABRE_TOKEN || '').trim();

    if (staticToken) {
        console.log('[SabreAuth] Using static SABRE_TOKEN from environment');
        cachedToken = {
            accessToken: staticToken,
            expiresAt: Date.now() + (3600 * 1000) - EXPIRY_BUFFER_MS,
        };
        return cachedToken.accessToken;
    }

    if (!clientId || !clientSecret || clientId === 'placeholder') {
        throw new Error('Sabre credentials not configured. Please add valid SABRE_CLIENT_ID and SABRE_CLIENT_SECRET to .env');
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
            lastFailure = null;

            console.log(`[SabreAuth] Token obtained via ${strategy.name} – expires in ${expires_in}s`);
            return cachedToken.accessToken;
        } catch (error) {
            const status = error.response?.status;
            const data = error.response?.data;
            const message = data?.error_description || data?.error || error.message;
            console.warn(`[SabreAuth] ${strategy.name} failed (HTTP ${status || 'N/A'}): ${message}`);
            lastError = error;
        }
    }

    // All strategies failed - cache failure for 15 seconds to prevent continuous log spamming
    cachedToken = null;
    const message = lastError?.response?.data?.error_description || lastError?.message || 'Authentication failed';
    lastFailure = {
        message,
        expiresAt: Date.now() + 15000
    };

    console.error(`[SabreAuth] All auth strategies failed: ${message}`);
    throw new Error(`Sabre authentication failed: ${message}`);
}

/**
 * Clears the cached token – useful for testing or forced re-auth.
 */
function clearTokenCache() {
    cachedToken = null;
    lastFailure = null;
}

module.exports = {
    getToken,
    getBaseUrl,
    clearTokenCache,
};
