require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

// Sabre modules
const sabreAuth = require('./sabre-auth');
const sabreFlightSearch = require('./sabre-flight-search');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : {
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                projectId: process.env.FIREBASE_PROJECT_ID
            };

        if (serviceAccount.clientEmail && serviceAccount.privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.FIREBASE_DATABASE_URL
            });
            console.log("Firebase Admin initialized successfully");
        } else {
            console.warn("Firebase Admin credentials missing");
        }
    } catch (e) {
        console.error("Firebase Admin initialization error:", e.message);
    }
}

const db = admin.apps.length ? admin.database() : null;

// Firebase REST Helper (Fallback)
const firebaseRest = {
    baseUrl: process.env.FIREBASE_DATABASE_URL?.replace(/\/$/, ''),

    async get(path, token = null) {
        try {
            const url = `${this.baseUrl}/${path}.json${token ? `?auth=${token}` : ''}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error(`Firebase REST GET Error (${path}):`, error.message);
            throw error;
        }
    },

    async post(path, data, token = null) {
        try {
            const url = `${this.baseUrl}/${path}.json${token ? `?auth=${token}` : ''}`;
            const response = await axios.post(url, data);
            return response.data;
        } catch (error) {
            console.error(`Firebase REST POST Error (${path}):`, error.message);
            throw error;
        }
    },

    async patch(path, data, token = null) {
        try {
            const url = `${this.baseUrl}/${path}.json${token ? `?auth=${token}` : ''}`;
            const response = await axios.patch(url, data);
            return response.data;
        } catch (error) {
            console.error(`Firebase REST PATCH Error (${path}):`, error.message);
            throw error;
        }
    },

    async put(path, data, token = null) {
        try {
            const url = `${this.baseUrl}/${path}.json${token ? `?auth=${token}` : ''}`;
            const response = await axios.put(url, data, {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            console.error(`Firebase REST PUT Error (${path}):`, error.message);
            throw error;
        }
    },

    async push(path, data, token = null) {
        const result = await this.post(path, data, token);
        return { key: result.name };
    }
};

const decodeTokenUnsafe = (token) => {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(Buffer.from(payload, 'base64').toString());
    } catch (e) {
        return null;
    }
};

// Admin Middleware
const verifyAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        console.warn("Missing or invalid Authorization header");
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split('Bearer ')[1];
    req.token = token; // Store token for REST fallback

    try {
        let decodedToken;
        if (admin.apps.length) {
            decodedToken = await admin.auth().verifyIdToken(token);
        } else {
            decodedToken = decodeTokenUnsafe(token);
            if (!decodedToken) {
                console.warn("VerifyAdmin: Invalid token format during unsafe decode");
                return res.status(401).json({ error: "Invalid token format" });
            }
            console.log("VerifyAdmin: Unsafe decode success for email:", decodedToken.email);
        }

        const adminEmail = 'roadyakib@gmail.com';
        console.log(`Verifying admin: ${decodedToken.email} vs ${adminEmail}`);

        if (decodedToken.email === adminEmail) {
            req.user = decodedToken;
            console.log(`Admin verified: ${adminEmail}`);

            // Auto-promote in DB to ensure role consistency
            const promoteInDb = async () => {
                try {
                    const update = {
                        role: 'ADMIN',
                        email: decodedToken.email,
                        displayName: decodedToken.name || 'System Admin',
                        uid: decodedToken.uid
                    };
                    if (db) {
                        await db.ref(`users/${decodedToken.uid}`).update(update);
                    } else {
                        await firebaseRest.patch(`users/${decodedToken.uid}`, update, token);
                    }
                    console.log(`Auto-promotion successful for ${adminEmail}`);
                } catch (e) {
                    console.warn(`Auto-promotion failed for ${adminEmail}:`, e.message);
                }
            };
            promoteInDb();

            next();
        } else {
            console.warn(`Access denied for: ${decodedToken.email}. Expected: ${adminEmail}`);
            res.status(403).json({ error: "Access Denied", email: decodedToken.email });
        }
    } catch (error) {
        console.error("Token verification failed:", error.message);
        res.status(401).json({ error: "Invalid token or verification failed", details: error.message });
    }
};

// API Analytics
const updateApiStats = async (apiPath, duration, error = null) => {
    const apiName = apiPath.replace(/\//g, '_').replace(/\./g, '_');
    const statsPath = `admin/api_stats/${apiName}`;
    try {
        let currentStats = {};
        if (db) {
            const snap = await db.ref(statsPath).once('value');
            currentStats = snap.val() || { requests: 0, errors: 0, totalTime: 0 };
        } else {
            currentStats = await firebaseRest.get(statsPath) || { requests: 0, errors: 0, totalTime: 0 };
        }

        const newRequests = (currentStats.requests || 0) + 1;
        const newTotalTime = (currentStats.totalTime || 0) + duration;

        const update = {
            requests: newRequests,
            errors: (currentStats.errors || 0) + (error ? 1 : 0),
            totalTime: newTotalTime,
            avgResponseTime: Math.round(newTotalTime / newRequests),
            lastUsed: new Date().toISOString(),
            status: error ? 'ERROR' : 'OK'
        };

        if (error) update.lastError = error.message;

        if (db) {
            await db.ref(statsPath).update(update);
        } else {
            await firebaseRest.patch(statsPath, update);
        }
    } catch (e) {
        console.error("Stats Tracking Failed:", e.message);
    }
};

// Currency Service
const getExchangeRate = async () => {
    return 120; // Default BDT to USD
};

// =====================================================================
// SABRE FLIGHT SEARCH – Primary Route
// =====================================================================

/**
 * POST /api/flights/search
 *
 * Accepts JSON body:
 *   { origin, destination, departureDate, returnDate?, adults?, children?, cabin?, direct? }
 *
 * Returns transformed Sabre flight results in Amadeus-compatible shape.
 */
app.post('/api/flights/search', async (req, res) => {
    const startTime = Date.now();
    const {
        origin,
        destination,
        departureDate,
        returnDate,
        adults = 1,
        children = 0,
        cabin = 'ECONOMY',
        direct = false,
        tripType,
        segments
    } = req.body;

    // --- Validation ---
    const iataRegex = /^[A-Z]{3}$/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!origin || !iataRegex.test(origin.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid origin – must be a 3-letter IATA code' });
    }
    if (!destination || !iataRegex.test(destination.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid destination – must be a 3-letter IATA code' });
    }
    if (!departureDate || !dateRegex.test(departureDate)) {
        return res.status(400).json({ error: 'Invalid departureDate – must be YYYY-MM-DD' });
    }
    if (returnDate && !dateRegex.test(returnDate)) {
        return res.status(400).json({ error: 'Invalid returnDate – must be YYYY-MM-DD' });
    }

    try {
        // --- Get pricing markup ---
        let markup = { type: 'percentage', value: 0 };
        if (db) {
            const snap = await db.ref('settings/pricing').once('value');
            if (snap.exists()) markup = snap.val();
        } else {
            const data = await firebaseRest.get('settings/pricing');
            if (data) markup = data;
        }

        const exchangeRate = await getExchangeRate();

        // --- Call Sabre ---
        const flights = await sabreFlightSearch.searchFlights(
            {
                origin: origin.toUpperCase(),
                destination: destination.toUpperCase(),
                departureDate,
                returnDate,
                adults: parseInt(adults),
                children: parseInt(children),
                cabin,
                nonStop: direct === true || direct === 'true',
                tripType,
                segments
            },
            exchangeRate,
            markup
        );

        const duration = Date.now() - startTime;
        updateApiStats('sabre.flightSearch', duration);

        console.log(`[SabreSearch] Returned ${flights.length} offers in ${duration}ms`);
        res.json(flights);
    } catch (error) {
        const duration = Date.now() - startTime;
        updateApiStats('sabre.flightSearch', duration, error);
        console.error('[SabreSearch] Error:', error.message);
        res.status(500).json({
            error: 'Flight search failed',
            details: error.message,
            provider: 'SABRE'
        });
    }
});

// =====================================================================
// LEGACY /api/search – removed (Amadeus). Return 410 Gone.
// =====================================================================
app.get('/api/search', (req, res) => {
    res.status(410).json({ error: 'This endpoint has been removed. Use POST /api/flights/search instead.' });
});


// Flight Pricing (Sabre – placeholder for future Sabre re-shop/pricing integration)
app.post('/api/flights/price', async (req, res) => {
    // The selected offer already has a confirmed price from BFM.
    // Return the offer as-is; a full re-price via Sabre re-shop can be added later.
    const { flightOffer } = req.body || {};
    if (!flightOffer) return res.status(400).json({ error: 'flightOffer is required' });
    res.json({ flightOffer, confirmed: true });
});

// Seatmap (not yet available via Sabre BFM – returns empty)
app.post('/api/flights/seat-map', (req, res) => {
    res.json({ seatmap: [], message: 'Seat map not available via current Sabre integration' });
});

// Create Flight Order / Booking
app.post('/api/flights/book', async (req, res) => {
    try {
        const { flightOffer, travelers, contactInfo } = req.body || {};
        if (!flightOffer || !travelers) {
            return res.status(400).json({ error: 'flightOffer and travelers are required' });
        }

        // Persist booking to Firebase
        const bookingRecord = {
            status: 'PENDING_TICKET',
            provider: 'SABRE',
            flightOffer,
            travelers,
            contactInfo: contactInfo || {},
            amount: flightOffer?.price?.total || 0,
            currency: flightOffer?.price?.currency || 'BDT',
            createdAt: new Date().toISOString(),
        };

        let bookingId;
        if (db) {
            const ref = await db.ref('bookings').push(bookingRecord);
            bookingId = ref.key;
        } else {
            const result = await firebaseRest.push('bookings', bookingRecord);
            bookingId = result.key;
        }

        console.log(`[Booking] Created booking ${bookingId}`);
        res.json({ bookingId, status: 'PENDING_TICKET', message: 'Booking received. Ticket will be issued within 24 hours.' });
    } catch (error) {
        console.error('[Booking] Error:', error.message);
        res.status(500).json({ error: 'Booking failed', details: error.message });
    }
});

// Airport dataset cache (load once)
let cachedAirports = [];
try {
    const rawData = require('./airports-fallback.json');
    cachedAirports = rawData.map(f => ({
        ...f,
        code_lc: (f.iata || '').toLowerCase(),
        city_lc: (f.city || '').toLowerCase(),
        name_lc: (f.airport || '').toLowerCase()
    }));
    console.log(`[Init] Loaded ${cachedAirports.length} airports into memory cache.`);
} catch (e) {
    console.warn('[Init] Could not load airports-fallback.json');
}

/**
 * High-performance airport ranking algorithm.
 * Follows exact OTA scoring criteria in a single loop.
 */
function rankAirports(query, airports) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const scored = [];
    for (let i = 0; i < airports.length; i++) {
        const apt = airports[i];
        let score = 0;

        // 1. Exact IATA match (+100)
        if (apt.code_lc === q) {
            score = 100;
        } 
        // 2. Starts with IATA (+80)
        else if (apt.code_lc.startsWith(q)) {
            score = 80;
        } 
        // 3. City starts with query (+60)
        else if (apt.city_lc.startsWith(q)) {
            score = 60;
        } 
        // 4. Name starts with query (+50)
        else if (apt.name_lc.startsWith(q)) {
            score = 50;
        } 
        // 5. Contains match (+30)
        else if (apt.name_lc.includes(q) || apt.city_lc.includes(q)) {
            score = 30;
        }

        if (score > 0) {
            // Priority boost simulation based on type if present (assumed to be available)
            if (apt.type === 'AIRPORT' || apt.type === 'large_airport') score += 20;
            if (apt.type === 'medium_airport') score += 10;
            
            // Remove the internal lowercase fields before sending to client
            const { code_lc, city_lc, name_lc, ...resultObj } = apt;
            scored.push({ item: resultObj, score });
        }
    }

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(obj => obj.item);
}

// Airport autocomplete – optimized
app.get('/api/airports', (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);

    try {
        const results = rankAirports(query, cachedAirports);
        res.json(results);
    } catch (error) {
        console.error('Airport search failed:', error.message);
        res.status(500).json({ error: 'Airport search failed' });
    }
});

// Airport specific lookup endpoint (strict)
app.get('/api/airports/:code', (req, res) => {
    const code = (req.params.code || '').toUpperCase();
    if (!code) return res.status(400).json({ error: 'Missing code' });
    const found = cachedAirports.find(a => a.iata && a.iata.toUpperCase() === code);
    if (!found) {
        return res.json({ code });
    }
    const { code_lc, city_lc, name_lc, _score, ...clean } = found;
    return res.json(clean);
});

// Airline dataset cache
let cachedAirlines = [];
fetch('https://raw.githubusercontent.com/npow/airline-codes/master/airlines.json')
    .then(r => r.ok ? r.json() : [])
    .then(data => {
        cachedAirlines = data;
        console.log(`[Init] Loaded ${cachedAirlines.length} airlines into memory cache.`);
    })
    .catch(e => console.warn('[Init] Could not fetch airlines dataset:', e.message));

// Airline specific lookup endpoint (strict)
app.get('/api/airlines/:code', (req, res) => {
    const code = (req.params.code || '').toUpperCase();
    if (!code) return res.status(400).json({ error: 'Missing code' });
    const found = cachedAirlines.find(a => a.iata && a.iata.toUpperCase() === code);
    if (!found) {
        return res.json({ code, name: code, logo: null });
    }
    return res.json({
        code: found.iata,
        name: found.alias || found.name,
        logo: `https://pics.avs.io/90/90/${found.iata}.png`
    });
});

// Admin Routes
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    try {

        let bookingsData = {};
        let usersData = {};

        if (db) {
            const [bookingsSnap, usersSnap] = await Promise.all([
                db.ref('bookings').once('value'),
                db.ref('users').once('value')
            ]);
            bookingsData = bookingsSnap.val() || {};
            usersData = usersSnap.val() || {};
        } else {
            [bookingsData, usersData] = await Promise.all([
                firebaseRest.get('bookings', req.token) || {},
                firebaseRest.get('users', req.token) || {}
            ]);
        }

        const recentBookings = [];
        let totalRevenue = 0;
        let totalBookings = 0;

        Object.keys(bookingsData).forEach(key => {
            const b = bookingsData[key];
            recentBookings.push({ id: key, ...b });
            if (b.status === 'CONFIRMED') totalRevenue += parseFloat(b.amount || 0);
            totalBookings++;
        });

        console.log(`Stats fetched: ${totalBookings} bookings, ${Object.keys(usersData).length} users`);

        res.json({
            totalRevenue,
            totalBookings,
            totalUsers: Object.keys(usersData).length,
            recentBookings: recentBookings.slice(-10).reverse()
        });
    } catch (error) {
        console.error("Stats Error:", error.message);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        let data = {};
        if (db) {
            const snap = await db.ref('users').once('value');
            data = snap.val() || {};
        } else {
            data = await firebaseRest.get('users', req.token) || {};
        }
        const users = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        console.log(`Users fetched: ${users.length}`);
        res.json(users);
    } catch (e) {
        res.status(500).send("Error fetching users");
    }
});

app.get('/api/admin/api-health', verifyAdmin, async (req, res) => {
    try {
        let stats = {};
        if (db) {
            const snap = await db.ref('admin/api_stats').once('value');
            stats = snap.val() || {};
        } else {
            stats = await firebaseRest.get('admin/api_stats', req.token) || {};
        }

        // Convert map to array for easier frontend rendering
        const healthList = Object.keys(stats).map(key => ({
            name: key.replace(/_/g, '.'),
            ...stats[key]
        }));

        res.json(healthList);
    } catch (error) {
        console.error("Health Stats Error:", error.message);
        res.status(500).json({ error: "Failed to fetch API metrics" });
    }
});

app.patch('/api/admin/users/:id', verifyAdmin, async (req, res) => {
    try {
        if (db) {
            await db.ref(`users/${req.params.id}`).update(req.body);
        } else {
            await firebaseRest.patch(`users/${req.params.id}`, req.body, req.token);
        }
        res.json({ success: true });
    } catch (e) {
        console.error("Error updating user:", e.message);
        res.status(500).send("Error updating user");
    }
});

app.get('/api/admin/bookings', verifyAdmin, async (req, res) => {
    try {
        let data = {};
        if (db) {
            const snap = await db.ref('bookings').once('value');
            data = snap.val() || {};
        } else {
            data = await firebaseRest.get('bookings', req.token) || {};
        }
        const bookings = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        console.log(`Bookings fetched: ${bookings.length}`);
        res.json(bookings.reverse());
    } catch (e) {
        res.status(500).send("Error fetching bookings");
    }
});

app.get('/api/admin/settings', verifyAdmin, async (req, res) => {
    try {
        if (db) {
            const snap = await db.ref('settings').once('value');
            res.json(snap.val() || {});
        } else {
            const data = await firebaseRest.get('settings', req.token);
            res.json(data || {});
        }
    } catch (e) {
        res.status(500).send("Error fetching settings");
    }
});

app.post('/api/admin/settings/pricing', verifyAdmin, async (req, res) => {
    try {
        if (db) {
            await db.ref('settings/pricing').set(req.body);
        } else {
            await firebaseRest.patch('settings/pricing', req.body, req.token);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).send("Error updating settings");
    }
});

app.post('/api/admin/settings/aviation-provider', verifyAdmin, async (req, res) => {
    try {
        if (db) {
            await db.ref('settings/aviation_provider').set(req.body);
        } else {
            await firebaseRest.patch('settings/aviation_provider', req.body, req.token);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).send("Error updating settings");
    }
});

// Get Banners (Admin - for editing)
app.get('/api/admin/settings/banners', verifyAdmin, async (req, res) => {
    try {
        let banners = [];
        if (db) {
            const snap = await db.ref('settings/banners').once('value');
            banners = snap.val() || [];
        } else {
            banners = await firebaseRest.get('settings/banners', req.token) || [];
        }
        console.log('📸 Fetched banners for admin:', banners);
        res.json(Array.isArray(banners) ? banners : []);
    } catch (e) {
        console.error('❌ Error fetching banners:', e.message);
        res.status(500).json({ error: "Error fetching banners", details: e.message });
    }
});

// Banner Management (Admin)
app.post('/api/admin/settings/banners', verifyAdmin, async (req, res) => {
    try {
        console.log('📸 Updating banners:', JSON.stringify(req.body, null, 2));
        if (db) {
            await db.ref('settings/banners').set(req.body);
            console.log('✅ Banners updated successfully via Admin SDK');
        } else {
            await firebaseRest.put('settings/banners', req.body, req.token);
            console.log('✅ Banners updated successfully via REST');
        }
        res.json({ success: true });
    } catch (e) {
        console.error('❌ Banner update error:', e.message, e.stack);
        res.status(500).json({ error: "Error updating banners", details: e.message });
    }
});

// Get Banners (Public)
app.get('/api/public/banners', async (req, res) => {
    try {
        let banners = [];
        if (db) {
            const snap = await db.ref('settings/banners').once('value');
            banners = snap.val() || [];
        } else {
            banners = await firebaseRest.get('settings/banners') || [];
        }
        // Filter active banners and sort by order
        const activeBanners = Array.isArray(banners)
            ? banners.filter(b => b.active).sort((a, b) => (a.order || 0) - (b.order || 0))
            : [];
        res.json(activeBanners);
    } catch (e) {
        res.json([]);
    }
});

// Get Hero Background (Public)
app.get('/api/public/hero-background', async (req, res) => {
    try {
        let backgroundUrl = '';
        if (db) {
            const snap = await db.ref('settings/heroBackground').once('value');
            backgroundUrl = snap.val() || '';
        } else {
            backgroundUrl = await firebaseRest.get('settings/heroBackground') || '';
        }
        res.json({ backgroundUrl });
    } catch (e) {
        res.json({ backgroundUrl: '' });
    }
});

const HOME_SEO_DEFAULTS = {
    metaTitle: 'Cheap Air Tickets Bangladesh | Secure Booking | AirTech',
    metaDescription: 'Book cheap air tickets in Bangladesh with AirTech Aviation. Secure, instant online flight booking from Dhaka for domestic and international routes.',
    metaKeywords: 'cheap air tickets bangladesh, flight booking bangladesh, online air ticket booking, cheapest flight tickets, international flight booking from bangladesh, air ticket dhaka, airline ticket booking website bangladesh',
    metaRobots: 'index,follow',
    canonicalMode: 'auto',
    canonicalPath: '/',
    canonicalUrl: '',
    primaryDomain: 'https://airtech-aviation-ota.vercel.app',
    alternateDomains: [
        'https://airtech-aviation-ota.vercel.app',
        'https://www.airtechaviation.click',
        'https://airtech-angular.vercel.app'
    ],
    ogTitle: '',
    ogDescription: '',
    ogImageUrl: '',
    ogType: 'website',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    twitterCardType: 'summary_large_image'
};

const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION
    || '8WbeVkSHzkcfWfMiESJhjf4sBnXl28DRN8lNz2sYzl0';

const DEFAULT_META_TAGS = [
    {
        id: 'google-site-verification',
        keyType: 'name',
        key: 'google-site-verification',
        content: GOOGLE_SITE_VERIFICATION,
        pages: ['/'],
        active: true,
        attributes: {}
    }
];

const sanitizeSeoText = (value, maxLength) => {
    const text = String(value ?? '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return text.slice(0, maxLength);
};

const sanitizeCanonicalPath = (value) => {
    const text = sanitizeSeoText(value, 200);
    if (!text) return '/';
    if (text.startsWith('http://') || text.startsWith('https://')) {
        try {
            const parsed = new URL(text);
            return parsed.pathname || '/';
        } catch {
            return '/';
        }
    }
    return text.startsWith('/') ? text : `/${text}`;
};

const sanitizeAbsoluteUrl = (value, maxLength = 500) => {
    const text = sanitizeSeoText(value, maxLength);
    if (!text) return '';
    try {
        const parsed = new URL(text);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
        return parsed.toString();
    } catch {
        return '';
    }
};

const sanitizeDomainUrl = (value) => {
    const safe = sanitizeAbsoluteUrl(value, 200);
    if (!safe) return '';
    try {
        const parsed = new URL(safe);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return '';
    }
};

const sanitizeRobots = (value) => {
    const text = sanitizeSeoText(value, 50).toLowerCase();
    const tokens = text.split(',').map(t => t.trim()).filter(Boolean);
    const indexToken = tokens.includes('noindex') ? 'noindex' : 'index';
    const followToken = tokens.includes('nofollow') ? 'nofollow' : 'follow';
    return `${indexToken},${followToken}`;
};

const sanitizeHomeSeoPayload = (payload = {}, options = { forStorage: false }) => {
    const canonicalMode = payload.canonicalMode === 'manual' ? 'manual' : 'auto';
    const primaryDomain = sanitizeDomainUrl(payload.primaryDomain) || HOME_SEO_DEFAULTS.primaryDomain;
    const canonicalPath = sanitizeCanonicalPath(payload.canonicalPath || '/');
    const canonicalUrlInput = sanitizeAbsoluteUrl(payload.canonicalUrl);

    const alternateDomainsInput = Array.isArray(payload.alternateDomains) ? payload.alternateDomains : [];
    const alternateDomainsSanitized = alternateDomainsInput
        .map(sanitizeDomainUrl)
        .filter(Boolean);
    const uniqueDomains = Array.from(new Set([primaryDomain, ...alternateDomainsSanitized]));

    const sanitized = {
        metaTitle: sanitizeSeoText(payload.metaTitle, 70) || HOME_SEO_DEFAULTS.metaTitle,
        metaDescription: sanitizeSeoText(payload.metaDescription, 160) || HOME_SEO_DEFAULTS.metaDescription,
        metaKeywords: sanitizeSeoText(payload.metaKeywords, 400) || HOME_SEO_DEFAULTS.metaKeywords,
        metaRobots: sanitizeRobots(payload.metaRobots || HOME_SEO_DEFAULTS.metaRobots),
        canonicalMode,
        canonicalPath,
        canonicalUrl: canonicalMode === 'manual' ? canonicalUrlInput : '',
        primaryDomain,
        alternateDomains: uniqueDomains,
        ogTitle: sanitizeSeoText(payload.ogTitle, 95),
        ogDescription: sanitizeSeoText(payload.ogDescription, 220),
        ogImageUrl: sanitizeAbsoluteUrl(payload.ogImageUrl),
        ogType: sanitizeSeoText(payload.ogType, 30) || 'website',
        twitterTitle: sanitizeSeoText(payload.twitterTitle, 70),
        twitterDescription: sanitizeSeoText(payload.twitterDescription, 200),
        twitterImage: sanitizeAbsoluteUrl(payload.twitterImage),
        twitterCardType: ['summary', 'summary_large_image'].includes(payload.twitterCardType)
            ? payload.twitterCardType
            : HOME_SEO_DEFAULTS.twitterCardType
    };

    if (options.forStorage) {
        sanitized.updatedAt = new Date().toISOString();
    } else if (payload.updatedAt) {
        sanitized.updatedAt = sanitizeSeoText(payload.updatedAt, 50);
    }

    return sanitized;
};

const sanitizeMetaTagAttributes = (attributes) => {
    if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return {};
    const blocked = new Set(['onload', 'onclick', 'onerror', 'style', 'src']);
    const safe = {};
    Object.entries(attributes).forEach(([rawKey, rawValue]) => {
        const key = sanitizeSeoText(rawKey, 50).toLowerCase();
        if (!key || blocked.has(key)) return;
        if (!/^[a-z0-9:-]+$/.test(key)) return;
        const value = sanitizeSeoText(rawValue, 500);
        if (!value) return;
        safe[key] = value;
    });
    return safe;
};

const sanitizeMetaTagEntry = (entry = {}) => {
    const keyTypeRaw = sanitizeSeoText(entry.keyType, 20).toLowerCase();
    const keyType = ['name', 'property', 'http-equiv', 'charset', 'custom'].includes(keyTypeRaw)
        ? keyTypeRaw
        : 'name';

    const key = sanitizeSeoText(entry.key, 120).toLowerCase();
    const content = sanitizeSeoText(entry.content, 1000);
    const pagesInput = Array.isArray(entry.pages) ? entry.pages : ['/'];
    const pages = Array.from(new Set(
        pagesInput
            .map((p) => sanitizeSeoText(p, 200))
            .map((p) => {
                if (!p) return '';
                if (p === '*' || p === 'all') return '*';
                if (p.startsWith('/')) return p;
                return `/${p}`;
            })
            .filter(Boolean)
    ));

    const attributes = sanitizeMetaTagAttributes(entry.attributes);

    if (keyType === 'charset') {
        const charset = sanitizeSeoText(entry.charset || entry.content || key || 'utf-8', 30).toLowerCase();
        if (!/^[a-z0-9_-]+$/i.test(charset)) return null;
        return {
            id: sanitizeSeoText(entry.id, 80) || `charset-${Date.now()}`,
            keyType,
            key: 'charset',
            content: charset,
            pages: pages.length ? pages : ['/'],
            active: entry.active !== false,
            attributes
        };
    }

    if (!key) return null;
    if (keyType !== 'custom' && !content) return null;

    return {
        id: sanitizeSeoText(entry.id, 80) || `${keyType}-${key}`,
        keyType,
        key,
        content,
        pages: pages.length ? pages : ['/'],
        active: entry.active !== false,
        attributes
    };
};

const ensureVerificationMetaTag = (metaTags = []) => {
    const cloned = Array.isArray(metaTags) ? [...metaTags] : [];
    const existingIndex = cloned.findIndex(
        (item) => item?.keyType === 'name' && item?.key === 'google-site-verification'
    );

    if (existingIndex >= 0) {
        cloned[existingIndex] = {
            ...cloned[existingIndex],
            content: cloned[existingIndex].content || GOOGLE_SITE_VERIFICATION,
            pages: Array.isArray(cloned[existingIndex].pages) && cloned[existingIndex].pages.length
                ? cloned[existingIndex].pages
                : ['/'],
            active: cloned[existingIndex].active !== false
        };
        return cloned;
    }

    return [...cloned, ...DEFAULT_META_TAGS];
};

const sanitizeMetaTagsPayload = (payload = [], options = { forStorage: false }) => {
    const input = Array.isArray(payload) ? payload : [];
    const sanitized = input
        .map((entry) => sanitizeMetaTagEntry(entry))
        .filter(Boolean);

    const deduped = [];
    const seen = new Set();
    sanitized.forEach((item) => {
        const signature = `${item.keyType}|${item.key}|${(item.pages || []).join(',')}`;
        if (seen.has(signature)) return;
        seen.add(signature);
        deduped.push(item);
    });

    const withVerification = ensureVerificationMetaTag(deduped);

    if (!options.forStorage) return withVerification;

    const updatedAt = new Date().toISOString();
    return withVerification.map((item) => ({
        ...item,
        updatedAt
    }));
};

const appendSeoAuditLog = async (path, actor, changes, token = null) => {
    try {
        const payload = {
            actorEmail: actor?.email || 'unknown',
            actorUid: actor?.uid || 'unknown',
            action: path,
            changes,
            timestamp: new Date().toISOString()
        };

        if (db) {
            await db.ref('admin/seo_audit').push(payload);
        } else {
            await firebaseRest.post('admin/seo_audit', payload, token);
        }
    } catch (error) {
        console.warn('SEO audit log failed:', error.message);
    }
};

// Get Home SEO (Public)
app.get('/api/public/home-seo', async (req, res) => {
    try {
        let homeSeo = {};
        if (db) {
            const snap = await db.ref('settings/homeSeo').once('value');
            homeSeo = snap.val() || {};
        } else {
            homeSeo = await firebaseRest.get('settings/homeSeo') || {};
        }
        res.json(sanitizeHomeSeoPayload(homeSeo || {}));
    } catch (e) {
        res.json({ ...HOME_SEO_DEFAULTS });
    }
});

// Get Home SEO (Admin)
app.get('/api/admin/settings/home-seo', verifyAdmin, async (req, res) => {
    try {
        let homeSeo = {};
        if (db) {
            const snap = await db.ref('settings/homeSeo').once('value');
            homeSeo = snap.val() || {};
        } else {
            homeSeo = await firebaseRest.get('settings/homeSeo', req.token) || {};
        }
        res.json(sanitizeHomeSeoPayload(homeSeo || {}));
    } catch (e) {
        res.status(500).json({ error: 'Error fetching home SEO', details: e.message });
    }
});

// Get Meta Tags (Public)
app.get('/api/public/meta-tags', async (req, res) => {
    try {
        let metaTags = [];
        if (db) {
            const snap = await db.ref('settings/metaTags').once('value');
            metaTags = snap.val() || [];
        } else {
            metaTags = await firebaseRest.get('settings/metaTags') || [];
        }
        res.json(sanitizeMetaTagsPayload(metaTags || []));
    } catch (e) {
        res.json(sanitizeMetaTagsPayload(DEFAULT_META_TAGS));
    }
});

// Get Meta Tags (Admin)
app.get('/api/admin/settings/meta-tags', verifyAdmin, async (req, res) => {
    try {
        let metaTags = [];
        if (db) {
            const snap = await db.ref('settings/metaTags').once('value');
            metaTags = snap.val() || [];
        } else {
            metaTags = await firebaseRest.get('settings/metaTags', req.token) || [];
        }
        res.json(sanitizeMetaTagsPayload(metaTags || []));
    } catch (e) {
        res.status(500).json({ error: 'Error fetching meta tags', details: e.message });
    }
});

// Update Hero Background (Admin)
app.post('/api/admin/settings/hero-background', verifyAdmin, async (req, res) => {
    try {
        const { backgroundUrl } = req.body;
        console.log('🖼️ Updating hero background:', backgroundUrl);
        if (db) {
            await db.ref('settings/heroBackground').set(backgroundUrl);
            console.log('✅ Hero background updated successfully via Admin SDK');
        } else {
            // Firebase REST API requires the value to be JSON-encoded
            await firebaseRest.put('settings/heroBackground', JSON.stringify(backgroundUrl), req.token);
            console.log('✅ Hero background updated successfully via REST');
        }
        res.json({ success: true });
    } catch (e) {
        console.error('❌ Hero background update error:', e.message, e.stack);
        res.status(500).json({ error: "Error updating hero background", details: e.message });
    }
});

// Update Home SEO (Admin)
app.post('/api/admin/settings/home-seo', verifyAdmin, async (req, res) => {
    try {
        const sanitizedPayload = sanitizeHomeSeoPayload(req.body || {}, { forStorage: true });
        console.log('🏷️ Updating home SEO settings');
        if (db) {
            await db.ref('settings/homeSeo').set(sanitizedPayload);
            console.log('✅ Home SEO updated successfully via Admin SDK');
        } else {
            await firebaseRest.put('settings/homeSeo', sanitizedPayload, req.token);
            console.log('✅ Home SEO updated successfully via REST');
        }
        await appendSeoAuditLog('home-seo:update', req.user, { updatedKeys: Object.keys(sanitizedPayload) }, req.token);
        res.json({ success: true });
    } catch (e) {
        console.error('❌ Home SEO update error:', e.message, e.stack);
        res.status(500).json({ error: 'Error updating home SEO', details: e.message });
    }
});

// Update Meta Tags (Admin)
app.post('/api/admin/settings/meta-tags', verifyAdmin, async (req, res) => {
    try {
        const sanitizedPayload = sanitizeMetaTagsPayload(req.body || [], { forStorage: true });
        console.log('🏷️ Updating custom meta tags');
        if (db) {
            await db.ref('settings/metaTags').set(sanitizedPayload);
            console.log('✅ Meta tags updated successfully via Admin SDK');
        } else {
            await firebaseRest.put('settings/metaTags', sanitizedPayload, req.token);
            console.log('✅ Meta tags updated successfully via REST');
        }
        await appendSeoAuditLog('meta-tags:update', req.user, { tagCount: sanitizedPayload.length }, req.token);
        res.json({ success: true });
    } catch (e) {
        console.error('❌ Meta tags update error:', e.message, e.stack);
        res.status(500).json({ error: 'Error updating meta tags', details: e.message });
    }
});

// Update Booking Status (Admin)
app.patch('/api/admin/bookings/:id', verifyAdmin, async (req, res) => {
    try {
        if (db) {
            await db.ref(`bookings/${req.params.id}`).update(req.body);
        } else {
            await firebaseRest.patch(`bookings/${req.params.id}`, req.body, req.token);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).send("Error updating booking");
    }
});

// Create Booking (Public)
app.post('/api/bookings', async (req, res) => {
    try {
        const bookingData = req.body;
        let result;
        if (db) {
            result = await db.ref('bookings').push({
                ...bookingData,
                createdAt: new Date().toISOString()
            });
            res.status(201).json({ id: result.key, success: true });
        } else {
            const token = req.headers.authorization?.split('Bearer ')[1];
            result = await firebaseRest.push('bookings', {
                ...bookingData,
                createdAt: new Date().toISOString()
            }, token);
            res.status(201).json({ id: result.key, success: true });
        }
    } catch (error) {
        console.error("Booking Error:", error.message);
        res.status(500).json({ error: "Failed to save booking" });
    }
});

// Get User Bookings
app.get('/api/user/bookings', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
        let bookingsData = {};
        if (db) {
            const snap = await db.ref('bookings').orderByChild('userId').equalTo(userId).once('value');
            bookingsData = snap.val() || {};
        } else {
            // Get token from auth header for user bookings (if present)
            const token = req.headers.authorization?.split('Bearer ')[1];
            const allBookings = await firebaseRest.get('bookings', token) || {};
            Object.keys(allBookings).forEach(id => {
                if (allBookings[id].userId === userId) {
                    bookingsData[id] = allBookings[id];
                }
            });
        }

        const bookings = Object.keys(bookingsData).map(key => ({
            id: key,
            ...bookingsData[key]
        })).reverse();

        res.json(bookings);
    } catch (error) {
        console.error("Fetch User Bookings Error:", error.message);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

// Request Cancellation
app.post('/api/bookings/:id/request-cancel', async (req, res) => {
    const { id } = req.params;
    try {
        const update = { status: 'CANCEL_REQUESTED' };
        if (db) {
            await db.ref(`bookings/${id}`).update(update);
        } else {
            const token = req.headers.authorization?.split('Bearer ')[1];
            await firebaseRest.patch(`bookings/${id}`, update, token);
        }
        res.json({ success: true, status: 'CANCEL_REQUESTED' });
    } catch (error) {
        console.error("Cancel Request Error:", error.message);
        res.status(500).json({ error: "Failed to request cancellation" });
    }
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
