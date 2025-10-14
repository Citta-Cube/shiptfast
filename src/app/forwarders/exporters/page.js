import { getExportersByForwarder } from '@/data-access/companies';
import { getCurrentUser } from '@/data-access/users';
import { getUserCompanyMembership } from '@/data-access/companies';
import { redirect } from 'next/navigation';
import { ExportersTable } from '@/components/forwarders/exporters-table';
import { Card, CardContent } from '@/components/ui/card';
import { Building } from 'lucide-react';

export default async function ExportersPage() {
  // Get authenticated user
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }
  
  // Get user's company membership
  const companyMembership = await getUserCompanyMembership(user.id);
  
  if (!companyMembership?.companies?.type || companyMembership.companies.type !== 'FREIGHT_FORWARDER') {
    redirect('/dashboard');
  }
  
  const forwarderId = companyMembership.companies.id;
  
  // Get exporters that work with this forwarder
  const exporters = await getExportersByForwarder(forwarderId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exporters</h1>
        <p className="text-muted-foreground">
          View and manage your relationships with exporters.
        </p>
      </div>

      {exporters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exporters Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don&apos;t have any active relationships with exporters yet.
              Exporters will appear here once they start working with your company.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ExportersTable exporters={exporters} />
      )}
    </div>
  );
}