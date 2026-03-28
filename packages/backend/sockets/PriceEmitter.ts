import MergerService from '../services/MergerService.js';
import FinnhubService from '../services/FinnhubService.js';
import SocketServer from './SocketServer.js';
import SpreadCalculatorService from '../services/SpreadCalculatorService.js';
import MergerRepository from '../repositories/MergerRepository.js';
import { Merger } from '@prisma/client';
import { TrendType } from '@arbimerge/shared';

export class PriceEmitter {
  private static instance: PriceEmitter;
  private lastPrices: Record<string, { price: number; timestamp: number }> = {};
  private lastEmitted: Record<string, number> = {};
  private lastDbUpdate: Record<string, number> = {};
  private activeTickers: Set<string> = new Set();
  private readonly THROTTLE_MS = 500;
  private readonly DB_UPDATE_THROTTLE_MS = 10 * 60 * 1000; // 10 minutos
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
      let lastTargetPriceUpdate: number | undefined;
      let lastBuyerPriceUpdate: number | undefined;
      let targetPrice: number = data.price;
      let buyerPrice: number | null = null;

      if (merger) {
        targetPrice = symbol === merger.targetTicker ? data.price : (this.lastPrices[merger.targetTicker]?.price || 0);
        const currentBuyerPrice = merger.buyerTicker 
          ? (symbol === merger.buyerTicker ? data.price : (this.lastPrices[merger.buyerTicker]?.price || 0))
          : undefined;
        
        buyerPrice = currentBuyerPrice ?? null;
        
        spread = SpreadCalculatorService.calculateSpread(merger, targetPrice, buyerPrice ?? undefined);
        effectiveOfferPrice = SpreadCalculatorService.calculateEffectiveOfferPrice(merger, buyerPrice ?? undefined);
        
        // Intentamos recuperar el último spread para determinar el trend
        const oldSpread = this.lastSpreads.get(merger.targetTicker);
        if (oldSpread !== undefined) {
          trend = SpreadCalculatorService.getTrend(spread, oldSpread);
        }
        
        // Actualizamos el caché de spreads
        this.lastSpreads.set(merger.targetTicker, spread);

        lastTargetPriceUpdate = this.lastPrices[merger.targetTicker]?.timestamp;
        lastBuyerPriceUpdate = merger.buyerTicker ? this.lastPrices[merger.buyerTicker]?.timestamp : undefined;
      }

      return {
        symbol,
        targetPrice,
        buyerPrice,
        timestamp: data.timestamp,
        spread,
        trend,
        effectiveOfferPrice,
        lastTargetPriceUpdate,
        lastBuyerPriceUpdate
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

          // Actualizamos el último spread conocido
          this.lastSpreads.set(merger.targetTicker, newSpread);

          // Emitimos SIEMPRE bajo el targetTicker para que el frontend sepa qué fusión actualizar
          SocketServer.emitPriceUpdate(
            merger.targetTicker, 
            targetPrice, 
            buyerPrice ?? null,
            timestamp, 
            newSpread, 
            trend,
            effectiveOfferPrice,
            this.lastPrices[merger.targetTicker]?.timestamp,
            merger.buyerTicker ? this.lastPrices[merger.buyerTicker]?.timestamp : undefined
          );

          // Intentamos actualizar la base de datos con throttle
          this.maybeUpdateDbTimestamps(merger);
        });
      } else {
        // Si no es parte de una fusión conocida (raro), emitimos solo el precio
        SocketServer.emitPriceUpdate(symbol, price, null, timestamp);
      }
    }
  }

  /**
   * Actualiza los timestamps en la base de datos con un throttle de 10 minutos.
   */
  private async maybeUpdateDbTimestamps(merger: Merger) {
    const now = Date.now();
    const lastUpdate = this.lastDbUpdate[merger.targetTicker] || 0;

    if (now - lastUpdate >= this.DB_UPDATE_THROTTLE_MS) {
      this.lastDbUpdate[merger.targetTicker] = now;

      const targetTimestamp = this.lastPrices[merger.targetTicker]?.timestamp 
        ? new Date(this.lastPrices[merger.targetTicker].timestamp) 
        : undefined;
      
      const buyerTimestamp = merger.buyerTicker && this.lastPrices[merger.buyerTicker]?.timestamp
        ? new Date(this.lastPrices[merger.buyerTicker].timestamp)
        : undefined;

      try {
        await MergerRepository.updatePriceTimestamps(
          merger.targetTicker, 
          targetTimestamp, 
          buyerTimestamp
        );
      } catch (error) {
        console.error(`[PriceEmitter] Error al actualizar timestamps en DB para ${merger.targetTicker}:`, error);
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

  // --- DEMO MODE FOR HACKATHON ---
  private demoInterval: NodeJS.Timeout | null = null;
  public isDemoActive: boolean = false;

  startDemo() {
    if (this.demoInterval) return;
    console.log('[PriceEmitter] Iniciando modo DEMO...');
    this.isDemoActive = true;
    
    // Si no había precios todavía, los inicializamos falsos basados en los mergers
    if (Object.keys(this.lastPrices).length === 0) {
       for (const merger of this.mergersCache.values()) {
         this.lastPrices[merger.targetTicker] = { price: (merger.offerPrice || 10) * 0.8, timestamp: Date.now() };
         if (merger.buyerTicker) {
           this.lastPrices[merger.buyerTicker] = { price: 50, timestamp: Date.now() };
         }
       }
    }

    this.demoInterval = setInterval(() => {
      const now = Date.now();
      for (const [symbol, data] of Object.entries(this.lastPrices)) {
        // Añadimos un ruido del -0.2% a +0.2% cada 3 segundos
        const volatility = (Math.random() - 0.5) * 0.004; 
        const newPrice = data.price * (1 + volatility);
        this.handlePriceUpdate(symbol, newPrice, now);
      }
    }, 3000);
  }

  stopDemo() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
      this.isDemoActive = false;
      console.log('[PriceEmitter] Deteniendo modo DEMO...');
    }
  }
}

export default PriceEmitter.getInstance();
