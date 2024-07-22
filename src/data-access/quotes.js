import prisma from '@/lib/prisma'

export async function getQuotesByOrderId(orderId) {
  return prisma.quote.findMany({
    where: { orderId },
    include: {
      freightForwarder: true,
      transshipmentPorts: {
        include: {
          port: true,
        },
      },
    },
  })
}

export async function createQuote(data) {
  return prisma.quote.create({
    data,
    include: {
      freightForwarder: true,
      transshipmentPorts: {
        include: {
          port: true,
        },
      },
    },
  })
}

export async function updateQuote(id, data) {
  return prisma.quote.update({
    where: { id },
    data,
    include: {
      freightForwarder: true,
      transshipmentPorts: {
        include: {
          port: true,
        },
      },
    },
  })
}

export async function getHistoricalPrices(originPortId, destinationPortId, duration = 6) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - duration)
  
    return prisma.quote.findMany({
      where: {
        order: {
          originPortId: originPortId,
          destinationPortId: destinationPortId,
          createdAt: {
            gte: startDate
          }
        }
      },
      select: {
        netFreightCost: true,
        createdAt: true,
        order: {
          select: {
            shipmentType: true,
            loadType: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
}
  
export async function getQuotesByForwarderAndStatus(forwarderId, status) {
    return prisma.quote.findMany({
      where: {
        freightForwarderId: forwarderId,
        order: {
          status: status
        }
      },
      include: {
        order: {
          include: {
            exporter: true,
            originPort: true,
            destinationPort: true
          }
        }
      }
    })
}