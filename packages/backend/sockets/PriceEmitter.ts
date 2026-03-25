import MergerService from '../services/MergerService.js';
import FinnhubService from '../services/FinnhubService.js';
import SocketServer from './SocketServer.js';
import SpreadCalculatorService from '../services/SpreadCalculatorService.js';
import { Merger } from '@prisma/client';
import { TrendType } from '@arbimerge/shared';

export class PriceEmitter {
  private static instance: PriceEmitter;
  private lastPrices: Record<string, { price: number; timestamp: number }> = {};
  private lastEmitted: Record<string, number> = {};
  private activeTickers: Set<string> = new Set();
  private readonly THROTTLE_MS = 500;
  private isRunning: boolean = false;

  // Caché local para fusiones y spreads
  private mergersCache: Map<string, Merger> = new Map();
  private lastSpreads: Map<string, number> = new Map();

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
      
      // Poblamos el caché local
      this.mergersCache.clear();
      const tickersToSubscribe = new Set<string>();

      activeMergers.forEach(merger => {
        this.mergersCache.set(merger.targetTicker, merger);
        tickersToSubscribe.add(merger.targetTicker);
        
        if (merger.buyerTicker) {
          this.mergersCache.set(merger.buyerTicker, merger);
          tickersToSubscribe.add(merger.buyerTicker);
        }
      });

      if (tickersToSubscribe.size === 0) {
        console.log('[PriceEmitter] No hay fusiones activas para monitorear.');
      }

      // 2. Nos suscribimos a cada ticker en Finnhub
      this.activeTickers.clear();
      tickersToSubscribe.forEach(ticker => {
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
   * Obtiene todos los últimos precios almacenados con spread y trend pre-calculados.
   */
  getAllLastPrices() {
    return Object.entries(this.lastPrices).map(([symbol, data]) => {
      const merger = this.mergersCache.get(symbol);
      let spread: number | undefined;
      let trend: TrendType = TrendType.STABLE;
      let effectiveOfferPrice: number | undefined;

      if (merger) {
        const targetPrice = symbol === merger.targetTicker ? data.price : (this.lastPrices[merger.targetTicker]?.price || 0);
        const buyerPrice = merger.buyerTicker 
          ? (symbol === merger.buyerTicker ? data.price : (this.lastPrices[merger.buyerTicker]?.price || 0))
          : undefined;
        
        spread = SpreadCalculatorService.calculateSpread(merger, targetPrice, buyerPrice);
        effectiveOfferPrice = SpreadCalculatorService.calculateEffectiveOfferPrice(merger, buyerPrice);
        
        // Intentamos recuperar el último spread para determinar el trend
        const oldSpread = this.lastSpreads.get(merger.targetTicker);
        if (oldSpread !== undefined) {
          trend = SpreadCalculatorService.getTrend(spread, oldSpread);
        }
        
        // Actualizamos el caché de spreads
        this.lastSpreads.set(merger.targetTicker, spread);
      }

      return {
        symbol,
        price: data.price,
        timestamp: data.timestamp,
        spread,
        trend,
        effectiveOfferPrice
      };
    });
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

    // Actualizamos el precio en el caché siempre, para que los cálculos de spread sean precisos
    this.lastPrices[symbol] = { price, timestamp };

    // Throttle: solo emitimos si han pasado m├ís de THROTTLE_MS
    if (now - lastEmit >= this.THROTTLE_MS) {
      this.lastEmitted[symbol] = now;

      // Buscamos si este ticker pertenece a una fusi├│n
      // IMPORTANTE: Un ticker puede ser target de una fusi├│n y buyer de otra (aunque raro en el MVP)
      // O un buyer puede estar en m├║ltiples fusiones.
      const activeMergers = Array.from(this.mergersCache.values());
      const relevantMergers = activeMergers.filter(m => m.targetTicker === symbol || m.buyerTicker === symbol);

      if (relevantMergers.length > 0) {
        relevantMergers.forEach(merger => {
          // Calculamos el nuevo spread y el valor efectivo de la oferta
          const targetPrice = this.lastPrices[merger.targetTicker]?.price || 0;
          const buyerPrice = merger.buyerTicker ? (this.lastPrices[merger.buyerTicker]?.price || 0) : undefined;

          const newSpread = SpreadCalculatorService.calculateSpread(merger, targetPrice, buyerPrice);
          const oldSpread = this.lastSpreads.get(merger.targetTicker) ?? newSpread;
          const trend = SpreadCalculatorService.getTrend(newSpread, oldSpread);

          // El valor efectivo de la oferta (EOP) es lo que realmente importa para el usuario
          const effectiveOfferPrice = SpreadCalculatorService.calculateEffectiveOfferPrice(merger, buyerPrice);

          // Actualizamos el ├║ltimo spread conocido
          this.lastSpreads.set(merger.targetTicker, newSpread);

          // Emitimos SIEMPRE bajo el targetTicker para que el frontend sepa qu├® fusi├│n actualizar
          SocketServer.emitPriceUpdate(
            merger.targetTicker, 
            targetPrice, 
            timestamp, 
            newSpread, 
            trend,
            effectiveOfferPrice
          );
        });
      } else {
        // Si no es parte de una fusi├│n conocida (raro), emitimos solo el precio
        SocketServer.emitPriceUpdate(symbol, price, timestamp);
      }
    }
  }

  /**
   * Obtiene el último precio conocido de un símbolo.
   */
  getLastPrice(symbol: string): number | undefined {
    return this.lastPrices[symbol]?.price;
  }

  /**
   * Obtiene el último timestamp conocido de un símbolo.
   */
  getLastTimestamp(symbol: string): number | undefined {
    return this.lastPrices[symbol]?.timestamp;
  }
}

export default PriceEmitter.getInstance();
