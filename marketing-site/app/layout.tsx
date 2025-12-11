// /marketing-site/app/layout.tsx
import React from 'react';
import '../styles/globals.css';
import Shell from '../components/Shell';

export const metadata = {
  title: 'SimpleStates',
  description: 'Deterministic, mechanical infrastructure tools.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
