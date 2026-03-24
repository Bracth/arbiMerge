import { EventEmitter } from 'events';
import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config();
export class FinnhubService extends EventEmitter {
    static instance;
    ws = null;
    apiKey;
    url;
    subscribedSymbols = new Set();
    reconnectAttempts = 0;
    maxReconnectDelay = 60000; // 1 minute
    isConnecting = false;
    reconnectTimeout = null;
    constructor() {
        super();
        this.apiKey = process.env.FINNHUB_API_KEY || '';
        if (!this.apiKey) {
            console.error('[FinnhubService] FINNHUB_API_KEY is not defined in environment variables');
        }
        this.url = `wss://ws.finnhub.io?token=${this.apiKey}`;
        this.connect();
    }
    static getInstance() {
        if (!FinnhubService.instance) {
            FinnhubService.instance = new FinnhubService();
        }
        return FinnhubService.instance;
    }
    /**
     * Fetches the initial price for a symbol using the Finnhub REST API.
     */
    async fetchInitialPrice(symbol, abortSignal) {
        try {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKey}`, {
                signal: abortSignal
            });
            if (!response.ok) {
                throw new Error(`Finnhub API error: ${response.statusText}`);
            }
            const data = (await response.json());
            // Finnhub returns c=0 for invalid symbols or when data is not available
            if (data.c === 0) {
                return null;
            }
            return {
                symbol,
                price: data.c,
                timestamp: data.t * 1000, // Convert seconds to milliseconds to match WebSocket timestamp format
            };
        }
        catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`[FinnhubService] Fetch initial price for ${symbol} was aborted`);
                return null;
            }
            console.error(`[FinnhubService] Error fetching initial price for ${symbol}:`, error);
            return null;
        }
    }
    connect() {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return;
        }
        this.isConnecting = true;
        console.log('[FinnhubService] Connecting to Finnhub WebSocket...');
        // Cleanup old instance if it exists
        if (this.ws) {
            this.ws.removeAllListeners();
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }
            this.ws = null;
        }
        try {
            this.ws = new WebSocket(this.url);
            this.ws.on('open', () => {
                console.log('[FinnhubService] Connected to Finnhub WebSocket');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
                this.resubscribeAll();
            });
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'trade' && message.data) {
                        message.data.forEach((trade) => {
                            this.emit('priceUpdate', {
                                symbol: trade.s,
                                price: trade.p,
                                timestamp: trade.t,
                            });
                        });
                    }
                }
                catch (error) {
                    console.error('[FinnhubService] Error parsing message:', error);
                }
            });
            this.ws.on('error', (error) => {
                console.error('[FinnhubService] WebSocket error:', error);
                this.isConnecting = false;
            });
            this.ws.on('close', () => {
                this.isConnecting = false;
                console.log('[FinnhubService] WebSocket connection closed');
                this.scheduleReconnect();
            });
        }
        catch (error) {
            console.error('[FinnhubService] Error creating WebSocket:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }
    scheduleReconnect() {
        if (this.reconnectTimeout)
            return;
        const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, this.maxReconnectDelay);
        console.log(`[FinnhubService] Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts + 1})`);
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.reconnectTimeout = null;
            this.connect();
        }, delay);
    }
    resubscribeAll() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.subscribedSymbols.forEach((symbol) => {
                this.sendSubscribe(symbol);
            });
        }
    }
    sendSubscribe(symbol) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        }
    }
    sendUnsubscribe(symbol) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
        }
    }
    subscribe(symbol) {
        if (!this.subscribedSymbols.has(symbol)) {
            this.subscribedSymbols.add(symbol);
            this.sendSubscribe(symbol);
        }
    }
    unsubscribe(symbol) {
        if (this.subscribedSymbols.has(symbol)) {
            this.subscribedSymbols.delete(symbol);
            this.sendUnsubscribe(symbol);
        }
    }
    stop() {
        console.log('[FinnhubService] Closing WebSocket connection...');
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.removeAllListeners();
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }
            this.ws = null;
        }
        this.isConnecting = false;
        this.subscribedSymbols.clear();
    }
}
export default FinnhubService.getInstance();
