import { Server } from 'socket.io';
export class SocketServer {
    io = null;
    /**
     * Inicializa el servidor de WebSockets.
     */
    init(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*', // TODO En producción, deberíamos restringir esto
                methods: ['GET', 'POST'],
            },
        });
        this.io.on('connection', (socket) => {
            console.log(`[SocketServer] Nuevo cliente conectado: ${socket.id}`);
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
    emitPriceUpdate(ticker, price) {
        if (!this.io) {
            console.error('[SocketServer] Intento de emitir antes de inicializar.');
            return;
        }
        this.io.emit('priceUpdate', { ticker, price });
    }
    /**
     * Obtiene la instancia de Socket.io.
     */
    getIO() {
        return this.io;
    }
}
export default new SocketServer();
