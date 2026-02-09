import { Injectable, inject } from '@angular/core';
import { Database, ref, get, set } from '@angular/fire/database';

export interface PricingSettings {
    markup_type: 'percentage' | 'fixed';
    markup_value: number;
}

@Injectable({
    providedIn: 'root'
})
export class PricingService {
    private db = inject(Database);

    /**
     * Fetch current pricing settings from Realtime Database.
     */
    async getSettings(): Promise<PricingSettings> {
        try {
            const settingsRef = ref(this.db, "settings/pricing");
            const snapshot = await get(settingsRef);

            if (snapshot.exists()) {
                return snapshot.val() as PricingSettings;
            }
        } catch (error) {
            console.error("Error fetching pricing settings:", error);
        }

        return { markup_type: 'percentage', markup_value: 0 }; // Default: No markup
    }

    /**
     * Update pricing settings.
     */
    async updateSettings(settings: PricingSettings) {
        await set(ref(this.db, "settings/pricing"), settings);
    }

    /**
     * Apply markup to a base BDT price.
     */
    async applyMarkup(basePriceBDT: number): Promise<number> {
        const settings = await this.getSettings();

        if (settings.markup_type === 'percentage') {
            return Math.floor(basePriceBDT * (1 + settings.markup_value / 100));
        } else {
            return basePriceBDT + settings.markup_value;
        }
    }
}
