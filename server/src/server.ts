import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { habitRouter } from './routes/habitRoutes.js';
import { logRouter } from './routes/logRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';

// Load environment variables from .env
dotenv.config();

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration supporting configured CLIENT_ORIGIN and local development
const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (clientOrigin && origin === clientOrigin) return callback(null, true);
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      callback(null, true);
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Primary API route mounts
app.use('/api/habits', habitRouter);
app.use('/api/logs', logRouter);
app.use('/api/reports', reportRouter);

// 404 handler for unknown endpoints
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Centralized error handling middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const errorMessage = err instanceof Error ? err.message : 'Internal server error.';
  res.status(500).json({ error: errorMessage });
});

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 5173;

export let serverInstance: ReturnType<typeof app.listen> | null = null;

/**
 * Initializes database connection and starts Express HTTP server.
 */
export async function startServer(): Promise<ReturnType<typeof app.listen>> {
  try {
    await connectDB();
  } catch (error) {
    console.warn('MongoDB initial connection notice (server continuing to listen):', error);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running and listening on port ${PORT}`);
  });
  serverInstance = server;
  return server;
}

if (process.env.NODE_ENV !== 'test') {
  void startServer();
}

export { app };
export default app;
