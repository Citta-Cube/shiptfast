// @/app/forwarders/dashboard/page.js
import React from 'react';
import DashboardContent from '@/components/dashboard/DashboardContent';

const ForwarderDashboardPage = ({ searchParams }) => {
  return <DashboardContent initialFilters={searchParams} variant="forwarder" />;
};

export default ForwarderDashboardPage;
