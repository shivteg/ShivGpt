import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Groq ChatGPT AI - Ultra Fast AI Assistant',
  description: 'ChatGPT-like AI interface powered by Groq Llama 3.3 70B & DeepSeek reasoning models. Ready for Vercel deployment.',
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
