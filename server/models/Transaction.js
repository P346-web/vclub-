import pool from '../db.js';

export const Transaction = {
  async findById(id, userId = null, client = pool) {
    let query = 'SELECT * FROM transactions WHERE id = $1';
    const params = [id];
    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }
    const result = await client.query(query, params);
    return result.rows[0] || null;
  },

  async findByIdWithListing(id, userId, client = pool) {
    const result = await client.query(
      'SELECT t.*, l.seller_id, l.id as listing_id FROM transactions t LEFT JOIN listings l ON t.listing_id = l.id WHERE t.id = $1 AND t.user_id = $2 FOR UPDATE',
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async findByUser(userId) {
    const result = await pool.query(
      'SELECT t.*, l.title as listing_title FROM transactions t LEFT JOIN listings l ON t.listing_id = l.id WHERE t.user_id = $1 ORDER BY t.created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findPurchasesByUser(userId) {
    const result = await pool.query(
      `SELECT t.*, l.title as listing_title, l.id as listing_id 
       FROM transactions t 
       LEFT JOIN listings l ON t.listing_id = l.id 
       WHERE t.user_id = $1 AND t.type = 'purchase' 
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findAll() {
    const result = await pool.query(`
      SELECT t.*, u.username, l.title as listing_title 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      LEFT JOIN listings l ON t.listing_id = l.id 
      ORDER BY t.created_at DESC
    `);
    return result.rows;
  },

  async create(data, client = pool) {
    const { userId, listingId, type, amount, status } = data;
    const result = await client.query(
      'INSERT INTO transactions (user_id, listing_id, type, amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, listingId, type, amount, status]
    );
    return result.rows[0];
  },

  async updateRefundStatus(id, status, reason = null, client = pool) {
    if (reason) {
      await client.query(
        'UPDATE transactions SET refund_status = $1, refund_reason = $2, refund_requested_at = CURRENT_TIMESTAMP WHERE id = $3',
        [status, reason, id]
      );
    } else {
      await client.query('UPDATE transactions SET refund_status = $1 WHERE id = $2', [status, id]);
    }
  },

  async getCart(userId) {
    const result = await pool.query(`
      SELECT t.*, l.title as listing_title, l.id as listing_id, l.card_number, l.exp_month, l.exp_year, l.cvv, l.card_brand, l.card_type, l.country, l.details
      FROM transactions t 
      LEFT JOIN listings l ON t.listing_id = l.id 
      WHERE t.user_id = $1 AND t.type = 'purchase' 
      ORDER BY t.created_at DESC
    `, [userId]);
    return result.rows;
  },

  async hasPurchased(userId, listingId) {
    const result = await pool.query(
      `SELECT t.id FROM transactions t WHERE t.user_id = $1 AND t.listing_id = $2 AND t.type = 'purchase'`,
      [userId, listingId]
    );
    return result.rows.length > 0;
  }
};
