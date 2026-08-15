// In-memory passenger profile store
// NOTE: Profiles are lost on server restart. For production, persist to Firebase.
const profiles = new Map();

function saveProfile(userId, passengers) {
    if (!userId || !passengers) return;
    const existing = profiles.get(userId) || [];
    // Merge new profiles, avoid exact duplicates
    const merged = [...existing];
    const toAdd = Array.isArray(passengers) ? passengers : [passengers];
    for (const p of toAdd) {
        const isDuplicate = merged.some(
            e => e.firstName === p.firstName && e.lastName === p.lastName
        );
        if (!isDuplicate && p.firstName && p.lastName) {
            merged.push(p);
        }
    }
    profiles.set(userId, merged.slice(0, 10)); // max 10 saved passengers per session
}

function getProfile(userId) {
    return profiles.get(userId) || [];
}

function clearProfile(userId) {
    profiles.delete(userId);
}

module.exports = { saveProfile, getProfile, clearProfile };
