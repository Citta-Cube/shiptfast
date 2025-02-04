// @/app/dashboard/page.js
import React from 'react';
import DashboardContent from '@/components/dashboard/DashboardContent';

const DashboardPage = ({ searchParams }) => {
  return <DashboardContent initialFilters={searchParams} />;
};

export default DashboardPage;