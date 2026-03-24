import yahooFinance from 'yahoo-finance2';
/**
 * En entornos ESM, el default export de yahoo-finance2 es la clase.
 * Necesitamos instanciarla para que los métodos (como .quote) tengan
 * el contexto 'this' correcto (instancia con _moduleExec, etc).
 */
const yf = new yahooFinance();
export default yf;
