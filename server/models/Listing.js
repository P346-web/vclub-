import pool from '../db.js';

export const Listing = {
  async findById(id, client = pool) {
    const result = await client.query('SELECT * FROM listings WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByIdForUpdate(id, status, client) {
    const result = await client.query('SELECT * FROM listings WHERE id = $1 AND status = $2 FOR UPDATE', [id, status]);
    return result.rows[0] || null;
  },

  async findActive(filters = {}) {
    let query = `
      SELECT l.*, u.username as seller_name 
      FROM listings l 
      JOIN users u ON l.seller_id = u.id 
      WHERE l.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;
    
    if (filters.bin) {
      query += ` AND (l.bin ILIKE $${paramIndex} OR LEFT(l.card_number, 6) LIKE $${paramIndex})`;
      params.push(`${filters.bin}%`);
      paramIndex++;
    }
    if (filters.bank) {
      query += ` AND (l.bank ILIKE $${paramIndex} OR l.details ILIKE $${paramIndex})`;
      params.push(`%${filters.bank}%`);
      paramIndex++;
    }
    if (filters.zip) {
      query += ` AND (l.zip ILIKE $${paramIndex} OR l.details ILIKE $${paramIndex})`;
      params.push(`%${filters.zip}%`);
      paramIndex++;
    }
    
    query += ' ORDER BY l.created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findBySeller(sellerId) {
    const result = await pool.query('SELECT * FROM listings WHERE seller_id = $1 ORDER BY created_at DESC', [sellerId]);
    return result.rows;
  },

  async findAll() {
    const result = await pool.query(`
      SELECT l.*, u.username as seller_name 
      FROM listings l 
      JOIN users u ON l.seller_id = u.id 
      ORDER BY l.created_at DESC
    `);
    return result.rows;
  },

  async create(data) {
    const { sellerId, title, cardType, cardBrand, country, price, details, cardNumber, expMonth, expYear, cvv, bin, bank, zip } = data;
    const derivedBin = bin || cardNumber.slice(0, 6);
    
    const result = await pool.query(
      'INSERT INTO listings (seller_id, title, card_type, card_brand, country, price, details, card_number, exp_month, exp_year, cvv, bin, bank, zip) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [sellerId, title, cardType, cardBrand, country, price, details, cardNumber, expMonth, expYear, cvv, derivedBin, bank || null, zip || null]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { title, cardType, cardBrand, country, price, details, status } = data;
    const result = await pool.query(
      'UPDATE listings SET title = $1, card_type = $2, card_brand = $3, country = $4, price = $5, details = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [title, cardType, cardBrand, country, price, details, status, id]
    );
    return result.rows[0];
  },

  async updateStatus(id, status, client = pool) {
    const result = await client.query(
      'UPDATE listings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM listings WHERE id = $1', [id]);
  },

  async getCardDetails(id) {
    const result = await pool.query(
      `SELECT card_number, exp_month, exp_year, cvv, card_brand, card_type, country, details FROM listings WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }
};
