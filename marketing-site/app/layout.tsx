// marketing-site/app/layout.tsx

import './styles/globals.css';
import Shell from '../components/Shell';

export const metadata = {
  title: 'SimpleStates',
  description: 'Deterministic. Self-hosted. Mechanical infrastructure tools.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <Shell>
          {children}
        </Shell>
      </body>
    </html>
  );
}
