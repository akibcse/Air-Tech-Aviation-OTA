/**
 * AI Service for Flight Booking Assistant
 * ---------------------------------------
 * Powered by rule-based algorithm (no external AI).
 * Created by Md. Akib Hasan
 */

const AI_CONFIG = {
    provider: process.env.AI_PROVIDER || 'algorithm',
};

const SYSTEM_PROMPT = `You are the AI Flight Booking Assistant for AirTech Aviation, Bangladesh's First AI Flight Booking App.
Created by Md. Akib Hasan, an Aviation Trainer & GDS Expert.

Your goal is to help users find flights. Ask for:
1. Origin City/Airport (IATA code)
2. Destination City/Airport (IATA code)
3. Travel Date (YYYY-MM-DD)
4. Number of Passengers (Adults/Children/Infants)
5. Cabin Class (ECONOMY, BUSINESS, etc.)

Once you have all the information AND the user confirms they want to search, return JSON:
{
  "status": "complete",
  "data": {
    "origin": "DAC",
    "destination": "DXB",
    "departureDate": "2026-05-15",
    "adults": 1,
    "children": 0,
    "infants": 0,
    "cabin": "ECONOMY",
    "tripType": "one-way"
  }
}`;

const AIRPORT_CODES = {
    'dhaka': 'DAC', 'dhaka airport': 'DAC', 'dac': 'DAC',
    'chittagong': 'CGP', 'ctg': 'CGP', 'cgp': 'CGP',
    'cox': 'CXB', 'cox bazar': 'CXB', 'cxb': 'CXB',
    'sylhet': 'ZYL', 'zyl': 'ZYL',
    'jeddah': 'JED', 'jed': 'JED',
    'dubai': 'DXB', 'dxb': 'DXB',
    'kolkata': 'CCU', 'ccu': 'CCU', 'calcutta': 'CCU',
    'mumbai': 'BOM', 'bom': 'BOM', 'bombay': 'BOM',
    'delhi': 'DEL', 'del': 'DEL',
    'bangkok': 'BKK', 'bkk': 'BKK',
    'singapore': 'SIN', 'sin': 'SIN',
    'kuala lumpur': 'KUL', 'kul': 'KUL',
    'doha': 'DOH', 'doh': 'DOH',
    'abu dhabi': 'AUH', 'auh': 'AUH',
    'kuwait': 'KWI', 'kwi': 'KWI',
    'riyadh': 'RUH', 'ruh': 'RUH',
    'karachi': 'KHI', 'khi': 'KHI',
    'london': 'LHR', 'lhr': 'LHR',
    'new york': 'JFK', 'jfk': 'JFK',
    'jfk': 'JFK',
};

const CABIN_KEYWORDS = {
    'economy': 'ECONOMY', 'eco': 'ECONOMY', 'standard': 'ECONOMY', 'regular': 'ECONOMY',
    'business': 'BUSINESS', 'biz': 'BUSINESS', 'business class': 'BUSINESS',
    'first': 'FIRST', 'first class': 'FIRST', 'premium': 'FIRST',
};

function extractAirportCode(text) {
    const lower = text.toLowerCase().trim();
    if (AIRPORT_CODES[lower]) return AIRPORT_CODES[lower];
    if (/^[A-Z]{3}$/i.test(text.trim())) return text.trim().toUpperCase();
    return null;
}

function extractDate(text) {
    const patterns = [
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            if (match[1].length === 4) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
            if (match[3] && match[3].length === 4) return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
        }
    }
    
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const monthMatch = text.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
    if (monthMatch) {
        const month = months[monthMatch[2].toLowerCase().substring(0, 3)];
        if (month) return `${monthMatch[3]}-${month.padStart(2, '0')}-${monthMatch[1].padStart(2, '0')}`;
    }
    
    return null;
}

function extractNumber(text, keywords) {
    for (const kw of keywords) {
        const match = text.toLowerCase().match(new RegExp(`(\\d+)\\s*${kw}`));
        if (match) return parseInt(match[1]);
    }
    const numMatch = text.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1]) : 1;
}

function extractCabin(text) {
    const lower = text.toLowerCase();
    for (const [key, value] of Object.entries(CABIN_KEYWORDS)) {
        if (lower.includes(key)) return value;
    }
    return 'ECONOMY';
}

function extractPassengers(text) {
    const adults = extractNumber(text, ['adult', 'passenger', 'person', 'traveler']) || 1;
    const textNoAdult = text.replace(/adult/gi, '');
    const children = extractNumber(textNoAdult, ['child', 'children', 'kid']) || 0;
    const textNoChild = text.replace(/child/gi, '');
    const infants = extractNumber(textNoChild, ['infant', 'baby']) || 0;
    return { adults: Math.min(adults, 9), children: Math.min(children, 9), infants: Math.min(infants, 2) };
}

const bookingSlots = {};

function processMessage(userMessage, history = []) {
    const sessionKey = 'current';
    let booking = bookingSlots[sessionKey] || {
        origin: null,
        destination: null,
        departureDate: null,
        returnDate: null,
        adults: 1,
        children: 0,
        infants: 0,
        cabin: 'ECONOMY',
        tripType: 'one-way',
        step: 0
    };

    const lower = userMessage.toLowerCase();
    let response = '';
    let status = 'incomplete';
    let foundFields = [];

    const extractedOrigin = extractAirportCode(userMessage);
    if (!booking.origin && extractedOrigin) {
        booking.origin = extractedOrigin;
        foundFields.push(`origin: ${extractedOrigin}`);
    }

    if (!booking.destination) {
        const keys = Object.keys(AIRPORT_CODES);
        for (const key of keys) {
            if (lower.includes(key)) {
                const dest = AIRPORT_CODES[key];
                if (dest && dest !== booking.origin) {
                    booking.destination = dest;
                    foundFields.push(`destination: ${dest}`);
                    break;
                }
            }
        }
    }

    const date = extractDate(userMessage);
    if (date && !booking.departureDate) {
        booking.departureDate = date;
        foundFields.push(`date: ${date}`);
    }

    if (lower.includes('return') || lower.includes('round')) {
        booking.tripType = 'round-trip';
    }

    const pax = extractPassengers(userMessage);
    booking.adults = pax.adults;
    booking.children = pax.children;
    booking.infants = pax.infants;

    const cabin = extractCabin(userMessage);
    if (cabin) {
        booking.cabin = cabin;
        foundFields.push(`cabin: ${cabin}`);
    }

    bookingSlots[sessionKey] = booking;

    if (booking.origin && booking.destination && booking.departureDate) {
        status = 'complete';
    }

    if (status === 'complete') {
        response = `Great! I've found your flight details:\n`;
        response += `✈️ ${booking.origin} → ${booking.destination}\n`;
        response += `📅 ${booking.departureDate}\n`;
        response += `👥 ${booking.adults} adult(s), ${booking.children} child(ren), ${booking.infants} infant(s)\n`;
        response += `💺 ${booking.cabin}\n\n`;
        response += `Shall I search for flights?`;
    } else {
        response = `I'd be happy to help you find a flight! 👋\n\n`;
        
        if (!booking.origin) {
            response += `📍 Where would you like to fly from? (e.g., Dhaka, Chittagong, Cox's Bazar)\n`;
        } else if (!booking.destination) {
            response += `📍 From ${booking.origin}, where would you like to go? (e.g., Dubai, Jeddah, Singapore)\n`;
        } else if (!booking.departureDate) {
            response += `📅 When do you want to travel? (e.g., 2026-05-15)\n`;
        }
    }

    console.log(`[AI] Processed:`, foundFields.length ? foundFields.join(', ') : 'greeting/question');

    return { response, status, booking };
}

async function chat(userMessage, history = []) {
    try {
        const { response, status, booking } = processMessage(userMessage, history);

        let reply = response;
        
        if (status === 'complete') {
            reply += `\n\n${JSON.stringify({ data: booking, status: 'complete' }, null, 2)}`;
        }

        return { role: 'assistant', content: reply };
    } catch (error) {
        console.error('[AI] Error:', error.message);
        return {
            role: 'assistant',
            content: "I encountered a problem processing your request. Please try again."
        };
    }
}

module.exports = {
    chat,
    SYSTEM_PROMPT,
    processMessage
};