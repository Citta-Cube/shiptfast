import { getUserCompanyMembership } from '@/data-access/companies';

export async function getUserRole(userId) {
  try {
    const membership = await getUserCompanyMembership(userId);
    const companyType = membership?.companies?.type;
    
    if (companyType === 'EXPORTER') {
      return 'exporter';
    } else if (companyType === 'FREIGHT_FORWARDER') {
      return 'forwarder';
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

export function isExporter(companyType) {
  return companyType === 'EXPORTER';
}

export function isFreightForwarder(companyType) {
  return companyType === 'FREIGHT_FORWARDER';
}