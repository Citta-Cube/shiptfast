// src/app/dashboard/forwarders/[id]/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ForwarderHeader from "@/components/forwarders/information/ForwarderHeader";
import ForwarderContactInfo from "@/components/forwarders/information/ForwarderContactInfo";
import ForwarderServices from "@/components/forwarders/information/ForwarderServices";
import ForwarderActionButtons from "@/components/forwarders/information/ForwarderActionButtons";
import QuickStats from "@/components/forwarders/QuickStats";
import EmployeeTable from "@/components/forwarders/ForwaderEmployeeTable";
import DocumentSection from "@/components/orders/DocumentSection";

const ForwarderDetailPage = ({ params }) => {
  const [forwarder, setForwarder] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchForwarder = async () => {
      const response = await fetch(`/api/freight-forwarders/${params.id}`);
      const data = await response.json();
      setForwarder(data);
    };

    fetchForwarder();
  }, [params.id]);

  if (!forwarder) return <div>Loading...</div>;

  const handleStatusChange = async (newStatus) => {
    setForwarder({ ...forwarder, status: newStatus });
    toast("Success", {
      description: `Forwarder ${newStatus === 'blacklisted' ? 'blacklisted' : newStatus}`
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'blacklisted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{forwarder.name}</h1>
        <Button onClick={() => router.push(`/dashboard/orders?forwarder=${forwarder.id}`)}>
          View Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <ForwarderHeader forwarder={forwarder} getStatusColor={getStatusColor} />
            <ForwarderContactInfo forwarder={forwarder} />
            <ForwarderServices services={forwarder.services} />
            <ForwarderActionButtons forwarder={forwarder} onStatusChange={handleStatusChange} />
          </CardContent>
        </Card>

        <DocumentSection documents={forwarder.documents} />

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeTable employees={forwarder.employeeList} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForwarderDetailPage;