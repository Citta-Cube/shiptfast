import prisma from '@/lib/prisma'

export async function getCompanyById(id) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      freightForwarder: true,
      exporter: true,
    },
  })
}

export async function createCompany(data) {
  return prisma.company.create({
    data,
    include: {
      freightForwarder: true,
      exporter: true,
    },
  })
}

export async function createFreightForwarder(companyId, data) {
    return prisma.freightForwarder.create({
      data: {
        companyId,
        services: data.services,
        sVATNumber: data.sVATNumber,
        bRNumber: data.bRNumber,
      },
    })
  }
  
  export async function createExporter(companyId) {
    return prisma.exporter.create({
      data: {
        companyId,
      },
    })
  }

export async function updateCompany(id, data) {
  return prisma.company.update({
    where: { id },
    data,
    include: {
      freightForwarder: true,
      exporter: true,
    },
  })
}