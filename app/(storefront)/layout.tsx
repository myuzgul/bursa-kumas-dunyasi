import React from 'react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 w-full max-w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
