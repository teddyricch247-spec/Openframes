import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenFrame — 20-Minute Open-Source Code Animation Guide ($17 Black Friday)',
  description:
    'Learn how to make code-drawn animations from start to final edit in 20 minutes using free open-source tools — zero Claude Code subscription required. On Black Friday sale for $17 (regularly $47).',
  openGraph: {
    title: 'OpenFrame — 20-Minute Open-Source Code Animation Guide',
    description:
      'Create code-drawn animations from prompt to final edit in 20 minutes for free with open-source tools. Black Friday sale: $17 instead of $47.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenFrame — 20-Minute Open-Source Code Animation Guide',
    description:
      'Make code-drawn animations for free without a Claude Code subscription. 20 minutes start to finish. $17 Black Friday sale.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-white text-slate-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
