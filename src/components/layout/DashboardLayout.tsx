import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
}

export default function DashboardLayout({ children, activeTab = 'dashboard' }: DashboardLayoutProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar activeTab={currentTab} onTabChange={setCurrentTab} />
      <div className="lg:ml-64">
        <TopHeader />
        {/* Add pt-20 to account for fixed header (h-16 = 64px + extra spacing) */}
        <main className="p-4 lg:p-6 pt-20 lg:pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}
