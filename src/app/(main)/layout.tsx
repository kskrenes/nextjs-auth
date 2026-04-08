import Sidebar from '@/components/sidebar';
import React from 'react';

const MainLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex min-h-screen gap-8">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;