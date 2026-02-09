export interface SearchState {
    origin: { iata: string; display: string } | null;
    destination: { iata: string; display: string } | null;
    departDate: string | null;
    returnDate: string | null;
    tripType: 'return' | 'one-way' | 'multi-city';
    travellers: {
        adults: number;
        childrenCount: number;
        cabin: string;
    };
    directOnly: boolean;
    addHotel: boolean;
}
