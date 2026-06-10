import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import chatRoutes from './routes/chat';
import { errorHandler } from './utils/errorHandler';

const app = express();

const PORT = process.env.PORT || 3001;

// Startup Validation
if (process.env.NODE_ENV === 'production' && !process.env.GEMINI_API_KEY) {
  console.error('FATAL: GEMINI_API_KEY is missing in production environment');
  process.exit(1);
}

app.use(helmet());

const ALLOWED_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173';

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.use('/api/chat', chatRoutes);

// Serve Frontend
app.use(express.static(path.join(process.cwd(), 'dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🤖 EcoGuide AI server running on port ${PORT}`);
  });
}

export default app;