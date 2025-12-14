import pool from '../db.js';

export const User = {
  async findById(id) {
    const result = await pool.query('SELECT id, username, role, balance, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  },

  async create(username, passwordHash, role = 'user', balance = 0) {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role, balance) VALUES ($1, $2, $3, $4) RETURNING id, username, role, balance',
      [username, passwordHash, role, balance]
    );
    return result.rows[0];
  },

  async getAll() {
    const result = await pool.query('SELECT id, username, role, balance, created_at FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  async update(id, role, balance) {
    const result = await pool.query(
      'UPDATE users SET role = $1, balance = $2 WHERE id = $3 RETURNING id, username, role, balance',
      [role, balance, id]
    );
    return result.rows[0];
  },

  async updateBalance(id, amount, client = pool) {
    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, id]);
  },

  async updateRole(id, role) {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  },

  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
};
