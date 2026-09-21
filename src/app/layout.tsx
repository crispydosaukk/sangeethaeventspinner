import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://svrpinnerevents.co.uk'),
  title: 'SVR Sangeetha Events Pinner | Luxury South Indian Vegetarian Catering',
  description: 'SVR Pinner Events offers premier authentic South Indian pure vegetarian catering, bespoke live dosa stations, and banquet packages across Pinner, Harrow & London.',
  alternates: {
    canonical: 'https://svrpinnerevents.co.uk',
  },
  openGraph: {
    title: 'SVR Sangeetha Events Pinner | Luxury South Indian Vegetarian Catering',
    description: 'SVR Pinner Events offers premier authentic South Indian pure vegetarian catering, bespoke live dosa stations, and banquet packages across Pinner, Harrow & London.',
    url: 'https://svrpinnerevents.co.uk',
    siteName: 'SVR Pinner Events',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVR Sangeetha Events Pinner | Luxury South Indian Vegetarian Catering',
    description: 'SVR Pinner Events offers premier authentic South Indian pure vegetarian catering, bespoke live dosa stations, and banquet packages across Pinner, Harrow & London.',
  },
  icons: {
    icon: [
      { url: '/assets/images/sangeetha-logo.png', type: 'image/png' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#F4F8F5] text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
