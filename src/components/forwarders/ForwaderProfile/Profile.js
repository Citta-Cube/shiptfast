import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail, Globe, MapPin, Star, CheckCircle2, Package } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FreightServiceTags, FreightStatusIndicator } from "@/components/forwarders/FreightMetadata";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile({ forwarder, onStatusChange, isUpdating }) {
  const [blacklistReason, setBlacklistReason] = useState('');
  const [isBlacklistDialogOpen, setIsBlacklistDialogOpen] = useState(false);

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

  const handleStatusAction = (action) => {
    if (action === 'blacklist' && !blacklistReason.trim()) {
      return;
    }
    
    onStatusChange({
      action,
      reason: action === 'blacklist' ? blacklistReason : undefined
    });

    if (action === 'blacklist') {
      setBlacklistReason('');
      setIsBlacklistDialogOpen(false);
    }
  };

  const currentStatus = forwarder.relationship?.status?.toUpperCase();
  const isBlacklisted = currentStatus === 'BLACKLISTED';
  const isActive = currentStatus === 'ACTIVE';

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
          <AlertDialog open={isBlacklistDialogOpen} onOpenChange={setIsBlacklistDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant={isBlacklisted ? 'default' : 'destructive'}
                disabled={isUpdating}
              >
                {isBlacklisted ? 'Remove from Blacklist' : 'Blacklist'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isBlacklisted ? 'Remove from Blacklist' : 'Blacklist Forwarder'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isBlacklisted 
                    ? 'This will remove the forwarder from the blacklist. They will be set to inactive status.'
                    : 'This action will blacklist the freight forwarder. All their active quotes will be cancelled.'}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {!isBlacklisted && (
                <div className="py-4">
                  <Label htmlFor="reason">Reason for blacklisting</Label>
                  <Input
                    id="reason"
                    value={blacklistReason}
                    onChange={(e) => setBlacklistReason(e.target.value)}
                    placeholder="Enter reason for blacklisting"
                    className="mt-2"
                  />
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleStatusAction(isBlacklisted ? 'activate' : 'blacklist')}
                  disabled={!isBlacklisted && !blacklistReason.trim()}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={isBlacklisted || isUpdating}
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isActive ? 'Deactivate Forwarder' : 'Activate Forwarder'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isActive 
                    ? 'This will deactivate the forwarder. All their active quotes will be cancelled.'
                    : 'This will activate the forwarder, allowing them to submit quotes.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleStatusAction(isActive ? 'deactivate' : 'activate')}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Show current blacklist reason if blacklisted */}
        {isBlacklisted && forwarder.relationship?.blacklist_reason && (
          <div className="mt-4 p-4 bg-destructive/10 rounded-md">
            <p className="text-sm font-medium text-destructive">Blacklist Reason:</p>
            <p className="mt-1 text-sm">{forwarder.relationship.blacklist_reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}