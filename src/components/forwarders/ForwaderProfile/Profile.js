import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail, Globe, MapPin, Star, CheckCircle2, Package } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FreightServiceTags, FreightStatusIndicator } from "@/components/forwarders/FreightMetadata";

export default function Profile({ forwarder, onStatusChange }) {
  const contactItems = [
    { icon: Phone, value: forwarder.phone },
    { icon: Mail, value: forwarder.email },
    { 
      icon: Globe, 
      value: forwarder.website,
      isLink: true 
    },
    { icon: MapPin, value: forwarder.address }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-24 w-24 rounded-lg border-2 border-muted">
            <AvatarImage src={forwarder.iconurl} alt={forwarder.name} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 rounded-lg">
              {forwarder.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{forwarder.name}</h2>
              {forwarder.is_verified && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>
            <FreightStatusIndicator status={forwarder.relationship?.status} size="sm" className="mt-1" />
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end">
            <Star className="h-6 w-6 text-yellow-400 mr-1 fill-current" />
            <span className="text-2xl font-semibold">
              {forwarder.average_rating?.toFixed(1) || 'N/A'}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            ({forwarder.total_ratings} {forwarder.total_ratings === 1 ? 'rating' : 'ratings'})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contactItems.map(({ icon: Icon, value, isLink }) => 
          value && (
            <div key={value} className="flex items-center">
              <Icon className="h-5 w-5 text-gray-400 mr-2 shrink-0" />
              {isLink ? (
                <a 
                  href={value} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {value}
                </a>
              ) : (
                <span className="text-sm break-all">{value}</span>
              )}
            </div>
          )
        )}
      </div>


      {/* Description Section */}
      {forwarder.description && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">About {forwarder.name}</h3>
          <p className="text-sm whitespace-pre-wrap">{forwarder.description}</p>
        </div>
      )}

      {/* Services Section */}
      <div className="border-t pt-4">
        <FreightServiceTags services={forwarder.services} />
      </div>

      {/* Action Buttons Section */}
      <div className="pt-2">
        <div className="flex space-x-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant={forwarder.status === 'blacklisted' ? 'default' : 'destructive'}>
                {forwarder.status === 'blacklisted' ? 'Unblacklist' : 'Blacklist'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will {forwarder.status === 'blacklisted' ? 'unblacklist' : 'blacklist'} the freight forwarder.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onStatusChange(forwarder.status === 'blacklisted' ? 'inactive' : 'blacklisted')}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={forwarder.status === 'blacklisted'}>
                {forwarder.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will {forwarder.status === 'active' ? 'deactivate' : 'activate'} the freight forwarder.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onStatusChange(forwarder.status === 'active' ? 'inactive' : 'active')}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}