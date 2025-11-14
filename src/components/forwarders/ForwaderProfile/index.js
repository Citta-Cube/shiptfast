// src/components/forwarders/ForwaderProfile/index.js
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Profile from './Profile';
import EmployeesList from './EmployeesList';
import DocumentSection from "@/components/orders/DocumentSection";
import { LoadingPage } from '@/components/ui/loading-spinner';

export default function ForwarderProfile({ forwarderId }) {
  const [data, setData] = useState({ forwarder: null, documents: [], isLoading: true });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [forwarderRes, documentsRes, employeesRes] = await Promise.all([
          fetch(`/api/freight-forwarders/${forwarderId}`),
          fetch(`/api/freight-forwarders/${forwarderId}/documents`),
          fetch(`/api/freight-forwarders/${forwarderId}/company-members`)
        ]);

        const [forwarder, documents, employees] = await Promise.all([
          forwarderRes.json(),
          documentsRes.json(),
          employeesRes.json()
        ]);

        setData({
          forwarder: { ...forwarder, employeeList: employees },
          documents,
          isLoading: false
        });
      } catch (error) {
        toast.error("Failed to load forwarder data");
        console.error(error);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
  }, [forwarderId]);

  const handleStatusChange = async ({ action, reason }) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/freight-forwarders/${forwarderId}/relationship`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      const result = await response.json();
      
      // Update local state with new relationship status
      setData(prev => ({
        ...prev,
        forwarder: {
          ...prev.forwarder,
          relationship: {
            ...prev.forwarder.relationship,
            status: result.data.status,
            blacklist_reason: result.data.blacklist_reason
          }
        }
      }));

      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (data.isLoading) return <LoadingPage />;
  if (!data.forwarder) return <div>Forwarder not found</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardContent className="p-6">
          <Profile 
            forwarder={data.forwarder} 
            onStatusChange={handleStatusChange}
            isUpdating={isUpdating}
          />
        </CardContent>
      </Card>

      <DocumentSection
        documents={data.documents}
        entityId={forwarderId}
        entityType="FORWARDER"
        canUpload={false}
      />

      <Card className="lg:col-span-3">
        <CardContent>
          <EmployeesList employees={data.forwarder.employeeList} />
        </CardContent>
      </Card>
    </div>
  );
}