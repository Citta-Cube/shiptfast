import prisma from '@/lib/prisma'

export async function getOrderById(id) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      exporter: true,
      originPort: true,
      destinationPort: true,
      documents: true,
      quotes: {
        include: {
          freightForwarder: true,
          transshipmentPorts: {
            include: {
              port: true,
            },
          },
        },
      },
    },
  })
}

export async function createOrder(data) {
  return prisma.order.create({
    data,
    include: {
      exporter: true,
      originPort: true,
      destinationPort: true,
    },
  })
}

export async function updateOrderStatus(id, status) {
  return prisma.order.update({
    where: { id },
    data: { status },
  })
}