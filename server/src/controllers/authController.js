import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const COOKIE = 'melo_token';

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function sign(user) {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret';
  return jwt.sign({ sub: String(user._id) }, secret, { expiresIn: '7d' });
}

function publicUser(user) {
  return { _id: user._id, name: user.name, email: user.email };
}

export async function register(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name || !email || !email.includes('@')) {
      const err = new Error('Name and a valid email are required.');
      err.status = 400;
      throw err;
    }
    if (password.length < 8) {
      const err = new Error('Password must be at least 8 characters.');
      err.status = 400;
      throw err;
    }

    const exists = await User.findOne({ email });
    if (exists) {
      const err = new Error('An account with that email already exists.');
      err.status = 409;
      throw err;
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
    });

    res.cookie(COOKIE, sign(user), cookieOpts());
    res.status(201).json(publicUser(user));
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      const err = new Error('Email or password is incorrect.');
      err.status = 401;
      throw err;
    }
    res.cookie(COOKIE, sign(user), cookieOpts());
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
}

export function logout(_req, res) {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const err = new Error('Please log in.');
      err.status = 401;
      throw err;
    }
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (newPassword.length < 8) {
      const err = new Error('New password must be at least 8 characters.');
      err.status = 400;
      throw err;
    }

    const user = await User.findById(req.userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      const err = new Error('Current password is incorrect.');
      err.status = 401;
      throw err;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
