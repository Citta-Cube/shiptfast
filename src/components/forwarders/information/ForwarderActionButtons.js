// components/forwarders/information/ForwarderActionButtons.js
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ForwarderActionButtons = ({ forwarder, onStatusChange }) => (
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
);

export default ForwarderActionButtons;