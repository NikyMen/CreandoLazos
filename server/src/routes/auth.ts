import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'PATIENT'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type Role = 'ADMIN' | 'PATIENT';

export default function authRouter(prisma: PrismaClient) {
  const router = Router();

  router.post('/register', async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { email, password, role } = parsed.data;
    try {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return res.status(409).json({ error: 'Email ya registrado' });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash, role }
      });
      const token = signToken(user.id, user.role as Role);
      return res.status(201).json({
        token,
        user: { id: user.id, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en registro' });
    }
  });

  router.post('/login', async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
      const token = signToken(user.id, user.role as Role);
      return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en inicio de sesión' });
    }
  });

  return router;
}

function signToken(userId: string, role: Role) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no configurado');
  return jwt.sign({ sub: userId, role }, secret, { expiresIn: '7d' });
}