import { Request, Response } from 'express';
import { settingsService } from '../services/settings.service';
import { insertSettingsSchema } from '@shared/schema';
import { ZodError } from 'zod';

export class SettingsController {
    async getSettings(_req: Request, res: Response) {
        try {
            const settings = await settingsService.getSettings();
            res.json(settings);
        } catch (error) {
            console.error('Failed to get settings:', error);
            res.status(500).json({ message: 'Failed to retrieve settings' });
        }
    }

    async updateSettings(req: Request, res: Response) {
        try {
            const validatedData = insertSettingsSchema.partial().parse(req.body);
            const updated = await settingsService.updateSettings(validatedData);
            res.json(updated);
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({ message: 'Invalid data', errors: error.errors });
                return;
            }
            console.error('Failed to update settings:', error);
            res.status(500).json({ message: 'Failed to update settings' });
        }
    }
}

export const settingsController = new SettingsController();
