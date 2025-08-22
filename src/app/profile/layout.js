import React from 'react'
import Sidebar from '@/components/ui/sidebar'
import Header from '@/components/ui/header'

const DashboardLayout = ({ children }) => {
  return (
    <div className="h-screen w-full overflow-hidden grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden p-4 lg:p-6">
          <div className="h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout