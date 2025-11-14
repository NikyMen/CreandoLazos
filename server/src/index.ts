import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { PrismaClient } from './generated/prisma';
import authRouter from './routes/auth';
import studiesRouter from './routes/studies';
import path from 'path';
import { fileURLToPath } from 'url';
import serveStatic from 'serve-static';

const app = express();
const prisma = new PrismaClient();

// Basic config
app.use(cors({ origin: '*'}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Static serving for uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', serveStatic(path.join(__dirname, '../uploads')));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRouter(prisma));
app.use('/studies', studiesRouter(prisma));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});