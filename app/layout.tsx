import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/components/storefront/CartContext';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { seedDatabase } from '@/lib/db/seed';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://bursakumasdunyasi.com'),
  title: {
    default: 'Bursa Kumaş Dünyası - Tescilli Metre Kumaş Satışı',
    template: '%s | Bursa Kumaş Dünyası',
  },
  description:
    'Doğrudan üreticiden viskon, oduncu, keten, tensel, ayrobin, krep, modal, müslin ve seçkin giyimlik kumaşlar. 0.5m adımlarla toptan & perakende güvenli alışveriş.',
  keywords: [
    'bursa kumaş dünyası',
    'viskon kumaş',
    'keten kumaş',
    'tensel kumaş',
    'ayrobin kumaş',
    'krep kumaş',
    'oduncu kumaş',
    'modal kumaş',
    'müslin kumaş',
    'metre bazlı kumaş satışı',
    'bursa kumaşı',
  ],
  authors: [{ name: 'Bursa Kumaş Dünyası' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://bursakumasdunyasi.com',
    siteName: 'Bursa Kumaş Dünyası',
    title: 'Bursa Kumaş Dünyası - Seçkin Metre Kumaş Satışı',
    description:
      'Viskon, keten, tensel, ayrobin, krep, oduncu, modal ve müslin kumaşlar en uygun metre fiyatlarıyla.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Bursa Kumaş Dünyası Premium Kumaş Koleksiyonu',
      },
    ],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

import { TrackingScripts } from '@/components/analytics/TrackingScripts';
import { UserProvider } from '@/components/storefront/UserContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure seed data is initialized
  seedDatabase();

  return (
    <html lang="tr" className="scroll-smooth">
      <body className="min-h-screen flex flex-col antialiased selection:bg-blue-900 selection:text-white">
        <TrackingScripts />
        <UserProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
