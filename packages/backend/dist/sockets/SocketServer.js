import { Server } from 'socket.io';
import PriceEmitter from './PriceEmitter';
export class SocketServer {
    io = null;
    /**
     * Inicializa el servidor de WebSockets.
     */
    init(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*', // TODO En producci├│n, deber├¡amos restringir esto
                methods: ['GET', 'POST'],
            },
        });
        this.io.on('connection', (socket) => {
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
     * Emite una actualizaci├│n de precio a todos los clientes.
     */
    emitPriceUpdate(symbol, price, timestamp, spread, trend, effectiveOfferPrice) {
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
            effectiveOfferPrice
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
