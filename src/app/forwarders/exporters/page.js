import { getExportersByForwarder } from '@/data-access/companies';
import { getCurrentUser } from '@/data-access/users';
import { getUserCompanyMembership } from '@/data-access/companies';
import { redirect } from 'next/navigation';
import { Building, Mail, Phone, Globe, MapPin, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'BLACKLISTED':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Blacklisted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exporters</h1>
        <p className="text-muted-foreground">
          Manage your relationships with exporters and view their details.
        </p>
      </div>

      {exporters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exporters Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have any active relationships with exporters yet. 
              Exporters will appear here once they start working with your company.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exporters.map((exporter) => (
            <Card key={exporter.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {exporter.iconurl ? (
                      <img 
                        src={exporter.iconurl} 
                        alt={exporter.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{exporter.name}</CardTitle>
                      {exporter.is_verified && (
                        <Badge variant="outline" className="text-xs mt-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(exporter.relationship?.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {exporter.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {exporter.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  {exporter.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{exporter.email}</span>
                    </div>
                  )}
                  
                  {exporter.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{exporter.phone}</span>
                    </div>
                  )}
                  
                  {exporter.website && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={exporter.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {exporter.website}
                      </a>
                    </div>
                  )}
                  
                  {exporter.address && (
                    <div className="flex items-start space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="line-clamp-2">{exporter.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">
                      {exporter.average_rating ? exporter.average_rating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({exporter.total_ratings || 0} reviews)
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {exporter.total_orders || 0} orders
                  </div>
                </div>
                
                {exporter.relationship?.blacklist_reason && (
                  <div className="p-2 bg-red-50 rounded-md">
                    <p className="text-xs text-red-700">
                      <strong>Blacklist Reason:</strong> {exporter.relationship.blacklist_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
