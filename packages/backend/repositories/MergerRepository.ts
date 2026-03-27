import prisma from '../db/client.js';
import { MergerStatus } from '@prisma/client';

export class MergerRepository {
  /**
   * Obtiene todas las fusiones que están en estado PENDING.
   * Estas son las que nos interesan para el monitoreo en tiempo real.
   */
  async getActiveMergers() {
    return prisma.merger.findMany({
      where: {
        status: MergerStatus.PENDING,
      },
      orderBy: {
        announcedDate: 'desc',
      },
    });
  }

  /**
   * Obtiene todas las fusiones registradas.
   */
  async getAllMergers() {
    return prisma.merger.findMany({
      orderBy: {
        announcedDate: 'desc',
      },
    });
  }

  /**
   * Obtiene una fusión por su ID.
   */
  async getMergerById(id: string) {
    return prisma.merger.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Obtiene una fusión por su ticker objetivo.
   */
  async getMergerByTicker(ticker: string) {
    return prisma.merger.findUnique({
      where: {
        targetTicker: ticker,
      },
    });
  }

  /**
   * Actualiza los timestamps de los últimos precios recibidos para una fusión.
   */
  async updatePriceTimestamps(targetTicker: string, targetTimestamp?: Date, buyerTimestamp?: Date) {
    const data: any = {};
    if (targetTimestamp) data.lastTargetPriceUpdate = targetTimestamp;
    if (buyerTimestamp) data.lastBuyerPriceUpdate = buyerTimestamp;

    if (Object.keys(data).length === 0) return;

    return prisma.merger.update({
      where: { targetTicker },
      data,
    });
  }
}

export default new MergerRepository();
