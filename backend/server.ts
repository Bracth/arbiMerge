import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import 'dotenv/config';
import MergerService from './services/MergerService';
import SocketServer from './sockets/SocketServer';

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// Socket.io initialization
SocketServer.init(httpServer);

// REST API Endpoints
app.get('/api/mergers', async (req, res) => {
  try {
    const mergers = await MergerService.getAllMergers();
    res.json(mergers);
  } catch (error) {
    console.error('[REST] Error al obtener fusiones:', error);
    res.status(500).json({ error: 'Error al obtener la lista de fusiones.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { httpServer, app };
