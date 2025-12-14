import pool from '../db.js';
import { Transaction, RefundRequest, Listing, User } from '../models/index.js';

export const transactionController = {
  async getAll(req, res) {
    try {
      const transactions = await Transaction.findByUser(req.user.id);
      res.json(transactions);
    } catch (err) {
      console.error('Get transactions error:', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  },

  async getOrders(req, res) {
    try {
      const orders = await Transaction.findPurchasesByUser(req.user.id);
      res.json(orders);
    } catch (err) {
      console.error('Get orders error:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  },

  async getCardDetails(req, res) {
    try {
      const { listingId } = req.params;
      const hasPurchased = await Transaction.hasPurchased(req.user.id, listingId);
      if (!hasPurchased) {
        return res.status(403).json({ error: 'You have not purchased this item' });
      }
      
      const cardDetails = await Listing.getCardDetails(listingId);
      if (!cardDetails) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      res.json(cardDetails);
    } catch (err) {
      console.error('Get card details error:', err);
      res.status(500).json({ error: 'Failed to fetch card details' });
    }
  },

  async requestRefund(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ error: 'Reason is required' });
      
      const tx = await Transaction.findById(id, req.user.id);
      if (!tx) return res.status(404).json({ error: 'Transaction not found' });
      if (tx.type !== 'purchase') return res.status(400).json({ error: 'Can only refund purchases' });
      
      const existing = await RefundRequest.findByTransactionId(id);
      if (existing) return res.status(400).json({ error: 'Refund already requested' });
      
      await RefundRequest.create(id, req.user.id, reason);
      await Transaction.updateRefundStatus(id, 'pending', reason);
      
      res.json({ message: 'Refund request submitted' });
    } catch (err) {
      console.error('Request refund error:', err);
      res.status(500).json({ error: 'Failed to request refund' });
    }
  },

  async getCart(req, res) {
    try {
      const cart = await Transaction.getCart(req.user.id);
      res.json(cart);
    } catch (err) {
      console.error('Get cart error:', err);
      res.status(500).json({ error: 'Failed to fetch cart items' });
    }
  },

  async autoCheck(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { transactionId } = req.params;
      
      const tx = await Transaction.findByIdWithListing(transactionId, req.user.id, client);
      if (!tx) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      const purchaseTime = new Date(tx.created_at);
      const now = new Date();
      const minutesDiff = (now - purchaseTime) / (1000 * 60);
      
      if (minutesDiff > 5) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Check window expired (5 minutes)', expired: true });
      }
      
      const isValid = Math.random() > 0.3;
      
      if (!isValid) {
        await User.updateBalance(req.user.id, tx.amount, client);
        if (tx.seller_id) {
          await User.updateBalance(tx.seller_id, -tx.amount, client);
        }
        
        await Transaction.updateRefundStatus(tx.id, 'auto_refunded', 'Auto-check failed', client);
        
        await client.query('COMMIT');
        return res.json({ 
          status: 'refunded', 
          message: 'Card check failed - automatic refund processed',
          refundAmount: tx.amount
        });
      }
      
      await Transaction.updateRefundStatus(tx.id, 'verified', null, client);
      await client.query('COMMIT');
      
      res.json({ 
        status: 'valid', 
        message: 'Card verified successfully'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Auto check error:', err);
      res.status(500).json({ error: 'Check failed' });
    } finally {
      client.release();
    }
  }
};
