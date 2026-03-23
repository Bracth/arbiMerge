import MergerService from '../services/MergerService';
import FinnhubService from '../services/FinnhubService';
import SocketServer from './SocketServer';

export class PriceEmitter {
  private static instance: PriceEmitter;
  private lastPrices: Record<string, { price: number; timestamp: number }> = {};
  private lastEmitted: Record<string, number> = {};
  private activeTickers: Set<string> = new Set();
  private readonly THROTTLE_MS = 500;
  private isRunning: boolean = false;

  private constructor() {}

  public static getInstance(): PriceEmitter {
    if (!PriceEmitter.instance) {
      PriceEmitter.instance = new PriceEmitter();
    }
    return PriceEmitter.instance;
  }

  /**
   * Manejador para las actualizaciones de precio de Finnhub.
   */
  private onPriceUpdate = ({ symbol, price, timestamp }: { symbol: string, price: number, timestamp: number }) => {
    this.handlePriceUpdate(symbol, price, timestamp);
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
   * Inicializa el caché de precios con los últimos valores conocidos.
   */
  async initializeCache(symbols: string[], abortSignal?: AbortSignal) {
    console.log(`[PriceEmitter] Inicializando caché para ${symbols.length} símbolos...`);
    
    for (const symbol of symbols) {
      try {
        const data = await FinnhubService.fetchInitialPrice(symbol, abortSignal);
        if (data) {
          this.lastPrices[symbol] = { price: data.price, timestamp: data.timestamp };
          // Marcamos como emitido para evitar una emisión inmediata duplicada si llega un tick rápido
          this.lastEmitted[symbol] = Date.now();
          console.log(`[PriceEmitter] Caché inicializado para ${symbol}: ${data.price}`);
        }
        // Delay de 200ms para no saturar la API de Finnhub (Rate limiting)
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`[PriceEmitter] Error al inicializar caché para ${symbol}:`, error);
      }
    }
    console.log('[PriceEmitter] Caché de precios inicializado.');
  }

  /**
   * Obtiene todos los últimos precios almacenados.
   */
  getAllLastPrices() {
    return Object.entries(this.lastPrices).map(([symbol, data]) => ({
      symbol,
      price: data.price,
      timestamp: data.timestamp
    }));
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
  private handlePriceUpdate(symbol: string, price: number, timestamp: number) {
    const now = Date.now();
    const lastEmit = this.lastEmitted[symbol] || 0;

    // Throttle: solo emitimos si han pasado más de THROTTLE_MS
    if (now - lastEmit >= this.THROTTLE_MS) {
      this.lastPrices[symbol] = { price, timestamp };
      this.lastEmitted[symbol] = now;
      SocketServer.emitPriceUpdate(symbol, price, timestamp);
    }
  }

  /**
   * Obtiene el último precio conocido de un símbolo.
   */
  getLastPrice(symbol: string): number | undefined {
    return this.lastPrices[symbol]?.price;
  }
}

export default PriceEmitter.getInstance();
