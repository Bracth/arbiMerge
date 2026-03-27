import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TrendType } from '@arbimerge/shared';
import MergerService from './services/MergerService.js';
import SocketServer from './sockets/SocketServer.js';
import PriceEmitter from './sockets/PriceEmitter.js';

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
    const enrichedMergers = await MergerService.getEnrichedMergers();

    res.json(enrichedMergers);
  } catch (error) {
    console.error('[REST] Error al obtener fusiones:', error);
    res.status(500).json({ error: 'Error al obtener la lista de fusiones.' });
  }
});

app.get('/api/mergers/:id/analyze/stream', async (req, res) => {
  const { id } = req.params;

  try {
    const merger = await MergerService.getMergerById(id);
    if (!merger) {
      res.status(404).json({ error: 'Fusión no encontrada.' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      res.write(`data: ${JSON.stringify({ error: 'Gemini API key not configured.' })}\n\n`);
      res.end();
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Analyze the following merger and acquisition deal:
      Target: ${merger.targetName} (${merger.targetTicker})
      Buyer: ${merger.buyerName} ${merger.buyerTicker ? `(${merger.buyerTicker})` : ''}
      Type: ${merger.acquisitionType}
      Offer Price: ${merger.offerPrice} ${merger.currency}
      Announced Date: ${merger.announcedDate}
      Expected Closing: ${merger.expectedClosingDate || 'N/A'}

      Provide a concise summary of the deal, potential risks, and strategic rationale.
      Your response MUST be under 250 characters. Keep it professional and focused on arbitrage considerations.
    `;

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('[SSE] Error in AI analysis stream:', error);
    // If headers were already sent, we can't send a 500, so we send the error via SSE
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error generating AI summary.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Error generating AI summary.' })}\n\n`);
      res.end();
    }
  }

  req.on('close', () => {
    console.log('[SSE] Client disconnected');
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { httpServer, app };
