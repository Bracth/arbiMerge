import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import 'dotenv/config';
import { TrendType } from '@arbimerge/shared';
import MergerService from './services/MergerService';
import SocketServer from './sockets/SocketServer';
import PriceEmitter from './sockets/PriceEmitter';
import SpreadCalculatorService from './services/SpreadCalculatorService';

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
    
    const enrichedMergers = mergers.map(merger => {
      const targetPrice = PriceEmitter.getLastPrice(merger.targetTicker) || 0;
      const targetTimestamp = PriceEmitter.getLastTimestamp(merger.targetTicker);
      const buyerPrice = merger.buyerTicker ? PriceEmitter.getLastPrice(merger.buyerTicker) : undefined;
      const buyerTimestamp = merger.buyerTicker ? PriceEmitter.getLastTimestamp(merger.buyerTicker) : undefined;
      
      const spread = SpreadCalculatorService.calculateSpread(merger, targetPrice, buyerPrice);
      const effectiveOfferPrice = SpreadCalculatorService.calculateEffectiveOfferPrice(merger, buyerPrice);
      
      // El lastUpdate de la fusión es el más reciente entre el target y el buyer (si existe)
      const lastUpdate = Math.max(targetTimestamp || 0, buyerTimestamp || 0) || undefined;
      
      return {
        ...merger,
        currentPrice: targetPrice,
        effectiveOfferPrice,
        spread,
        trend: TrendType.STABLE, // Por defecto en la carga inicial
        lastUpdate
      };
    });

    res.json(enrichedMergers);
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
