import pool from '../db.js';

export const RefundRequest = {
  async findById(id, client = pool) {
    const result = await client.query('SELECT * FROM refund_requests WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByTransactionId(transactionId) {
    const result = await pool.query('SELECT id FROM refund_requests WHERE transaction_id = $1', [transactionId]);
    return result.rows[0] || null;
  },

  async findByIdWithDetails(id, client = pool) {
    const result = await client.query(`
      SELECT r.*, t.amount, t.user_id as buyer_id, l.seller_id, l.id as listing_id
      FROM refund_requests r 
      JOIN transactions t ON r.transaction_id = t.id 
      LEFT JOIN listings l ON t.listing_id = l.id 
      WHERE r.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async findByUser(userId) {
    const result = await pool.query(`
      SELECT r.*, t.amount, l.title as listing_title 
      FROM refund_requests r 
      JOIN transactions t ON r.transaction_id = t.id 
      LEFT JOIN listings l ON t.listing_id = l.id 
      WHERE r.user_id = $1 
      ORDER BY r.created_at DESC
    `, [userId]);
    return result.rows;
  },

  async findAll() {
    const result = await pool.query(`
      SELECT r.*, t.amount, l.title as listing_title, u.username 
      FROM refund_requests r 
      JOIN transactions t ON r.transaction_id = t.id 
      JOIN users u ON r.user_id = u.id 
      LEFT JOIN listings l ON t.listing_id = l.id 
      ORDER BY r.created_at DESC
    `);
    return result.rows;
  },

  async create(transactionId, userId, reason) {
    await pool.query(
      'INSERT INTO refund_requests (transaction_id, user_id, reason, status) VALUES ($1, $2, $3, $4)',
      [transactionId, userId, reason, 'pending']
    );
  },

  async updateStatus(id, status, client = pool) {
    await client.query('UPDATE refund_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
  }
};
