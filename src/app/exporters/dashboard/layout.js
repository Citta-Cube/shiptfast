import React from 'react'
import Sidebar from '@/components/ui/sidebar'
import Header from '@/components/ui/header'


const DashboardLayout = ({ children }) => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar userType="EXPORTER" />
      <div className="flex flex-col">
        <Header userType="EXPORTER" />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout