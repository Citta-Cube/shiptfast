import prisma from '@/lib/prisma'

export async function getForwardersWithStatusForExporter(exporterId) {
  return prisma.company.findMany({
    where: {
      type: 'FREIGHT_FORWARDER',
      companyStatuses: {
        some: {
          statusBy: {
            id: exporterId
          }
        }
      }
    },
    include: {
      freightForwarder: true,
      companyStatuses: {
        where: {
          statusBy: {
            id: exporterId
          }
        }
      }
    }
  })
}

export async function getForwardersByService(service) {
  return prisma.company.findMany({
    where: {
      type: 'FREIGHT_FORWARDER',
      freightForwarder: {
        services: {
          has: service
        }
      }
    },
    include: {
      freightForwarder: true
    }
  })
}