import pool from '../db.js';
import { User, Listing, Transaction, RefundRequest, AdminSettings } from '../models/index.js';
import { upload } from '../middleware/upload.js';

export const adminController = {
  async getUsers(req, res) {
    try {
      const users = await User.getAll();
      res.json(users);
    } catch (err) {
      console.error('Get users error:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { role, balance } = req.body;
      const user = await User.update(id, role, balance);
      res.json(user);
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ error: 'Failed to update user' });
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await User.delete(id);
      res.json({ message: 'User deleted' });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },

  async getSettings(req, res) {
    try {
      const settings = await AdminSettings.get();
      res.json(settings);
    } catch (err) {
      console.error('Get settings error:', err);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  },

  async updateSettings(req, res) {
    try {
      const { wallet_address, qr_code_url, site_name, btc_rate, bonus_percentage, min_bonus_amount, exchange_fee } = req.body;
      const settings = await AdminSettings.update({
        walletAddress: wallet_address,
        qrCodeUrl: qr_code_url,
        siteName: site_name,
        btcRate: btc_rate,
        bonusPercentage: bonus_percentage,
        minBonusAmount: min_bonus_amount,
        exchangeFee: exchange_fee
      });
      res.json(settings);
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  },

  async getListings(req, res) {
    try {
      const listings = await Listing.findAll();
      res.json(listings);
    } catch (err) {
      console.error('Get admin listings error:', err);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  },

  async approveListing(req, res) {
    try {
      const { id } = req.params;
      const listing = await Listing.updateStatus(id, 'active');
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      res.json(listing);
    } catch (err) {
      console.error('Approve listing error:', err);
      res.status(500).json({ error: 'Failed to approve listing' });
    }
  },

  async rejectListing(req, res) {
    try {
      const { id } = req.params;
      const listing = await Listing.updateStatus(id, 'rejected');
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      res.json(listing);
    } catch (err) {
      console.error('Reject listing error:', err);
      res.status(500).json({ error: 'Failed to reject listing' });
    }
  },

  async getTransactions(req, res) {
    try {
      const transactions = await Transaction.findAll();
      res.json(transactions);
    } catch (err) {
      console.error('Get admin transactions error:', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  },

  async getRefunds(req, res) {
    try {
      const refunds = await RefundRequest.findAll();
      res.json(refunds);
    } catch (err) {
      console.error('Get admin refunds error:', err);
      res.status(500).json({ error: 'Failed to fetch refunds' });
    }
  },

  async approveRefund(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { id } = req.params;
      
      const r = await RefundRequest.findByIdWithDetails(id, client);
      if (!r) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Refund request not found' });
      }
      
      if (r.status !== 'pending') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Refund already processed' });
      }
      
      await User.updateBalance(r.buyer_id, r.amount, client);
      if (r.seller_id) {
        await User.updateBalance(r.seller_id, -r.amount, client);
      }
      
      await RefundRequest.updateStatus(id, 'approved', client);
      await Transaction.updateRefundStatus(r.transaction_id, 'approved', null, client);
      
      await Transaction.create({
        userId: r.buyer_id,
        listingId: r.listing_id,
        type: 'refund',
        amount: r.amount,
        status: 'confirmed'
      }, client);
      
      await client.query('COMMIT');
      res.json({ message: 'Refund approved' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Approve refund error:', err);
      res.status(500).json({ error: 'Failed to approve refund' });
    } finally {
      client.release();
    }
  },

  async rejectRefund(req, res) {
    try {
      const { id } = req.params;
      
      const refund = await RefundRequest.findById(id);
      if (!refund) return res.status(404).json({ error: 'Refund request not found' });
      if (refund.status !== 'pending') return res.status(400).json({ error: 'Refund already processed' });
      
      await RefundRequest.updateStatus(id, 'rejected');
      await Transaction.updateRefundStatus(refund.transaction_id, 'rejected');
      
      res.json({ message: 'Refund rejected' });
    } catch (err) {
      console.error('Reject refund error:', err);
      res.status(500).json({ error: 'Failed to reject refund' });
    }
  },

  uploadQr(req, res) {
    upload.single('qr')(req, res, async (err) => {
      if (err) {
        if (err.message.includes('Only image files')) {
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: 'File upload failed' });
      }
      try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const url = `/uploads/${req.file.filename}`;
        await AdminSettings.updateQrCode(url);
        res.json({ url });
      } catch (err) {
        console.error('Upload QR error:', err);
        res.status(500).json({ error: 'Failed to upload QR code' });
      }
    });
  }
};
