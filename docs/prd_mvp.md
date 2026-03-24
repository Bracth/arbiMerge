📄 PRD: ArbiMerge (Versión Definitiva MVP)
1. Visión del Producto
ArbiMerge es una plataforma de monitoreo en tiempo real diseñada para democratizar el acceso al arbitraje de fusiones (Merger Arbitrage). El MVP proporciona a los inversores retail una herramienta visual, rápida y sin latencia para identificar el spread (margen de ganancia) entre el precio actual de mercado y la oferta de compra oficial, soportando adquisiciones en efectivo (CASH), acciones (STOCK) y mixtas (MIXED).

2. Arquitectura y Stack Tecnológico
Frontend: React + Vite (Servido mediante Nginx).

Backend: Node.js + Express + Socket.io (o ws) para manejo de WebSockets.

Base de Datos: PostgreSQL (Capa estática para guardar datos de las fusiones y términos de adquisición).

Proveedor de Datos Financieros: API de Finnhub (WebSockets + REST).

Infraestructura: Todo el sistema estará contenido y orquestado localmente usando Docker y Docker Compose.

3. Funcionalidades Core (Requisitos Funcionales)
🟢 Capa de Datos Estática (Base de Datos)
El sistema debe almacenar una lista pre-curada de fusiones activas con sus términos específicos.

Los datos requeridos por cada fusión incluyen: Ticker de la empresa objetivo, Ticker de la compradora (si aplica), Tipo de Adquisición (CASH, STOCK, MIXED), Precio de la Oferta en Efectivo, y Ratio de Intercambio de Acciones.

🟢 Capa de Datos Dinámica (Tiempo Real)
El backend centraliza todo el motor de cálculo de arbitraje (SpreadCalculatorService).

El backend debe conectarse a la API financiera e ingestar los precios en vivo tanto de las empresas objetivo como de las compradoras (Suscripción selectiva).

El motor de cálculo en el backend debe determinar el "Effective Offer Price" (EOP) y el spread de cada acción ante cada actualización de precio, utilizando fórmulas específicas para cada tipo de adquisición.

🟢 Experiencia de Usuario (Frontend)
Un Dashboard principal que muestre las operaciones en formato de tarjetas con indicadores de tipo de adquisición.

Actualización de los valores de spread, precio actual y valor efectivo de la oferta en tiempo real vía WebSocket.

Los números deben tener retroalimentación visual (ej. parpadear en verde si el spread sube, en rojo si baja) basada en el trend calculado por el backend.

Resiliencia: El frontend actúa como un contenedor de estado puro, sincronizado con el backend para garantizar la consistencia de los datos en todo momento.

4. Fuera del Alcance (Out of Scope para el MVP)
Calculadora de cobertura (Hedging / Short selling).

Autenticación de usuarios (El MVP será de acceso público para facilitar la demo).

Descubrimiento automático de nuevas fusiones en internet (Scraping).

Historial de spreads a largo plazo (Gráficos históricos).
