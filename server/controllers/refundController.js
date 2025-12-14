import { RefundRequest } from '../models/index.js';

export const refundController = {
  async getMy(req, res) {
    try {
      const refunds = await RefundRequest.findByUser(req.user.id);
      res.json(refunds);
    } catch (err) {
      console.error('Get refunds error:', err);
      res.status(500).json({ error: 'Failed to fetch refunds' });
    }
  }
};
