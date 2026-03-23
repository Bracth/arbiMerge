// backend/db/seed.ts
import { MergerStatus } from '@prisma/client';
import prisma from './client';
async function main() {
    console.log('🌱 Iniciando el seeding de la base de datos con TypeScript...');
    // Array tipado con operaciones reales (o realistas) para que las APIs financieras las reconozcan
    const mergers = [
        {
            targetTicker: 'CPRI',
            targetName: 'Capri Holdings',
            buyerName: 'Tapestry',
            buyerTicker: 'TPR',
            offerPrice: 57.00,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2023-08-10T00:00:00Z'),
            expectedClosingDate: 'Q4 2026',
        },
        {
            targetTicker: 'X',
            targetName: 'United States Steel',
            buyerName: 'Nippon Steel',
            buyerTicker: null, // Nippon Steel cotiza en Japón, para el MVP ignoramos su ticker
            offerPrice: 55.00,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2023-12-18T00:00:00Z'),
            expectedClosingDate: 'Q3 2026',
        },
        {
            targetTicker: 'SAVE',
            targetName: 'Spirit Airlines',
            buyerName: 'JetBlue',
            buyerTicker: 'JBLU',
            offerPrice: 33.50,
            currency: 'USD',
            status: MergerStatus.CANCELLED, // Para mostrar cómo se ve una operación cancelada en la UI
            announcedDate: new Date('2022-07-28T00:00:00Z'),
            expectedClosingDate: null,
        },
        {
            targetTicker: 'M',
            targetName: 'Macy\'s',
            buyerName: 'Arkhouse Management',
            buyerTicker: null,
            offerPrice: 24.00,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2024-03-03T00:00:00Z'),
            expectedClosingDate: 'Q1 2027',
        }
    ];
    for (const deal of mergers) {
        // Usamos upsert para evitar errores si corremos el seed múltiples veces
        const merger = await prisma.merger.upsert({
            where: { targetTicker: deal.targetTicker },
            update: {}, // Si ya existe, no hacemos nada (o podríamos actualizar los valores)
            create: deal,
        });
        console.log(`✅ Fusión registrada: ${merger.targetTicker} -> ${merger.buyerName}`);
    }
    console.log('🎉 Seeding completado con éxito.');
}
main()
    .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    // Es vital desconectar el cliente al terminar
    await prisma.$disconnect();
});
