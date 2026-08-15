// In-memory session store
// NOTE: Data is lost on server restart. For production, replace with Redis or Firebase.
const sessions = new Map();

// Auto-cleanup sessions older than 2 hours
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

function cleanup() {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.lastActivity > SESSION_TTL_MS) {
            sessions.delete(id);
        }
    }
}

// Run cleanup every 30 minutes
setInterval(cleanup, 30 * 60 * 1000);

class SessionService {
    get(sessionId) {
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                history: [],
                booking: {},
                passengerProfiles: [],
                createdAt: Date.now(),
                lastActivity: Date.now()
            });
        }
        const session = sessions.get(sessionId);
        session.lastActivity = Date.now();
        return session;
    }

    updateBooking(sessionId, data) {
        const session = this.get(sessionId);
        Object.assign(session.booking, data);
        session.lastActivity = Date.now();
    }

    savePassengerProfiles(sessionId, profiles) {
        const session = this.get(sessionId);
        if (Array.isArray(profiles) && profiles.length > 0) {
            session.passengerProfiles = profiles;
            session.lastActivity = Date.now();
        }
    }

    getPassengerProfiles(sessionId) {
        if (!sessions.has(sessionId)) return [];
        return sessions.get(sessionId).passengerProfiles || [];
    }

    reset(sessionId) {
        if (sessions.has(sessionId)) {
            const existing = sessions.get(sessionId);
            // Keep profiles but reset history and booking
            sessions.set(sessionId, {
                history: [],
                booking: {},
                passengerProfiles: existing.passengerProfiles || [],
                createdAt: existing.createdAt,
                lastActivity: Date.now()
            });
        }
    }

    getCount() {
        return sessions.size;
    }
}

module.exports = new SessionService();
