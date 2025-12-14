import pool from '../db.js';

export const AdminSettings = {
  async getPublic() {
    const result = await pool.query('SELECT wallet_address, qr_code_url, site_name, btc_rate, bonus_percentage, min_bonus_amount, exchange_fee FROM admin_settings WHERE id = 1');
    return result.rows[0] || {};
  },

  async get() {
    const result = await pool.query('SELECT * FROM admin_settings WHERE id = 1');
    return result.rows[0] || {};
  },

  async update(data) {
    const { walletAddress, qrCodeUrl, siteName, btcRate, bonusPercentage, minBonusAmount, exchangeFee } = data;
    const result = await pool.query(
      'UPDATE admin_settings SET wallet_address = $1, qr_code_url = $2, site_name = $3, btc_rate = $4, bonus_percentage = $5, min_bonus_amount = $6, exchange_fee = $7, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *',
      [walletAddress, qrCodeUrl, siteName, btcRate, bonusPercentage, minBonusAmount, exchangeFee]
    );
    return result.rows[0];
  },

  async updateQrCode(url) {
    await pool.query('UPDATE admin_settings SET qr_code_url = $1 WHERE id = 1', [url]);
  }
};
