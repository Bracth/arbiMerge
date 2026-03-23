import FinnhubService from './services/FinnhubService';
async function testFinnhubWebSocket() {
    const tickers = ['AAPL', 'MSFT', 'BINANCE:BTCUSDT'];
    console.log(`Subscribing to: ${tickers.join(', ')}...`);
    FinnhubService.on('priceUpdate', (data) => {
        console.log(`[Price Update] ${data.symbol}: ${data.price} at ${new Date(data.timestamp).toLocaleTimeString()}`);
    });
    tickers.forEach(ticker => {
        FinnhubService.subscribe(ticker);
    });
    console.log('Waiting 10 seconds for trade data...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Test finished. Unsubscribing...');
    tickers.forEach(ticker => {
        FinnhubService.unsubscribe(ticker);
    });
    // Give it a moment to send unsubscribe messages before exiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(0);
}
testFinnhubWebSocket().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
