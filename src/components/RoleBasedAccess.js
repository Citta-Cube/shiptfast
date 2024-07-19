import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-opacity-75 z-50">
    <Card className="w-64">
      <CardContent className="flex flex-col items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-gray-600">Verifying access...</p>
      </CardContent>
    </Card>
  </div>
);

const RoleBasedAccess = ({ children, allowedRoles }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session || !allowedRoles.includes(session.user.role)) {
    router.push('/unauthorized');
    return null;
  }

  return children;
};

export default RoleBasedAccess;