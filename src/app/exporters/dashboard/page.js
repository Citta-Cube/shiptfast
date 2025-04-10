// @/app/exporters/dashboard/page.js
import React from 'react';
import DashboardContent from '@/components/dashboard/DashboardContent';

const ExporterDashboardPage = ({ searchParams }) => {
  return <DashboardContent initialFilters={searchParams} variant="exporter" />;
};

export default ExporterDashboardPage;