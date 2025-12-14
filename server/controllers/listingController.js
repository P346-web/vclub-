import pool from '../db.js';
import { Listing, User, Transaction } from '../models/index.js';

export const listingController = {
  async getAll(req, res) {
    try {
      const { bin, bank, zip } = req.query;
      const listings = await Listing.findActive({ bin, bank, zip });
      res.json(listings);
    } catch (err) {
      console.error('Get listings error:', err);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  },

  async getMy(req, res) {
    try {
      const listings = await Listing.findBySeller(req.user.id);
      res.json(listings);
    } catch (err) {
      console.error('Get my listings error:', err);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  },

  async create(req, res) {
    try {
      const { title, card_type, card_brand, country, price, details, card_number, exp_month, exp_year, cvv, bin, bank, zip } = req.body;
      if (!title || !price) return res.status(400).json({ error: 'Title and price required' });
      if (!card_number || !exp_month || !exp_year || !cvv) {
        return res.status(400).json({ error: 'Card details are required' });
      }
      
      if (req.user.role === 'user') {
        await User.updateRole(req.user.id, 'seller');
      }
      
      const listing = await Listing.create({
        sellerId: req.user.id,
        title,
        cardType: card_type,
        cardBrand: card_brand,
        country,
        price,
        details,
        cardNumber: card_number,
        expMonth: exp_month,
        expYear: exp_year,
        cvv,
        bin,
        bank,
        zip
      });
      res.json(listing);
    } catch (err) {
      console.error('Create listing error:', err);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, card_type, card_brand, country, price, details, status } = req.body;
      
      const listing = await Listing.findById(id);
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const updated = await Listing.update(id, {
        title,
        cardType: card_type,
        cardBrand: card_brand,
        country,
        price,
        details,
        status
      });
      res.json(updated);
    } catch (err) {
      console.error('Update listing error:', err);
      res.status(500).json({ error: 'Failed to update listing' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const listing = await Listing.findById(id);
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      await Listing.delete(id);
      res.json({ message: 'Listing deleted' });
    } catch (err) {
      console.error('Delete listing error:', err);
      res.status(500).json({ error: 'Failed to delete listing' });
    }
  },

  async purchase(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { id } = req.params;
      
      const item = await Listing.findByIdForUpdate(id, 'active', client);
      if (!item) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Listing not available' });
      }
      
      if (parseFloat(req.user.balance) < parseFloat(item.price)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      await User.updateBalance(req.user.id, -item.price, client);
      await User.updateBalance(item.seller_id, item.price, client);
      await Listing.updateStatus(id, 'sold', client);
      
      await Transaction.create({ userId: req.user.id, listingId: id, type: 'purchase', amount: item.price, status: 'confirmed' }, client);
      await Transaction.create({ userId: item.seller_id, listingId: id, type: 'sale', amount: item.price, status: 'confirmed' }, client);
      
      await client.query('COMMIT');
      res.json({ message: 'Purchase successful', listing: item });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Purchase error:', err);
      res.status(500).json({ error: 'Purchase failed' });
    } finally {
      client.release();
    }
  }
};
