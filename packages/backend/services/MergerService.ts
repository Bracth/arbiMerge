import { TrendType } from '@arbimerge/shared';
import MergerRepository from '../repositories/MergerRepository.js';
import { enrichMerger, getMergerLastUpdate } from '../utils/mergerUtils.js';

export class MergerService {
  async getActiveMergers() {
    return MergerRepository.getActiveMergers();
  }

  async getAllMergers() {
    return MergerRepository.getAllMergers();
  }

  async getMergerByTicker(ticker: string) {
    return MergerRepository.getMergerByTicker(ticker);
  }

  /**
   * Obtiene las fusiones enriquecidas con precios y cálculos en tiempo real.
   * Útil para los endpoints REST.
   */
  async getEnrichedMergers() {
    const mergers = await this.getActiveMergers();

    // Importación dinámica para evitar dependencia circular
    const { default: PriceEmitter } = await import('../sockets/PriceEmitter.js');

    return mergers.map(merger => {
      const targetPrice = PriceEmitter.getLastPrice(merger.targetTicker) || 0;
      const buyerPrice = merger.buyerTicker ? PriceEmitter.getLastPrice(merger.buyerTicker) : undefined;

      return enrichMerger(merger, {
        targetPrice,
        buyerPrice,
        getLastTimestamp: (ticker) => PriceEmitter.getLastTimestamp(ticker)
      });
    });
  }
}

export default new MergerService();
