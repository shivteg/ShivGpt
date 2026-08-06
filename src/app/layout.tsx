import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAI (Shiv AI) - Ultra Fast AI Assistant',
  description: 'Next-generation AI chat, image, and video generation platform powered by SAI (Shiv AI).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#171717] text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
