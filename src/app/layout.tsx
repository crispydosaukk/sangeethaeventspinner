import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Sangeetha Events Pinner — Luxury South Indian Pure Vegetarian Catering',
  description: 'Sangeetha Events Pinner offers premier authentic South Indian pure vegetarian catering, bespoke live dosa stations, and grand banquet packages across Pinner, Harrow, London & Berkshire.',
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
