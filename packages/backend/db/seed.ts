// backend/prisma/seed.ts
import { MergerStatus, AcquisitionType } from '@prisma/client';
import prisma from './client.js';

async function main() {
    console.log('🌱 Iniciando el seeding de la base de datos con TypeScript...');

    // Limpiamos la tabla antes de empezar para evitar duplicados o datos viejos
    await prisma.merger.deleteMany();

    // Array tipado con operaciones reales (o realistas) para que las APIs financieras las reconozcan
    const mergers = [
        {
            targetTicker: 'HCBN',
            targetName: 'HCB Financial Corp.',
            buyerName: 'Independent Bank Corporation',
            buyerTicker: 'IBCP',
            acquisitionType: AcquisitionType.MIXED,
            offerPrice: 17.51,
            cashAmount: 17.51,
            exchangeRatio: 1.59,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2026-03-18T00:00:00Z'),
            expectedClosingDate: '2026',
        },
        {
            targetTicker: 'PERF',
            targetName: 'Perfect Corp',
            buyerName: 'CyberLink International Technology Corp.',
            buyerTicker: '5230.TW',
            acquisitionType: AcquisitionType.CASH,
            offerPrice: 1.95,
            cashAmount: 1.95,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2026-03-18T00:00:00Z'),
            expectedClosingDate: '2026',
        },
        {
            targetTicker: 'NSA',
            targetName: 'National Storage Affiliates',
            buyerName: 'Public Storage',
            buyerTicker: 'PSA',
            acquisitionType: AcquisitionType.STOCK,
            exchangeRatio: 0.14,
            offerPrice: 0,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2026-03-18T00:00:00Z'),
            expectedClosingDate: '2026',
        },
    ];

    for (const deal of mergers) {
        // Usamos upsert para evitar errores si corremos el seed múltiples veces
        const merger = await prisma.merger.upsert({
            where: { targetTicker: deal.targetTicker },
            update: deal, // Si ya existe, actualizamos con los nuevos datos
            create: deal,
        });
        console.log(`✅ Fusión registrada: ${merger.targetTicker} (${merger.acquisitionType}) -> ${merger.buyerName}`);
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