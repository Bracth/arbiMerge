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
   * Obtiene una fusión por su ticker objetivo.
   */
  async getMergerByTicker(ticker: string) {
    return prisma.merger.findUnique({
      where: {
        targetTicker: ticker,
      },
    });
  }
}

export default new MergerRepository();
