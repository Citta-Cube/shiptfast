// @/app/forwarders/dashboard/page.js
import React from 'react';
import ForwarderDashboardContent from '@/components/forwarders/ForwarderDashboardContent';

const ForwarderDashboardPage = ({ searchParams }) => {
  return <ForwarderDashboardContent initialFilters={searchParams} />;
};

export default ForwarderDashboardPage;
