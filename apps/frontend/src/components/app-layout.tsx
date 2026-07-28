'use client';

import { ReactNode } from 'react';
import { SideBar } from '@/components/side-bar';
import { ChatProvider, useChats } from '@/lib/chat-context';
import { useAuth } from '@clerk/nextjs';
import '../../sentry.client.config';

interface AppLayoutProps {
  children: ReactNode;
}

function AppContent({ children }: AppLayoutProps) {
  const { isSidebarOpen, setIsSidebarOpen } = useChats();
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SideBar />
      <main className="flex-1 flex flex-col min-w-0 lg:ml-72 ml-0 relative">
        {children}
      </main>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function AppLayout({ children }: AppLayoutProps) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-xs text-muted-foreground/50">Loading...</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <main className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        {children}
      </main>
    );
  }

  return (
    <ChatProvider>
      <AppContent>{children}</AppContent>
    </ChatProvider>
  );
}

export { AppLayout };
