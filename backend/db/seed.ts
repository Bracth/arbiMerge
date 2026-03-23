// backend/prisma/seed.ts
import { MergerStatus } from '@prisma/client';
import prisma from './client.js';

async function main() {
    console.log('🌱 Iniciando el seeding de la base de datos con TypeScript...');

    // Array tipado con operaciones reales (o realistas) para que las APIs financieras las reconozcan
    const mergers = [
        {
            targetTicker: 'TWO',
            targetName: 'Two Harbors Investment',
            buyerName: 'Annaly Capital Management',
            buyerTicker: 'NLY',
            offerPrice: 10.75,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2026-03-21T00:00:00Z'),
            expectedClosingDate: 'Q4 2026',
        },
        {
            targetTicker: 'PERF',
            targetName: 'Perfect Corp.',
            buyerName: 'CyberLink International Technology Corp.',
            buyerTicker: 'TAI:5203',
            offerPrice: 1.95,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2026-03-17T00:00:00Z'),
            expectedClosingDate: 'Q4 2026',
        },
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