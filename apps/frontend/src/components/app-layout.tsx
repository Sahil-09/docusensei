'use client';

import { ReactNode } from 'react';
import { SideBar } from '@/components/side-bar';
import { ChatProvider } from '@/lib/chat-context';

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <ChatProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <SideBar />
        <main className="flex-1 flex flex-col min-w-0 ml-72 relative">
          {children}
        </main>
      </div>
    </ChatProvider>
  );
}

export { AppLayout };
