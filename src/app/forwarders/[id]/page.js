// Remove 'use client' since we'll make this a server component
import { Suspense } from 'react';
import ForwarderProfile from '@/components/forwarders/ForwaderProfile';
import { LoadingPage } from '@/components/ui/loading-spinner';

export default async function ForwarderDetailPage({ params }) {
  return (
    <div className="container mx-auto py-2 px-4">
      <Suspense fallback={<LoadingPage text="Fetching your data..." />}>
        <ForwarderProfile forwarderId={params.id} />
      </Suspense>
    </div>
  );
}