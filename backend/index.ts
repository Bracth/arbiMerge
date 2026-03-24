import 'dotenv/config';
import { httpServer } from './server';
import PriceEmitter from './sockets/PriceEmitter';
import MergerService from './services/MergerService';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    console.log('🚀 Iniciando servidor de arbiMerge...');

    // Iniciamos el servidor HTTP y WebSockets
    httpServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: El puerto ${PORT} ya está en uso.`);
        console.error(`💡 Sugerencia: Ejecuta este comando en PowerShell para liberar el puerto:`);
        console.error(`   Stop-Process -Id (netstat -ano | findstr :${PORT} | ForEach-Object { $_.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)[-1] } | Select-Object -First 1) -Force\n`);
        process.exit(1);
      } else {
        console.error('❌ Error en el servidor HTTP:', err);
      }
    });

    httpServer.listen(PORT, () => {
      console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
    });

    // 1. Obtenemos las fusiones activas para inicializar el caché
    const activeMergers = await MergerService.getActiveMergers();
    const symbols = activeMergers.flatMap(m => [m.targetTicker, m.buyerTicker].filter(Boolean) as string[]);

    // 2. Inicializamos el caché de precios (REST API) con un timeout de 10 segundos
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 10000);
    
    try {
      await PriceEmitter.initializeCache(symbols, ac.signal);
    } finally {
      clearTimeout(timeoutId);
    }

    // 3. Iniciamos el bucle de actualización de precios en tiempo real (WebSocket)
    await PriceEmitter.start();

    console.log('✨ Sistema operativo y monitoreando fusiones.');
  } catch (error) {
    console.error('❌ Fallo catastrófico al iniciar el sistema:', error);
    process.exit(1);
  }
}

// Manejo de cierres limpios
const shutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} recibido. Cerrando sistema...`);
  try {
    PriceEmitter.stop();
    httpServer.close(() => {
      console.log('💤 Servidor HTTP cerrado.');
      process.exit(0);
    });
    
    // Fuerza el cierre después de 5 segundos si no se cierra solo
    setTimeout(() => {
      console.error('⛔ Cierre forzado por tiempo de espera excedido.');
      process.exit(1);
    }, 5000);
  } catch (error) {
    console.error('❌ Error durante el apagado:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('💥 Excepción no capturada:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('❓ Rechazo no manejado:', reason);
  shutdown('unhandledRejection');
});

bootstrap();
