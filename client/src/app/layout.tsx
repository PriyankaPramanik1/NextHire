import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import MUIRegistry from '../components/MUIRegistry';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NextHire - Find Your Dream Job',
  description: 'Connect with top employers and find your perfect job match',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MUIRegistry>
          {/* Both AuthProvider & SocketProvider are client components */}
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </MUIRegistry>
      </body>
    </html>
  );
}
