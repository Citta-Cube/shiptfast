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

  if (data.isLoading) return <LoadingPage />;
  if (!data.forwarder) return <div>Forwarder not found</div>;

  const handleStatusChange = async (newStatus) => {
    setData(prev => ({
      ...prev,
      forwarder: { ...prev.forwarder, status: newStatus }
    }));
    toast.success(`Forwarder status updated to ${newStatus}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardContent className="p-6">
          <Profile 
            forwarder={data.forwarder} 
            onStatusChange={handleStatusChange}
          />
        </CardContent>
      </Card>

      <DocumentSection documents={data.documents} />

      <Card className="lg:col-span-3">
        <CardContent>
          <EmployeesList employees={data.forwarder.employeeList} />
        </CardContent>
      </Card>
    </div>
  );
}