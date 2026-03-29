# 🦅 arbiMerge

**[🔗 Access the Live Web App Here](https://bratch.cloud/)**

## 📌 El Problema

El arbitraje de fusiones y adquisiciones (Merger Arbitrage) es una de las estrategias más consistentes para generar retornos mitigando el riesgo de mercado direccional. Sin embargo, para inversores retail o fondos independientes, seguir estas operaciones es una pesadilla manual. Requiere monitorizar constantemente los precios de las empresas objetivo y de las empresas compradoras, calcular en tiempo real *spreads* dinámicos (especialmente en transacciones que involucran acciones o métodos mixtos) y leer densos documentos de la SEC. Para cuando un humano calcula la rentabilidad real de una operación compleja, la oportunidad ya puede haber desaparecido.

## 💡 Nuestra Solución: arbiMerge

**arbiMerge** es un dashboard analítico en tiempo real diseñado para democratizar el seguimiento de estas operaciones. Agrega automáticamente los datos del mercado, recalcula los spreads netos y la TIR (IRR) anualizada, y los presenta en una interfaz de alto rendimiento que no tiene nada que envidiar a una terminal de grado institucional.

### 🎛️ El Dashboard y la `MergerCard`

El núcleo de nuestra experiencia de usuario es el componente **`MergerCard`**. Hemos jerarquizado la información para darle al trader exactamente los insights accionables en un solo vistazo:

- **Contexto del Trato (Deal Header):** Identificación visual instantánea de la empresa *Target* y el *Acquirer*, su estado actual y la naturaleza de la adquisición (Efectivo, Acciones o Mixta).
- **Precios Dinámicos:** Indicadores visuales que parpadean en verde/rojo para señalar tendencias de las últimas actualizaciones de precios, junto con el cálculo fundamental del **Valor Efectivo de la Oferta**.
- **Las Métricas de Alpha:** Mostramos de la manera más destacada posible lo más importante para tomar una decisión: el **Net Spread** y la **TIR Anualizada (Annualized IRR)**.
- **✨ Análisis IA de la Operación (Deal Analysis):** En lugar del trabajo manual rutinario de leer análisis financieros, el usuario puede hacer clic en "Analyze Deal". Esto dispara una solicitud que devuelve un resumen en forma de *stream* progresivo, generado por IA. Aporta contexto sobre los motivos, riesgos de la operación (ejemplo: anti-monopolio) y obstáculos regulatorios en segundos.

### 🎭 Modo Demo

Puesto que los mercados pueden no estar activos durante la demostración del hackathon (o requieren costosas APIs en vivo), implementamos un sorprendente **Modo Demo**. 
Cuando se activa, nuestro sistema inyecta "ticks" falsos vía WebSockets. Esto simula volatilidad realista en las cotizaciones y convergencias de *spreads*, permitiendo evaluar en tiempo real la extrema fluidez y reactividad de nuestra arquitectura frontend ante cambios rápidos del mercado.

## 🏗️ Decisiones de Arquitectura

- **Frontend:** Construido con **React + Vite + TypeScript**. Nos aseguramos de mantener un diseño premium que combinara tipografía enérgica y componentes reactivos para lograr el "feeling" de software financiero profesional.
- **Backend:** **Node.js con Express**, sirviendo flujos de datos y endpoints robustos.
- **Base de Datos / ORM:** **Prisma** como ORM sobre una base de datos **PostgreSQL**. El arbitraje maneja datos complejos e interconectados, por lo que un esquema relacional muy estructurado fue vital para nuestra lógica.
- **Micro-interacciones e IA:** Implementación de *Streaming* de IA y de animaciones UI sutiles (`RadarSweep`, `TypewriterText`) que retienen la atención y minimizan la percepción de los tiempos de carga en procesos costosos.

## 🧗 El Reto Técnico Más Difícil: WebSockets

El desafío técnico más exigente al cual me enfrenté fue, sin lugar a dudas, la integración de **WebSockets para el streaming de datos financieros en tiempo real**, especialmente porque **era la primera vez que los utilizaba**.

Pasar de la simplicidad de `fetch` (REST) a un flujo de eventos bidireccional fue un gran choque:
1. Tuve que gestionar conexiones persistentes del lado del cliente.
2. Manejar la sincronización de estado complejo en React (`useEffect` y `useRef`) para que múltiples "ticks" de precios por segundo de las empresas Target/Acquirer recalcularan correctamente el *Net Spread* instantáneo.
3. Asegurar de que este redibujado agresivo no colapsara el hilo de ejecución principal, manteniendo las sutiles animaciones flash muy fluidas.

Al final, lograr que la aplicación reaccione "viva" al milisegundo valió cada hora de frustración inicial.

## 🚀 Mejoras Futuras (Roadmap)

Construimos un MVP poderoso, pero la arquitectura está preparada para escalar. Este es nuestro plan a futuro:

1. **Soporte de Divisas (FX) y Expansión Global:** Ampliar nuestro espectro más allá de EE. UU., incrustando tipos de cambio FX en tiempo real para reflejar riesgos cambiarios sobre los retornos del arbitraje en adquisiciones internacionales.
2. **Adquisición Automatizada de Oportunidades (Webhooks / Scraping):** Eliminar la intervención manual de deals. Construiríamos un scraper/webhook que lea publicaciones de Cuentas especialistas en X.com (Twitter) enfocadas en eventos de M&A. Pasaríamos el texto por un LLM estructurado para que extraiga a la Base de Datos las nuevas oportunidades, ratios y precios automáticamente de manera diaria.
3. **Expansión a Estrategias Paralelas:** Reutilizar nuestra lógica modular visual y de backend para detectar anomalías relativas en **liquidaciones corporativas**, y desintegraciones financieras como Spin-offs o fusiones vía SPACs.

---
*Construido con mucha pasión durante el hackathon. 💻🔥*
