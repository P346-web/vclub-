import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { JWT_SECRET } from '../middleware/auth.js';

export const authController = {
  async register(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
      if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
      
      const existingUser = await User.findByUsername(username);
      if (existingUser) return res.status(400).json({ error: 'Username already exists' });
      
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create(username, passwordHash);
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ user, token });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  async login(req, res) {
    try {
      const { username, password } = req.body;
      const user = await User.findByUsername(username);
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ user: { id: user.id, username: user.username, role: user.role, balance: user.balance }, token });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  logout(req, res) {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  },

  getMe(req, res) {
    res.json({ user: req.user });
  }
};
