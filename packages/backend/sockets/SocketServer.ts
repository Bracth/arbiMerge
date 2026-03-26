import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TrendType } from '@arbimerge/shared';
import PriceEmitter from './PriceEmitter.js';

export class SocketServer {
  private io: Server | null = null;

  /**
   * Inicializa el servidor de WebSockets.
   */
  init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // TODO En producci├│n, deber├¡amos restringir esto
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[SocketServer] Nuevo cliente conectado: ${socket.id}`);

      // Enviar precios actuales al nuevo cliente para que tenga datos de inmediato
      const currentPrices = PriceEmitter.getAllLastPrices();
      socket.emit('initialPrices', currentPrices);

      socket.on('disconnect', () => {
        console.log(`[SocketServer] Cliente desconectado: ${socket.id}`);
      });
    });

    console.log('[SocketServer] Servidor WebSocket inicializado.');
    return this.io;
  }

  /**
   * Emite una actualización de precio a todos los clientes.
   */
  emitPriceUpdate(
    symbol: string, 
    price: number, 
    timestamp: number, 
    spread?: number, 
    trend?: TrendType, 
    effectiveOfferPrice?: number,
    lastTargetPriceUpdate?: number,
    lastBuyerPriceUpdate?: number
  ) {
    if (!this.io) {
      console.error('[SocketServer] Intento de emitir antes de inicializar.');
      return;
    }

    this.io.emit('priceUpdate', { 
      ticker: symbol, 
      price, 
      timestamp,
      spread,
      trend,
      effectiveOfferPrice,
      lastTargetPriceUpdate,
      lastBuyerPriceUpdate
    });
  }

  /**
   * Obtiene la instancia de Socket.io.
   */
  getIO() {
    return this.io;
  }
}

export default new SocketServer();
