import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads/studies');

const createSchema = z.object({
  name: z.string().min(1),
  mimeType: z.literal('application/pdf'),
  forEmail: z.string().email().optional(),
  dataBase64: z.string().min(10),
});

export default function studiesRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const forEmail = typeof req.query.forEmail === 'string' ? req.query.forEmail : undefined;
    const studies = await prisma.study.findMany({
      ...(forEmail ? { where: { forEmail } } : {}),
      orderBy: { createdAt: 'desc' },
    });
    res.json(studies);
  });

  router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const study = await prisma.study.findUnique({ where: { id } });
    if (!study) return res.status(404).json({ error: 'Not found' });
    res.json(study);
  });

  router.post('/', async (req: Request, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, mimeType, forEmail, dataBase64 } = parsed.data;
    try {
      // Ensure dir
      fs.mkdirSync(uploadDir, { recursive: true });
      const id = cryptoRandomId();
      const filename = `${id}.pdf`;
      const absPath = path.join(uploadDir, filename);
      const buf = Buffer.from(dataBase64, 'base64');
      fs.writeFileSync(absPath, buf);
      const fileUrl = `/uploads/studies/${filename}`;
      const created = await prisma.study.create({
        data: { id, name, mimeType, forEmail, fileUrl },
      });
      res.status(201).json(created);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'No se pudo guardar el PDF' });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const study = await prisma.study.findUnique({ where: { id } });
    if (!study) return res.status(404).json({ error: 'Not found' });
    try {
      // delete file
      const filename = path.basename(study.fileUrl);
      const absPath = path.join(uploadDir, filename);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    } catch {}
    await prisma.study.delete({ where: { id } });
    res.status(204).end();
  });

  return router;
}

function cryptoRandomId() {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}