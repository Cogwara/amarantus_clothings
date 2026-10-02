import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://amarantus-clothings.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Amarantus Clothings | Premium Handpicked Thrift & Retail Fashion',
    template: '%s | Amarantus Clothings',
  },
  description:
    'Shop premium handpicked UK Grade A thrift clothing, dresses, tops, jackets, vintage pieces and wholesale bales. Clean, steam-pressed and ready-to-wear with fast delivery across Abuja and Nigeria.',
  applicationName: 'Amarantus Clothings',
  authors: [{ name: 'Amarantus Clothings', url: APP_URL }],
  creator: 'Amarantus Clothings',
  publisher: 'Amarantus Clothings',
  keywords: [
    'Amarantus Clothings',
    'Thrift Store Nigeria',
    'Grade A Thrift',
    'Okrika Boutique Abuja',
    'Abuja Thrift Clothes',
    'Gbazango Kubwa FCT',
    'UK Used Clothes',
    'First Grade Thrift',
    'Vintage Fashion Nigeria',
    'Wholesale Thrift Bales',
    'Online Clothing Store Nigeria',
    'Thrift Dresses',
    'Affordable Fashion Nigeria',
  ],
  category: 'ecommerce',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: APP_URL,
    siteName: 'Amarantus Clothings',
    title: 'Amarantus Clothings | Premium Handpicked Thrift & Retail Fashion',
    description:
      'Discover clean, steam-pressed Grade A handpicked thrift clothing, stylish dresses, shirts, jackets and vintage pieces. Fast doorstep waybill delivery nationwide in Nigeria.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&h=630&q=85',
        width: 1200,
        height: 630,
        alt: 'Amarantus Clothings Premium Thrift Collection',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amarantus Clothings | Premium Handpicked Thrift Fashion',
    description:
      'Shop Grade A UK thrift clothing, vintage fashion, and wholesale bales. Fast nationwide delivery.',
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&h=630&q=85',
    ],
    creator: '@AmarantusCloth',
    site: '@AmarantusCloth',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Amarantus Clothings',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16803C',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F8FAF9] text-[#17211B] font-sans">
        {children}
      </body>
    </html>
  );
}
