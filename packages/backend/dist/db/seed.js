// backend/prisma/seed.ts
import { MergerStatus, AcquisitionType } from '@prisma/client';
import prisma from './client.js';
async function main() {
    console.log('🌱 Iniciando el seeding de la base de datos con TypeScript...');
    // Array tipado con operaciones reales (o realistas) para que las APIs financieras las reconozcan
    const mergers = [
        {
            targetTicker: 'CPRI',
            targetName: 'Capri Holdings',
            buyerName: 'Tapestry',
            buyerTicker: 'TPR',
            acquisitionType: AcquisitionType.CASH,
            offerPrice: 57.0,
            cashAmount: 57.0,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2023-08-10T00:00:00Z'),
            expectedClosingDate: '2024',
        },
        {
            targetTicker: 'VMW',
            targetName: 'VMware',
            buyerName: 'Broadcom',
            buyerTicker: 'AVGO',
            acquisitionType: AcquisitionType.STOCK,
            offerPrice: 142.5, // Announced value (approx)
            exchangeRatio: 0.252,
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2022-05-26T00:00:00Z'),
            expectedClosingDate: '2023',
        },
        {
            targetTicker: 'ATVI',
            targetName: 'Activision Blizzard',
            buyerName: 'Microsoft',
            buyerTicker: 'MSFT',
            acquisitionType: AcquisitionType.MIXED,
            offerPrice: 95.0,
            cashAmount: 95.0,
            exchangeRatio: 0.0, // Simplified for testing as per instructions
            currency: 'USD',
            status: MergerStatus.PENDING,
            announcedDate: new Date('2022-01-18T00:00:00Z'),
            expectedClosingDate: '2023',
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
