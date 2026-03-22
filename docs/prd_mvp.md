📄 PRD: ArbiMerge (Versión Definitiva MVP)
1. Visión del Producto
ArbiMerge es una plataforma de monitoreo en tiempo real diseñada para democratizar el acceso al arbitraje de fusiones (Merger Arbitrage). El MVP se centra exclusivamente en operaciones de adquisición en efectivo, proporcionando a los inversores retail una herramienta visual, rápida y sin latencia para identificar el spread (margen de ganancia) entre el precio actual de mercado y la oferta de compra oficial.

2. Arquitectura y Stack Tecnológico
Frontend: React + Vite (Servido mediante Nginx).

Backend: Node.js + Express + Socket.io (o ws) para manejo de WebSockets.

Base de Datos: PostgreSQL (Capa estática para guardar datos de las fusiones).

Proveedor de Datos Financieros: API de Polygon.io o Yahoo Finance.

Infraestructura: Todo el sistema estará contenido y orquestado localmente usando Docker y Docker Compose.

3. Funcionalidades Core (Requisitos Funcionales)
🟢 Capa de Datos Estática (Base de Datos)
El sistema debe almacenar una lista pre-curada de al menos 5-10 fusiones activas.

Los datos requeridos por cada fusión son: Ticker de la empresa objetivo, Nombre de la compradora y Precio de la Oferta en Efectivo.

🟢 Capa de Datos Dinámica (Tiempo Real)
El backend debe conectarse a la API financiera e ingestar los precios en vivo únicamente de los tickers registrados en la base de datos (Suscripción selectiva).

El motor de cálculo en el backend debe calcular el spread de cada acción ante cada actualización de precio utilizando la fórmula: ((Precio Oferta - Precio Actual) / Precio Actual) * 100.

🟢 Experiencia de Usuario (Frontend)
Un Dashboard principal que muestre las operaciones en formato de tarjetas o tabla.

Actualización de los valores de spread y precio actual en tiempo real vía WebSocket (sin que el usuario recargue la página).

Los números deben tener retroalimentación visual (ej. parpadear en verde si el spread sube, en rojo si baja).

Resiliencia: Si el WebSocket se desconecta, la interfaz debe mostrar un indicador visual de "Reconectando..." y mantener el último precio conocido en pantalla.

4. Fuera del Alcance (Out of Scope para el MVP)
Operaciones de arbitraje mixtas (Efectivo + Acciones).

Calculadora de cobertura (Hedging / Short selling).

Autenticación de usuarios (El MVP será de acceso público para facilitar la demo).

Descubrimiento automático de nuevas fusiones en internet (Scraping).