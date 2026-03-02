import { db } from '../db';
import { settings, type Settings, type InsertSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class SettingsService {
    async getSettings(): Promise<Settings> {
        const allSettings = await db.select().from(settings).limit(1);
        if (allSettings.length === 0) {
            // Create default settings row if it doesn't exist
            const [defaultSettings] = await db
                .insert(settings)
                .values({
                    networkRanges: [{ id: '1', name: 'Main LAN', cidr: '192.168.1.0/24', enabled: true }],
                    vlans: [],
                    scanSettings: { interval: 60, autoDiscovery: true },
                })
                .returning();
            return defaultSettings;
        }
        return allSettings[0];
    }

    async updateSettings(data: Partial<InsertSettings>): Promise<Settings> {
        const currentSettings = await this.getSettings();
        const [updated] = await db
            .update(settings)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(settings.id, currentSettings.id))
            .returning();
        return updated;
    }
}

export const settingsService = new SettingsService();
