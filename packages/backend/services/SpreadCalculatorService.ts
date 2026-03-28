import { Merger, AcquisitionType } from '@prisma/client';
import { TrendType } from '@arbimerge/shared';

export class SpreadCalculatorService {
  /**
   * Calcula el spread porcentual de una fusión según su tipo de adquisición.
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
   * Calcula el valor efectivo de la oferta (Effective Offer Price) según el tipo de adquisición.
   * Esto es lo que el accionista de la empresa objetivo recibiría realmente.
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
  getTrend(newSpread: number, oldSpread: number): TrendType {
    if (newSpread > oldSpread) return TrendType.UP;
    if (newSpread < oldSpread) return TrendType.DOWN;
    return TrendType.STABLE;
  }

  /**
   * Calcula la Tasa Interna de Retorno (TIR) anualizada para una fusión.
   * Formula: IRR = ((1 + spreadPercentage/100)^(365 / daysToClosing) - 1) * 100
   */
  calculateAnnualizedIRR(spreadPercentage: number, closingDate: Date): number | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closing = new Date(closingDate);
    closing.setHours(0, 0, 0, 0);

    const diffTime = closing.getTime() - today.getTime();
    const daysToClosing = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysToClosing <= 0) {
      return null;
    }

    // Evitar errores matemáticos si el spread es <= -100%
    if (spreadPercentage <= -100) {
      return -100;
    }

    const irr = (Math.pow(1 + spreadPercentage / 100, 365 / daysToClosing) - 1) * 100;

    return Math.round(irr * 100) / 100;
  }
}

export default new SpreadCalculatorService();
