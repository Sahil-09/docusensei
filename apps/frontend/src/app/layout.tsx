import './global.css';
import { ClerkProvider } from '@clerk/nextjs';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'DocuSensei - AI Document Assistant',
  description: 'Chat with your documents using AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <AppLayout>{children}</AppLayout>
          <Toaster position="top-right" richColors/>
        </body>
      </html>
    </ClerkProvider>
  );
}
