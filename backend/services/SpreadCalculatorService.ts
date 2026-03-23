export class SpreadCalculatorService {
  /**
   * Calcula el spread porcentual de una fusión.
   * Spread = ((Offer Price - Current Price) / Current Price) * 100
   */
  calculateSpread(offerPrice: number, currentPrice: number): number {
    if (currentPrice <= 0) return 0;
    
    const spread = ((offerPrice - currentPrice) / currentPrice) * 100;
    
    // Redondeamos a 2 decimales
    return Math.round(spread * 100) / 100;
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
