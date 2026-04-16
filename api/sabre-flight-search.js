/**
 * Sabre Bargain Finder Max (BFM) – Flight Search Module
 * -------------------------------------------------------
 * Uses POST /v5/offers/shop (Sabre BFM) which is entitled on CERT/DEVCENTER accounts.
 * The original /v1/offers/flightSearch endpoint requires a separate subscription
 * that DEVCENTER accounts do not have by default.
 *
 * BFM returns a "groupedItineraryResponse" with descriptor tables:
 *   scheduleDescs[] – individual flight segments (lookup by id)
 *   legDescs[]      – ordered list of scheduleDesc refs forming one leg
 *   itineraryGroups[] – groups of itineraries sharing the same O&D
 *     itineraries[]   – each has leg refs + pricingInformation[]
 *
 * This module transforms that structure into the Amadeus-compatible shape
 * already expected by the Angular frontend.
 */

const axios = require('axios');
const { getToken, getBaseUrl } = require('./sabre-auth');

const BFM_PATH = '/v5/offers/shop';
const DEFAULT_TIMEOUT = 30000; // 30 s – BFM can be slow on CERT

// ---------------------------------------------------------------------------
// 1. Build BFM request payload
// ---------------------------------------------------------------------------

/**
 * @param {Object} params
 * @param {string}  params.origin          – IATA code (e.g. "DAC")
 * @param {string}  params.destination     – IATA code (e.g. "DXB")
 * @param {string}  params.departureDate   – "YYYY-MM-DD"
 * @param {string}  [params.returnDate]    – "YYYY-MM-DD" (round-trip)
 * @param {number}  [params.adults]
 * @param {number}  [params.children]
 * @param {number}  [params.infants]
 * @param {string}  [params.cabin]         – "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST"
 * @param {boolean} [params.nonStop]
 * @param {number}  [params.maxResults]
 */
function buildBfmPayload(params) {
    const {
        origin,
        destination,
        departureDate,
        returnDate,
        adults = 1,
        children = 0,
        infants = 0,
        cabin = 'ECONOMY',
        nonStop = false,
        maxResults = 100,
        tripType,
        segments
    } = params;

    // Map our cabin strings to Sabre cabin codes
    const CABIN_MAP = {
        ECONOMY: 'Y',
        PREMIUM_ECONOMY: 'S',
        BUSINESS: 'C',
        FIRST: 'F',
    };
    const sabreCabin = CABIN_MAP[cabin?.toUpperCase()] || 'Y';

    // Build passenger list
    const passengerList = [];
    const adultCount = parseInt(adults) || 1;
    const childCount = parseInt(children) || 0;
    const infantCount = parseInt(infants) || 0;

    if (adultCount > 0) passengerList.push({ Code: 'ADT', Quantity: adultCount });
    if (childCount > 0) passengerList.push({ Code: 'CNN', Quantity: childCount });
    if (infantCount > 0) passengerList.push({ Code: 'INF', Quantity: infantCount });

    // Build O&D legs
    const originDestinations = [];

    if (tripType === 'multi-city' && Array.isArray(segments) && segments.length > 0) {
        segments.forEach((seg, index) => {
            originDestinations.push({
                RPH: String(index + 1),
                DepartureDateTime: `${seg.t}T00:00:00`,
                OriginLocation: { LocationCode: seg.o?.toUpperCase() },
                DestinationLocation: { LocationCode: seg.d?.toUpperCase() },
            });
        });
    } else {
        originDestinations.push({
            RPH: '1',
            DepartureDateTime: `${departureDate}T00:00:00`,
            OriginLocation: { LocationCode: origin.toUpperCase() },
            DestinationLocation: { LocationCode: destination.toUpperCase() },
        });

        if (returnDate) {
            originDestinations.push({
                RPH: '2',
                DepartureDateTime: `${returnDate}T00:00:00`,
                OriginLocation: { LocationCode: destination.toUpperCase() },
                DestinationLocation: { LocationCode: origin.toUpperCase() },
            });
        }
    }

    const payload = {
        OTA_AirLowFareSearchRQ: {
            Version: '6.3.0',
            POS: {
                Source: [
                    {
                        PseudoCityCode: 'F9CE',
                        RequestorID: {
                            Type: '1',
                            ID: '1',
                            CompanyName: { Code: 'TN' },
                        },
                    },
                ],
            },
            OriginDestinationInformation: originDestinations,
            TravelerInfoSummary: {
                SeatsRequested: [adultCount + childCount],
                AirTravelerAvail: [
                    {
                        PassengerTypeQuantity: passengerList,
                    },
                ],
            },
            TPA_Extensions: {
                IntelliSellTransaction: {
                    RequestType: { Name: `${Math.min(maxResults, 200)}ITINS` },
                },
            },
        },
    };

    // Cabin filter
    if (sabreCabin !== 'Y') {
        payload.OTA_AirLowFareSearchRQ.TPA_Extensions.CabinPref = { Cabin: sabreCabin };
    }

    // Non-stop filter
    if (nonStop) {
        originDestinations.forEach(od => {
            od.TPA_Extensions = { ...od.TPA_Extensions, MaxStopsQuantity: 0 };
        });
    }

    return payload;
}

// ---------------------------------------------------------------------------
// 2. Call Sabre BFM API
// ---------------------------------------------------------------------------

async function callBfm(payload) {
    const token = await getToken();
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${BFM_PATH}`;

    console.log(`[SabreBFM] POST ${url}`);
    console.log(`[SabreBFM] O: ${payload.OTA_AirLowFareSearchRQ?.OriginDestinationInformation?.[0]?.OriginLocation?.LocationCode} → D: ${payload.OTA_AirLowFareSearchRQ?.OriginDestinationInformation?.[0]?.DestinationLocation?.LocationCode} | ${payload.OTA_AirLowFareSearchRQ?.OriginDestinationInformation?.[0]?.DepartureDateTime?.split('T')[0]}`);

    try {
        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            timeout: DEFAULT_TIMEOUT,
        });

        const bfm = response.data?.groupedItineraryResponse;

        if (!bfm) {
            const raw = JSON.stringify(response.data).slice(0, 400);
            console.error(`[SabreBFM] Unexpected response – no groupedItineraryResponse. Raw: ${raw}`);
            throw new Error(`Unexpected BFM response schema. Raw: ${raw}`);
        }

        const itinCount = bfm.statistics?.itineraryCount ?? '?';
        console.log(`[SabreBFM] HTTP ${response.status} – ${itinCount} itineraries`);

        return bfm;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const msg =
                error.response.data?.Errors?.Error?.[0]?.Value ||
                error.response.data?.message ||
                JSON.stringify(error.response.data).substring(0, 300);
            console.error(`[SabreBFM] HTTP ${status}: ${msg}`);
            throw new Error(`Sabre BFM error (${status}): ${msg}`);
        }
        if (error.code === 'ECONNABORTED') {
            console.error('[SabreBFM] Request timed out');
            throw new Error('Sabre BFM request timed out');
        }
        throw error;
    }
}

// ---------------------------------------------------------------------------
// 3. Transform BFM grouped response → UI-friendly format
// ---------------------------------------------------------------------------

/**
 * Parse an ISO-8601-like time string with tz offset "HH:mm:ss+HH:mm" into
 * a wall-clock datetime string for the given date.
 */
function buildDatetime(date, timeWithTz) {
    if (!date || !timeWithTz) return date ? `${date}T00:00:00` : '';
    // timeWithTz looks like "08:30:00+06:00" – strip tz for local display
    const localTime = timeWithTz.substring(0, 8); // "HH:mm:ss"
    return `${date}T${localTime}`;
}

function minutesToIsoDuration(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `PT${h}H${m}M`;
}

/**
 * Main transformer.
 * Takes the raw BFM groupedItineraryResponse and returns an array of
 * flight offer objects compatible with the Angular frontend components.
 *
 * Target output shape (per offer):
 * {
 *   id, source: 'SABRE',
 *   price: { currency, total, base, originalTotal, originalCurrency },
 *   itineraries: [
 *     {
 *       duration: "PT4H30M",
 *       segments: [
 *         {
 *           departure: { iataCode, at },
 *           arrival:   { iataCode, at },
 *           carrierCode, number, aircraft: { code },
 *           duration: "PT2H15M",
 *           id
 *         }
 *       ]
 *     }
 *   ],
 *   validatingAirlineCodes: [...],
 *   bookable: true
 * }
 */
function transformBfmResponse(bfm, exchangeRate = 120, markup = { type: 'percentage', value: 0 }) {
    if (!bfm) return [];

    // Build lookup maps for the descriptor tables
    const scheduleMap = {}; // id → scheduleDesc
    (bfm.scheduleDescs || []).forEach(s => { scheduleMap[s.id] = s; });

    const legMap = {}; // id → legDesc
    (bfm.legDescs || []).forEach(l => { legMap[l.id] = l; });

    const fareComponentMap = {}; // id → fareComponentDesc
    (bfm.fareComponentDescs || []).forEach(f => { fareComponentMap[f.id] = f; });

    const taxMap = {}; // id → taxDesc
    (bfm.taxDescs || []).forEach(t => { taxMap[t.id] = t; });

    const baggageMap = {}; // id → baggageAllowanceDesc
    (bfm.baggageAllowanceDescs || []).forEach(b => { baggageMap[b.id] = b; });

    const transformedOffers = [];
    let offerId = 0;

    for (const group of (bfm.itineraryGroups || [])) {
        const groupDesc = group.groupDescription;
        const legDescriptions = groupDesc?.legDescriptions || [];

        for (const itin of (group.itineraries || [])) {
            try {
                // Resolve legs → itineraries
                const itineraries = [];

                (itin.legs || []).forEach((legRef, legIdx) => {
                    const legDesc = legMap[legRef.ref];
                    if (!legDesc) return;

                    const departureDate = legDescriptions[legIdx]?.departureDate || '';
                    const segments = [];

                    (legDesc.schedules || []).forEach((schedRef, segIdx) => {
                        const sched = scheduleMap[schedRef.ref];
                        if (!sched) return;

                        // Calculate arrival date accounting for dateAdjustment
                        const arrDateObj = departureDate ? new Date(departureDate) : null;
                        if (arrDateObj && sched.arrival?.dateAdjustment) {
                            arrDateObj.setDate(arrDateObj.getDate() + sched.arrival.dateAdjustment);
                        }
                        const arrDate = arrDateObj ? arrDateObj.toISOString().substring(0, 10) : departureDate;

                        const departureAt = buildDatetime(departureDate, sched.departure?.time);
                        const arrivalAt = buildDatetime(arrDate, sched.arrival?.time);

                        segments.push({
                            id: `${offerId}-${legIdx}-${segIdx}`,
                            departure: {
                                iataCode: sched.departure?.airport || '---',
                                terminal: sched.departure?.terminal,
                                at: departureAt,
                            },
                            arrival: {
                                iataCode: sched.arrival?.airport || '---',
                                terminal: sched.arrival?.terminal,
                                at: arrivalAt,
                            },
                            carrierCode: sched.carrier?.marketing || sched.carrier?.operating || '',
                            number: String(sched.carrier?.marketingFlightNumber || sched.carrier?.operatingFlightNumber || ''),
                            aircraft: { code: sched.carrier?.equipment?.code || '' },
                            duration: minutesToIsoDuration(sched.elapsedTime || 0),
                            numberOfStops: sched.stopCount || 0,
                            _sabre: {
                                from: sched.departure?.airport,
                                to: sched.arrival?.airport,
                                airline: sched.carrier?.marketing,
                                flightNumber: `${sched.carrier?.marketing}${sched.carrier?.marketingFlightNumber}`,
                                equipment: sched.carrier?.equipment?.code,
                            },
                        });
                    });

                    if (segments.length === 0) return;

                    itineraries.push({
                        duration: minutesToIsoDuration(legDesc.elapsedTime || 0),
                        segments,
                    });
                });

                if (itineraries.length === 0) continue;

                // Extract pricing from first pricingInformation block
                const pricing = itin.pricingInformation?.[0];
                if (!pricing) continue;

                const fare = pricing.fare;
                const passengerInfo = fare?.passengerInfoList?.[0]?.passengerInfo;

                // Total fare in original currency (USD)
                const totalFareUSD = parseFloat(fare?.totalFare?.totalPrice || 0);
                const baseFareUSD = parseFloat(fare?.totalFare?.equivalentAmount || fare?.totalFare?.totalPrice * 0.85 || 0);
                const currency = fare?.totalFare?.currency || 'USD';
                const validatingCarrier = fare?.validatingCarrierCode || itineraries[0]?.segments[0]?.carrierCode || '';

                // Apply exchange rate and markup
                let totalBDT = totalFareUSD * exchangeRate;
                let baseBDT = baseFareUSD * exchangeRate;
                if (markup.type === 'percentage') {
                    const factor = 1 + (parseFloat(markup.value || 0) / 100);
                    totalBDT *= factor;
                    baseBDT *= factor;
                } else {
                    const flat = parseFloat(markup.value || 0);
                    totalBDT += flat;
                    baseBDT += flat * 0.85;
                }

                // Cabin class (from first segment booking code)
                const cabinCode = passengerInfo?.fareComponents?.[0]?.segments?.[0]?.segment?.cabinCode || 'Y';
                const CABIN_NAMES = { Y: 'ECONOMY', C: 'BUSINESS', F: 'FIRST', S: 'PREMIUM_ECONOMY', W: 'PREMIUM_ECONOMY' };

                const isNonStop = itineraries.every(it => it.segments.length === 1);
                const isRefundable = !(passengerInfo?.nonRefundable === true);

                transformedOffers.push({
                    id: `sabre-bfm-${offerId++}`,
                    source: 'SABRE',
                    pricingSource: itin.pricingSource,
                    price: {
                        currency: 'BDT',
                        total: Math.round(totalBDT),
                        base: Math.round(baseBDT),
                        originalTotal: totalFareUSD,
                        originalCurrency: currency,
                    },
                    itineraries,
                    validatingAirlineCodes: [validatingCarrier],
                    isNonStop,
                    isRefundable,
                    cabin: CABIN_NAMES[cabinCode] || 'ECONOMY',
                    bookable: true,
                    lastTicketDate: fare?.lastTicketDate,
                });
            } catch (err) {
                console.warn(`[SabreBFM] Failed to transform itinerary ${itin.id}: ${err.message}`);
            }
        }
    }

    console.log(`[SabreBFM] Transformed ${transformedOffers.length} offers`);
    return transformedOffers;
}

// ---------------------------------------------------------------------------
// 4. High-level search function
// ---------------------------------------------------------------------------

/**
 * Perform a complete Sabre BFM flight search: build payload → call API → transform.
 *
 * @param {Object} params
 * @param {string} params.origin
 * @param {string} params.destination
 * @param {string} params.departureDate
 * @param {string} [params.returnDate]
 * @param {number} [params.adults]
 * @param {number} [params.children]
 * @param {number} [params.infants]
 * @param {string} [params.cabin]
 * @param {boolean} [params.nonStop]
 * @param {number} [exchangeRate]
 * @param {Object} [markup]
 * @returns {Promise<Array>} Transformed flight offers
 */
async function searchFlights(params, exchangeRate = 120, markup = { type: 'percentage', value: 0 }) {
    const bfmPayload = buildBfmPayload(params);
    const rawResponse = await callBfm(bfmPayload);
    return transformBfmResponse(rawResponse, exchangeRate, markup);
}

module.exports = {
    searchFlights,
    buildBfmPayload,
    callBfm,
    transformBfmResponse,
};
