import MergerService from '../services/MergerService';
import FinnhubService from '../services/FinnhubService';
import SocketServer from './SocketServer';

export class PriceEmitter {
  private lastPrices: Record<string, number> = {};
  private lastEmitted: Record<string, number> = {};
  private activeTickers: Set<string> = new Set();
  private readonly THROTTLE_MS = 500;
  private isRunning: boolean = false;

  /**
   * Manejador para las actualizaciones de precio de Finnhub.
   */
  private onPriceUpdate = ({ symbol, price }: { symbol: string, price: number }) => {
    this.handlePriceUpdate(symbol, price);
  };

  /**
   * Inicia la escucha de precios en tiempo real.
   */
  async start() {
    if (this.isRunning) {
      console.warn('[PriceEmitter] Ya está en ejecución.');
      return;
    }

    console.log('[PriceEmitter] Iniciando escucha de precios en tiempo real...');
    
    try {
      // 1. Obtenemos las fusiones activas (PENDING)
      const activeMergers = await MergerService.getActiveMergers();
      const tickers = activeMergers.map(m => m.targetTicker);

      if (tickers.length === 0) {
        console.log('[PriceEmitter] No hay fusiones activas para monitorear.');
      }

      // 2. Nos suscribimos a cada ticker en Finnhub
      this.activeTickers.clear();
      tickers.forEach(ticker => {
        console.log(`[PriceEmitter] Suscribiéndose a ${ticker}`);
        FinnhubService.subscribe(ticker);
        this.activeTickers.add(ticker);
      });

      // 3. Escuchamos actualizaciones de Finnhub
      FinnhubService.on('priceUpdate', this.onPriceUpdate);
      
      this.isRunning = true;
    } catch (error) {
      console.error('[PriceEmitter] Error al iniciar PriceEmitter:', error);
    }
  }

  /**
   * Detiene la escucha de precios.
   */
  stop() {
    if (!this.isRunning) return;

    console.log('[PriceEmitter] Deteniendo escucha de precios...');
    
    FinnhubService.stop();
    FinnhubService.off('priceUpdate', this.onPriceUpdate);
    this.isRunning = false;
  }

  /**
   * Procesa una actualización de precio con lógica de throttle.
   */
  private handlePriceUpdate(ticker: string, price: number) {
    const now = Date.now();
    const lastEmit = this.lastEmitted[ticker] || 0;

    // Throttle: solo emitimos si han pasado más de THROTTLE_MS
    if (now - lastEmit >= this.THROTTLE_MS) {
      this.lastPrices[ticker] = price;
      this.lastEmitted[ticker] = now;
      SocketServer.emitPriceUpdate(ticker, price);
    }
  }

  /**
   * Obtiene el último precio conocido de un ticker.
   */
  getLastPrice(ticker: string): number | undefined {
    return this.lastPrices[ticker];
  }
}

export default new PriceEmitter();
