export interface Airline {
    code: string;
    name: string;
    logoUrl?: string;
}

export interface Airport {
    iata: string;
    name: string;
    city: string;
    country?: string;
}

export interface FlightSegment {
    departure: {
        iata: string;
        at: string; // ISO DateTime
        terminal?: string;
    };
    arrival: {
        iata: string;
        at: string; // ISO DateTime
        terminal?: string;
    };
    carrierCode: string;
    number: string;
    aircraft?: string;
    duration: string; // ISO 8601 Duration e.g., PT2H30M
    id: string;
    numberOfStops: number;
    blacklistedInEU?: boolean;
}

export interface FlightPrice {
    currency: string;
    total: string;
    base: string;
    fees?: any[];
    grandTotal?: string;
}

export interface FlightOffer {
    id: string;
    source: string;
    itineraries: {
        duration: string;
        segments: FlightSegment[];
    }[];
    price: FlightPrice;
    pricingOptions?: any;
    validatingAirlineCodes: string[];
    travelerPricings?: any[];
}
