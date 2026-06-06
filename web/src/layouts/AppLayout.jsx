import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      {/* Sidebar - Fixed width on Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header - Fixed top bar */}
        <Header />

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-[1440px] w-full mx-auto p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
