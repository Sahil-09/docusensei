import './global.css';
import { ClerkProvider } from '@clerk/nextjs';
import { AppLayout } from '@/components/app-layout';

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
        </body>
      </html>
    </ClerkProvider>
  );
}
