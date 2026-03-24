import yahooFinance from '../lib/yahooFinance';
export class YahooFinanceService {
    /**
     * Obtiene el precio actual de mercado para un ticker dado.
     */
    async getCurrentPrice(ticker) {
        try {
            if (!yahooFinance || typeof yahooFinance.quote !== 'function') {
                console.error('[YahooFinanceService] La función "quote" no existe.');
                return null;
            }
            const result = await yahooFinance.quote(ticker);
            if (result && (result.regularMarketPrice || result.postMarketPrice)) {
                return result.regularMarketPrice || result.postMarketPrice;
            }
            return null;
        }
        catch (error) {
            console.error(`[YahooFinanceService] Error al obtener precio para ${ticker}:`, error);
            return null;
        }
    }
    async getMultiplePrices(tickers) {
        const prices = {};
        const validTickers = [...new Set(tickers.filter(t => !!t))];
        if (validTickers.length === 0)
            return prices;
        // Initialize with nulls
        validTickers.forEach(ticker => {
            prices[ticker] = null;
        });
        // Create a map for O(1) lookup of original ticker case
        const tickerMap = new Map(validTickers.map(t => [t.toUpperCase(), t]));
        try {
            if (!yahooFinance || typeof yahooFinance.quote !== 'function') {
                throw new Error('yahooFinance.quote is not a function');
            }
            // Call yahooFinance.quote with the entire array of tickers in a single call
            const results = await yahooFinance.quote(validTickers);
            // yahoo-finance2 returns an array of objects when passed an array of tickers
            const resultsArray = Array.isArray(results) ? results : [results];
            resultsArray.forEach((result) => {
                if (result && result.symbol) {
                    // Find the original ticker that matches this symbol (case-insensitive)
                    const originalTicker = tickerMap.get(result.symbol.toUpperCase());
                    if (originalTicker) {
                        prices[originalTicker] = result.regularMarketPrice || result.postMarketPrice || null;
                    }
                }
            });
        }
        catch (error) {
            // Check for 429 Too Many Requests
            const isRateLimit = error.status === 429 ||
                error.response?.status === 429 ||
                error.statusCode === 429 ||
                (error.message && (error.message.includes('429') || error.message.includes('Too Many Requests')));
            if (isRateLimit) {
                console.error(`[YahooFinanceService] Rate limit (429) hit during batch quote. Skipping fallback.`);
                return prices; // Return initialized nulls
            }
            console.warn(`[YahooFinanceService] Batch quote failed, falling back to individual calls:`, error);
            // Fallback to individual calls to handle individual ticker errors gracefully
            await Promise.all(validTickers.map(async (ticker) => {
                prices[ticker] = await this.getCurrentPrice(ticker);
            }));
        }
        return prices;
    }
}
export default new YahooFinanceService();
