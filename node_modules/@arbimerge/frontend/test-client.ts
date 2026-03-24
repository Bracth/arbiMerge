import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

console.log('📡 Intentando conectar al servidor de arbiMerge...');

socket.on('connect', () => {
  console.log('✅ ¡Conectado con éxito!');
  console.log('⏳ Esperando actualizaciones de precios (cada 5 seg)...');
});

socket.on('priceUpdate', (data) => {
  console.log('📈 Actualización recibida:', data);
});

socket.on('connect_error', (err) => {
  console.error('❌ Error de conexión:', err.message);
});

socket.on('disconnect', () => {
  console.log('🔌 Desconectado del servidor.');
});
