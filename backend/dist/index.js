import 'dotenv/config';
import { httpServer } from './server';
import PriceEmitter from './sockets/PriceEmitter';
const PORT = process.env.PORT || 3000;
async function bootstrap() {
    try {
        console.log('🚀 Iniciando servidor de arbiMerge...');
        // Iniciamos el servidor HTTP y WebSockets
        httpServer.listen(PORT, () => {
            console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
        });
        // Iniciamos el bucle de actualización de precios en tiempo real
        await PriceEmitter.start();
        console.log('✨ Sistema operativo y monitoreando fusiones.');
    }
    catch (error) {
        console.error('❌ Fallo catastrófico al iniciar el sistema:', error);
        process.exit(1);
    }
}
// Manejo de cierres limpios
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido. Cerrando PriceEmitter...');
    PriceEmitter.stop();
    httpServer.close(() => {
        process.exit(0);
    });
});
bootstrap();
