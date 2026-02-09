require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Amadeus = require('amadeus');
const axios = require('axios');
const admin = require('firebase-admin');

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

// Initialize Amadeus
let amadeus;
try {
    amadeus = new Amadeus({
        clientId: process.env.AMADEUS_CLIENT_ID,
        clientSecret: process.env.AMADEUS_CLIENT_SECRET,
        hostname: 'test'
    });
} catch (error) {
    console.warn("Amadeus initialization failed:", error.message);
}

// Amadeus API Tracker & Analytics
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

/**
 * Wrapper for Amadeus calls with automatic tracking
 * @param {Function} apiFunc - The Amadeus API function to call (e.g. amadeus.shopping.flightOffersSearch.get)
 * @param {Object} params - The parameters for the call
 * @param {String} apiPath - Descriptive name for logging (e.g. 'shopping.flightOffersSearch')
 */
const amadeusCall = async (apiPath, params) => {
    if (!amadeus) throw new Error("Amadeus not initialized");
    const startTime = Date.now();
    try {
        // Resolve function reference from path (e.g. "shopping.flightOffersSearch")
        const parts = apiPath.split('.');
        let func = amadeus;
        for (const part of parts) {
            func = func[part];
        }

        const response = await func.get(params);
        const duration = Date.now() - startTime;
        updateApiStats(apiPath, duration);
        return response;
    } catch (error) {
        const duration = Date.now() - startTime;
        updateApiStats(apiPath, duration, error);
        throw error;
    }
};

// Currency Service (Simple fallback)
const getExchangeRate = async () => {
    return 120; // Default BDT to USD
};

// Public Search Route
app.get('/api/search', async (req, res) => {
    const { origin, destination, date, returnDate, adults = 1, children = 0, infants = 0, travelClass = 'ECONOMY' } = req.query;

    try {
        const params = {
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: date,
            adults: parseInt(adults),
            children: parseInt(children),
            infants: parseInt(infants),
            travelClass: travelClass,
            currencyCode: 'USD',
            max: 50
        };

        if (returnDate && returnDate !== '') {
            params.returnDate = returnDate;
        }

        // Handle Multi-city
        let response;
        if (req.query.segments) {
            const segments = JSON.parse(req.query.segments);
            console.log("Multi-city search segments:", segments.length);

            // Construct Travelers
            const travelers = [];
            let travelerId = 1;
            for (let i = 0; i < parseInt(adults); i++) travelers.push({ id: (travelerId++).toString(), travelerType: 'ADULT' });
            for (let i = 0; i < parseInt(children); i++) travelers.push({ id: (travelerId++).toString(), travelerType: 'CHILD' });
            for (let i = 0; i < parseInt(infants); i++) travelers.push({ id: (travelerId++).toString(), travelerType: 'HELD_INFANT', associatedAdultId: '1' });

            // For multi-city, we use the POST method for better control
            const postParams = {
                currencyCode: 'USD',
                originDestinations: segments.map((s, idx) => ({
                    id: (idx + 1).toString(),
                    originLocationCode: s.o,
                    destinationLocationCode: s.d,
                    departureDateTimeRange: {
                        date: s.t
                    }
                })),
                travelers: travelers,
                sources: ['GDS'],
                searchCriteria: {
                    maxFlightOffers: 50,
                    flightFilters: {
                        cabinRestrictions: [{
                            cabin: travelClass,
                            originDestinationIds: segments.map((_, i) => (i + 1).toString())
                        }]
                    }
                }
            };

            const startTime = Date.now();
            response = await amadeus.shopping.flightOffersSearch.post(postParams);
            updateApiStats('shopping.flightOffersSearch.post', Date.now() - startTime);
        } else {
            response = await amadeusCall('shopping.flightOffersSearch', params);
        }

        const rate = await getExchangeRate();
        let markup = { type: 'percentage', value: 0 };

        if (db) {
            const snap = await db.ref('settings/pricing').once('value');
            if (snap.exists()) markup = snap.val();
        } else {
            const data = await firebaseRest.get('settings/pricing');
            if (data) markup = data;
        }

        const flights = response.data.map(offer => {
            const basePriceUSD = parseFloat(offer.price.grandTotal || offer.price.total);
            let priceBDT = basePriceUSD * rate;

            if (markup.type === 'percentage') {
                priceBDT = priceBDT * (1 + (parseFloat(markup.value || 0) / 100));
            } else {
                priceBDT += parseFloat(markup.value || 0);
            }

            // Enhanced normalization for all trip types
            return {
                id: offer.id,
                source: 'AMADEUS',
                price: {
                    currency: 'BDT',
                    total: Math.round(priceBDT),
                    base: Math.round(priceBDT * 0.85),
                    originalTotal: basePriceUSD,
                    originalCurrency: offer.price.currency
                },
                itineraries: offer.itineraries.map(it => ({
                    ...it,
                    segments: it.segments.map(seg => ({
                        ...seg,
                        // Add some helper fields if needed
                    }))
                })),
                validatingAirlineCodes: offer.validatingAirlineCodes,
                travelerPricings: offer.travelerPricings,
                bookable: true
            };
        });

        console.log(`Search returned ${flights.length} offers. First offer has ${flights[0]?.itineraries?.length} itineraries.`);
        res.json(flights);
    } catch (error) {
        console.error("Search Error:", error.message);
        res.status(500).json({ error: "Search failed" });
    }
});

// Flight Pricing
app.post('/api/flights/price', async (req, res) => {
    try {
        const { flightOffer } = req.body;
        const response = await amadeusCall('shopping.flightOffers.pricing', {
            data: {
                type: 'flight-offers-pricing',
                flightOffers: [flightOffer]
            }
        }, 'post');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Pricing failed", details: error.message });
    }
});

// Seatmap Display
app.post('/api/flights/seat-map', async (req, res) => {
    try {
        const { flightOffer } = req.body;
        const response = await amadeusCall('shopping.seatmaps', {
            data: {
                type: 'seatmap-display',
                flightOffers: [flightOffer]
            }
        }, 'post');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Seatmap fetch failed", details: error.message });
    }
});

// Create Flight Order (Booking)
app.post('/api/flights/book', async (req, res) => {
    try {
        const { flightOffer, travelers } = req.body;
        const response = await amadeusCall('booking.flightOrders', {
            data: {
                type: 'flight-order',
                flightOffers: [flightOffer],
                travelers: travelers
            }
        }, 'post');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Booking failed", details: error.message });
    }
});

app.get('/api/airports', async (req, res) => {
    const { query } = req.query;
    if (!amadeus || !query) return res.json([]);

    try {
        const queryUpper = query.toUpperCase();

        // Search Amadeus first
        let amadeusResults = [];
        try {
            const response = await amadeus.referenceData.locations.get({
                keyword: queryUpper,
                subType: "AIRPORT,CITY",
                'page[limit]': 15
            });
            amadeusResults = response.data.map((loc) => ({
                city: loc.address.cityName,
                airport: loc.name,
                iata: loc.iataCode,
                country: loc.address.countryName,
                type: 'AIRPORT',
                score: loc.iataCode === queryUpper ? 100 : (loc.address.cityName.toUpperCase() === queryUpper ? 90 : 50)
            })).sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error("Amadeus airport search error:", error.message);
        }

        // Load fallbacks
        let fallbacks = [];
        try {
            fallbacks = require('./airports-fallback.json');
        } catch (e) {
            // Silently ignore if missing
        }

        // Logic: If Amadeus results are empty OR don't contain the exact IATA match 
        // for a 3-letter query, check the fallback.
        const matchedFallbacks = fallbacks.filter(f =>
            f.iata === queryUpper ||
            f.city.includes(queryUpper) ||
            f.airport.includes(queryUpper)
        );

        // Merge: Add fallback results that are NOT in Amadeus results
        const finalResults = [...amadeusResults];

        matchedFallbacks.forEach(f => {
            const alreadyExists = finalResults.some(a => a.iata === f.iata);
            if (!alreadyExists) {
                // If it's an exact IATA match, put it at the top
                if (f.iata === queryUpper) {
                    finalResults.unshift(f);
                } else {
                    finalResults.push(f);
                }
            }
        });

        res.json(finalResults.slice(0, 15));
    } catch (error) {
        console.error("Airport search failed:", error.message);
        res.status(500).json({ error: "Airport search failed" });
    }
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
