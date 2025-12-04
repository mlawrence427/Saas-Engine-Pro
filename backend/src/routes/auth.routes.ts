// src/routes/auth.routes.ts

import { Router } from 'express';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET as string;

// ============================
// Register
// ============================
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    });

    return res.json({ message: 'User registered', userId: user.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

// ============================
// Login
// ============================
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Login failed' });
  }
});
