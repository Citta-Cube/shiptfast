import prisma from '@/lib/prisma'

export async function getTopForwarders(limit = 10) {
  return prisma.freightForwarder.findMany({
    take: limit,
    orderBy: {
      ordersClosedCount: 'desc'
    },
    include: {
      company: true
    }
  })
}

export async function getPopularRoutes(startDate, endDate, limit = 10) {
  return prisma.order.groupBy({
    by: ['originPortId', 'destinationPortId'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: limit
  })
}