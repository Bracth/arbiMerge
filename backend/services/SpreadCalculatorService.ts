import { Merger, AcquisitionType } from '@prisma/client';

export class SpreadCalculatorService {
  /**
   * Calcula el spread porcentual de una fusi├│n seg├║n su tipo de adquisici├│n.
   */
  calculateSpread(merger: Merger, targetPrice: number, buyerPrice?: number): number {
    if (targetPrice <= 0) return 0;

    const offerValue = this.calculateEffectiveOfferPrice(merger, buyerPrice);

    if (offerValue === 0) return 0;

    const spread = ((offerValue - targetPrice) / targetPrice) * 100;

    // Redondeamos a 2 decimales
    return Math.round(spread * 100) / 100;
  }

  /**
   * Calcula el valor efectivo de la oferta (Effective Offer Price) seg├║n el tipo de adquisici├│n.
   * Esto es lo que el accionista de la empresa objetivo recibir├¡a realmente.
   */
  public calculateEffectiveOfferPrice(merger: Merger, buyerPrice?: number): number {
    switch (merger.acquisitionType) {
      case AcquisitionType.CASH:
        return merger.offerPrice;
      case AcquisitionType.STOCK:
        return (buyerPrice || 0) * (merger.exchangeRatio || 0);
      case AcquisitionType.MIXED:
        return ((buyerPrice || 0) * (merger.exchangeRatio || 0)) + (merger.cashAmount || 0);
      default:
        return merger.offerPrice;
    }
  }

  /**
   * Determina si el spread ha subido o bajado respecto a uno anterior.
   * (Útil para la retroalimentación visual del frontend)
   */
  getTrend(newSpread: number, oldSpread: number): 'UP' | 'DOWN' | 'STABLE' {
    if (newSpread > oldSpread) return 'UP';
    if (newSpread < oldSpread) return 'DOWN';
    return 'STABLE';
  }
}

export default new SpreadCalculatorService();
