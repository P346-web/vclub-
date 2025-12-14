import { AdminSettings } from '../models/index.js';

export const settingsController = {
  async getPublic(req, res) {
    try {
      const settings = await AdminSettings.getPublic();
      res.json(settings);
    } catch (err) {
      console.error('Get public settings error:', err);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }
};
