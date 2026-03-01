import React from 'react';
import TopNav from '@/components/TopNav';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-full flex-col">
      <TopNav />
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
